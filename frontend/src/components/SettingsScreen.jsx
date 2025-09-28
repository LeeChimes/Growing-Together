import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  User, 
  Shield, 
  Settings, 
  Bell, 
  Accessibility, 
  LogOut,
  CheckSquare,
  Leaf,
  Download,
  Users
} from 'lucide-react';

// Import AuthContext directly since we can't import from App.js
const AuthContext = React.createContext();
const useAuth = () => useContext(AuthContext);

const SettingsScreen = () => {
  const auth = useAuth();
  
  if (!auth) {
    return (
      <div className="p-4 mt-16 md:mt-20">
        <div className="text-center py-12">
          <p className="text-gray-500">Authentication context not available</p>
        </div>
      </div>
    );
  }

  const { user, logout, isAdmin } = auth;

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      logout();
    }
  };

  const menuItems = [
    {
      title: 'My Tasks',
      description: 'View and manage your personal tasks',
      icon: CheckSquare,
      link: '/tasks',
      color: 'text-green-600',
    },
    {
      title: 'Plant Library',
      description: 'Browse plants and get AI advice',
      icon: Leaf,
      link: '/plants',
      color: 'text-green-600',
    },
    {
      title: 'Profile Settings',
      description: 'Update your profile information',
      icon: User,
      action: () => alert('Profile settings coming soon!'),
      color: 'text-blue-600',
    },
    {
      title: 'Notifications',
      description: 'Manage notification preferences',
      icon: Bell,
      action: () => alert('Notification settings coming soon!'),
      color: 'text-yellow-600',
    },
    {
      title: 'Accessibility',
      description: 'Adjust accessibility settings',
      icon: Accessibility,
      action: () => alert('Accessibility settings coming soon!'),
      color: 'text-purple-600',
    }
  ];

  if (isAdmin) {
    menuItems.push({
      title: 'Admin Panel',
      description: 'Manage community and settings',
      icon: Shield,
      link: '/admin',
      color: 'text-red-600',
    });
  }

  return (
    <div className="p-4 max-w-4xl mx-auto mt-16 md:mt-20">
      <div className="mb-8">
        <h1 className="heading-primary">Settings & More</h1>
        <p className="text-gray-600">Manage your account and app preferences</p>
      </div>

      {/* User Profile Card */}
      <Card className="mb-8 bg-gradient-to-br from-green-50 to-yellow-50 border-green-200">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">
                {user?.username?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            
            <div className="flex-1">
              <CardTitle className="text-xl text-green-800">{user?.username}</CardTitle>
              <p className="text-gray-600">{user?.email}</p>
              <div className="flex items-center space-x-2 mt-2">
                <Badge 
                  variant="secondary" 
                  className={`${
                    user?.role === 'admin' 
                      ? 'badge-admin' 
                      : user?.role === 'member' 
                      ? 'badge-member' 
                      : 'badge-guest'
                  }`}
                >
                  {user?.role?.toUpperCase()}
                </Badge>
                
                {user?.plot_number && (
                  <Badge variant="outline" className="bg-white">
                    Plot {user.plot_number}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Menu Items */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const content = (
            <Card className="plant-card cursor-pointer h-full">
              <CardContent className="p-6 flex items-center space-x-4">
                <div className={`p-3 rounded-lg bg-gray-100 ${item.color}`}>
                  <Icon size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
              </CardContent>
            </Card>
          );

          if (item.link) {
            return (
              <Link key={item.title} to={item.link} data-testid={`menu-${item.title.toLowerCase().replace(' ', '-')}`}>
                {content}
              </Link>
            );
          }

          return (
            <div 
              key={item.title} 
              onClick={item.action}
              data-testid={`menu-${item.title.toLowerCase().replace(' ', '-')}`}
            >
              {content}
            </div>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">12</div>
            <div className="text-sm text-gray-600">Diary Entries</div>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">3</div>
            <div className="text-sm text-gray-600">Events Attended</div>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">8</div>
            <div className="text-sm text-gray-600">Tasks Completed</div>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">24</div>
            <div className="text-sm text-gray-600">Photos Shared</div>
          </CardContent>
        </Card>
      </div>

      {/* Community Info */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users size={20} />
            <span>Community Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>Allotment:</strong> Stafford Road Allotment</p>
            <p><strong>Join Code:</strong> Contact admin for current code</p>
            <p><strong>Community Guidelines:</strong> Be respectful, share knowledge, help each other grow!</p>
          </div>
        </CardContent>
      </Card>

      {/* App Information */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>App Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Version</span>
              <span className="font-medium">1.0.0</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Last Updated</span>
              <span className="font-medium">March 2024</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Data Export</span>
              <Button size="sm" variant="outline">
                <Download size={14} className="mr-2" />
                Export My Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logout */}
      <Card className="border-red-200">
        <CardContent className="p-6">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
            data-testid="logout-btn"
          >
            <LogOut size={20} className="mr-2" />
            Log Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsScreen;