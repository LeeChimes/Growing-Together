import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  Card,
  Avatar,
  Tag,
  Button,
  FAB,
  EmptyState,
  useTheme,
} from '../src/design';
import { 
  usePosts, 
  useTogglePin, 
  useDeletePost, 
  usePostReactions, 
  useCreateComment 
} from '../src/hooks/useCommunity';
import { CreatePostModal } from '../src/components/CreatePostModal';
import { ChatModal } from '../src/components/ChatModal';
import { useAuthStore } from '../src/store/authStore';

export default function CommunityScreen() {
  const theme = useTheme();
  const { user, profile } = useAuthStore();
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pinned'>('all');
  const [showChat, setShowChat] = useState(false);
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  const [showComments, setShowComments] = useState<Set<string>>(new Set());

  const { data: posts = [], isLoading, refetch } = usePosts({
    pinnedOnly: filter === 'pinned',
  });
  
  const togglePinMutation = useTogglePin();
  const deletePostMutation = useDeletePost();
  const reactionMutation = usePostReactions();
  const commentMutation = useCreateComment();

  const handleTogglePin = async (postId: string, isPinned: boolean) => {
    try {
      await togglePinMutation.mutateAsync({ postId, isPinned: !isPinned });
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleDeletePost = async (postId: string) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePostMutation.mutateAsync(postId);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete post');
            }
          },
        },
      ]
    );
  };

  const handleReaction = async (postId: string, reaction: 'like' | 'love' | 'helpful') => {
    try {
      await reactionMutation.mutateAsync({ postId, reaction });
    } catch (error) {
      console.error('Reaction failed:', error);
    }
  };

  const toggleExpanded = (postId: string) => {
    setExpandedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const toggleComments = (postId: string) => {
    setShowComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  const renderPost = ({ item: post }: { item: any }) => {
    const isExpanded = expandedPosts.has(post.id);
    const shouldTruncate = post.content.length > 300;
    const displayContent = shouldTruncate && !isExpanded 
      ? post.content.substring(0, 300) + '...' 
      : post.content;
    const isOwner = post.user_id === user?.id;
    const canPin = profile?.role === 'admin';
    const showCommentsForPost = showComments.has(post.id);

    return (
      <Card style={[styles.postCard, post.is_pinned && styles.pinnedPost]}>
        {/* Post Header */}
        <View style={styles.postHeader}>
          <View style={styles.authorInfo}>
            <Avatar 
              name={post.author?.full_name || 'Member'} 
              imageUri={post.author?.avatar_url || null} 
              size="medium" 
            />
            <View style={styles.authorDetails}>
              <View style={styles.authorRow}>
                <Text style={[styles.authorName, { color: theme.colors.charcoal }]}>
                  {post.author?.full_name || 'Community Member'}
                </Text>
                {post.is_pinned && (
                  <View style={styles.pinnedIndicator}>
                    <Ionicons name="pin" size={12} color={theme.colors.warning} />
                    <Text style={[styles.pinnedText, { color: theme.colors.warning }]}>
                      Pinned
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[styles.postTime, { color: theme.colors.gray }]}>
                {formatTimeAgo(post.created_at)}
              </Text>
            </View>
          </View>

          {/* Post Actions Menu */}
          <View style={styles.postActions}>
            {canPin && (
              <TouchableOpacity
                onPress={() => handleTogglePin(post.id, post.is_pinned)}
                style={[styles.actionButton, { backgroundColor: theme.colors.warning + '20' }]}
              >
                <Ionicons 
                  name={post.is_pinned ? 'pin' : 'pin-outline'} 
                  size={16} 
                  color={theme.colors.warning} 
                />
              </TouchableOpacity>
            )}
            
            {isOwner && (
              <TouchableOpacity
                onPress={() => handleDeletePost(post.id)}
                style={[styles.actionButton, { backgroundColor: theme.colors.error + '20' }]}
              >
                <Ionicons name="trash-outline" size={16} color={theme.colors.error} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Post Content */}
        <View style={styles.postContent}>
          <Text style={[styles.postText, { color: theme.colors.charcoal }]}>
            {displayContent}
          </Text>
          
          {shouldTruncate && (
            <TouchableOpacity onPress={() => toggleExpanded(post.id)}>
              <Text style={[styles.readMore, { color: theme.colors.green }]}>
                {isExpanded ? 'Read less' : 'Read more'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Post Photos */}
        {post.photos && post.photos.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
            {post.photos.map((photo: string, index: number) => (
              <Image key={index} source={{ uri: photo }} style={styles.postPhoto} />
            ))}
          </ScrollView>
        )}

        {/* Engagement Bar */}
        <View style={styles.engagementBar}>
          <View style={styles.reactions}>
            <TouchableOpacity
              style={styles.reactionButton}
              onPress={() => handleReaction(post.id, 'like')}
            >
              <Ionicons name="heart-outline" size={20} color={theme.colors.error} />
              <Text style={[styles.reactionText, { color: theme.colors.gray }]}>
                Like
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.reactionButton}
              onPress={() => handleReaction(post.id, 'helpful')}
            >
              <Ionicons name="thumbs-up-outline" size={20} color={theme.colors.green} />
              <Text style={[styles.reactionText, { color: theme.colors.gray }]}>
                Helpful
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.reactionButton}
              onPress={() => toggleComments(post.id)}
            >
              <Ionicons name="chatbubble-outline" size={20} color={theme.colors.sky} />
              <Text style={[styles.reactionText, { color: theme.colors.gray }]}>
                Comment
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Comments Section */}
        {showCommentsForPost && (
          <View style={[styles.commentsSection, { borderTopColor: theme.colors.grayLight }]}>
            <View style={styles.commentInput}>
              <Avatar name={profile?.full_name ?? undefined} size="small" />
              <View style={[styles.commentInputField, { borderColor: theme.colors.grayLight }]}>
                <Text style={[styles.commentPlaceholder, { color: theme.colors.gray }]}>
                  Write a comment...
                </Text>
              </View>
              <TouchableOpacity 
                style={[styles.commentSendButton, { backgroundColor: theme.colors.green }]}
                onPress={() => commentMutation.mutate({ postId: post.id, content: 'Great post!' })}
              >
                <Ionicons name="send" size={16} color={theme.colors.paper} />
              </TouchableOpacity>
            </View>

            {/* Sample Comments */}
            <View style={styles.commentsList}>
              <View style={styles.comment}>
                <Avatar name="Jane Smith" size="small" />
                <View style={styles.commentContent}>
                  <Text style={[styles.commentAuthor, { color: theme.colors.charcoal }]}>
                    Jane Smith
                  </Text>
                  <Text style={[styles.commentText, { color: theme.colors.charcoal }]}>
                    Thanks for sharing! My tomatoes are struggling with similar issues.
                  </Text>
                  <Text style={[styles.commentTime, { color: theme.colors.gray }]}>
                    2h ago
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.paper }]}>
        <View>
          <Text style={[styles.headerTitle, { color: theme.colors.charcoal }]}>
            Community Feed
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.gray }]}>
            {posts.filter(p => p.is_pinned).length} pinned • {posts.length} total posts
          </Text>
        </View>

        {/* Header Actions: Chat + Filter Toggle */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity
            onPress={() => setShowChat(true)}
            style={{ padding: 8, borderRadius: 20, backgroundColor: theme.colors.sky + '20' }}
          >
            <Ionicons name="chatbubbles" size={20} color={theme.colors.sky} />
          </TouchableOpacity>

          <View style={[styles.filterToggle, { backgroundColor: theme.colors.grayLight }]}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              {
                backgroundColor: filter === 'all' ? theme.colors.green : 'transparent',
              }
            ]}
            onPress={() => setFilter('all')}
          >
            <Text 
              style={[
                styles.filterText,
                { color: filter === 'all' ? theme.colors.paper : theme.colors.gray }
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              {
                backgroundColor: filter === 'pinned' ? theme.colors.green : 'transparent',
              }
            ]}
            onPress={() => setFilter('pinned')}
          >
            <Text 
              style={[
                styles.filterText,
                { color: filter === 'pinned' ? theme.colors.paper : theme.colors.gray }
              ]}
            >
              Pinned
            </Text>
          </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Posts Feed */}
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.feedContent}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon={<Ionicons name="people" size={48} color={theme.colors.gray} />}
            title={filter === 'pinned' ? 'No pinned posts' : 'No posts yet'}
            description={
              filter === 'pinned' 
                ? 'Admins can pin important posts for the community'
                : 'Be the first to share something with the community!'
            }
            actionLabel={filter === 'all' ? 'Create Post' : undefined}
            onAction={filter === 'all' ? () => setCreateModalVisible(true) : undefined}
          />
        }
      />

      {/* FAB */}
      <FAB
        onPress={() => setCreateModalVisible(true)}
        icon={<Ionicons name="add" size={24} color="white" />}
      />

      {/* Create Post Modal */}
      <CreatePostModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
      />

      {/* Chat Modal */}
      <ChatModal visible={showChat} onClose={() => setShowChat(false)} />
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
  filterToggle: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 2,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  feedContent: {
    padding: 16,
  },
  postCard: {
    marginBottom: 16,
  },
  pinnedPost: {
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  authorDetails: {
    marginLeft: 12,
    flex: 1,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
  },
  pinnedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  pinnedText: {
    fontSize: 12,
    fontWeight: '500',
  },
  postTime: {
    fontSize: 14,
    marginTop: 2,
  },
  postActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postContent: {
    marginBottom: 12,
  },
  postText: {
    fontSize: 16,
    lineHeight: 24,
  },
  readMore: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  photoScroll: {
    marginBottom: 12,
    marginHorizontal: -4,
  },
  postPhoto: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  engagementBar: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
  },
  reactions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  reactionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  commentsSection: {
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 12,
  },
  commentInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  commentInputField: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'white',
  },
  commentPlaceholder: {
    fontSize: 14,
  },
  commentSendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentsList: {
    gap: 12,
  },
  comment: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  commentContent: {
    flex: 1,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 2,
  },
  commentTime: {
    fontSize: 12,
  },
});