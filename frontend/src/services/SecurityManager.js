// Advanced Security and Privacy Manager
class SecurityManager {
  constructor() {
    this.encryptionKey = null;
    this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
    this.maxLoginAttempts = 5;
    this.lockoutDuration = 15 * 60 * 1000; // 15 minutes
    this.initializeSecurity();
  }

  async initializeSecurity() {
    // Initialize encryption for sensitive data
    try {
      if (window.crypto && window.crypto.subtle) {
        this.encryptionKey = await this.generateEncryptionKey();
      }
    } catch (error) {
      console.error('Failed to initialize encryption:', error);
    }

    // Set up security event listeners
    this.setupSecurityListeners();
    
    // Initialize session monitoring
    this.initializeSessionMonitoring();
  }

  async generateEncryptionKey() {
    return await window.crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256
      },
      true,
      ["encrypt", "decrypt"]
    );
  }

  setupSecurityListeners() {
    // Detect potential security threats
    let rapidClickCount = 0;
    let lastClickTime = 0;

    document.addEventListener('click', (event) => {
      const currentTime = Date.now();
      
      // Detect rapid clicking (potential bot behavior)
      if (currentTime - lastClickTime < 100) {
        rapidClickCount++;
        if (rapidClickCount > 10) {
          this.reportSuspiciousActivity('rapid_clicking', { count: rapidClickCount });
          rapidClickCount = 0;
        }
      } else {
        rapidClickCount = 0;
      }
      lastClickTime = currentTime;
    });

    // Detect developer tools opening
    let devtools = { open: false, orientation: null };
    setInterval(() => {
      if (window.outerHeight - window.innerHeight > 100 || window.outerWidth - window.innerWidth > 100) {
        if (!devtools.open) {
          devtools.open = true;
          this.reportSuspiciousActivity('devtools_opened');
        }
      } else {
        devtools.open = false;
      }
    }, 500);

    // Detect copy/paste of sensitive data
    document.addEventListener('copy', (event) => {
      const selection = window.getSelection().toString();
      if (this.isSensitiveData(selection)) {
        this.reportSuspiciousActivity('sensitive_data_copied', { length: selection.length });
      }
    });

    // Detect right-click context menu
    document.addEventListener('contextmenu', (event) => {
      // Allow context menu but log it
      this.logSecurityEvent('context_menu_accessed', {
        target: event.target.tagName,
        timestamp: new Date().toISOString()
      });
    });
  }

  initializeSessionMonitoring() {
    let lastActivity = Date.now();
    let warningShown = false;

    // Track user activity
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    activityEvents.forEach(event => {
      document.addEventListener(event, () => {
        lastActivity = Date.now();
        warningShown = false;
      }, true);
    });

    // Check for session timeout
    setInterval(() => {
      const inactiveTime = Date.now() - lastActivity;
      
      if (inactiveTime > this.sessionTimeout - 5 * 60 * 1000 && !warningShown) {
        // Show warning 5 minutes before timeout
        this.showSessionWarning();
        warningShown = true;
      } else if (inactiveTime > this.sessionTimeout) {
        this.handleSessionTimeout();
      }
    }, 60000); // Check every minute
  }

  showSessionWarning() {
    const warningDiv = document.createElement('div');
    warningDiv.id = 'session-warning';
    warningDiv.className = 'fixed top-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded z-50';
    warningDiv.innerHTML = `
      <div class="flex items-center space-x-2">
        <span>⚠️ Your session will expire in 5 minutes due to inactivity.</span>
        <button onclick="this.parentNode.parentNode.remove()" class="ml-2 text-yellow-700 hover:text-yellow-900">×</button>
      </div>
    `;
    
    document.body.appendChild(warningDiv);
    
    setTimeout(() => {
      const warning = document.getElementById('session-warning');
      if (warning) warning.remove();
    }, 10000);
  }

  handleSessionTimeout() {
    // Clear sensitive data
    this.clearSensitiveStorage();
    
    // Redirect to login
    if (window.location.pathname !== '/auth') {
      localStorage.setItem('session_expired', 'true');
      window.location.href = '/auth';
    }
  }

  // Login attempt tracking
  trackLoginAttempt(email, success) {
    const attempts = this.getStoredData('login_attempts') || {};
    const now = Date.now();
    
    if (!attempts[email]) {
      attempts[email] = { count: 0, lastAttempt: now, lockedUntil: null };
    }
    
    if (success) {
      // Reset on successful login
      delete attempts[email];
    } else {
      attempts[email].count++;
      attempts[email].lastAttempt = now;
      
      if (attempts[email].count >= this.maxLoginAttempts) {
        attempts[email].lockedUntil = now + this.lockoutDuration;
        this.reportSuspiciousActivity('account_locked', { email, attempts: attempts[email].count });
      }
    }
    
    this.storeData('login_attempts', attempts);
    return attempts[email];
  }

  isAccountLocked(email) {
    const attempts = this.getStoredData('login_attempts') || {};
    if (!attempts[email]) return false;
    
    const now = Date.now();
    if (attempts[email].lockedUntil && now < attempts[email].lockedUntil) {
      return {
        locked: true,
        remainingTime: Math.ceil((attempts[email].lockedUntil - now) / 1000 / 60) // minutes
      };
    }
    
    return { locked: false };
  }

  // Data encryption/decryption
  async encryptData(data) {
    if (!this.encryptionKey || !window.crypto.subtle) {
      return btoa(JSON.stringify(data)); // Fallback to base64
    }
    
    try {
      const encoded = new TextEncoder().encode(JSON.stringify(data));
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      
      const encrypted = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        this.encryptionKey,
        encoded
      );
      
      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);
      
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Encryption failed:', error);
      return btoa(JSON.stringify(data));
    }
  }

  async decryptData(encryptedData) {
    if (!this.encryptionKey || !window.crypto.subtle) {
      try {
        return JSON.parse(atob(encryptedData)); // Fallback from base64
      } catch {
        return null;
      }
    }
    
    try {
      const combined = new Uint8Array(atob(encryptedData).split('').map(c => c.charCodeAt(0)));
      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);
      
      const decrypted = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        this.encryptionKey,
        encrypted
      );
      
      const decoded = new TextDecoder().decode(decrypted);
      return JSON.parse(decoded);
    } catch (error) {
      console.error('Decryption failed:', error);
      try {
        return JSON.parse(atob(encryptedData));
      } catch {
        return null;
      }
    }
  }

  // Secure storage
  async storeSecureData(key, data) {
    const encrypted = await this.encryptData(data);
    localStorage.setItem(`secure_${key}`, encrypted);
  }

  async getSecureData(key) {
    const encrypted = localStorage.getItem(`secure_${key}`);
    if (!encrypted) return null;
    return await this.decryptData(encrypted);
  }

  storeData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  getStoredData(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  // Security reporting
  reportSuspiciousActivity(type, details = {}) {
    const report = {
      type,
      details,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId: this.getSessionId()
    };
    
    console.warn('🚨 Security Alert:', report);
    
    // Store locally for admin review
    const reports = this.getStoredData('security_reports') || [];
    reports.push(report);
    
    // Keep only last 50 reports
    if (reports.length > 50) {
      reports.splice(0, reports.length - 50);
    }
    
    this.storeData('security_reports', reports);
    
    // In production, send to server
    this.sendSecurityReport(report);
  }

  logSecurityEvent(type, details) {
    const events = this.getStoredData('security_events') || [];
    events.push({
      type,
      details,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 100 events
    if (events.length > 100) {
      events.splice(0, events.length - 100);
    }
    
    this.storeData('security_events', events);
  }

  async sendSecurityReport(report) {
    try {
      // In production, send to security endpoint
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      await fetch(`${BACKEND_URL}/api/security/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(report)
      });
    } catch (error) {
      console.error('Failed to send security report:', error);
    }
  }

  // Utility methods
  isSensitiveData(text) {
    const sensitivePatterns = [
      /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/, // Credit card
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
      /password/i,
      /token/i,
      /api[_-]?key/i
    ];
    
    return sensitivePatterns.some(pattern => pattern.test(text));
  }

  getSessionId() {
    let sessionId = sessionStorage.getItem('security_session_id');
    if (!sessionId) {
      sessionId = this.generateSessionId();
      sessionStorage.setItem('security_session_id', sessionId);
    }
    return sessionId;
  }

  generateSessionId() {
    return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  clearSensitiveStorage() {
    // Clear sensitive items but preserve user preferences
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('secure_') || key === 'token' || key === 'user_data') {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    sessionStorage.clear();
  }

  // Content Security Policy helpers
  validateImageSrc(src) {
    // Only allow images from trusted domains
    const trustedDomains = [
      'images.unsplash.com',
      'localhost',
      window.location.hostname
    ];
    
    try {
      const url = new URL(src);
      return trustedDomains.some(domain => url.hostname.endsWith(domain));
    } catch {
      return false;
    }
  }

  sanitizeHTML(html) {
    // Basic HTML sanitization
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  }

  // CSRF protection
  generateCSRFToken() {
    const token = Math.random().toString(36).substr(2) + Date.now().toString(36);
    sessionStorage.setItem('csrf_token', token);
    return token;
  }

  getCSRFToken() {
    return sessionStorage.getItem('csrf_token');
  }

  // Security audit
  getSecurityAudit() {
    return {
      loginAttempts: this.getStoredData('login_attempts') || {},
      securityReports: this.getStoredData('security_reports') || [],
      securityEvents: this.getStoredData('security_events') || [],
      sessionInfo: {
        sessionId: this.getSessionId(),
        hasEncryption: !!this.encryptionKey,
        userAgent: navigator.userAgent,
        lastActivity: Date.now()
      }
    };
  }

  // Clean up old data
  cleanupSecurityData() {
    const now = Date.now();
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
    
    // Clean old login attempts
    const attempts = this.getStoredData('login_attempts') || {};
    Object.keys(attempts).forEach(email => {
      if (attempts[email].lastAttempt < oneWeekAgo) {
        delete attempts[email];
      }
    });
    this.storeData('login_attempts', attempts);
    
    // Clean old security events
    const events = (this.getStoredData('security_events') || [])
      .filter(event => new Date(event.timestamp).getTime() > oneWeekAgo);
    this.storeData('security_events', events);
  }
}

// Create singleton instance
const securityManager = new SecurityManager();

// Clean up old security data daily
setInterval(() => {
  securityManager.cleanupSecurityData();
}, 24 * 60 * 60 * 1000);

export default securityManager;