
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { 
  Card, 
  Button, 
  Tag, 
  Avatar, 
  ListItem, 
  EmptyState, 
  useTheme 
} from '../src/design';
import { useAuthStore } from '../src/store/authStore';
import { useTasks } from '../src/hooks/useTasks';
import { useEvents } from '../src/hooks/useEvents';
import { usePosts } from '../src/hooks/useCommunity';
import { fetchWeatherSnapshot, WeatherSnapshot } from '../src/lib/weather';
import { TaskPanel } from '../src/components/TaskPanel';

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { profile } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);

  // Data hooks
  const { data: siteTasks = [] } = useTasks({ type: 'site', completed: false });
  const { data: events = [] } = useEvents({});
  const { data: posts = [] } = usePosts({ limit: 3 });

  const nextEvent = events?.find(e => !e.is_cancelled) || null;
  const latestPosts = posts || [];

  useEffect(() => {
    const loadWeather = async () => {
      const snapshot = await fetchWeatherSnapshot();
      setWeather(snapshot);
    };
    loadWeather();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Re-fetch weather
    fetchWeatherSnapshot().then(setWeather).finally(() => setRefreshing(false));
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Announcement Banner: show if there is a pinned post */}
        {latestPosts?.some(p => (p as any).is_pinned) && (
          <View style={[styles.banner, { backgroundColor: theme.colors.warning + '20' }]}>
            <Ionicons name="megaphone" size={20} color={theme.colors.warning} />
            <View style={styles.bannerContent}>
              <Text style={[styles.bannerTitle, { color: theme.colors.warning }]}> 
                Announcement
              </Text>
              <Text style={[styles.bannerText, { color: theme.colors.charcoal }]}> 
                {(latestPosts.find(p => (p as any).is_pinned) as any)?.text || 'Pinned update'}
              </Text>
            </View>
          </View>
        )}

        {/* Welcome Section */}
        <View style={styles.welcome}>
          <Text style={[styles.welcomeTitle, { color: theme.colors.charcoal }]}>
            Welcome back, {profile?.full_name?.split(' ')[0] || 'Member'}!
          </Text>
          <Text style={[styles.welcomeSubtitle, { color: theme.colors.gray }]}>
            Here's what's happening in your allotment community
          </Text>
        </View>

        {/* Weather Widget (cached) */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="partly-sunny" size={24} color={theme.colors.sky} />
              <Text style={[styles.cardTitle, { color: theme.colors.charcoal }]}>
                Today's Weather
              </Text>
            </View>
            <Text style={[styles.temperature, { color: theme.colors.charcoal }]}>
              {weather?.temperatureC ?? '--'}°C
            </Text>
          </View>
          <Text style={[styles.weatherCondition, { color: theme.colors.gray }]}>
            {weather?.condition ?? '—'}{weather?.humidityPct != null ? ` • Humidity ${weather.humidityPct}%` : ''}{weather?.windKph != null ? ` • Wind ${weather.windKph} km/h` : ''}
          </Text>
        </Card>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={[styles.sectionTitle, { color: theme.colors.charcoal }]}>
            Quick Actions
          </Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.green }]}
              onPress={() => router.push('/diary')}
            >
              <Ionicons name="book" size={40} color={theme.colors.paper} />
              <Text style={[styles.actionText, { color: theme.colors.paper }]}>
                Diary
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.sky }]}
              onPress={() => router.push('/events')}
            >
              <Ionicons name="calendar" size={40} color={theme.colors.paper} />
              <Text style={[styles.actionText, { color: theme.colors.paper }]}>
                Events
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.sunflower }]}
              onPress={() => router.push('/community')}
            >
              <Ionicons name="people" size={40} color={theme.colors.charcoal} />
              <Text style={[styles.actionText, { color: theme.colors.charcoal }]}>
                Community
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.soil }]}
              onPress={() => router.push('/gallery')}
            >
              <Ionicons name="images" size={40} color={theme.colors.paper} />
              <Text style={[styles.actionText, { color: theme.colors.paper }]}>
                Gallery
              </Text>
            </TouchableOpacity>

            {/* Admin Tools shortcut */}
            {profile?.role === 'admin' && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.colors.error + '20' }]}
                onPress={() => router.push('/more')}
              >
                <Ionicons name="shield-checkmark" size={40} color={theme.colors.error} />
                <Text style={[styles.actionText, { color: theme.colors.error }]}> 
                  Admin Tools
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.sunflower }]}
              onPress={() => router.push('/recipes')}
            >
              <Ionicons name="restaurant" size={40} color={theme.colors.charcoal} />
              <Text style={[styles.actionText, { color: theme.colors.charcoal }]}> 
                Recipes
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Task Management Panel */}
        <View style={styles.taskPanelContainer}>
          <TaskPanel />
        </View>

        {/* Next Event */}
        {nextEvent && (
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="calendar" size={24} color={theme.colors.sky} />
                <Text style={[styles.cardTitle, { color: theme.colors.charcoal }]}>
                  Next Event
                </Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.eventItem}
              onPress={() => router.push('/events')}
            >
              <View>
                <Text style={[styles.eventTitle, { color: theme.colors.charcoal }]}>
                  {nextEvent.title}
                </Text>
                <Text style={[styles.eventDate, { color: theme.colors.gray }]}>
                  {new Date(nextEvent.start_date).toLocaleDateString('en-GB')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.gray} />
            </TouchableOpacity>
          </Card>
        )}

        {/* Latest Posts */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="chatbubbles" size={24} color={theme.colors.green} />
              <Text style={[styles.cardTitle, { color: theme.colors.charcoal }]}>
                Latest Posts
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/community')}>
              <Text style={[styles.seeAll, { color: theme.colors.green }]}>
                See All
              </Text>
            </TouchableOpacity>
          </View>
          
          {latestPosts.length > 0 ? (
            <View style={styles.postList}>
              {latestPosts.map((post: any) => (
                <TouchableOpacity 
                  key={post.id} 
                  style={styles.postItem}
                  onPress={() => router.push('/community')}
                >
                  <Avatar name={post.author?.full_name || 'Member'} size="small" />
                  <View style={styles.postContent}>
                    <View style={styles.postHeader}>
                      <Text style={[styles.postAuthor, { color: theme.colors.charcoal }]}>
                        {post.author?.full_name || 'Member'}
                      </Text>
                    </View>
                    <Text style={[styles.postText, { color: theme.colors.charcoal }]}>
                      {post.text}
                    </Text>
                    <View style={styles.postStats}>
                      <View style={styles.postStat}>
                        <Ionicons name="heart" size={14} color={theme.colors.error} />
                        <Text style={[styles.postStatText, { color: theme.colors.gray }]}>0</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <EmptyState
              title="No recent posts"
              description="Be the first to share something with the community!"
            />
          )}
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
  scrollView: {
    flex: 1,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  bannerContent: {
    flex: 1,
    marginLeft: 12,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  bannerText: {
    fontSize: 14,
    lineHeight: 20,
  },
  welcome: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  temperature: {
    fontSize: 24,
    fontWeight: '700',
  },
  weatherCondition: {
    fontSize: 14,
    marginTop: 4,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '500',
  },
  quickActions: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  taskPanelContainer: {
    marginBottom: 24,
    backgroundColor: 'white',
    borderRadius: 12,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    // Web compatibility
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '31%',
    aspectRatio: 1.0,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'center',
  },
  taskList: {
    gap: 12,
  },
  taskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  taskDate: {
    fontSize: 14,
  },
  eventItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 14,
    marginBottom: 2,
  },
  eventAttendees: {
    fontSize: 14,
    fontWeight: '500',
  },
  postList: {
    gap: 16,
  },
  postItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  postContent: {
    flex: 1,
    marginLeft: 12,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  postAuthor: {
    fontSize: 14,
    fontWeight: '600',
  },
  postTime: {
    fontSize: 12,
  },
  postText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  postStats: {
    flexDirection: 'row',
  },
  postStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  postStatText: {
    fontSize: 12,
    marginLeft: 4,
  },
});
