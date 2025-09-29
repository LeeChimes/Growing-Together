import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  Card,
  Button,
  Tag,
  Avatar,
  FAB,
  EmptyState,
  useTheme,
} from '../src/design';
import { TextInput } from 'react-native';
import { useEvents, useEventRSVPs, useUpdateEventRSVP, useMyRSVPs, useEventComments, useCreateEventComment } from '../src/hooks/useEvents';
import { useEventNotifications } from '../src/hooks/useNotifications';
import { CreateEventModal } from '../src/components/CreateEventModal';
import { Database } from '../src/lib/database.types';
import { useAuthStore } from '../src/store/authStore';

type Event = Database['public']['Tables']['events']['Row'];
type EventRSVP = Database['public']['Tables']['event_rsvps']['Row'];

export default function EventsScreen() {
  const theme = useTheme();
  const { profile } = useAuthStore();
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [rsvpModalVisible, setRSVPModalVisible] = useState(false);
  const [bringingItems, setBringingItems] = useState<string[]>([]);
  const [rsvpNotes, setRSVPNotes] = useState('');

  const { data: events = [], isLoading, refetch } = useEvents();
  const { data: myRSVPs = [] } = useMyRSVPs();
  const updateRSVPMutation = useUpdateEventRSVP();
  
  // Initialize event notifications
  useEventNotifications();

  const upcomingEvents = events.filter(event => new Date(event.start_date) >= new Date());
  const pastEvents = events.filter(event => new Date(event.start_date) < new Date());

  const getMyRSVPForEvent = (eventId: string) => {
    return myRSVPs.find(rsvp => rsvp.event_id === eventId);
  };

  const handleRSVP = async (event: Event, status: 'going' | 'maybe' | 'not_going') => {
    try {
      await updateRSVPMutation.mutateAsync({
        eventId: event.id,
        status,
        bringingItems,
        notes: rsvpNotes,
      });
      setBringingItems([]);
      setRSVPNotes('');
      setRSVPModalVisible(false);
    } catch (error) {
      console.error('RSVP failed:', error);
    }
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow, ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  const getRSVPStatusColor = (status: string) => {
    switch (status) {
      case 'going': return theme.colors.success;
      case 'maybe': return theme.colors.warning;
      case 'not_going': return theme.colors.error;
      default: return theme.colors.gray;
    }
  };

  const generateCalendarData = () => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Get first day of month and adjust for Monday start
    const firstDay = new Date(currentYear, currentMonth, 1);
    const startDate = new Date(firstDay);
    const dayOfWeek = firstDay.getDay();
    startDate.setDate(startDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    
    const calendarDays = [];
    const monthEvents = events.filter(event => {
      const eventDate = new Date(event.start_date);
      return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
    });
    
    for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const dayEvents = monthEvents.filter(event => {
        const eventDate = new Date(event.start_date);
        return eventDate.toDateString() === date.toDateString();
      });
      
      calendarDays.push({
        date,
        isCurrentMonth: date.getMonth() === currentMonth,
        isToday: date.toDateString() === currentDate.toDateString(),
        events: dayEvents,
      });
    }
    
    return calendarDays;
  };

  const renderEventCard = ({ item: event }: { item: Event }) => {
    const myRSVP = getMyRSVPForEvent(event.id);
    const isPastEvent = new Date(event.start_date) < new Date();

    return (
      <TouchableOpacity onPress={() => setSelectedEvent(event)}>
        <Card style={[styles.eventCard as any, isPastEvent ? (styles.pastEventCard as any) : undefined]}>
          <View style={styles.eventHeader}>
            <View style={styles.eventInfo}>
              <Text style={[styles.eventTitle, { color: theme.colors.charcoal }]}>
                {event.title}
              </Text>
              <View style={styles.eventMeta}>
                <View style={styles.eventMetaItem}>
                  <Ionicons name="time" size={14} color={theme.colors.green} />
                  <Text style={[styles.eventMetaText, { color: theme.colors.gray }]}>
                    {formatEventDate(event.start_date)}
                  </Text>
                </View>
                <View style={styles.eventMetaItem}>
                  <Ionicons name="location" size={14} color={theme.colors.green} />
                  <Text style={[styles.eventMetaText, { color: theme.colors.gray }]}>
                    {event.location}
                  </Text>
                </View>
              </View>
            </View>

            {myRSVP && (
              <Tag
                label={myRSVP.status.replace('_', ' ')}
                variant="default"
                size="small"
                style={{ backgroundColor: getRSVPStatusColor(myRSVP.status) + '20' }}
              />
            )}
          </View>

          <Text style={[styles.eventDescription, { color: theme.colors.gray }]} numberOfLines={2}>
            {event.description}
          </Text>

          {event.bring_list && event.bring_list.length > 0 && (
            <View style={styles.bringList}>
              <Text style={[styles.bringListTitle, { color: theme.colors.charcoal }]}>
                Bring:
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {event.bring_list.slice(0, 3).map((item, index) => (
                  <Tag key={index} label={item} size="small" />
                ))}
                {event.bring_list.length > 3 && (
                  <Tag label={`+${event.bring_list.length - 3} more`} size="small" />
                )}
              </ScrollView>
            </View>
          )}

          {!isPastEvent && (
            <View style={styles.eventActions}>
              <Button
                title="Going"
                variant={myRSVP?.status === 'going' ? 'primary' : 'outline'}
                size="small"
                onPress={() => handleRSVP(event, 'going')}
                style={styles.rsvpButton}
              />
              <Button
                title="Maybe"
                variant={myRSVP?.status === 'maybe' ? 'primary' : 'outline'}
                size="small"
                onPress={() => handleRSVP(event, 'maybe')}
                style={styles.rsvpButton}
              />
              <Button
                title="Can't Go"
                variant={myRSVP?.status === 'not_going' ? 'primary' : 'outline'}
                size="small"
                onPress={() => handleRSVP(event, 'not_going')}
                style={styles.rsvpButton}
              />
            </View>
          )}
        </Card>
      </TouchableOpacity>
    );
  };

  const renderCalendarView = () => {
    const calendarDays = generateCalendarData();
    const currentDate = new Date();
    const monthName = currentDate.toLocaleDateString('en-GB', { 
      month: 'long', 
      year: 'numeric' 
    });

    return (
      <ScrollView style={styles.calendarContainer}>
        <View style={styles.calendarHeader}>
          <Text style={[styles.calendarTitle, { color: theme.colors.charcoal }]}>
            {monthName}
          </Text>
        </View>

        <View style={styles.calendarGrid}>
          {/* Day headers */}
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <View key={day} style={styles.dayHeader}>
              <Text style={[styles.dayHeaderText, { color: theme.colors.gray }]}>
                {day}
              </Text>
            </View>
          ))}

          {/* Calendar days */}
          {calendarDays.map((day, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.calendarDay,
                {
                  backgroundColor: day.isToday ? theme.colors.green + '20' : 'transparent',
                  opacity: day.isCurrentMonth ? 1 : 0.3,
                }
              ]}
              onPress={() => {
                if (day.events.length > 0) {
                  setSelectedEvent(day.events[0]);
                }
              }}
            >
              <Text style={[
                styles.calendarDayText,
                {
                  color: day.isToday ? theme.colors.green : theme.colors.charcoal,
                  fontWeight: day.isToday ? '600' : 'normal',
                }
              ]}>
                {day.date.getDate()}
              </Text>
              
              {day.events.length > 0 && (
                <View style={styles.eventIndicators}>
                  {day.events.slice(0, 2).map((event, eventIndex) => (
                    <View
                      key={eventIndex}
                      style={[
                        styles.eventIndicator,
                        { backgroundColor: theme.colors.green }
                      ]}
                    />
                  ))}
                  {day.events.length > 2 && (
                    <Text style={[styles.moreEvents, { color: theme.colors.green }]}>
                      +{day.events.length - 2}
                    </Text>
                  )}
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    );
  };

  if (selectedEvent) {
    return <EventDetailView event={selectedEvent} onBack={() => setSelectedEvent(null)} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.paper }]}>
        <View>
          <Text style={[styles.headerTitle, { color: theme.colors.charcoal }]}>
            Community Events
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.gray }]}>
            {upcomingEvents.length} upcoming events
          </Text>
        </View>

        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[
              styles.viewButton,
              {
                backgroundColor: viewMode === 'list' ? theme.colors.green : 'transparent',
              }
            ]}
            onPress={() => setViewMode('list')}
          >
            <Ionicons 
              name="list" 
              size={20} 
              color={viewMode === 'list' ? theme.colors.paper : theme.colors.gray} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.viewButton,
              {
                backgroundColor: viewMode === 'calendar' ? theme.colors.green : 'transparent',
              }
            ]}
            onPress={() => setViewMode('calendar')}
          >
            <Ionicons 
              name="calendar" 
              size={20} 
              color={viewMode === 'calendar' ? theme.colors.paper : theme.colors.gray} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {viewMode === 'calendar' ? (
        renderCalendarView()
      ) : (
        <FlatList
          data={upcomingEvents}
          renderItem={renderEventCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
          ListEmptyComponent={
            <EmptyState
              icon={<Ionicons name="calendar" size={48} color={theme.colors.gray} />}
              title="No upcoming events"
              description="Be the first to create an event for the community!"
              actionLabel="Create Event"
              onAction={() => setCreateModalVisible(true)}
            />
          }
          ListFooterComponent={
            pastEvents.length > 0 ? (
              <View style={styles.pastEventsSection}>
                <Text style={[styles.sectionTitle, { color: theme.colors.charcoal }]}>
                  Past Events
                </Text>
                {pastEvents.slice(0, 5).map((event) => renderEventCard({ item: event }))}
              </View>
            ) : null
          }
        />
      )}

      {/* FAB for Admin/Event Creators */}
      {profile?.role === 'admin' && (
        <FAB
          onPress={() => setCreateModalVisible(true)}
          icon={<Ionicons name="add" size={24} color="white" />}
        />
      )}

      {/* Create Event Modal */}
      <CreateEventModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
      />
    </SafeAreaView>
  );
}

// Placeholder for Event Detail View
function EventDetailView({ event, onBack }: { event: Event; onBack: () => void }) {
  const theme = useTheme();
  const { data: comments = [] } = useEventComments(event.id);
  const createComment = useCreateEventComment();
  const [commentText, setCommentText] = useState('');
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.detailHeader}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.charcoal} />
        </TouchableOpacity>
        <Text style={[styles.detailTitle, { color: theme.colors.charcoal }]}>
          Event Details
        </Text>
      </View>
      
      <ScrollView style={styles.detailContent}>
        <Card>
          <Text style={[styles.eventTitle, { color: theme.colors.charcoal }]}>
            {event.title}
          </Text>
          <Text style={[styles.eventDescription, { color: theme.colors.gray }]}>
            {event.description}
          </Text>
          <View style={styles.eventInfo}>
            <Text style={[styles.label, { color: theme.colors.charcoal }]}>
              When: {new Date(event.start_date).toLocaleString('en-GB')}
            </Text>
            <Text style={[styles.label, { color: theme.colors.charcoal }]}>
              Where: {event.location}
            </Text>
          </View>
        </Card>

        {/* Bring list */}
        {event.bring_list && event.bring_list.length > 0 && (
          <Card style={{ marginTop: 12 }}>
            <Text style={[styles.label, { color: theme.colors.charcoal, marginBottom: 8 }]}>Bring list</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {event.bring_list.map((item, i) => (
                <Tag key={i} label={item} size="small" />
              ))}
            </View>
          </Card>
        )}

        {/* Comments */}
        <Card style={{ marginTop: 12 }}>
          <Text style={[styles.label, { color: theme.colors.charcoal, marginBottom: 8 }]}>Comments</Text>
          {comments.length === 0 ? (
            <Text style={{ color: theme.colors.gray }}>No comments yet.</Text>
          ) : (
            <View style={{ gap: 12 }}>
              {comments.map((c) => (
                <View key={c.id} style={{ gap: 4 }}>
                  <Text style={{ color: theme.colors.charcoal, fontWeight: '600' }}>{c.user_id?.slice(0, 6)}</Text>
                  <Text style={{ color: theme.colors.gray }}>{c.text}</Text>
                </View>
              ))}
            </View>
          )}
          <View style={{ flexDirection: 'row', marginTop: 12, gap: 8 }}>
            <View style={{ flex: 1 }}>
              <TextInput
                style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, color: theme.colors.charcoal }}
                value={commentText}
                onChangeText={setCommentText}
                placeholder="Add a comment"
                placeholderTextColor={theme.colors.gray}
              />
            </View>
            <Button
              title="Post"
              onPress={async () => {
                if (!commentText.trim()) return;
                await createComment.mutateAsync({ eventId: event.id, text: commentText.trim() });
                setCommentText('');
              }}
              size="small"
            />
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    padding: 2,
  },
  viewButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
  },
  listContent: {
    padding: 16,
  },
  eventCard: {
    marginBottom: 12,
  },
  pastEventCard: {
    opacity: 0.7,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  eventMeta: {
    gap: 4,
  },
  eventMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventMetaText: {
    fontSize: 14,
  },
  eventDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  bringList: {
    marginBottom: 12,
  },
  bringListTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  eventActions: {
    flexDirection: 'row',
    gap: 8,
  },
  rsvpButton: {
    flex: 1,
  },
  pastEventsSection: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  // Calendar styles
  calendarContainer: {
    flex: 1,
  },
  calendarHeader: {
    padding: 16,
    alignItems: 'center',
  },
  calendarTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
  dayHeader: {
    width: '14.28%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayHeaderText: {
    fontSize: 12,
    fontWeight: '600',
  },
  calendarDay: {
    width: '14.28%',
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: '#e5e7eb',
  },
  calendarDayText: {
    fontSize: 14,
  },
  eventIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 2,
  },
  eventIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  moreEvents: {
    fontSize: 10,
    fontWeight: '500',
  },
  // Detail view styles
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 16,
  },
  detailContent: {
    flex: 1,
    padding: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
  },
});