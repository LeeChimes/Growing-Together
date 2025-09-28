import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, FormField, useTheme } from '../design';
import { useCreateJoinCode } from '../hooks/useAdmin';

const joinCodeSchema = z.object({
  role: z.enum(['admin', 'member', 'guest']),
  expires_days: z.number().min(1).max(365).optional(),
  max_uses: z.number().min(1).max(1000).optional(),
  never_expires: z.boolean(),
  unlimited_uses: z.boolean(),
});

type JoinCodeFormData = z.infer<typeof joinCodeSchema>;

interface CreateJoinCodeModalProps {
  visible: boolean;
  onClose: () => void;
}

export function CreateJoinCodeModal({ visible, onClose }: CreateJoinCodeModalProps) {
  const theme = useTheme();
  const createMutation = useCreateJoinCode();

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<JoinCodeFormData>({
    resolver: zodResolver(joinCodeSchema),
    defaultValues: {
      role: 'member',
      expires_days: 30,
      max_uses: 10,
      never_expires: false,
      unlimited_uses: false,
    },
  });

  const watchNeverExpires = watch('never_expires');
  const watchUnlimitedUses = watch('unlimited_uses');

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data: JoinCodeFormData) => {
    try {
      const expires_at = data.never_expires 
        ? null 
        : new Date(Date.now() + (data.expires_days || 30) * 24 * 60 * 60 * 1000).toISOString();
      
      const max_uses = data.unlimited_uses ? null : data.max_uses;

      await createMutation.mutateAsync({
        role: data.role,
        expires_at,
        max_uses,
      });

      Alert.alert('Success', 'Join code created successfully!');
      handleClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to create join code');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet">
      <SafeAreaView style={styles.container}>
        <View style={[styles.header, { borderBottomColor: theme.colors.grayLight }]}>
          <TouchableOpacity onPress={handleClose}>
            <Ionicons name="close" size={24} color={theme.colors.charcoal} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.charcoal }]}>
            Create Join Code
          </Text>
          <Button
            title="Create"
            onPress={handleSubmit(onSubmit)}
            loading={createMutation.isPending}
            size="small"
          />
        </View>

        <ScrollView style={styles.content}>
          {/* Role Selection */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.charcoal }]}>
              Member Role
            </Text>
            <Controller
              control={control}
              name="role"
              render={({ field: { onChange, value } }) => (
                <View>
                  {['admin', 'member', 'guest'].map((role) => (
                    <TouchableOpacity
                      key={role}
                      style={[
                        styles.roleOption,
                        {
                          backgroundColor: value === role ? theme.colors.green + '20' : theme.colors.grayLight,
                          borderColor: value === role ? theme.colors.green : theme.colors.grayLight,
                        }
                      ]}
                      onPress={() => onChange(role)}
                    >
                      <View style={styles.roleContent}>
                        <Ionicons 
                          name={
                            role === 'admin' ? 'shield-checkmark' : 
                            role === 'member' ? 'person' : 'person-outline'
                          } 
                          size={24} 
                          color={value === role ? theme.colors.green : theme.colors.gray} 
                        />
                        <View style={styles.roleText}>
                          <Text 
                            style={[
                              styles.roleTitle,
                              { color: value === role ? theme.colors.green : theme.colors.charcoal }
                            ]}
                          >
                            {role.charAt(0).toUpperCase() + role.slice(1)}
                          </Text>
                          <Text style={[styles.roleDescription, { color: theme.colors.gray }]}>
                            {role === 'admin' && 'Full administrative access'}
                            {role === 'member' && 'Standard community member'}
                            {role === 'guest' && 'Limited access, view-only'}
                          </Text>
                        </View>
                      </View>
                      {value === role && (
                        <Ionicons name="checkmark-circle" size={20} color={theme.colors.green} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            />
          </View>

          {/* Expiration Settings */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.charcoal }]}>
              Expiration
            </Text>
            
            <Controller
              control={control}
              name="never_expires"
              render={({ field: { onChange, value } }) => (
                <TouchableOpacity
                  style={[styles.checkboxOption, { borderColor: theme.colors.grayLight }]}
                  onPress={() => onChange(!value)}
                >
                  <Ionicons 
                    name={value ? "checkbox" : "square-outline"} 
                    size={24} 
                    color={value ? theme.colors.green : theme.colors.gray} 
                  />
                  <Text style={[styles.checkboxText, { color: theme.colors.charcoal }]}>
                    Never expires
                  </Text>
                </TouchableOpacity>
              )}
            />

            {!watchNeverExpires && (
              <Controller
                control={control}
                name="expires_days"
                render={({ field: { onChange, value } }) => (
                  <FormField
                    label="Expires in (days)"
                    value={value?.toString() || '30'}
                    onChangeText={(text) => onChange(parseInt(text) || 30)}
                    placeholder="30"
                    keyboardType="numeric"
                    error={errors.expires_days?.message}
                  />
                )}
              />
            )}
          </View>

          {/* Usage Limits */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.charcoal }]}>
              Usage Limits
            </Text>
            
            <Controller
              control={control}
              name="unlimited_uses"
              render={({ field: { onChange, value } }) => (
                <TouchableOpacity
                  style={[styles.checkboxOption, { borderColor: theme.colors.grayLight }]}
                  onPress={() => onChange(!value)}
                >
                  <Ionicons 
                    name={value ? "checkbox" : "square-outline"} 
                    size={24} 
                    color={value ? theme.colors.green : theme.colors.gray} 
                  />
                  <Text style={[styles.checkboxText, { color: theme.colors.charcoal }]}>
                    Unlimited uses
                  </Text>
                </TouchableOpacity>
              )}
            />

            {!watchUnlimitedUses && (
              <Controller
                control={control}
                name="max_uses"
                render={({ field: { onChange, value } }) => (
                  <FormField
                    label="Maximum uses"
                    value={value?.toString() || '10'}
                    onChangeText={(text) => onChange(parseInt(text) || 10)}
                    placeholder="10"
                    keyboardType="numeric"
                    error={errors.max_uses?.message}
                  />
                )}
              />
            )}
          </View>

          {/* Info Box */}
          <View style={[styles.infoBox, { backgroundColor: theme.colors.greenBg }]}>
            <View style={styles.infoHeader}>
              <Ionicons name="information-circle" size={20} color={theme.colors.green} />
              <Text style={[styles.infoTitle, { color: theme.colors.green }]}>
                Join Code Info
              </Text>
            </View>
            <Text style={[styles.infoText, { color: theme.colors.charcoal }]}>
              • Join codes allow new users to register for the community{'\n'}
              • Share codes securely with trusted individuals{'\n'}
              • You can deactivate codes at any time{'\n'}
              • Expired or used-up codes become inactive automatically
            </Text>
          </View>
        </ScrollView>
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
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 2,
    borderRadius: 12,
    marginBottom: 8,
  },
  roleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  roleText: {
    marginLeft: 12,
    flex: 1,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  roleDescription: {
    fontSize: 14,
  },
  checkboxOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
    gap: 12,
  },
  checkboxText: {
    fontSize: 16,
    fontWeight: '500',
  },
  infoBox: {
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
});