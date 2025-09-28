// Advanced Performance Optimization Service
class PerformanceOptimizer {
  constructor() {
    this.metrics = {
      loadTimes: [],
      renderTimes: [],
      memoryUsage: [],
      networkRequests: [],
      cacheHitRates: {}
    };
    
    this.cache = new Map();
    this.imageCache = new Map();
    this.requestQueue = [];
    this.isOnline = navigator.onLine;
    
    this.initialize();
  }

  initialize() {
    this.setupPerformanceMonitoring();
    this.setupNetworkOptimization();
    this.setupImageOptimization();
    this.setupMemoryManagement();
    this.setupServiceWorker();
  }

  setupPerformanceMonitoring() {
    // Monitor page load performance
    window.addEventListener('load', () => {
      if ('performance' in window) {
        const navigation = performance.getEntriesByType('navigation')[0];
        this.recordLoadTime(navigation.loadEventEnd - navigation.loadEventStart);
        
        // Monitor largest contentful paint
        new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          console.log('LCP:', lastEntry.startTime);
        }).observe({ entryTypes: ['largest-contentful-paint'] });
        
        // Monitor cumulative layout shift
        new PerformanceObserver((entryList) => {
          let clsValue = 0;
          for (const entry of entryList.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          console.log('CLS:', clsValue);
        }).observe({ entryTypes: ['layout-shift'] });
        
        // Monitor first input delay
        new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            console.log('FID:', entry.processingStart - entry.startTime);
          }
        }).observe({ entryTypes: ['first-input'] });
      }
    });

    // Monitor component render times
    this.setupRenderMonitoring();
    
    // Monitor memory usage
    setInterval(() => {
      if ('memory' in performance) {
        this.recordMemoryUsage(performance.memory);
      }
    }, 30000); // Every 30 seconds
  }

  setupRenderMonitoring() {
    const originalCreateElement = React.createElement;
    
    React.createElement = (...args) => {
      const startTime = performance.now();
      const result = originalCreateElement(...args);
      const endTime = performance.now();
      
      if (args[0] && typeof args[0] === 'function') {
        const componentName = args[0].name || 'AnonymousComponent';
        this.recordRenderTime(componentName, endTime - startTime);
      }
      
      return result;
    };
  }

  setupNetworkOptimization() {
    // Queue and batch API requests
    const originalFetch = window.fetch;
    
    window.fetch = (...args) => {
      const url = args[0];
      const options = args[1] || {};
      
      // Add request to metrics
      const requestStart = performance.now();
      
      return originalFetch(...args)
        .then(response => {
          const requestEnd = performance.now();
          this.recordNetworkRequest(url, requestEnd - requestStart, response.ok);
          return response;
        })
        .catch(error => {
          const requestEnd = performance.now();
          this.recordNetworkRequest(url, requestEnd - requestStart, false, error);
          throw error;
        });
    };

    // Network status monitoring
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processQueuedRequests();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  setupImageOptimization() {
    // Lazy loading for images
    this.setupIntersectionObserver();
    
    // Image compression and caching
    this.setupImageCache();
  }

  setupIntersectionObserver() {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const src = img.dataset.src;
          
          if (src) {
            this.loadOptimizedImage(src).then(optimizedSrc => {
              img.src = optimizedSrc;
              img.classList.remove('loading');
              observer.unobserve(img);
            });
          }
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '50px'
    });

    // Observe all images with data-src attribute
    document.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    });

    // Observe dynamically added images
    const mutationObserver = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) {
            const images = node.querySelectorAll ? node.querySelectorAll('img[data-src]') : [];
            images.forEach(img => imageObserver.observe(img));
          }
        });
      });
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });
  }

  async loadOptimizedImage(src) {
    // Check cache first
    if (this.imageCache.has(src)) {
      return this.imageCache.get(src);
    }

    try {
      // Load and optimize image
      const response = await fetch(src);
      const blob = await response.blob();
      
      // Create canvas for optimization
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      return new Promise((resolve) => {
        img.onload = () => {
          // Calculate optimal size
          const maxWidth = window.devicePixelRatio > 1 ? 800 : 400;
          const scale = Math.min(maxWidth / img.width, maxWidth / img.height, 1);
          
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          
          // Draw and compress
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          canvas.toBlob((optimizedBlob) => {
            const optimizedUrl = URL.createObjectURL(optimizedBlob);
            this.imageCache.set(src, optimizedUrl);
            resolve(optimizedUrl);
          }, 'image/jpeg', 0.85);
        };
        
        img.src = URL.createObjectURL(blob);
      });
    } catch (error) {
      console.error('Image optimization failed:', error);
      return src; // Fallback to original
    }
  }

  setupImageCache() {
    // Preload critical images
    const criticalImages = [
      '/logos/growing-logo-128.png',
      // Add other critical images
    ];

    criticalImages.forEach(src => {
      this.preloadImage(src);
    });
  }

  async preloadImage(src) {
    if (this.imageCache.has(src)) return;
    
    try {
      await this.loadOptimizedImage(src);
    } catch (error) {
      console.error('Image preload failed:', error);
    }
  }

  setupMemoryManagement() {
    // Clear unused caches periodically
    setInterval(() => {
      this.cleanupCaches();
    }, 5 * 60 * 1000); // Every 5 minutes

    // Monitor memory pressure
    if ('memory' in performance) {
      setInterval(() => {
        const memory = performance.memory;
        const usageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
        
        if (usageRatio > 0.9) {
          console.warn('High memory usage detected');
          this.forceCacheCleanup();
        }
      }, 10000);
    }
  }

  setupServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('ServiceWorker registered:', registration);
          
          // Update service worker when needed
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                this.showUpdateNotification();
              }
            });
          });
        })
        .catch(error => {
          console.error('ServiceWorker registration failed:', error);
        });
    }
  }

  // Caching methods
  setCache(key, data, ttl = 5 * 60 * 1000) { // Default 5 minutes
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  getCache(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    // Update cache hit rate
    this.updateCacheHitRate(key, true);
    return item.data;
  }

  updateCacheHitRate(key, hit) {
    if (!this.metrics.cacheHitRates[key]) {
      this.metrics.cacheHitRates[key] = { hits: 0, misses: 0 };
    }
    
    if (hit) {
      this.metrics.cacheHitRates[key].hits++;
    } else {
      this.metrics.cacheHitRates[key].misses++;
    }
  }

  // Request batching and queuing
  batchRequest(endpoint, data, options = {}) {
    return new Promise((resolve, reject) => {
      const request = {
        endpoint,
        data,
        options,
        resolve,
        reject,
        timestamp: Date.now()
      };

      this.requestQueue.push(request);
      
      // Process queue after short delay to allow batching
      setTimeout(() => {
        this.processBatchedRequests();
      }, 50);
    });
  }

  processBatchedRequests() {
    if (this.requestQueue.length === 0) return;

    // Group requests by endpoint
    const grouped = {};
    this.requestQueue.forEach(request => {
      if (!grouped[request.endpoint]) {
        grouped[request.endpoint] = [];
      }
      grouped[request.endpoint].push(request);
    });

    // Process each group
    Object.entries(grouped).forEach(([endpoint, requests]) => {
      if (requests.length === 1) {
        // Single request
        this.processSingleRequest(requests[0]);
      } else {
        // Batch request
        this.processBatchedEndpoint(endpoint, requests);
      }
    });

    this.requestQueue = [];
  }

  async processSingleRequest(request) {
    try {
      const response = await fetch(request.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request.data),
        ...request.options
      });
      
      const result = await response.json();
      request.resolve(result);
    } catch (error) {
      request.reject(error);
    }
  }

  async processBatchedEndpoint(endpoint, requests) {
    try {
      const batchData = requests.map(r => r.data);
      const response = await fetch(`${endpoint}/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batch: batchData }),
        ...requests[0].options
      });
      
      const results = await response.json();
      
      requests.forEach((request, index) => {
        if (results[index]) {
          request.resolve(results[index]);
        } else {
          request.reject(new Error('Batch request failed'));
        }
      });
    } catch (error) {
      requests.forEach(request => request.reject(error));
    }
  }

  processQueuedRequests() {
    if (this.requestQueue.length > 0) {
      this.processBatchedRequests();
    }
  }

  // Performance metrics recording
  recordLoadTime(time) {
    this.metrics.loadTimes.push({
      time,
      timestamp: Date.now()
    });
    
    // Keep only last 50 measurements
    if (this.metrics.loadTimes.length > 50) {
      this.metrics.loadTimes.shift();
    }
  }

  recordRenderTime(component, time) {
    if (!this.metrics.renderTimes[component]) {
      this.metrics.renderTimes[component] = [];
    }
    
    this.metrics.renderTimes[component].push({
      time,
      timestamp: Date.now()
    });
    
    // Keep only last 20 measurements per component
    if (this.metrics.renderTimes[component].length > 20) {
      this.metrics.renderTimes[component].shift();
    }
  }

  recordMemoryUsage(memory) {
    this.metrics.memoryUsage.push({
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit,
      timestamp: Date.now()
    });
    
    if (this.metrics.memoryUsage.length > 100) {
      this.metrics.memoryUsage.shift();
    }
  }

  recordNetworkRequest(url, time, success, error = null) {
    this.metrics.networkRequests.push({
      url,
      time,
      success,
      error: error?.message || null,
      timestamp: Date.now()
    });
    
    if (this.metrics.networkRequests.length > 200) {
      this.metrics.networkRequests.shift();
    }
  }

  // Cache cleanup
  cleanupCaches() {
    const now = Date.now();
    
    // Clean expired cache entries
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }

    // Clean old image cache (keep only last 50 images)
    if (this.imageCache.size > 50) {
      const entries = Array.from(this.imageCache.entries());
      const toDelete = entries.slice(0, entries.length - 50);
      toDelete.forEach(([key]) => {
        URL.revokeObjectURL(this.imageCache.get(key));
        this.imageCache.delete(key);
      });
    }
  }

  forceCacheCleanup() {
    // More aggressive cleanup when memory is low
    this.cache.clear();
    
    // Clear half of image cache
    const entries = Array.from(this.imageCache.entries());
    const toDelete = entries.slice(0, Math.floor(entries.length / 2));
    toDelete.forEach(([key]) => {
      URL.revokeObjectURL(this.imageCache.get(key));
      this.imageCache.delete(key);
    });

    // Trigger garbage collection if available
    if (window.gc) {
      window.gc();
    }
  }

  // Performance analytics
  getPerformanceReport() {
    const report = {
      loadTimes: this.calculateStats(this.metrics.loadTimes.map(m => m.time)),
      memoryUsage: this.getMemoryStats(),
      networkPerformance: this.getNetworkStats(),
      cacheEfficiency: this.getCacheStats(),
      renderPerformance: this.getRenderStats(),
      recommendations: this.getPerformanceRecommendations()
    };

    return report;
  }

  calculateStats(values) {
    if (values.length === 0) return { avg: 0, min: 0, max: 0 };
    
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    return { avg, min, max };
  }

  getMemoryStats() {
    const recent = this.metrics.memoryUsage.slice(-10);
    if (recent.length === 0) return null;
    
    const avgUsed = recent.reduce((sum, m) => sum + m.used, 0) / recent.length;
    const avgTotal = recent.reduce((sum, m) => sum + m.total, 0) / recent.length;
    
    return {
      averageUsed: Math.round(avgUsed / 1024 / 1024), // MB
      averageTotal: Math.round(avgTotal / 1024 / 1024), // MB
      usagePercentage: Math.round((avgUsed / avgTotal) * 100)
    };
  }

  getNetworkStats() {
    const requests = this.metrics.networkRequests;
    const successRate = (requests.filter(r => r.success).length / requests.length) * 100;
    const avgTime = this.calculateStats(requests.map(r => r.time));
    
    return {
      totalRequests: requests.length,
      successRate: Math.round(successRate),
      averageResponseTime: Math.round(avgTime.avg)
    };
  }

  getCacheStats() {
    const stats = {};
    Object.entries(this.metrics.cacheHitRates).forEach(([key, data]) => {
      const total = data.hits + data.misses;
      stats[key] = {
        hitRate: Math.round((data.hits / total) * 100),
        totalRequests: total
      };
    });
    return stats;
  }

  getRenderStats() {
    const stats = {};
    Object.entries(this.metrics.renderTimes).forEach(([component, times]) => {
      const values = times.map(t => t.time);
      stats[component] = this.calculateStats(values);
    });
    return stats;
  }

  getPerformanceRecommendations() {
    const recommendations = [];
    
    // Check load times
    const avgLoadTime = this.calculateStats(this.metrics.loadTimes.map(m => m.time)).avg;
    if (avgLoadTime > 3000) {
      recommendations.push({
        type: 'load_time',
        severity: 'high',
        message: 'Page load time is above 3 seconds. Consider optimizing images and reducing JavaScript bundle size.'
      });
    }

    // Check memory usage
    const memoryStats = this.getMemoryStats();
    if (memoryStats && memoryStats.usagePercentage > 80) {
      recommendations.push({
        type: 'memory',
        severity: 'medium',
        message: 'High memory usage detected. Consider implementing more aggressive cache cleanup.'
      });
    }

    // Check cache efficiency
    const cacheStats = this.getCacheStats();
    Object.entries(cacheStats).forEach(([key, stats]) => {
      if (stats.hitRate < 50 && stats.totalRequests > 10) {
        recommendations.push({
          type: 'cache',
          severity: 'low',
          message: `Low cache hit rate for ${key} (${stats.hitRate}%). Consider optimizing cache strategy.`
        });
      }
    });

    return recommendations;
  }

  showUpdateNotification() {
    const notification = document.createElement('div');
    notification.className = 'fixed bottom-4 right-4 bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded z-50';
    notification.innerHTML = `
      <div class="flex items-center space-x-2">
        <span>🔄 A new version is available!</span>
        <button onclick="window.location.reload()" class="ml-2 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
          Update
        </button>
        <button onclick="this.parentNode.parentNode.remove()" class="ml-2 text-blue-700 hover:text-blue-900">×</button>
      </div>
    `;
    
    document.body.appendChild(notification);
  }

  // Public API for components
  optimizeComponent(ComponentName) {
    return React.memo(ComponentName, (prevProps, nextProps) => {
      // Custom comparison logic for better performance
      return JSON.stringify(prevProps) === JSON.stringify(nextProps);
    });
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
}

// Create singleton instance
const performanceOptimizer = new PerformanceOptimizer();

export default performanceOptimizer;