import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Calendar, MapPin, Users, Clock, CheckCircle, List, Plus } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EventsScreen = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rsvpLoading, setRsvpLoading] = useState({});
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const response = await axios.get(`${API}/events`);
      setEvents(response.data.sort((a, b) => new Date(a.date) - new Date(b.date)));
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRSVP = async (eventId) => {
    setRsvpLoading({ ...rsvpLoading, [eventId]: true });
    try {
      const response = await axios.post(`${API}/events/${eventId}/rsvp`);
      
      // Update the events list
      setEvents(events.map(event => {
        if (event.id === eventId) {
          const updatedRsvpList = response.data.rsvp 
            ? [...(event.rsvp_list || []), 'current_user_id']
            : (event.rsvp_list || []).filter(id => id !== 'current_user_id');
          
          return { ...event, rsvp_list: updatedRsvpList };
        }
        return event;
      }));
    } catch (error) {
      console.error('Error updating RSVP:', error);
    } finally {
      setRsvpLoading({ ...rsvpLoading, [eventId]: false });
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4 mt-16 md:mt-20">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-40 bg-gray-200 rounded-lg loading-skeleton"></div>
        ))}
      </div>
    );
  }

  const now = new Date();
  const upcomingEvents = events.filter(event => new Date(event.date) >= now);
  const pastEvents = events.filter(event => new Date(event.date) < now);

  // Calendar view helper functions
  const getCurrentMonthEvents = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
    });
  };

  const generateCalendarDays = () => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentMonthEvents = getCurrentMonthEvents();
    
    for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const dayEvents = currentMonthEvents.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.toDateString() === date.toDateString();
      });
      
      days.push({
        date,
        isCurrentMonth: date.getMonth() === currentMonth,
        isToday: date.toDateString() === currentDate.toDateString(),
        events: dayEvents
      });
    }
    
    return days;
  };

  return (
    <div className="p-4 max-w-4xl mx-auto mt-16 md:mt-20">
      <div className="mb-8">
        <h1 className="heading-primary mb-2">Community Events</h1>
        <p className="text-gray-600">Join fellow allotment members at upcoming events</p>
      </div>

      {/* Upcoming Events */}
      <div className="mb-8">
        <h2 className="heading-secondary mb-4 flex items-center">
          <Calendar className="mr-2" size={24} />
          Upcoming Events
        </h2>
        
        {upcomingEvents.length > 0 ? (
          <div className="space-y-4" data-testid="upcoming-events-list">
            {upcomingEvents.map((event) => (
              <Card key={event.id} className="event-card hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-xl text-gray-800 mb-2">{event.title}</CardTitle>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Clock size={16} />
                          <span>{new Date(event.date).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <MapPin size={16} />
                          <span>{event.location}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Users size={16} />
                          <span>{event.rsvp_list?.length || 0} attending</span>
                        </div>
                      </div>
                    </div>
                    
                    <Badge 
                      variant="secondary" 
                      className="bg-yellow-100 text-yellow-800"
                    >
                      Upcoming
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <p className="text-gray-700 mb-4">{event.description}</p>
                  
                  {event.bring_list && event.bring_list.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-800 mb-2">What to bring:</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {event.bring_list.map((item, index) => (
                          <li key={index} className="text-gray-600">{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {event.cover_photo && (
                    <img
                      src={event.cover_photo}
                      alt={event.title}
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Button
                        onClick={() => handleRSVP(event.id)}
                        disabled={rsvpLoading[event.id]}
                        className="btn-accessible bg-green-600 hover:bg-green-700"
                        data-testid={`rsvp-btn-${event.id}`}
                      >
                        {rsvpLoading[event.id] ? (
                          'Loading...'
                        ) : (
                          <>
                            <CheckCircle className="mr-2" size={16} />
                            RSVP
                          </>
                        )}
                      </Button>
                      
                      <span className="text-sm text-gray-600">
                        {event.rsvp_list?.length || 0} people attending
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No upcoming events</h3>
            <p className="text-gray-500">Check back later for new community events!</p>
          </div>
        )}
      </div>

      {/* Past Events */}
      {pastEvents.length > 0 && (
        <div>
          <h2 className="heading-secondary mb-4 flex items-center">
            <Clock className="mr-2" size={24} />
            Past Events
          </h2>
          
          <div className="space-y-4" data-testid="past-events-list">
            {pastEvents.slice(0, 3).map((event) => (
              <Card key={event.id} className="opacity-75 hover:opacity-90 transition-opacity">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg text-gray-700 mb-2">{event.title}</CardTitle>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 text-gray-500 text-sm">
                          <Clock size={14} />
                          <span>{new Date(event.date).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-500 text-sm">
                          <MapPin size={14} />
                          <span>{event.location}</span>
                        </div>
                      </div>
                    </div>
                    
                    <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                      Past Event
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <p className="text-gray-600 text-sm line-clamp-2">{event.description}</p>
                  <div className="mt-2 text-sm text-gray-500">
                    {event.rsvp_list?.length || 0} people attended
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsScreen;