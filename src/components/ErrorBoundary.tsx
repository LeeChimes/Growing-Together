import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, useTheme } from '../design';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorId: string;
}

export class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console and external service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // In a production app, you would send this to an error reporting service
    this.logErrorToService(error, errorInfo);
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    if (hasError && !prevProps.hasError) {
      // Reset error state if resetKeys changed
      if (resetKeys && resetKeys.length > 0) {
        const hasResetKeyChanged = resetKeys.some(
          (key, index) => key !== prevProps.resetKeys?.[index]
        );
        if (hasResetKeyChanged) {
          this.resetErrorBoundary();
        }
      }

      // Reset error state if any props changed (if enabled)
      if (resetOnPropsChange && prevProps !== this.props) {
        this.resetErrorBoundary();
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  private logErrorToService = (error: Error, errorInfo: React.ErrorInfo) => {
    // In a production app, integrate with services like:
    // - Sentry
    // - Bugsnag
    // - Crashlytics
    // - Custom logging endpoint

    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      errorId: this.state.errorId,
      userAgent: navigator.userAgent,
      url: window.location?.href || 'mobile-app',
    };

    // For now, just log to console
    console.log('Error data for reporting service:', errorData);

    // Example of how you might send to a service:
    // fetch('/api/errors', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errorData),
    // }).catch(console.error);
  };

  private resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    });
  };

  private handleRetry = () => {
    this.resetErrorBoundary();
  };

  private handleReload = () => {
    // In a web context, this would reload the page
    // In React Native, we might navigate to a safe screen
    if (typeof window !== 'undefined' && window.location) {
      window.location.reload();
    } else {
      // For React Native, just reset
      this.resetErrorBoundary();
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return <DefaultErrorFallback
        error={this.state.error}
        errorInfo={this.state.errorInfo}
        onRetry={this.handleRetry}
        onReload={this.handleReload}
        errorId={this.state.errorId}
      />;
    }

    return this.props.children;
  }
}

interface DefaultErrorFallbackProps {
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  onRetry: () => void;
  onReload: () => void;
  errorId: string;
}

const DefaultErrorFallback: React.FC<DefaultErrorFallbackProps> = ({
  error,
  errorInfo,
  onRetry,
  onReload,
  errorId,
}) => {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="warning" size={64} color={theme.colors.error} />
        </View>

        <Text style={[styles.title, { color: theme.colors.charcoal }]}>
          Oops! Something went wrong
        </Text>

        <Text style={[styles.subtitle, { color: theme.colors.gray }]}>
          We've encountered an unexpected error. Don't worry, your data is safe.
        </Text>

        <Card style={styles.errorCard}>
          <View style={styles.errorHeader}>
            <Ionicons name="bug" size={20} color={theme.colors.error} />
            <Text style={[styles.errorTitle, { color: theme.colors.error }]}>
              Error Details
            </Text>
          </View>
          
          <Text style={[styles.errorMessage, { color: theme.colors.charcoal }]}>
            {error?.message || 'Unknown error occurred'}
          </Text>
          
          <Text style={[styles.errorId, { color: theme.colors.gray }]}>
            Error ID: {errorId}
          </Text>
        </Card>

        <View style={styles.actions}>
          <Button
            title="Try Again"
            onPress={onRetry}
            style={styles.actionButton}
          />
          
          <Button
            title="Reload App"
            onPress={onReload}
            variant="outline"
            style={styles.actionButton}
          />
        </View>

        <View style={[styles.helpBox, { backgroundColor: theme.colors.greenBg }]}>
          <View style={styles.helpHeader}>
            <Ionicons name="information-circle" size={20} color={theme.colors.green} />
            <Text style={[styles.helpTitle, { color: theme.colors.green }]}>
              What can you do?
            </Text>
          </View>
          <Text style={[styles.helpText, { color: theme.colors.charcoal }]}>
            • Try the "Try Again" button to retry the operation{'\n'}
            • Use "Reload App" if the problem persists{'\n'}
            • Check your internet connection{'\n'}
            • Contact support if the issue continues
          </Text>
        </View>

        {__DEV__ && error && (
          <Card style={styles.debugCard}>
            <Text style={[styles.debugTitle, { color: theme.colors.warning }]}>
              Debug Information (Development Only)
            </Text>
            <ScrollView style={styles.debugScroll} horizontal>
              <Text style={[styles.debugText, { color: theme.colors.charcoal }]}>
                {error.stack}
              </Text>
            </ScrollView>
            {errorInfo && (
              <ScrollView style={styles.debugScroll} horizontal>
                <Text style={[styles.debugText, { color: theme.colors.charcoal }]}>
                  Component Stack:{'\n'}{errorInfo.componentStack}
                </Text>
              </ScrollView>
            )}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// Specialized error boundaries for different parts of the app
export const ScreenErrorBoundary: React.FC<{ children: ReactNode; screenName: string }> = ({
  children,
  screenName,
}) => (
  <ErrorBoundary
    onError={(error, errorInfo) => {
      console.error(`Error in ${screenName} screen:`, error, errorInfo);
    }}
  >
    {children}
  </ErrorBoundary>
);

export const FeatureErrorBoundary: React.FC<{ children: ReactNode; featureName: string }> = ({
  children,
  featureName,
}) => (
  <ErrorBoundary
    fallback={
      <View style={styles.featureErrorFallback}>
        <Ionicons name="alert-circle" size={24} color="#ef4444" />
        <Text style={styles.featureErrorText}>
          {featureName} is temporarily unavailable
        </Text>
      </View>
    }
  >
    {children}
  </ErrorBoundary>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  errorCard: {
    width: '100%',
    marginBottom: 24,
    padding: 16,
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorMessage: {
    fontSize: 14,
    marginBottom: 8,
    fontFamily: 'monospace',
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderRadius: 4,
  },
  errorId: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  actions: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    width: '100%',
  },
  helpBox: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  helpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 14,
    lineHeight: 20,
  },
  debugCard: {
    width: '100%',
    padding: 16,
    backgroundColor: '#fef3c7',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  debugScroll: {
    maxHeight: 150,
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  featureErrorFallback: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    margin: 8,
    minHeight: 60,
    gap: 8,
  },
  featureErrorText: {
    fontSize: 14,
    color: '#ef4444',
    textAlign: 'center',
  },
});