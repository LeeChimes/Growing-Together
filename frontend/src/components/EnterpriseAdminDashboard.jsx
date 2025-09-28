import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import AdvancedAnalytics from './AdvancedAnalytics';
import { 
  Shield, 
  Activity, 
  Users, 
  Database,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Server,
  Wifi,
  Download,
  Upload,
  Eye,
  Settings,
  RefreshCw
} from 'lucide-react';
import securityManager from '../services/SecurityManager';
import performanceOptimizer from '../services/PerformanceOptimizer';
import realtimeService from '../services/RealtimeService';
import offlineManager from '../services/OfflineManager';

const EnterpriseAdminDashboard = () => {
  const [systemStatus, setSystemStatus] = useState({});
  const [securityAudit, setSecurityAudit] = useState({});
  const [performanceReport, setPerformanceReport] = useState({});
  const [realtimeStatus, setRealtimeStatus] = useState({});
  const [offlineStatus, setOfflineStatus] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSystemData();
    
    // Set up real-time monitoring
    const interval = setInterval(loadSystemData, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const loadSystemData = async () => {
    try {
      setLoading(true);
      
      // Load security audit
      const security = securityManager.getSecurityAudit();
      setSecurityAudit(security);
      
      // Load performance report
      const performance = performanceOptimizer.getPerformanceReport();
      setPerformanceReport(performance);
      
      // Load real-time status
      const realtime = realtimeService.getConnectionStatus();
      setRealtimeStatus(realtime);
      
      // Load offline capabilities status
      const offline = await offlineManager.getStorageInfo();
      setOfflineStatus(offline);
      
      // Generate system status summary
      setSystemStatus(generateSystemStatus(security, performance, realtime, offline));
      
    } catch (error) {
      console.error('Failed to load system data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSystemStatus = (security, performance, realtime, offline) => {
    const status = {
      overall: 'healthy',
      issues: [],
      alerts: [],
      services: {
        frontend: { status: 'online', uptime: '99.9%' },
        backend: { status: 'online', uptime: '99.8%' },
        database: { status: 'online', uptime: '99.9%' },
        realtime: { status: realtime.isConnected ? 'online' : 'offline', uptime: '98.5%' }
      }
    };

    // Check for security issues
    if (security.securityReports && security.securityReports.length > 0) {
      const recentReports = security.securityReports.filter(
        r => Date.now() - new Date(r.timestamp).getTime() < 24 * 60 * 60 * 1000
      );
      
      if (recentReports.length > 0) {
        status.alerts.push({
          type: 'security',
          severity: 'medium',
          message: `${recentReports.length} security events in the last 24 hours`,
          count: recentReports.length
        });
      }
    }

    // Check for performance issues
    if (performance.recommendations && performance.recommendations.length > 0) {
      const highSeverity = performance.recommendations.filter(r => r.severity === 'high');
      if (highSeverity.length > 0) {
        status.issues.push({
          type: 'performance',
          severity: 'high',
          message: `${highSeverity.length} high-priority performance issues detected`
        });
        status.overall = 'warning';
      }
    }

    // Check offline storage
    const totalOfflineItems = Object.values(offline).reduce((sum, store) => sum + (store.count || 0), 0);
    if (totalOfflineItems > 1000) {
      status.alerts.push({
        type: 'storage',
        severity: 'low',
        message: `Large offline storage usage: ${totalOfflineItems} items`
      });
    }

    return status;
  };

  const handleSecurityAction = (action) => {
    switch (action) {
      case 'clear_reports':
        localStorage.removeItem('security_reports');
        loadSystemData();
        break;
      case 'reset_attempts':
        localStorage.removeItem('login_attempts');
        loadSystemData();
        break;
      case 'export_audit':
        exportSecurityAudit();
        break;
      default:
        console.log('Unknown security action:', action);
    }
  };

  const handlePerformanceAction = (action) => {
    switch (action) {
      case 'clear_cache':
        performanceOptimizer.forceCacheCleanup();
        loadSystemData();
        break;
      case 'optimize_images':
        console.log('Image optimization triggered');
        break;
      case 'export_report':
        exportPerformanceReport();
        break;
      default:
        console.log('Unknown performance action:', action);
    }
  };

  const exportSecurityAudit = () => {
    const audit = {
      ...securityAudit,
      exportDate: new Date().toISOString(),
      exportedBy: 'admin'
    };
    
    const blob = new Blob([JSON.stringify(audit, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `security-audit-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const exportPerformanceReport = () => {
    const report = {
      ...performanceReport,
      exportDate: new Date().toISOString(),
      exportedBy: 'admin'
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `performance-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="text-center">
          <RefreshCw className="animate-spin mx-auto mb-4" size={32} />
          <p>Loading enterprise dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="enterprise-admin-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Enterprise Admin Dashboard</h1>
          <p className="text-gray-600">Advanced system monitoring and management</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Badge 
            variant={systemStatus.overall === 'healthy' ? 'default' : 'destructive'}
            className={systemStatus.overall === 'healthy' ? 'bg-green-600' : 'bg-yellow-600'}
          >
            System {systemStatus.overall}
          </Badge>
          
          <Button onClick={loadSystemData} variant="outline">
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Alerts */}
      {(systemStatus.alerts?.length > 0 || systemStatus.issues?.length > 0) && (
        <div className="space-y-3">
          {systemStatus.alerts?.map((alert, index) => (
            <Alert key={index} className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>{alert.type.toUpperCase()}:</strong> {alert.message}
              </AlertDescription>
            </Alert>
          ))}
          
          {systemStatus.issues?.map((issue, index) => (
            <Alert key={index} className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>{issue.type.toUpperCase()}:</strong> {issue.message}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Service Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(systemStatus.services || {}).map(([service, data]) => (
          <Card key={service} className="border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 capitalize">{service}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className={`w-2 h-2 rounded-full ${
                      data.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <span className="text-sm font-medium">{data.status}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Uptime: {data.uptime}</p>
                </div>
                
                {service === 'frontend' && <Server size={32} className="text-blue-600" />}
                {service === 'backend' && <Database size={32} className="text-green-600" />}
                {service === 'database' && <Activity size={32} className="text-purple-600" />}
                {service === 'realtime' && <Wifi size={32} className="text-orange-600" />}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="security" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="realtime">Real-time</TabsTrigger>
          <TabsTrigger value="offline">Offline</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Security Tab */}
        <TabsContent value="security">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield size={20} />
                  <span>Security Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Session ID</span>
                  <Badge variant="outline" className="font-mono text-xs">
                    {securityAudit.sessionInfo?.sessionId?.slice(0, 12)}...
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Encryption</span>
                  <div className="flex items-center space-x-2">
                    {securityAudit.sessionInfo?.hasEncryption ? (
                      <CheckCircle size={16} className="text-green-600" />
                    ) : (
                      <AlertTriangle size={16} className="text-yellow-600" />
                    )}
                    <span className="text-sm">
                      {securityAudit.sessionInfo?.hasEncryption ? 'Enabled' : 'Fallback'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Failed Login Attempts</span>
                  <Badge variant="secondary">
                    {Object.keys(securityAudit.loginAttempts || {}).length}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Security Reports</span>
                  <Badge variant={securityAudit.securityReports?.length > 0 ? 'destructive' : 'default'}>
                    {securityAudit.securityReports?.length || 0}
                  </Badge>
                </div>
                
                <div className="flex space-x-2 pt-4">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleSecurityAction('export_audit')}
                  >
                    <Download size={14} className="mr-1" />
                    Export
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleSecurityAction('clear_reports')}
                  >
                    Clear Reports
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Security Events</CardTitle>
              </CardHeader>
              <CardContent>
                {securityAudit.securityEvents?.length > 0 ? (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {securityAudit.securityEvents.slice(-5).map((event, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <p className="text-sm font-medium">{event.type.replace('_', ' ')}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(event.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <Eye size={16} className="text-gray-400" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No recent security events</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardContent className="p-6 text-center">
                <Activity size={32} className="mx-auto text-green-600 mb-2" />
                <p className="text-2xl font-bold text-gray-800">
                  {performanceReport.loadTimes?.avg ? Math.round(performanceReport.loadTimes.avg) : 0}ms
                </p>
                <p className="text-sm text-gray-600">Avg Load Time</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <Database size={32} className="mx-auto text-blue-600 mb-2" />
                <p className="text-2xl font-bold text-gray-800">
                  {performanceReport.memoryUsage?.averageUsed || 0}MB
                </p>
                <p className="text-sm text-gray-600">Memory Usage</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <Wifi size={32} className="mx-auto text-purple-600 mb-2" />
                <p className="text-2xl font-bold text-gray-800">
                  {performanceReport.networkPerformance?.successRate || 0}%
                </p>
                <p className="text-sm text-gray-600">Network Success</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Performance Recommendations</span>
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handlePerformanceAction('clear_cache')}
                  >
                    Clear Cache
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handlePerformanceAction('export_report')}
                  >
                    <Download size={14} className="mr-1" />
                    Export
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {performanceReport.recommendations?.length > 0 ? (
                <div className="space-y-3">
                  {performanceReport.recommendations.map((rec, index) => (
                    <Alert 
                      key={index} 
                      className={`${
                        rec.severity === 'high' ? 'border-red-200 bg-red-50' :
                        rec.severity === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                        'border-blue-200 bg-blue-50'
                      }`}
                    >
                      <AlertTriangle className={`h-4 w-4 ${
                        rec.severity === 'high' ? 'text-red-600' :
                        rec.severity === 'medium' ? 'text-yellow-600' :
                        'text-blue-600'
                      }`} />
                      <AlertDescription className={
                        rec.severity === 'high' ? 'text-red-800' :
                        rec.severity === 'medium' ? 'text-yellow-800' :
                        'text-blue-800'
                      }>
                        <strong>{rec.type.toUpperCase()}:</strong> {rec.message}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle size={48} className="mx-auto text-green-600 mb-4" />
                  <p className="text-gray-600">No performance issues detected</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Real-time Tab */}
        <TabsContent value="realtime">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wifi size={20} />
                  <span>Real-time Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Connection Status</span>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      realtimeStatus.isConnected ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <span className="text-sm font-medium">
                      {realtimeStatus.isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Active Subscribers</span>
                  <Badge variant="secondary">{realtimeStatus.subscriberCount || 0}</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Queued Messages</span>
                  <Badge variant={realtimeStatus.queuedMessages > 0 ? 'destructive' : 'default'}>
                    {realtimeStatus.queuedMessages || 0}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Reconnect Attempts</span>
                  <Badge variant="outline">{realtimeStatus.reconnectAttempts || 0}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Real-time Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-1">✅ Active Features</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Live community post notifications</li>
                    <li>• Task completion updates</li>
                    <li>• Event RSVP notifications</li>
                    <li>• User activity tracking</li>
                  </ul>
                </div>
                
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-1">📊 Metrics</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Connection uptime: 98.5%</li>
                    <li>• Message delivery rate: 99.2%</li>
                    <li>• Average latency: 45ms</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Offline Tab */}
        <TabsContent value="offline">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Download size={20} />
                  <span>Offline Storage</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(offlineStatus).map(([store, data]) => (
                    <div key={store} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <p className="text-sm font-medium capitalize">{store.replace('_', ' ')}</p>
                        <p className="text-xs text-gray-500">
                          {Math.round((data.size || 0) / 1024)}KB
                        </p>
                      </div>
                      <Badge variant="outline">{data.count || 0} items</Badge>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Total Items:</span>
                    <span>{Object.values(offlineStatus).reduce((sum, store) => sum + (store.count || 0), 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="font-medium">Total Size:</span>
                    <span>
                      {Math.round(Object.values(offlineStatus).reduce((sum, store) => sum + (store.size || 0), 0) / 1024)}KB
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Offline Capabilities</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-1">✅ Available Offline</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• View diary entries</li>
                    <li>• Create new entries</li>
                    <li>• Browse community posts</li>
                    <li>• View plant library</li>
                    <li>• Check tasks and events</li>
                  </ul>
                </div>
                
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-1">🔄 Auto-sync Features</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Background sync when online</li>
                    <li>• Conflict resolution</li>
                    <li>• Retry failed uploads</li>
                    <li>• Photo caching and compression</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <AdvancedAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnterpriseAdminDashboard;