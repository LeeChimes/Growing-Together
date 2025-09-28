import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Card, Button, useTheme, Tag } from '../design';
import { QATestRunner, QATestSuite, AutomatedQARunner } from '../lib/qaTestSuite';
import { PerformanceMonitor } from '../lib/performance';
import { useNetworkStatus } from '../lib/performance';

interface QADashboardProps {
  visible: boolean;
  onClose: () => void;
}

export function QADashboard({ visible, onClose }: QADashboardProps) {
  const theme = useTheme();
  const [testResults, setTestResults] = useState<QATestSuite | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [automatedQAActive, setAutomatedQAActive] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'results' | 'performance'>('dashboard');
  const { isConnected, networkType } = useNetworkStatus();

  useEffect(() => {
    if (visible) {
      // Load any existing test results
      loadLastTestResults();
    }
  }, [visible]);

  const loadLastTestResults = () => {
    // In a real implementation, you might load from storage
    console.log('Loading last test results...');
  };

  const runFullTestSuite = async () => {
    setIsRunningTests(true);
    try {
      const results = await QATestRunner.runFullTestSuite();
      setTestResults(results);
      setCurrentView('results');
      
      Alert.alert(
        'QA Tests Complete',
        `${results.overall.passed}/${results.overall.totalTests} tests passed (${results.overall.successRate.toFixed(1)}%)`,
        [
          { text: 'View Results', onPress: () => setCurrentView('results') },
          { text: 'OK' },
        ]
      );
    } catch (error) {
      Alert.alert('Test Error', 'Failed to run QA test suite');
    } finally {
      setIsRunningTests(false);
    }
  };

  const shareTestReport = async () => {
    if (!testResults) return;
    
    try {
      const report = QATestRunner.generateTestReport();
      await Share.share({
        message: report,
        title: 'QA Test Report - Growing Together App',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share test report');
    }
  };

  const toggleAutomatedQA = () => {
    if (automatedQAActive) {
      setAutomatedQAActive(false);
      // Stop automated QA (would need to store the cleanup function)
      Alert.alert('Automated QA', 'Continuous QA monitoring stopped');
    } else {
      setAutomatedQAActive(true);
      AutomatedQARunner.startContinuousQA(30); // Every 30 minutes
      Alert.alert('Automated QA', 'Continuous QA monitoring started (30-minute intervals)');
    }
  };

  const renderDashboard = () => (
    <ScrollView style={styles.content}>
      {/* System Status */}
      <Card style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Ionicons name="pulse" size={24} color={theme.colors.green} />
          <Text style={[styles.statusTitle, { color: theme.colors.charcoal }]}>
            System Status
          </Text>
        </View>
        
        <View style={styles.statusGrid}>
          <View style={styles.statusItem}>
            <Text style={[styles.statusLabel, { color: theme.colors.gray }]}>Network</Text>
            <View style={styles.statusValue}>
              <Ionicons 
                name={isConnected ? "wifi" : "wifi-outline"} 
                size={16} 
                color={isConnected ? theme.colors.success : theme.colors.error} 
              />
              <Text style={[styles.statusText, { color: theme.colors.charcoal }]}>
                {isConnected ? `Online (${networkType})` : 'Offline'}
              </Text>
            </View>
          </View>
          
          <View style={styles.statusItem}>
            <Text style={[styles.statusLabel, { color: theme.colors.gray }]}>Performance</Text>
            <View style={styles.statusValue}>
              <Ionicons name="speedometer" size={16} color={theme.colors.green} />
              <Text style={[styles.statusText, { color: theme.colors.charcoal }]}>
                Monitoring Active
              </Text>
            </View>
          </View>

          <View style={styles.statusItem}>
            <Text style={[styles.statusLabel, { color: theme.colors.gray }]}>Error Boundaries</Text>
            <View style={styles.statusValue}>
              <Ionicons name="shield-checkmark" size={16} color={theme.colors.success} />
              <Text style={[styles.statusText, { color: theme.colors.charcoal }]}>
                Protected
              </Text>
            </View>
          </View>
          
          <View style={styles.statusItem}>
            <Text style={[styles.statusLabel, { color: theme.colors.gray }]}>Auto QA</Text>
            <View style={styles.statusValue}>
              <Ionicons 
                name={automatedQAActive ? "checkmark-circle" : "pause-circle"} 
                size={16} 
                color={automatedQAActive ? theme.colors.success : theme.colors.gray} 
              />
              <Text style={[styles.statusText, { color: theme.colors.charcoal }]}>
                {automatedQAActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
        </View>
      </Card>

      {/* Quick Actions */}
      <Card style={styles.actionsCard}>
        <Text style={[styles.sectionTitle, { color: theme.colors.charcoal }]}>
          QA Actions
        </Text>
        
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.green + '20' }]}
            onPress={runFullTestSuite}
            disabled={isRunningTests}
          >
            <Ionicons 
              name={isRunningTests ? "hourglass" : "play-circle"} 
              size={32} 
              color={theme.colors.green} 
            />
            <Text style={[styles.actionText, { color: theme.colors.green }]}>
              {isRunningTests ? 'Running Tests...' : 'Run Full Test Suite'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.sky + '20' }]}
            onPress={() => setCurrentView('performance')}
          >
            <Ionicons name="analytics" size={32} color={theme.colors.sky} />
            <Text style={[styles.actionText, { color: theme.colors.sky }]}>
              Performance Metrics
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.warning + '20' }]}
            onPress={toggleAutomatedQA}
          >
            <Ionicons 
              name={automatedQAActive ? "stop-circle" : "timer"} 
              size={32} 
              color={theme.colors.warning} 
            />
            <Text style={[styles.actionText, { color: theme.colors.warning }]}>
              {automatedQAActive ? 'Stop Auto QA' : 'Start Auto QA'}
            </Text>
          </TouchableOpacity>

          {testResults && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.success + '20' }]}
              onPress={shareTestReport}
            >
              <Ionicons name="share" size={32} color={theme.colors.success} />
              <Text style={[styles.actionText, { color: theme.colors.success }]}>
                Share Report
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </Card>

      {/* Last Test Results Summary */}
      {testResults && (
        <Card style={styles.summaryCard}>
          <Text style={[styles.sectionTitle, { color: theme.colors.charcoal }]}>
            Last Test Results
          </Text>
          
          <View style={styles.summaryStats}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNumber, { color: theme.colors.success }]}>
                {testResults.overall.passed}
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.colors.gray }]}>Passed</Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNumber, { color: theme.colors.error }]}>
                {testResults.overall.failed}
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.colors.gray }]}>Failed</Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNumber, { color: theme.colors.charcoal }]}>
                {testResults.overall.successRate.toFixed(1)}%
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.colors.gray }]}>Success Rate</Text>
            </View>
          </View>
          
          <Button
            title="View Detailed Results"
            onPress={() => setCurrentView('results')}
            variant="outline"
            size="small"
          />
        </Card>
      )}
    </ScrollView>
  );

  const renderTestResults = () => {
    if (!testResults) return null;

    return (
      <ScrollView style={styles.content}>
        <Card style={styles.resultsHeader}>
          <Text style={[styles.resultsTitle, { color: theme.colors.charcoal }]}>
            Test Results
          </Text>
          <Text style={[styles.resultsSubtitle, { color: theme.colors.gray }]}>
            {testResults.overall.passed}/{testResults.overall.totalTests} tests passed
          </Text>
        </Card>

        {[
          { name: 'Offline Sync', tests: testResults.offlineSync, icon: 'airplane' },
          { name: 'Performance', tests: testResults.performance, icon: 'speedometer' },
          { name: 'Image Compression', tests: testResults.imageCompression, icon: 'image' },
          { name: 'Accessibility', tests: testResults.accessibility, icon: 'accessibility' },
          { name: 'Error Handling', tests: testResults.errorHandling, icon: 'shield-checkmark' },
        ].map(category => (
          <Card key={category.name} style={styles.categoryCard}>
            <View style={styles.categoryHeader}>
              <Ionicons name={category.icon as any} size={20} color={theme.colors.green} />
              <Text style={[styles.categoryTitle, { color: theme.colors.charcoal }]}>
                {category.name}
              </Text>
              <Tag
                label={`${category.tests.filter(t => t.passed).length}/${category.tests.length}`}
                variant={category.tests.every(t => t.passed) ? 'success' : 'error'}
                size="small"
              />
            </View>
            
            {category.tests.map(test => (
              <View key={test.testName} style={styles.testResult}>
                <View style={styles.testHeader}>
                  <Ionicons 
                    name={test.passed ? "checkmark-circle" : "close-circle"} 
                    size={16} 
                    color={test.passed ? theme.colors.success : theme.colors.error} 
                  />
                  <Text style={[styles.testName, { color: theme.colors.charcoal }]}>
                    {test.testName}
                  </Text>
                  <Text style={[styles.testDuration, { color: theme.colors.gray }]}>
                    {test.duration.toFixed(2)}ms
                  </Text>
                </View>
                <Text style={[styles.testDetails, { color: theme.colors.gray }]}>
                  {test.details}
                </Text>
              </View>
            ))}
          </Card>
        ))}
      </ScrollView>
    );
  };

  const renderPerformanceMetrics = () => (
    <ScrollView style={styles.content}>
      <Card style={styles.metricsCard}>
        <Text style={[styles.sectionTitle, { color: theme.colors.charcoal }]}>
          Performance Metrics
        </Text>
        
        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Text style={[styles.metricValue, { color: theme.colors.green }]}>
              {PerformanceMonitor.getAverageRenderTime().toFixed(2)}ms
            </Text>
            <Text style={[styles.metricLabel, { color: theme.colors.gray }]}>
              Avg Render Time
            </Text>
          </View>
          
          <View style={styles.metricItem}>
            <Text style={[styles.metricValue, { color: theme.colors.sky }]}>
              {PerformanceMonitor.getAverageLoadTime().toFixed(2)}ms
            </Text>
            <Text style={[styles.metricLabel, { color: theme.colors.gray }]}>
              Avg Load Time
            </Text>
          </View>
        </View>
        
        <Text style={[styles.metricsNote, { color: theme.colors.gray }]}>
          Performance monitoring is active. Metrics are collected automatically during app usage.
        </Text>
      </Card>
    </ScrollView>
  );

  const getViewTitle = () => {
    switch (currentView) {
      case 'dashboard': return 'QA Dashboard';
      case 'results': return 'Test Results';
      case 'performance': return 'Performance Metrics';
      default: return 'QA Dashboard';
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet">
      <SafeAreaView style={styles.container}>
        <View style={[styles.header, { borderBottomColor: theme.colors.grayLight }]}>
          <TouchableOpacity 
            onPress={currentView === 'dashboard' ? onClose : () => setCurrentView('dashboard')}
          >
            <Ionicons 
              name={currentView === 'dashboard' ? "close" : "arrow-back"} 
              size={24} 
              color={theme.colors.charcoal} 
            />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.charcoal }]}>
            {getViewTitle()}
          </Text>
          <View style={styles.headerActions}>
            {__DEV__ && (
              <Ionicons name="bug" size={24} color={theme.colors.warning} />
            )}
          </View>
        </View>

        {currentView === 'dashboard' && renderDashboard()}
        {currentView === 'results' && renderTestResults()}
        {currentView === 'performance' && renderPerformanceMetrics()}
      </SafeAreaView>
    </Modal>
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
    backgroundColor: 'white',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    width: 24,
    alignItems: 'flex-end',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  // Dashboard styles
  statusCard: {
    marginBottom: 16,
    padding: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statusItem: {
    flex: 1,
    minWidth: '45%',
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  statusValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 14,
  },
  actionsCard: {
    marginBottom: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  summaryCard: {
    padding: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  // Results styles
  resultsHeader: {
    marginBottom: 16,
    padding: 16,
    alignItems: 'center',
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  resultsSubtitle: {
    fontSize: 14,
  },
  categoryCard: {
    marginBottom: 12,
    padding: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  testResult: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  testName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  testDuration: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  testDetails: {
    fontSize: 12,
    lineHeight: 16,
    marginLeft: 24,
  },
  // Performance styles
  metricsCard: {
    padding: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  metricLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  metricsNote: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});