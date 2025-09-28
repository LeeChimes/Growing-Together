import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import EnhancedDiaryModal from './EnhancedDiaryModal';
import WeatherService from './WeatherService';
import { QuickActionBar, ScrollToTop, OfflineIndicator } from './MobileOptimizations';
import { 
  Cloud, 
  Thermometer, 
  Droplets, 
  Wind, 
  Calendar, 
  CheckSquare,
  Users,
  Plus,
  TrendingUp
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const HomeScreen = () => {
  const [weather, setWeather] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [weeklyTasks, setWeeklyTasks] = useState([]);
  const [recentPosts, setRecentPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showQuickDiary, setShowQuickDiary] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [weatherRes, eventsRes, tasksRes, postsRes] = await Promise.all([
        axios.get(`${API}/weather`),
        axios.get(`${API}/events`),
        axios.get(`${API}/tasks`),
        axios.get(`${API}/posts`)
      ]);

      setWeather(weatherRes.data);
      
      // Get upcoming events (next 7 days)
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const upcoming = eventsRes.data.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= now && eventDate <= nextWeek;
      }).slice(0, 3);
      setUpcomingEvents(upcoming);

      // Get weekly tasks (incomplete tasks)
      const weekly = tasksRes.data.filter(task => !task.completed).slice(0, 5);
      setWeeklyTasks(weekly);

      // Get recent posts
      setRecentPosts(postsRes.data.slice(0, 3));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDiarySubmit = async (diaryData) => {
    try {
      await axios.post(`${API}/diary`, diaryData);
      // Refresh data after adding diary entry
      loadDashboardData();
    } catch (error) {
      console.error('Error creating diary entry:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 rounded-lg loading-skeleton"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-6 mt-16 md:mt-20">
      {/* Welcome Header */}
      <div className="text-center mb-8">
        <h1 className="heading-primary mb-2">Welcome to Growing Together</h1>
        <p className="text-gray-600 text-accessible">
          Stafford Road Allotment Community Hub
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Button
          className="btn-accessible h-20 flex-col space-y-2 bg-green-600 hover:bg-green-700"
          data-testid="quick-add-diary"
          onClick={() => setShowQuickDiary(true)}
        >
          <Plus size={24} />
          <span>Add Diary</span>
        </Button>
        <Button
          className="btn-accessible h-20 flex-col space-y-2 bg-blue-600 hover:bg-blue-700"
          data-testid="quick-check-weather"
        >
          <Cloud size={24} />
          <span>Weather</span>
        </Button>
        <Button
          className="btn-accessible h-20 flex-col space-y-2 bg-yellow-600 hover:bg-yellow-700"
          data-testid="quick-view-events"
        >
          <Calendar size={24} />
          <span>Events</span>
        </Button>
        <Button
          className="btn-accessible h-20 flex-col space-y-2 bg-purple-600 hover:bg-purple-700"
          data-testid="quick-view-community"
        >
          <Users size={24} />
          <span>Community</span>
        </Button>
      </div>

      {/* Enhanced Weather Widget */}
      <WeatherService compact={true} />

      <div className="grid md:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <Card data-testid="upcoming-events">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-800">
              <Calendar size={20} />
              <span>Upcoming Events</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="event-card p-3 rounded-lg">
                    <h4 className="font-semibold text-gray-800">{event.title}</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      {new Date(event.date).toLocaleDateString()} at {event.location}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs">
                        {event.rsvp_list?.length || 0} attending
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No upcoming events this week</p>
            )}
          </CardContent>
        </Card>

        {/* Weekly Tasks */}
        <Card data-testid="weekly-tasks">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-800">
              <CheckSquare size={20} />
              <span>This Week's Tasks</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weeklyTasks.length > 0 ? (
              <div className="space-y-3">
                {weeklyTasks.map((task) => (
                  <div key={task.id} className="flex items-center space-x-3 p-2 border border-gray-200 rounded-lg">
                    <input
                      type="checkbox"
                      className="h-5 w-5 text-green-600"
                      data-testid={`task-checkbox-${task.id}`}
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{task.title}</p>
                      <p className="text-sm text-gray-600">{task.description}</p>
                      <Badge 
                        variant={task.task_type === 'site' ? 'default' : 'secondary'}
                        className="text-xs mt-1"
                      >
                        {task.task_type} task
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No pending tasks</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Community Activity */}
      <Card data-testid="community-activity">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-green-800">
            <Users size={20} />
            <span>Recent Community Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentPosts.length > 0 ? (
            <div className="space-y-4">
              {recentPosts.map((post) => (
                <div key={post.id} className="post-card p-4 rounded-lg bg-white border">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-semibold">
                        {post.username?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{post.username}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(post.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-3">{post.content}</p>
                  {post.photos && post.photos.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {post.photos.slice(0, 2).map((photo, index) => (
                        <img
                          key={index}
                          src={photo}
                          alt="Post"
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  )}
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>{post.comments?.length || 0} comments</span>
                    <span>❤️ {Object.values(post.reactions?.heart || {}).length || 0}</span>
                    <span>👍 {Object.values(post.reactions?.like || {}).length || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No recent community activity</p>
          )}
        </CardContent>
      </Card>

      {/* Tips Section */}
      <Card className="bg-gradient-to-br from-green-50 to-yellow-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-green-800">💡 Today's Gardening Tip</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">
            <strong>Watering Wisdom:</strong> Water your plants deeply but less frequently to encourage 
            strong root development. Early morning is the best time as it allows plants to absorb 
            water before the heat of the day and reduces evaporation.
          </p>
        </CardContent>
      </Card>

      {/* Mobile Enhancements */}
      <OfflineIndicator />
      <QuickActionBar
        onQuickDiary={() => setShowQuickDiary(true)}
        onQuickPhoto={() => console.log('Quick photo')}
        onQuickTask={() => console.log('Quick task')}
      />
      <ScrollToTop />

      {/* Enhanced Quick Diary Modal */}
      <EnhancedDiaryModal
        open={showQuickDiary}
        onClose={() => setShowQuickDiary(false)}
        onSubmit={handleQuickDiarySubmit}
      />
    </div>
  );
};

export default HomeScreen;