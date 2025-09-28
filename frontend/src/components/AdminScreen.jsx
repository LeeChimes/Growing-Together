import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Shield, Users, UserCheck, Download, AlertTriangle, Settings, Activity } from 'lucide-react';
import EnterpriseAdminDashboard from './EnterpriseAdminDashboard';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminScreen = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPendingUsers();
  }, []);

  const loadPendingUsers = async () => {
    try {
      const response = await axios.get(`${API}/admin/users`);
      setPendingUsers(response.data);
    } catch (error) {
      console.error('Error loading pending users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId) => {
    try {
      await axios.patch(`${API}/admin/users/${userId}/approve`);
      setPendingUsers(pendingUsers.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Error approving user:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4 mt-16 md:mt-20">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 rounded-lg loading-skeleton"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto mt-16 md:mt-20">
      <div className="mb-8">
        <h1 className="heading-primary flex items-center space-x-2">
          <Shield className="text-red-600" size={32} />
          <span>Admin Panel</span>
        </h1>
        <p className="text-gray-600">Manage community members and settings</p>
      </div>

      <Tabs defaultValue="enterprise" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="enterprise" data-testid="admin-enterprise-tab">
            <Activity size={16} className="mr-2" />
            Enterprise
          </TabsTrigger>
          <TabsTrigger value="users" data-testid="admin-users-tab">
            Member Approval ({pendingUsers.length})
          </TabsTrigger>
          <TabsTrigger value="content" data-testid="admin-content-tab">
            Content Moderation
          </TabsTrigger>
          <TabsTrigger value="settings" data-testid="admin-settings-tab">
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Member Approval */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users size={20} />
                <span>Pending Member Approvals</span>
                {pendingUsers.length > 0 && (
                  <Badge variant="destructive">{pendingUsers.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingUsers.length > 0 ? (
                <div className="space-y-4" data-testid="pending-users-list">
                  {pendingUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-gray-600 font-semibold">
                            {user.username?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">{user.username}</h3>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          {user.plot_number && (
                            <Badge variant="outline" className="mt-1">
                              Plot {user.plot_number}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          Deny
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApproveUser(user.id)}
                          className="bg-green-600 hover:bg-green-700"
                          data-testid={`approve-user-${user.id}`}
                        >
                          <UserCheck size={16} className="mr-2" />
                          Approve
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <UserCheck size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">No pending approvals</h3>
                  <p className="text-gray-500">All community members are approved!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Moderation */}
        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle size={20} />
                <span>Content Moderation</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <AlertTriangle size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No reports</h3>
                <p className="text-gray-500">Community content is looking good!</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings */}
        <TabsContent value="settings">
          <div className="space-y-6">
            {/* Join Code Management */}
            <Card>
              <CardHeader>
                <CardTitle>Join Code Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-semibold">Current Join Code</h4>
                      <p className="text-sm text-gray-600">Members use this code to register</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <code className="px-3 py-1 bg-white border rounded font-mono text-lg">
                        GROW2024
                      </code>
                      <Button size="sm" variant="outline">
                        Regenerate
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data Export */}
            <Card>
              <CardHeader>
                <CardTitle>Data Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">Export Community Data</h4>
                      <p className="text-sm text-gray-600">Download all community posts, events, and diary entries</p>
                    </div>
                    <Button size="sm" variant="outline" data-testid="export-data-btn">
                      <Download size={16} className="mr-2" />
                      Export CSV
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Community Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Community Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">24</div>
                    <div className="text-sm text-gray-600">Active Members</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">156</div>
                    <div className="text-sm text-gray-600">Diary Entries</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">8</div>
                    <div className="text-sm text-gray-600">Events Created</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">342</div>
                    <div className="text-sm text-gray-600">Photos Shared</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminScreen;