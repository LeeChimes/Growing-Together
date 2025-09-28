import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Plus, Heart, ThumbsUp, MessageCircle, Camera, Pin, Users } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CommunityScreen = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPost, setNewPost] = useState({ content: '', photos: [] });

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const response = await axios.get(`${API}/posts`);
      setPosts(response.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPost.content.trim()) return;

    try {
      const response = await axios.post(`${API}/posts`, newPost);
      setPosts([response.data, ...posts]);
      setNewPost({ content: '', photos: [] });
      setShowCreatePost(false);
    } catch (error) {
      console.error('Error creating post:', error);
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

  return (
    <div className="p-4 max-w-2xl mx-auto mt-16 md:mt-20">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="heading-primary">Community Feed</h1>
          <p className="text-gray-600">Share and connect with fellow gardeners</p>
        </div>
        
        <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
          <DialogTrigger asChild>
            <Button 
              className="btn-accessible bg-green-600 hover:bg-green-700"
              data-testid="create-post-btn"
            >
              <Plus className="mr-2" size={20} />
              Share
            </Button>
          </DialogTrigger>
          
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Share with Community</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleCreatePost} className="space-y-4">
              <Textarea
                placeholder="What's happening in your plot today?"
                value={newPost.content}
                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                rows={4}
                className="resize-none"
                data-testid="post-content-input"
              />
              
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <Camera size={16} />
                  <span>Add Photos</span>
                </Button>
                
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreatePost(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    className="bg-green-600 hover:bg-green-700"
                    disabled={!newPost.content.trim()}
                    data-testid="post-submit-btn"
                  >
                    Share
                  </Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Posts Feed */}
      <div className="space-y-6" data-testid="community-posts-feed">
        {posts.length > 0 ? (
          posts.map((post) => (
            <Card key={post.id} className="post-card hover:shadow-md transition-all">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-semibold text-lg">
                        {post.username?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{post.username}</h3>
                      <p className="text-sm text-gray-600">
                        {new Date(post.created_at).toLocaleDateString()} at{' '}
                        {new Date(post.created_at).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {post.is_pinned && (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        <Pin size={12} className="mr-1" />
                        Pinned
                      </Badge>
                    )}
                    {post.is_announcement && (
                      <Badge variant="default" className="bg-blue-100 text-blue-800">
                        Announcement
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <p className="text-gray-700 whitespace-pre-wrap mb-4">{post.content}</p>
                
                {post.photos && post.photos.length > 0 && (
                  <div className={`grid gap-2 mb-4 ${
                    post.photos.length === 1 ? 'grid-cols-1' :
                    post.photos.length === 2 ? 'grid-cols-2' :
                    'grid-cols-2 md:grid-cols-3'
                  }`}>
                    {post.photos.map((photo, index) => (
                      <img
                        key={index}
                        src={photo}
                        alt={`Post photo ${index + 1}`}
                        className="w-full h-40 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                      />
                    ))}
                  </div>
                )}
                
                {/* Interaction buttons */}
                <div className="flex items-center space-x-6 pt-4 border-t border-gray-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center space-x-2 text-gray-600 hover:text-red-600 hover:bg-red-50"
                    data-testid={`like-btn-${post.id}`}
                  >
                    <Heart size={16} />
                    <span>{Object.values(post.reactions?.heart || {}).length || 0}</span>
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                  >
                    <ThumbsUp size={16} />
                    <span>{Object.values(post.reactions?.like || {}).length || 0}</span>
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center space-x-2 text-gray-600 hover:text-green-600 hover:bg-green-50"
                  >
                    <MessageCircle size={16} />
                    <span>{post.comments?.length || 0}</span>
                  </Button>
                </div>
                
                {/* Comments section */}
                {post.comments && post.comments.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                    {post.comments.slice(0, 2).map((comment, index) => (
                      <div key={index} className="flex space-x-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-gray-600 text-sm font-medium">
                            {comment.username?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="bg-gray-50 rounded-lg px-3 py-2">
                            <p className="font-medium text-sm text-gray-800">{comment.username}</p>
                            <p className="text-gray-700 text-sm">{comment.content}</p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(comment.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    {post.comments.length > 2 && (
                      <Button variant="ghost" size="sm" className="text-gray-500">
                        View all {post.comments.length} comments
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No posts yet</h3>
            <p className="text-gray-500 mb-4">Be the first to share something with the community!</p>
            <Button
              onClick={() => setShowCreatePost(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="mr-2" size={16} />
              Create First Post
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityScreen;