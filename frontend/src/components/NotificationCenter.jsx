import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Bell, X, Check, Calendar, Users, Leaf, AlertTriangle } from 'lucide-react';

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    // Load notifications (mock data for demo)
    const mockNotifications = [
      {
        id: 1,
        type: 'event_reminder',
        title: 'Event Tomorrow',
        message: 'Test Community Event starts tomorrow at Community Garden',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        read: false,
        icon: Calendar,
        color: 'text-blue-600'
      },
      {
        id: 2,
        type: 'task_due',
        title: 'Task Due Soon',
        message: 'Your weekly watering task is due in 2 days',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
        read: false,
        icon: AlertTriangle,
        color: 'text-yellow-600'
      },
      {
        id: 3,
        type: 'community_post',
        title: 'New Community Post',
        message: 'John shared photos of his harvest in the community feed',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        read: true,
        icon: Users,
        color: 'text-green-600'
      },
      {
        id: 4,
        type: 'plant_care',
        title: 'Plant Care Reminder',
        message: 'Time to fertilize your tomatoes - optimal growth period',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        read: true,
        icon: Leaf,
        color: 'text-green-500'
      }
    ];
    
    setNotifications(mockNotifications);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (notificationId) => {
    setNotifications(notifications.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const removeNotification = (notificationId) => {
    setNotifications(notifications.filter(n => n.id !== notificationId));
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="sm"
        className="relative p-2"
        onClick={() => setShowNotifications(!showNotifications)}
        data-testid="notification-bell"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className="absolute right-0 top-12 w-80 max-w-sm z-50">
          <Card className="border-2 border-green-200 shadow-lg">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">Notifications</h3>
                <div className="flex items-center space-x-2">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-xs text-green-600 hover:text-green-700"
                    >
                      Mark all read
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNotifications(false)}
                    className="p-1"
                  >
                    <X size={16} />
                  </Button>
                </div>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => {
                    const Icon = notification.icon;
                    return (
                      <div
                        key={notification.id}
                        className={`p-4 hover:bg-gray-50 transition-colors ${
                          !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`p-2 rounded-full bg-gray-100 ${notification.color}`}>
                            <Icon size={16} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className={`text-sm font-medium ${
                                !notification.read ? 'text-gray-900' : 'text-gray-700'
                              }`}>
                                {notification.title}
                              </h4>
                              
                              <div className="flex items-center space-x-1">
                                {!notification.read && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => markAsRead(notification.id)}
                                    className="p-1 hover:bg-green-100"
                                    title="Mark as read"
                                  >
                                    <Check size={14} className="text-green-600" />
                                  </Button>
                                )}
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeNotification(notification.id)}
                                  className="p-1 hover:bg-red-100"
                                  title="Remove"
                                >
                                  <X size={14} className="text-red-600" />
                                </Button>
                              </div>
                            </div>
                            
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            
                            <p className="text-xs text-gray-500 mt-2">
                              {formatTimestamp(notification.timestamp)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Bell size={32} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-600">No notifications</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;