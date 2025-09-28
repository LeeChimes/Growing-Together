import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Logo } from '../src/design/Logo';
import { Button, FormField, Card, useTheme } from '../src/design';
import { useAuthStore } from '../src/store/authStore';

export default function AuthScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { signIn, signUp, isLoading } = useAuthStore();
  
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    joinCode: '',
  });

  const handleSignIn = async () => {
    try {
      await signIn(formData.email, formData.password);
      router.replace('/');
    } catch (error: any) {
      Alert.alert('Sign In Failed', error.message);
    }
  };

  const handleSignUp = async () => {
    try {
      await signUp(formData.email, formData.password, formData.joinCode, formData.fullName);
      Alert.alert(
        'Account Created',
        'Your account has been created and is pending approval. You will be notified once approved.',
        [{ text: 'OK', onPress: () => setMode('signin') }]
      );
    } catch (error: any) {
      Alert.alert('Sign Up Failed', error.message);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Logo width={200} />
            <Text style={[styles.welcome, { color: theme.colors.charcoal }]}>
              Welcome to Growing Together
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.gray }]}>
              Stafford Road Allotment Community
            </Text>
          </View>

          <Card style={styles.card}>
            <View style={styles.tabs}>
              <Button
                title="Sign In"
                onPress={() => setMode('signin')}
                variant={mode === 'signin' ? 'primary' : 'ghost'}
                style={styles.tabButton}
              />
              <Button
                title="Join Community"
                onPress={() => setMode('signup')}
                variant={mode === 'signup' ? 'primary' : 'ghost'}
                style={styles.tabButton}
              />
            </View>

            <View style={styles.form}>
              {mode === 'signup' && (
                <FormField
                  label="Full Name"
                  value={formData.fullName}
                  onChangeText={(text) => updateField('fullName', text)}
                  placeholder="Enter your full name"
                  required
                />
              )}

              <FormField
                label="Email"
                value={formData.email}
                onChangeText={(text) => updateField('email', text)}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                required
              />

              <FormField
                label="Password"
                value={formData.password}
                onChangeText={(text) => updateField('password', text)}
                placeholder="Enter your password"
                secureTextEntry
                required
              />

              {mode === 'signup' && (
                <FormField
                  label="Join Code"
                  value={formData.joinCode}
                  onChangeText={(text) => updateField('joinCode', text)}
                  placeholder="Enter your join code"
                  autoCapitalize="characters"
                  required
                />
              )}

              <Button
                title={mode === 'signin' ? 'Sign In' : 'Create Account'}
                onPress={mode === 'signin' ? handleSignIn : handleSignUp}
                loading={isLoading}
                style={styles.submitButton}
              />
            </View>

            {mode === 'signup' && (
              <View style={styles.info}>
                <Text style={[styles.infoText, { color: theme.colors.gray }]}>
                  You need a join code from an existing member or admin to create an account.
                  Your account will require approval before you can access the community.
                </Text>
              </View>
            )}
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  welcome: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  card: {
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  tabButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  form: {
    gap: 16,
  },
  submitButton: {
    marginTop: 8,
  },
  info: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#e0f2fe',
    borderRadius: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});