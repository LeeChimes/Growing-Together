import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Menu, 
  X, 
  Plus, 
  Search,
  Filter,
  ArrowUp,
  Wifi,
  WifiOff,
  Download
} from 'lucide-react';

// Mobile-first quick action buttons
export const QuickActionBar = ({ onQuickDiary, onQuickPhoto, onQuickTask }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Hide on scroll down, show on scroll up
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <div className={`fixed bottom-20 right-4 z-40 transition-transform duration-300 md:hidden ${
      isVisible ? 'translate-y-0' : 'translate-y-20'
    }`}>
      <div className="flex flex-col space-y-2">
        <Button
          size="sm"
          className="rounded-full w-12 h-12 bg-green-600 hover:bg-green-700 shadow-lg"
          onClick={onQuickDiary}
          data-testid="mobile-quick-diary"
        >
          <Plus size={20} className="text-white" />
        </Button>
        
        <Button
          size="sm"  
          className="rounded-full w-12 h-12 bg-blue-600 hover:bg-blue-700 shadow-lg"
          onClick={onQuickPhoto}
          data-testid="mobile-quick-photo"
        >
          📷
        </Button>
        
        <Button
          size="sm"
          className="rounded-full w-12 h-12 bg-purple-600 hover:bg-purple-700 shadow-lg"
          onClick={onQuickTask}
          data-testid="mobile-quick-task"
        >
          ✓
        </Button>
      </div>
    </div>
  );
};

// Scroll to top button
export const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  if (!isVisible) return null;

  return (
    <Button
      className="fixed bottom-32 left-4 z-40 rounded-full w-12 h-12 bg-gray-600 hover:bg-gray-700 shadow-lg md:hidden"
      onClick={scrollToTop}
      data-testid="scroll-to-top"
    >
      <ArrowUp size={20} className="text-white" />
    </Button>
  );
};

// Offline indicator
export const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineMessage(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineMessage(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed top-16 md:top-20 left-0 right-0 z-50 bg-yellow-500 text-black p-2 text-center">
      <div className="flex items-center justify-center space-x-2">
        <WifiOff size={16} />
        <span className="text-sm font-medium">You're offline - changes will sync when connected</span>
      </div>
    </div>
  );
};

// Mobile-optimized search bar
export const MobileSearchBar = ({ onSearch, placeholder = "Search..." }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (query) => {
    setSearchQuery(query);
    onSearch(query);
  };

  return (
    <div className="md:hidden mb-4">
      {!isExpanded ? (
        <Button
          variant="outline"
          className="w-full justify-start text-gray-500"
          onClick={() => setIsExpanded(true)}
        >
          <Search size={16} className="mr-2" />
          {placeholder}
        </Button>
      ) : (
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={placeholder}
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              autoFocus
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsExpanded(false);
              setSearchQuery('');
              onSearch('');
            }}
          >
            <X size={16} />
          </Button>
        </div>
      )}
    </div>
  );
};

// Mobile filter chips
export const MobileFilterChips = ({ filters, activeFilter, onFilterChange }) => {
  return (
    <div className="md:hidden mb-4">
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        <Filter size={16} className="text-gray-400 flex-shrink-0" />
        {filters.map((filter) => (
          <Button
            key={filter.value}
            variant={activeFilter === filter.value ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterChange(filter.value)}
            className={`flex-shrink-0 ${
              activeFilter === filter.value 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'border-gray-300'
            }`}
          >
            {filter.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

// Mobile-optimized card list
export const MobileCardList = ({ items, renderItem, emptyMessage }) => {
  return (
    <div className="md:hidden space-y-3">
      {items.length > 0 ? (
        items.map((item, index) => (
          <Card key={item.id || index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              {renderItem(item)}
            </CardContent>
          </Card>
        ))
      ) : (
        <div className="text-center py-8 text-gray-500">
          {emptyMessage}
        </div>
      )}
    </div>
  );
};

// Touch-friendly swipe actions
export const SwipeActions = ({ onSwipeLeft, onSwipeRight, children, leftAction, rightAction }) => {
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  const handleTouchStart = (e) => {
    setStartX(e.touches[0].clientX);
    setIsSwiping(true);
  };

  const handleTouchMove = (e) => {
    if (!isSwiping) return;
    setCurrentX(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!isSwiping) return;
    
    const diffX = currentX - startX;
    const threshold = 100;

    if (Math.abs(diffX) > threshold) {
      if (diffX > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (diffX < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }

    setIsSwiping(false);
    setCurrentX(0);
    setStartX(0);
  };

  return (
    <div
      className="relative overflow-hidden touch-manipulation md:touch-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Swipe indicators */}
      {isSwiping && (
        <>
          {rightAction && (
            <div className={`absolute left-0 top-0 h-full bg-green-500 transition-all duration-200 ${
              currentX - startX > 0 ? 'w-20' : 'w-0'
            } flex items-center justify-center text-white`}>
              {rightAction.icon}
            </div>
          )}
          {leftAction && (
            <div className={`absolute right-0 top-0 h-full bg-red-500 transition-all duration-200 ${
              currentX - startX < 0 ? 'w-20' : 'w-0'
            } flex items-center justify-center text-white`}>
              {leftAction.icon}
            </div>
          )}
        </>
      )}
      
      <div 
        className={`transform transition-transform duration-200 ${
          isSwiping ? `translateX(${Math.max(-100, Math.min(100, currentX - startX))}px)` : ''
        }`}
      >
        {children}
      </div>
    </div>
  );
};

// PWA install prompt
export const PWAInstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  if (!showPrompt) return null;

  return (
    <Card className="fixed bottom-4 left-4 right-4 z-50 border-green-200 bg-green-50 md:hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 mr-4">
            <h3 className="font-semibold text-green-800 mb-1">Install Growing Together</h3>
            <p className="text-sm text-green-700">Add to home screen for quick access and offline use!</p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPrompt(false)}
            >
              Later
            </Button>
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={handleInstall}
            >
              <Download size={16} className="mr-1" />
              Install
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Mobile layout wrapper
export const MobileLayout = ({ children, title, actions }) => {
  return (
    <div className="md:hidden min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="sticky top-16 bg-white border-b border-gray-200 p-4 z-30">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">{title}</h1>
          {actions && (
            <div className="flex space-x-2">
              {actions}
            </div>
          )}
        </div>
      </div>
      
      {/* Mobile Content */}
      <div className="p-4 pb-24">
        {children}
      </div>
    </div>
  );
};