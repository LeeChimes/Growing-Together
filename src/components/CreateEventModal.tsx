import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, FormField, Tag, useTheme } from '../design';
import { useCreateEvent } from '../hooks/useEvents';
import { Database } from '../lib/database.types';

type Event = Database['public']['Tables']['events']['Row'];

const eventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  location: z.string().min(1, 'Location is required'),
  start_date: z.string(),
  end_date: z.string().optional(),
  max_attendees: z.number().optional(),
});

type EventFormData = z.infer<typeof eventSchema>;

interface CreateEventModalProps {
  visible: boolean;
  onClose: () => void;
  event?: Event;
}

export function CreateEventModal({ visible, onClose, event }: CreateEventModalProps) {
  const theme = useTheme();
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [bringList, setBringList] = useState<string[]>(event?.bring_list || []);
  const [newBringItem, setNewBringItem] = useState('');

  const createMutation = useCreateEvent();

  const defaultDate = new Date();
  defaultDate.setHours(9, 0, 0, 0); // Default to 9 AM

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: event?.title || '',
      description: event?.description || '',
      location: event?.location || '',
      start_date: event?.start_date || defaultDate.toISOString(),
      end_date: event?.end_date || '',
      max_attendees: event?.max_attendees || undefined,
    },
  });

  const watchStartDate = watch('start_date');
  const watchEndDate = watch('end_date');

  const handleClose = () => {
    reset();
    setBringList([]);
    setNewBringItem('');
    onClose();
  };

  const onSubmit = async (data: EventFormData) => {
    try {
      const eventData = {
        ...data,
        bring_list: bringList,
        max_attendees: data.max_attendees || null,
        end_date: data.end_date || null,
      };

      await createMutation.mutateAsync(eventData);
      handleClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to create event');
    }
  };

  const handleDateTimeChange = (
    event: any, 
    selectedDate: Date | undefined, 
    field: string,
    type: 'date' | 'time'
  ) => {
    if (selectedDate) {
      const currentDate = new Date(watch(field as keyof EventFormData) as string);
      
      if (type === 'date') {
        currentDate.setFullYear(selectedDate.getFullYear());
        currentDate.setMonth(selectedDate.getMonth());
        currentDate.setDate(selectedDate.getDate());
      } else {
        currentDate.setHours(selectedDate.getHours());
        currentDate.setMinutes(selectedDate.getMinutes());
      }
      
      setValue(field as keyof EventFormData, currentDate.toISOString() as any);
    }
    
    // Hide pickers
    setShowStartDatePicker(false);
    setShowStartTimePicker(false);
    setShowEndDatePicker(false);
    setShowEndTimePicker(false);
  };

  const addBringItem = () => {
    if (newBringItem.trim() && !bringList.includes(newBringItem.trim())) {
      setBringList([...bringList, newBringItem.trim()]);
      setNewBringItem('');
    }
  };

  const removeBringItem = (index: number) => {
    setBringList(bringList.filter((_, i) => i !== index));
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-GB'),
      time: date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet">
      <SafeAreaView style={styles.container}>
        <View style={[styles.header, { borderBottomColor: theme.colors.grayLight }]}>
          <TouchableOpacity onPress={handleClose}>
            <Ionicons name="close" size={24} color={theme.colors.charcoal} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.charcoal }]}>
            {event ? 'Edit Event' : 'Create Event'}
          </Text>
          <Button
            title="Save"
            onPress={handleSubmit(onSubmit)}
            loading={createMutation.isPending}
            size="small"
          />
        </View>

        <ScrollView style={styles.content}>
          {/* Basic Information */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.charcoal }]}>
              Event Details
            </Text>
            
            <Controller
              control={control}
              name="title"
              render={({ field: { onChange, value } }) => (
                <FormField
                  label="Event Title"
                  value={value}
                  onChangeText={onChange}
                  placeholder="Weekend Work Day"
                  error={errors.title?.message}
                  required
                />
              )}
            />

            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, value } }) => (
                <View>
                  <Text style={[styles.label, { color: theme.colors.charcoal }]}>
                    Description *
                  </Text>
                  <TextInput
                    style={[
                      styles.textArea,
                      {
                        borderColor: errors.description ? theme.colors.error : theme.colors.grayLight,
                        color: theme.colors.charcoal,
                      }
                    ]}
                    value={value}
                    onChangeText={onChange}
                    placeholder="Join us for our monthly community work day. We'll be focusing on general maintenance and plot preparation."
                    placeholderTextColor={theme.colors.gray}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                  {errors.description && (
                    <Text style={[styles.error, { color: theme.colors.error }]}>
                      {errors.description.message}
                    </Text>
                  )}
                </View>
              )}
            />

            <Controller
              control={control}
              name="location"
              render={({ field: { onChange, value } }) => (
                <FormField
                  label="Location"
                  value={value}
                  onChangeText={onChange}
                  placeholder="Allotment Site, Plot A1"
                  error={errors.location?.message}
                  required
                />
              )}
            />
          </View>

          {/* Date and Time */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.charcoal }]}>
              When
            </Text>
            
            <View style={styles.dateTimeContainer}>
              <View style={styles.dateTimeField}>
                <Text style={[styles.label, { color: theme.colors.charcoal }]}>
                  Start Date & Time *
                </Text>
                <View style={styles.dateTimeRow}>
                  <TouchableOpacity
                    style={[styles.dateTimeButton, { borderColor: theme.colors.grayLight }]}
                    onPress={() => setShowStartDatePicker(true)}
                  >
                    <Ionicons name="calendar" size={16} color={theme.colors.green} />
                    <Text style={[styles.dateTimeText, { color: theme.colors.charcoal }]}>
                      {formatDateTime(watchStartDate).date}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.dateTimeButton, { borderColor: theme.colors.grayLight }]}
                    onPress={() => setShowStartTimePicker(true)}
                  >
                    <Ionicons name="time" size={16} color={theme.colors.green} />
                    <Text style={[styles.dateTimeText, { color: theme.colors.charcoal }]}>
                      {formatDateTime(watchStartDate).time}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.dateTimeField}>
                <Text style={[styles.label, { color: theme.colors.charcoal }]}>
                  End Date & Time (Optional)
                </Text>
                <View style={styles.dateTimeRow}>
                  <TouchableOpacity
                    style={[styles.dateTimeButton, { borderColor: theme.colors.grayLight }]}
                    onPress={() => setShowEndDatePicker(true)}
                  >
                    <Ionicons name="calendar" size={16} color={theme.colors.green} />
                    <Text style={[styles.dateTimeText, { color: theme.colors.charcoal }]}>
                      {watchEndDate ? formatDateTime(watchEndDate).date : 'Select date'}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.dateTimeButton, { borderColor: theme.colors.grayLight }]}
                    onPress={() => setShowEndTimePicker(true)}
                  >
                    <Ionicons name="time" size={16} color={theme.colors.green} />
                    <Text style={[styles.dateTimeText, { color: theme.colors.charcoal }]}>
                      {watchEndDate ? formatDateTime(watchEndDate).time : 'Select time'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* Additional Settings */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.charcoal }]}>
              Additional Settings
            </Text>
            
            <Controller
              control={control}
              name="max_attendees"
              render={({ field: { onChange, value } }) => (
                <FormField
                  label="Maximum Attendees (Optional)"
                  value={value?.toString() || ''}
                  onChangeText={(text) => onChange(text ? parseInt(text) : undefined)}
                  placeholder="Leave empty for unlimited"
                  keyboardType="numeric"
                />
              )}
            />
          </View>

          {/* Bring List */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.charcoal }]}>
              What to Bring
            </Text>
            <Text style={[styles.sectionSubtitle, { color: theme.colors.gray }]}>
              Items that attendees should bring to the event
            </Text>
            
            <View style={styles.bringItemInput}>
              <TextInput
                style={[
                  styles.bringInput,
                  { 
                    borderColor: theme.colors.grayLight,
                    color: theme.colors.charcoal,
                  }
                ]}
                value={newBringItem}
                onChangeText={setNewBringItem}
                placeholder="e.g., Gloves, Water bottle, Tools"
                placeholderTextColor={theme.colors.gray}
              />
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: theme.colors.green }]}
                onPress={addBringItem}
                disabled={!newBringItem.trim()}
              >
                <Ionicons name="add" size={20} color={theme.colors.paper} />
              </TouchableOpacity>
            </View>

            {bringList.length > 0 && (
              <View style={styles.bringList}>
                {bringList.map((item, index) => (
                  <View key={index} style={[styles.bringListItem, { backgroundColor: theme.colors.greenBg }]}>
                    <Text style={[styles.bringListText, { color: theme.colors.charcoal }]}>
                      {item}
                    </Text>
                    <TouchableOpacity onPress={() => removeBringItem(index)}>
                      <Ionicons name="close-circle" size={20} color={theme.colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Date/Time Pickers */}
        {showStartDatePicker && (
          <DateTimePicker
            value={new Date(watchStartDate)}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => 
              handleDateTimeChange(event, selectedDate, 'start_date', 'date')
            }
          />
        )}
        
        {showStartTimePicker && (
          <DateTimePicker
            value={new Date(watchStartDate)}
            mode="time"
            display="default"
            onChange={(event, selectedDate) => 
              handleDateTimeChange(event, selectedDate, 'start_date', 'time')
            }
          />
        )}
        
        {showEndDatePicker && (
          <DateTimePicker
            value={watchEndDate ? new Date(watchEndDate) : new Date()}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => 
              handleDateTimeChange(event, selectedDate, 'end_date', 'date')
            }
          />
        )}
        
        {showEndTimePicker && (
          <DateTimePicker
            value={watchEndDate ? new Date(watchEndDate) : new Date()}
            mode="time"
            display="default"
            onChange={(event, selectedDate) => 
              handleDateTimeChange(event, selectedDate, 'end_date', 'time')
            }
          />
        )}
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
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
    minHeight: 100,
  },
  error: {
    fontSize: 12,
    marginTop: 4,
  },
  dateTimeContainer: {
    gap: 16,
  },
  dateTimeField: {
    // Container styles
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: 'white',
    gap: 8,
  },
  dateTimeText: {
    fontSize: 14,
  },
  bringItemInput: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  bringInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bringList: {
    gap: 8,
  },
  bringListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  bringListText: {
    fontSize: 14,
    flex: 1,
  },
});