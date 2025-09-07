import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useState } from "react";
import { Alert, Dimensions, Linking, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { ActivityIndicator, Button, Card, Dialog, Portal, Title } from 'react-native-paper';
import DocumentPicker from '../../components/DocumentPicker';
import { createBooking, getBookingsForDate, getMyBookings } from '../../lib/Bookings';
import { auth } from '../../lib/firebase';
import { getServices } from '../../lib/Services';
import { uploadFile } from '../../lib/Storage';

interface Service {
  id: string;
  name: string;
  requirements?: string;
  fee: number;
}

interface Booking {
  id?: string;
  userId: string;
  serviceId: string;
  date: string;
  time: string;
  status: 'pending' | 'approved' | 'rejected';
  attachmentUrl?: string;
}

const timeSlots = [
  '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM',
  '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
  '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
];

const TimeSlotPicker = ({ selectedDate, selectedTime, onSelect } : { selectedDate: string; selectedTime?: string | null; onSelect: (time: string) => void }) => {
  const [available, setAvailable] = useState<{ time: string; available: boolean }[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const bookings = await getBookingsForDate(selectedDate);
        const booked = bookings.map(b => b.time);
        const slots = timeSlots.map(t => ({ time: t, available: !booked.includes(t) }));
        if (mounted) setAvailable(slots);
      } catch (e) {
        // ignore; show all slots if fetch fails
        const slots = timeSlots.map(t => ({ time: t, available: true }));
        if (mounted) setAvailable(slots);
      }
    })();
    return () => { mounted = false; };
  }, [selectedDate]);

  return (
    <View style={styles.slotContainer}>
      <Title style={styles.slotTitle}>Select Time Slot</Title>
      <View style={styles.slotGrid}>
        {available.map(s => (
          <TouchableOpacity
            key={s.time}
            style={[
              styles.slot, 
              !s.available && styles.slotDisabled, 
              selectedTime === s.time && styles.slotSelected
            ]}
            onPress={() => s.available && onSelect(s.time)}
            disabled={!s.available}
          >
            <Text style={[
              styles.slotText, 
              !s.available && styles.slotTextDisabled, 
              selectedTime === s.time && styles.slotTextSelected
            ]}>
              {s.time}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default function AppointmentsEnhancedScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  // Form controllers (state)
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  
  // State variables
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [date, setDate] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000)); // Tomorrow
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [picked, setPicked] = useState<{ uri: string; name: string } | null>(null);
  
  // Dialog states
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [appointmentId, setAppointmentId] = useState('');

  const canBookAppointment = selectedService && selectedTime && fullName.trim() && phone.trim() && email.trim() && address.trim();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const s = await getServices();
        if (mounted) {
          setServices(s);
          if (!selectedService && s.length) setSelectedService(s[0].id);
        }

        if (auth.currentUser) {
          const b = await getMyBookings(auth.currentUser.uid);
          if (mounted) setMyBookings(b);
        }
      } catch (e: any) {
        Alert.alert('Error', e.message || 'Failed to load');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const onChangeDate = (event: any, d?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (d) {
      setDate(d);
      setSelectedTime(null);
    }
  };

  const handleDocumentPicked = (uri: string, name: string) => setPicked({ uri, name });

  const showBookingConfirmation = () => {
    if (!canBookAppointment) {
      Alert.alert('Error', 'Please fill in all required fields and select service, date, and time.');
      return;
    }
    setShowConfirmation(true);
  };

  const handleSubmit = async () => {
    setShowConfirmation(false);
    setIsSubmitting(true);

    try {
      let attachmentUrl: string | undefined;
      if (picked && auth.currentUser) {
        try {
          const path = `booking_attachments/${auth.currentUser.uid}/${picked.name}`;
          attachmentUrl = await uploadFile(picked.uri, path);
        } catch (e: any) {
          Alert.alert('Upload failed', e.message || 'Failed to upload');
          setIsSubmitting(false);
          return;
        }
      }

      if (auth.currentUser) {
        await createBooking({
          userId: auth.currentUser.uid,
          serviceId: selectedService!,
          date: date.toISOString().split('T')[0],
          time: selectedTime!,
          attachmentUrl,
        });

        const newAppointmentId = `APT-${Date.now()}`;
        setAppointmentId(newAppointmentId);
        setShowSuccess(true);

        // Refresh bookings
        const b = await getMyBookings(auth.currentUser.uid);
        setMyBookings(b);
        
        // Reset form
        setPicked(null);
        setSelectedTime(null);
        setNotes('');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to submit booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  const buildConfirmationItem = (label: string, value: string, iconName: string) => (
    <View style={styles.confirmationItem}>
      <IconSymbol name={iconName as any} size={16} color={colors.icon} />
      <View style={styles.confirmationContent}>
        <Text style={[styles.confirmationLabel, { color: colors.icon }]}>{label}</Text>
        <Text style={[styles.confirmationValue, { color: colors.text }]}>{value}</Text>
      </View>
    </View>
  );

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.tint} />
      <Text style={[styles.loadingText, { color: colors.text }]}>Loading services...</Text>
    </View>
  );

  const selectedServiceData = services.find(s => s.id === selectedService);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header Section */}
        <View style={[styles.headerSection, { backgroundColor: colors.tint }]}>
          <View style={styles.headerContent}>
            <IconSymbol name="event" size={32} color="#fff" />
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Schedule Your Visit</Text>
              <Text style={styles.headerSubtitle}>Book an appointment for barangay services</Text>
            </View>
          </View>
        </View>

        {/* Service Selection */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={[styles.sectionTitle, { color: colors.text }]}>Select Service</Title>
            <View style={styles.pickerContainer}>
              <Picker 
                selectedValue={selectedService} 
                onValueChange={setSelectedService} 
                style={styles.picker}
              >
                {services.map(s => (
                  <Picker.Item 
                    key={s.id} 
                    label={`${s.name} - ₱${s.fee}`} 
                    value={s.id} 
                  />
                ))}
              </Picker>
            </View>
          </Card.Content>
        </Card>

        {/* Date Selection */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={[styles.sectionTitle, { color: colors.text }]}>Select Date</Title>
            <TouchableOpacity 
              style={[styles.dateButton, { borderColor: colors.icon }]}
              onPress={() => setShowDatePicker(true)}
            >
              <IconSymbol name="calendar" size={20} color={colors.icon} />
              <Text style={[styles.dateText, { color: colors.text }]}>
                {date.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker 
                value={date} 
                mode="date" 
                display="default" 
                onChange={onChangeDate} 
                minimumDate={new Date()} 
              />
            )}
          </Card.Content>
        </Card>

        {/* Time Slot Selection */}
        <Card style={styles.card}>
          <Card.Content>
            <TimeSlotPicker 
              selectedDate={date.toISOString().split('T')[0]} 
              selectedTime={selectedTime} 
              onSelect={setSelectedTime} 
            />
          </Card.Content>
        </Card>

        {/* Personal Information */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={[styles.sectionTitle, { color: colors.text }]}>Personal Information</Title>
            
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Full Name *</Text>
              <TextInput
                style={[styles.textInput, { borderColor: colors.icon, color: colors.text }]}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your full name"
                placeholderTextColor={colors.icon}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Phone Number *</Text>
              <TextInput
                style={[styles.textInput, { borderColor: colors.icon, color: colors.text }]}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter your phone number"
                placeholderTextColor={colors.icon}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Email Address *</Text>
              <TextInput
                style={[styles.textInput, { borderColor: colors.icon, color: colors.text }]}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor={colors.icon}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Address *</Text>
              <TextInput
                style={[styles.textInput, { borderColor: colors.icon, color: colors.text }]}
                value={address}
                onChangeText={setAddress}
                placeholder="Enter your address"
                placeholderTextColor={colors.icon}
                multiline
                numberOfLines={2}
              />
            </View>
          </Card.Content>
        </Card>

        {/* Notes */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={[styles.sectionTitle, { color: colors.text }]}>Additional Notes</Title>
            <TextInput
              style={[styles.textInput, styles.notesInput, { borderColor: colors.icon, color: colors.text }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Any additional information or special requests..."
              placeholderTextColor={colors.icon}
              multiline
              numberOfLines={4}
            />
          </Card.Content>
        </Card>

        {/* Document Upload */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={[styles.sectionTitle, { color: colors.text }]}>Upload Documents</Title>
            <DocumentPicker onDocumentPicked={handleDocumentPicked} />
            {picked && (
              <Text style={[styles.pickedText, { color: colors.icon }]}>
                Selected: {picked.name}
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* Book Appointment Button */}
        <TouchableOpacity
          style={[
            styles.bookButton,
            { 
              backgroundColor: canBookAppointment ? colors.tint : colors.icon + '30',
              opacity: canBookAppointment ? 1 : 0.6
            }
          ]}
          onPress={showBookingConfirmation}
          disabled={!canBookAppointment || isSubmitting}
        >
          {isSubmitting ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.bookButtonText}>Booking...</Text>
            </View>
          ) : (
            <View style={styles.bookButtonContent}>
              <IconSymbol name="event" size={20} color="#fff" />
              <Text style={styles.bookButtonText}>Book Appointment</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* My Bookings Section */}
        <Title style={[styles.sectionTitle, { marginTop: 24, color: colors.text }]}>My Bookings</Title>
        {myBookings.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.icon }]}>No bookings found.</Text>
        ) : (
          myBookings.map(b => (
            <Card key={b.id} style={styles.bookingCard}>
              <Card.Content>
                <Text style={[styles.bookingText, { color: colors.text }]}>
                  Service: {services.find(s => s.id === b.serviceId)?.name}
                </Text>
                <Text style={[styles.bookingText, { color: colors.text }]}>Date: {b.date}</Text>
                <Text style={[styles.bookingText, { color: colors.text }]}>Time: {b.time}</Text>
                <Text style={[
                  styles.bookingText, 
                  { color: b.status === 'approved' ? '#28a745' : b.status === 'rejected' ? '#dc3545' : '#ffa500' }
                ]}>
                  Status: {b.status.toUpperCase()}
                </Text>
                {b.attachmentUrl && (
                  <TouchableOpacity onPress={() => Linking.openURL(b.attachmentUrl!)}>
                    <Text style={[styles.linkText, { color: colors.tint }]}>View Document</Text>
                  </TouchableOpacity>
                )}
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      {/* Confirmation Dialog */}
      <Portal>
        <Dialog visible={showConfirmation} onDismiss={() => setShowConfirmation(false)}>
          <Dialog.Title style={styles.dialogTitle}>
            <IconSymbol name="event" size={24} color={colors.tint} />
            <Text style={[styles.dialogTitleText, { color: colors.text }]}>Confirm Appointment</Text>
          </Dialog.Title>
          <Dialog.ScrollArea>
            <View style={styles.dialogContent}>
              {buildConfirmationItem('Service', selectedServiceData?.name || '', 'business')}
              {buildConfirmationItem('Date', date.toLocaleDateString(), 'calendar')}
              {buildConfirmationItem('Time', selectedTime || '', 'access-time')}
              {buildConfirmationItem('Fee', `₱${selectedServiceData?.fee || 0}`, 'attach-money')}
              
              <View style={[styles.reminderBox, { backgroundColor: colors.tint + '10', borderColor: colors.tint + '30' }]}>
                <View style={styles.reminderHeader}>
                  <IconSymbol name="info" size={16} color={colors.tint} />
                  <Text style={[styles.reminderTitle, { color: colors.tint }]}>Important Reminders</Text>
                </View>
                <Text style={[styles.reminderText, { color: colors.tint }]}>
                  • Arrive 15 minutes before your appointment{'\n'}
                  • Bring valid ID and required documents{'\n'}
                  • Payment is made on-site{'\n'}
                  • Cancellation allowed up to 24 hours before
                </Text>
              </View>
            </View>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setShowConfirmation(false)}>Cancel</Button>
            <Button mode="contained" onPress={handleSubmit}>Confirm Booking</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Success Dialog */}
      <Portal>
        <Dialog visible={showSuccess} onDismiss={() => setShowSuccess(false)}>
          <Dialog.Content style={styles.successContent}>
            <View style={[styles.successIcon, { backgroundColor: colors.tint + '20' }]}>
              <IconSymbol name="check-circle" size={48} color={colors.tint} />
            </View>
            <Text style={[styles.successTitle, { color: colors.tint }]}>Appointment Booked!</Text>
            <Text style={[styles.successMessage, { color: colors.text }]}>
              Your appointment has been successfully scheduled.
            </Text>
            <View style={[styles.appointmentIdBox, { backgroundColor: colors.background, borderColor: colors.icon + '30' }]}>
              <Text style={[styles.appointmentIdLabel, { color: colors.icon }]}>Appointment ID</Text>
              <Text style={[styles.appointmentId, { color: colors.tint }]}>{appointmentId}</Text>
            </View>
            <Text style={[styles.notificationText, { color: colors.icon }]}>
              You will receive a confirmation notification shortly.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button mode="contained" onPress={() => setShowSuccess(false)} style={styles.doneButton}>
              Done
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f5f5f5' 
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  
  // Header Section
  headerSection: {
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  
  // Cards
  card: { 
    marginBottom: 16, 
    elevation: 3,
    borderRadius: 12,
  },
  bookingCard: { 
    marginBottom: 12,
    borderRadius: 8,
  },
  
  // Section Titles
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    marginBottom: 12 
  },
  
  // Picker
  pickerContainer: {
    marginTop: 8,
  },
  picker: { 
    height: 50, 
  },
  
  // Date Selection
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 8,
  },
  dateText: {
    marginLeft: 8,
    fontSize: 16,
  },
  
  // Time Slots
  slotContainer: { 
    marginTop: 8 
  },
  slotTitle: { 
    fontSize: 16, 
    marginBottom: 12,
    fontWeight: '600',
  },
  slotGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between' 
  },
  slot: { 
    width: (width - 80) / 4, 
    padding: 12, 
    marginBottom: 8, 
    borderWidth: 1, 
    borderColor: '#007bff', 
    borderRadius: 8, 
    alignItems: 'center', 
    backgroundColor: '#fff' 
  },
  slotDisabled: { 
    borderColor: '#ccc', 
    backgroundColor: '#f0f0f0' 
  },
  slotSelected: { 
    backgroundColor: '#007bff' 
  },
  slotText: { 
    fontSize: 12, 
    color: '#007bff',
    fontWeight: '500',
  },
  slotTextDisabled: { 
    color: '#999' 
  },
  slotTextSelected: { 
    color: '#fff' 
  },
  
  // Form Inputs
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'transparent',
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  
  // Book Button
  bookButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    elevation: 4,
  },
  bookButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  // Document Upload
  pickedText: { 
    marginTop: 8, 
    fontStyle: 'italic', 
    fontSize: 14,
  },
  
  // Bookings List
  emptyText: { 
    textAlign: 'center', 
    marginTop: 12,
    fontSize: 16,
  },
  bookingText: {
    fontSize: 14,
    marginBottom: 4,
  },
  linkText: { 
    color: '#007bff', 
    textDecorationLine: 'underline',
    marginTop: 4,
  },
  
  // Confirmation Dialog
  dialogTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  dialogTitleText: {
    marginLeft: 8,
    fontSize: 20,
    fontWeight: '600',
  },
  dialogContent: {
    padding: 16,
  },
  confirmationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  confirmationContent: {
    marginLeft: 12,
    flex: 1,
  },
  confirmationLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  confirmationValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  reminderBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 16,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reminderTitle: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
  },
  reminderText: {
    fontSize: 12,
    lineHeight: 18,
  },
  
  // Success Dialog
  successContent: {
    alignItems: 'center',
    padding: 16,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  appointmentIdBox: {
    width: '100%',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 16,
  },
  appointmentIdLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  appointmentId: {
    fontSize: 18,
    fontWeight: '600',
  },
  notificationText: {
    fontSize: 12,
    textAlign: 'center',
  },
  doneButton: {
    width: '100%',
  },
});
