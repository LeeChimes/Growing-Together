import { useState, useEffect, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { ImageCompressionService } from './imageCompression';

export interface PerformanceMetrics {
  renderTime: number;
  loadTime: number;
  memoryUsage?: number;
  networkStatus: 'online' | 'offline' | 'unknown';
  timestamp: number;
}

export class PerformanceMonitor {
  private static metrics: PerformanceMetrics[] = [];
  private static isMonitoring = false;

  static startMonitoring() {
    if (this.isMonitoring) return;
    this.isMonitoring = true;
    
    console.log('📊 Performance monitoring started');
    
    // Monitor network status changes
    NetInfo.addEventListener(state => {
      this.logNetworkChange(state.isConnected ? 'online' : 'offline');
    });
  }

  static stopMonitoring() {
    this.isMonitoring = false;
    console.log('📊 Performance monitoring stopped');
  }

  static recordMetric(metric: Partial<PerformanceMetrics>) {
    if (!this.isMonitoring) return;

    const fullMetric: PerformanceMetrics = {
      renderTime: 0,
      loadTime: 0,
      networkStatus: 'unknown',
      timestamp: Date.now(),
      ...metric,
    };

    this.metrics.push(fullMetric);
    
    // Keep only last 100 metrics to prevent memory leaks
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }

    if (__DEV__) {
      console.log('📊 Performance metric recorded:', fullMetric);
    }
  }

  static getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  static getAverageRenderTime(): number {
    const renderTimes = this.metrics.map(m => m.renderTime).filter(t => t > 0);
    return renderTimes.length > 0 ? renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length : 0;
  }

  static getAverageLoadTime(): number {
    const loadTimes = this.metrics.map(m => m.loadTime).filter(t => t > 0);
    return loadTimes.length > 0 ? loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length : 0;
  }

  static clearMetrics() {
    this.metrics = [];
  }

  private static logNetworkChange(status: 'online' | 'offline') {
    console.log(`🌐 Network status changed to: ${status}`);
    this.recordMetric({ networkStatus: status });
  }
}

/**
 * Hook to measure component render performance
 */
export const useRenderPerformance = (componentName: string) => {
  const startTime = useRef<number>(0);
  const [renderTime, setRenderTime] = useState<number>(0);

  useEffect(() => {
    startTime.current = performance.now();
  }, []);

  useEffect(() => {
    if (startTime.current) {
      const endTime = performance.now();
      const duration = endTime - startTime.current;
      setRenderTime(duration);
      
      PerformanceMonitor.recordMetric({
        renderTime: duration,
        timestamp: Date.now(),
      });

      if (__DEV__ && duration > 16) { // 60fps = 16.67ms per frame
        console.warn(`⚠️ Slow render detected in ${componentName}: ${duration.toFixed(2)}ms`);
      }
    }
  }, [componentName]);

  return renderTime;
};

/**
 * Hook to measure data loading performance
 */
export const useLoadPerformance = (operationName: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadTime, setLoadTime] = useState<number>(0);
  const startTime = useRef<number>(0);

  const startTimer = () => {
    startTime.current = performance.now();
    setIsLoading(true);
  };

  const endTimer = () => {
    if (startTime.current) {
      const endTime = performance.now();
      const duration = endTime - startTime.current;
      setLoadTime(duration);
      setIsLoading(false);
      
      PerformanceMonitor.recordMetric({
        loadTime: duration,
        timestamp: Date.now(),
      });

      if (__DEV__) {
        console.log(`⏱️ ${operationName} completed in ${duration.toFixed(2)}ms`);
      }
    }
  };

  return { startTimer, endTimer, isLoading, loadTime };
};

/**
 * Memory usage monitoring
 */
export const useMemoryMonitoring = () => {
  const [memoryUsage, setMemoryUsage] = useState<number>(0);

  useEffect(() => {
    const checkMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const usedMB = memory.usedJSHeapSize / 1024 / 1024;
        setMemoryUsage(usedMB);
        
        PerformanceMonitor.recordMetric({
          memoryUsage: usedMB,
          renderTime: 0,
          loadTime: 0,
          networkStatus: 'unknown',
          timestamp: Date.now(),
        });

        if (__DEV__ && usedMB > 100) { // Warn if over 100MB
          console.warn(`🧠 High memory usage detected: ${usedMB.toFixed(2)}MB`);
        }
      }
    };

    const interval = setInterval(checkMemory, 10000); // Check every 10 seconds
    checkMemory(); // Initial check

    return () => clearInterval(interval);
  }, []);

  return memoryUsage;
};

/**
 * Network status monitoring for offline-first testing
 */
export const useNetworkStatus = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [networkType, setNetworkType] = useState<string>('unknown');

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
      setNetworkType(state.type);
      
      PerformanceMonitor.recordMetric({
        networkStatus: state.isConnected ? 'online' : 'offline',
        renderTime: 0,
        loadTime: 0,
        timestamp: Date.now(),
      });
    });

    return unsubscribe;
  }, []);

  return { isConnected, networkType };
};

/**
 * Airplane mode testing utilities
 */
export class AirplaneModeTestUtil {
  private static testOperations: Map<string, {
    operation: () => Promise<any>;
    expectedOfflineBehavior: string;
    testResults: any[];
  }> = new Map();

  /**
   * Register a test operation for airplane mode testing
   */
  static registerTestOperation(
    name: string,
    operation: () => Promise<any>,
    expectedOfflineBehavior: string
  ) {
    this.testOperations.set(name, {
      operation,
      expectedOfflineBehavior,
      testResults: [],
    });
  }

  /**
   * Run all registered test operations
   */
  static async runAirplaneModeTests(): Promise<{
    passed: number;
    failed: number;
    results: Array<{
      name: string;
      success: boolean;
      error?: string;
      duration: number;
    }>;
  }> {
    const results = [];
    let passed = 0;
    let failed = 0;

    console.log('✈️ Starting airplane mode tests...');

    for (const [name, testData] of this.testOperations) {
      const startTime = performance.now();
      
      try {
        await testData.operation();
        const duration = performance.now() - startTime;
        
        results.push({
          name,
          success: true,
          duration,
        });
        
        passed++;
        console.log(`✅ ${name} passed (${duration.toFixed(2)}ms)`);
      } catch (error) {
        const duration = performance.now() - startTime;
        
        results.push({
          name,
          success: false,
          error: error instanceof Error ? error.message : String(error),
          duration,
        });
        
        failed++;
        console.log(`❌ ${name} failed:`, error);
      }
    }

    console.log(`✈️ Airplane mode tests completed: ${passed} passed, ${failed} failed`);
    
    return { passed, failed, results };
  }

  /**
   * Simulate network disconnection for testing
   */
  static simulateOfflineMode() {
    console.log('✈️ Simulating offline mode...');
    // In a real implementation, you might mock network requests
    // or use a network interceptor to simulate offline behavior
  }

  /**
   * Restore network connection
   */
  static restoreOnlineMode() {
    console.log('🌐 Restoring online mode...');
  }
}

/**
 * Performance testing utilities
 */
export class PerformanceTestUtil {
  /**
   * Test list virtualization performance
   */
  static async testListPerformance(
    listLength: number,
    renderFunction: (items: any[]) => Promise<void>
  ): Promise<{
    renderTime: number;
    frameRate: number;
    memoryBefore: number;
    memoryAfter: number;
  }> {
    const memoryBefore = this.getCurrentMemoryUsage();
    const items = Array.from({ length: listLength }, (_, i) => ({ id: i, data: `Item ${i}` }));
    
    const startTime = performance.now();
    await renderFunction(items);
    const renderTime = performance.now() - startTime;
    
    const memoryAfter = this.getCurrentMemoryUsage();
    const frameRate = 1000 / (renderTime / listLength);

    return {
      renderTime,
      frameRate,
      memoryBefore,
      memoryAfter,
    };
  }

  /**
   * Test image compression performance
   */
  static async testImageCompressionPerformance(
    imageUri: string
  ): Promise<{
    compressionTime: number;
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
  }> {
    const startTime = performance.now();
    const result = await ImageCompressionService.smartCompress(imageUri);
    const compressionTime = performance.now() - startTime;

    return {
      compressionTime,
      originalSize: result.originalSize || 0,
      compressedSize: result.compressedSize || 0,
      compressionRatio: result.compressionRatio || 1,
    };
  }

  private static getCurrentMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024;
    }
    return 0;
  }
}

// Initialize performance monitoring in development
if (__DEV__) {
  PerformanceMonitor.startMonitoring();
}