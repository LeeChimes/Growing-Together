// Real-time WebSocket Service for Live Updates
class RealtimeService {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.heartbeatInterval = null;
    this.subscribers = new Map();
    this.messageQueue = [];
    this.userId = null;
    this.connect();
  }

  connect() {
    try {
      // In production, this would be a WebSocket server
      // For demo, we'll simulate WebSocket functionality with EventSource
      this.simulateWebSocket();
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.handleReconnect();
    }
  }

  simulateWebSocket() {
    // Simulate real-time updates with polling and events
    this.isConnected = true;
    this.reconnectAttempts = 0;
    
    console.log('🔗 Real-time service connected (simulated)');
    
    // Simulate heartbeat
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        this.emit('heartbeat', { timestamp: new Date().toISOString() });
      }
    }, 30000);

    // Simulate periodic updates
    this.simulateUpdates();
  }

  simulateUpdates() {
    // Simulate new community post notifications
    setTimeout(() => {
      if (this.isConnected) {
        this.handleMessage({
          type: 'new_post',
          data: {
            id: `post_${Date.now()}`,
            username: 'Sarah Johnson',
            content: 'Just harvested my first tomatoes of the season! 🍅',
            timestamp: new Date().toISOString()
          }
        });
      }
    }, 10000);

    // Simulate task completion notification
    setTimeout(() => {
      if (this.isConnected) {
        this.handleMessage({
          type: 'task_completed',
          data: {
            id: `task_${Date.now()}`,
            title: 'Weekly Watering',
            completedBy: 'Mike Wilson',
            timestamp: new Date().toISOString()
          }
        });
      }
    }, 25000);

    // Simulate event RSVP update
    setTimeout(() => {
      if (this.isConnected) {
        this.handleMessage({
          type: 'event_rsvp',
          data: {
            eventId: 'event_1',
            username: 'Alex Green',
            action: 'joined',
            timestamp: new Date().toISOString()
          }
        });
      }
    }, 45000);
  }

  handleMessage(message) {
    console.log('📨 Real-time message received:', message);
    
    // Emit to all subscribers of this message type
    const typeSubscribers = this.subscribers.get(message.type);
    if (typeSubscribers) {
      typeSubscribers.forEach(callback => {
        try {
          callback(message.data);
        } catch (error) {
          console.error('Subscriber callback error:', error);
        }
      });
    }

    // Emit to global subscribers
    const globalSubscribers = this.subscribers.get('*');
    if (globalSubscribers) {
      globalSubscribers.forEach(callback => {
        try {
          callback(message);
        } catch (error) {
          console.error('Global subscriber callback error:', error);
        }
      });
    }
  }

  subscribe(eventType, callback) {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }
    
    this.subscribers.get(eventType).add(callback);
    
    console.log(`🎧 Subscribed to: ${eventType}`);
    
    // Return unsubscribe function
    return () => {
      const typeSubscribers = this.subscribers.get(eventType);
      if (typeSubscribers) {
        typeSubscribers.delete(callback);
        if (typeSubscribers.size === 0) {
          this.subscribers.delete(eventType);
        }
      }
    };
  }

  emit(eventType, data) {
    this.handleMessage({ type: eventType, data });
  }

  send(message) {
    if (this.isConnected) {
      // In a real WebSocket implementation, this would send to server
      console.log('📤 Sending message:', message);
      
      // Simulate server acknowledgment
      setTimeout(() => {
        this.handleMessage({
          type: 'message_ack',
          data: { originalMessage: message, status: 'delivered' }
        });
      }, 100);
    } else {
      // Queue messages when disconnected
      this.messageQueue.push(message);
      console.log('📫 Message queued (disconnected):', message);
    }
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('❌ Max reconnection attempts reached');
      this.emit('connection_failed', { attempts: this.reconnectAttempts });
    }
  }

  disconnect() {
    this.isConnected = false;
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    console.log('🔌 Real-time service disconnected');
  }

  // User-specific methods
  setUserId(userId) {
    this.userId = userId;
    if (this.isConnected) {
      this.send({
        type: 'user_identity',
        userId: userId,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Specific event methods for common use cases
  onNewPost(callback) {
    return this.subscribe('new_post', callback);
  }

  onTaskUpdate(callback) {
    return this.subscribe('task_completed', callback);
  }

  onEventUpdate(callback) {
    return this.subscribe('event_rsvp', callback);
  }

  onUserJoined(callback) {
    return this.subscribe('user_joined', callback);
  }

  onNewMessage(callback) {
    return this.subscribe('new_message', callback);
  }

  // Send specific event types
  broadcastUserActivity(activity) {
    this.send({
      type: 'user_activity',
      userId: this.userId,
      activity,
      timestamp: new Date().toISOString()
    });
  }

  joinRoom(roomId) {
    this.send({
      type: 'join_room',
      roomId,
      userId: this.userId,
      timestamp: new Date().toISOString()
    });
  }

  leaveRoom(roomId) {
    this.send({
      type: 'leave_room',
      roomId,
      userId: this.userId,
      timestamp: new Date().toISOString()
    });
  }

  // Status methods
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      subscriberCount: Array.from(this.subscribers.values()).reduce((total, set) => total + set.size, 0),
      queuedMessages: this.messageQueue.length
    };
  }

  // Cleanup
  destroy() {
    this.disconnect();
    this.subscribers.clear();
    this.messageQueue = [];
  }
}

// Create singleton instance
const realtimeService = new RealtimeService();

export default realtimeService;