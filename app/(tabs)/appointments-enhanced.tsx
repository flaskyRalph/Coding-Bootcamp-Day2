import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  where
} from 'firebase/firestore';
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import {
  ActivityIndicator,
  Button,
  Card,
  Dialog,
  Portal,
  Title
} from 'react-native-paper';
import DocumentPicker from '../../components/DocumentPicker';
import { auth, db } from '../../lib/firebase';
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
  serviceName: string;
  date: string;
  time: string;
  status: 'pending' | 'approved' | 'rejected';
  attachmentUrl?: string;
  fullName: string;
  phone: string;
  email: string;
  address: string;
  district: string;
  barangay: string;
  notes?: string;
  fee: number;
  createdAt?: Timestamp;
  appointmentId?: string;
}

const timeSlots = [
  '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM',
  '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
  '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
];

const DEFAULT_SERVICES: Service[] = [
  { id: 'barangay-clearance', name: 'Barangay Clearance', fee: 100 },
  { id: 'certificate-residency', name: 'Certificate of Residency', fee: 100 },
  { id: 'certificate-indigency', name: 'Certificate of Indigency', fee: 0 },
  { id: 'barangay-id', name: 'Barangay ID', fee: 150 },
  { id: 'blotter-incident', name: 'Blotter / Incident Recording', fee: 0 },
  { id: 'mediation-conciliation', name: 'Mediation / Conciliation', fee: 0 },
  { id: 'health-consultation', name: 'Health Consultation (BHS)', fee: 0 },
  { id: 'daycare-child-minding', name: 'Day Care / Child Minding', fee: 0 },
  { id: 'business-permit-stall', name: 'Barangay Business Permit (Small Stalls)', fee: 500 },
];

const DISTRICT_TO_BARANGAYS: Record<string, string[]> = {
  '1st': ['Agao', 'Datu Silongan', 'Humabon', 'Rajah Soliman'],
  '2nd': ['Dagohoy', 'Golden Ribbon', 'Lapu-Lapu'],
  '3rd': ['Holy Redeemer', 'Limaha', 'Tandang Sora'],
  '4th': ['Ambago', 'Bayanihan', 'Doongan'],
  '5th': ['Agusan Pequeño', 'Bading', 'Fort Poyohon'],
  '6th': ['Bancasi', 'Libertad', 'Masao'],
  '7th': ['Bonbon', 'Maon', 'San Vicente'],
  '8th': ['Amparo', 'Bit-os', 'Bugabus'],
  '9th': ['Bilay', 'Florida', 'Sumile'],
  '10th': ['Buhangin', 'Camayahan', 'Tagabaca'],
  '11th': ['Baan Km 3', 'Bobon', 'Mahogany'],
  '12th': ['Ampayon', 'De Oro', 'Taligaman'],
  '13th': ['Anticala', 'Los Angeles', 'Santo Niño'],
};

const baseFont = Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto';

// Firestore helper functions
const createBooking = async (bookingData: Omit<Booking, 'id' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'bookings'), {
      ...bookingData,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
};

const getBookingsForDate = async (date: string): Promise<Booking[]> => {
  try {
    const q = query(
      collection(db, 'bookings'),
      where('date', '==', date)
    );
    const querySnapshot = await getDocs(q);
    const bookings: Booking[] = [];
    querySnapshot.forEach((doc) => {
      bookings.push({ id: doc.id, ...doc.data() } as Booking);
    });
    return bookings;
  } catch (error) {
    console.error('Error fetching bookings for date:', error);
    return [];
  }
};

const getMyBookings = async (userId: string): Promise<Booking[]> => {
  try {
    const q = query(
      collection(db, 'bookings'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const bookings: Booking[] = [];
    querySnapshot.forEach((doc) => {
      bookings.push({ id: doc.id, ...doc.data() } as Booking);
    });
    return bookings;
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    return [];
  }
};

const TimeSlotPicker = ({ 
  selectedDate, 
  selectedTime, 
  onSelect 
}: { 
  selectedDate: string; 
  selectedTime?: string | null; 
  onSelect: (time: string) => void 
}) => {
  const [available, setAvailable] = useState<{ time: string; available: boolean }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const bookings = await getBookingsForDate(selectedDate);
        const booked = bookings.map(b => b.time);
        const slots = timeSlots.map(t => ({ 
          time: t, 
          available: !booked.includes(t) 
        }));
        if (mounted) {
          setAvailable(slots);
        }
      } catch (e) {
        console.error('Error checking time slots:', e);
        const slots = timeSlots.map(t => ({ time: t, available: true }));
        if (mounted) {
          setAvailable(slots);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();
    return () => { mounted = false; };
  }, [selectedDate]);

  if (loading) {
    return (
      <View style={styles.slotContainer}>
        <Title style={styles.slotTitle}>Select Time Slot</Title>
        <ActivityIndicator size="small" />
      </View>
    );
  }

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
  
  // Form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  
  // Selection state
  const [services] = useState<Service[]>(DEFAULT_SERVICES);
  const [selectedService, setSelectedService] = useState<string | null>(DEFAULT_SERVICES[0].id);
  const [district, setDistrict] = useState<string | null>(null);
  const [barangay, setBarangay] = useState<string | null>(null);
  
  const districts = Object.keys(DISTRICT_TO_BARANGAYS);
  const barangays = district ? DISTRICT_TO_BARANGAYS[district] : [];
  
  // Date and time state
  const [date, setDate] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000)); // Tomorrow
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  
  // Bookings state
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Document state
  const [picked, setPicked] = useState<{ uri: string; name: string } | null>(null);
  
  // Dialog states
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [appointmentId, setAppointmentId] = useState('');

  const canBookAppointment = 
    selectedService && 
    selectedTime && 
    fullName.trim() && 
    phone.trim() && 
    email.trim() && 
    address.trim() && 
    district && 
    barangay;

  useEffect(() => {
    loadMyBookings();
  }, []);

  const loadMyBookings = async () => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const bookings = await getMyBookings(auth.currentUser.uid);
      setMyBookings(bookings);
    } catch (error) {
      console.error('Error loading bookings:', error);
      Alert.alert('Error', 'Failed to load your bookings');
    } finally {
      setLoading(false);
    }
  };

  const formatDateDisplay = (d: Date) =>
    d.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  // Dynamic minimum date rules per service (e.g., health consultation can be same-day)
  const minDate = selectedService === 'health-consultation'
    ? new Date()
    : new Date(Date.now() + 24 * 60 * 60 * 1000);

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
      setSelectedTime(null);
    }
  };

  const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const formatDateForInput = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

  const openDatePicker = () => {
    console.log('Date picker opened on platform:', Platform.OS);
    console.log('Current showDatePicker state:', showDatePicker);
    
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: date,
        onChange: onChangeDate,
        mode: 'date',
        minimumDate: minDate,
      });
    } else if (Platform.OS === 'web') {
      // For web, always use the modal approach as it's more reliable
      console.log('Opening web date picker modal');
      setShowDatePicker(true);
    } else {
      // iOS and other platforms
      setShowDatePicker(true);
    }
  };

  const handleDocumentPicked = (uri: string, name: string) => {
    setPicked({ uri, name });
  };

  const showBookingConfirmation = () => {
    if (!canBookAppointment) {
      Alert.alert('Incomplete Form', 'Please fill in all required fields and select service, date, and time.');
      return;
    }
    
    if (!auth.currentUser) {
      Alert.alert('Authentication Required', 'Please sign in to book an appointment.');
      return;
    }
    
    setShowConfirmation(true);
  };

  const resetForm = () => {
    setFullName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setNotes('');
    setSelectedTime(null);
    setPicked(null);
    setDistrict(null);
    setBarangay(null);
    setDate(new Date(Date.now() + 24 * 60 * 60 * 1000));
  };

  const handleSubmit = async () => {
    setShowConfirmation(false);
    setIsSubmitting(true);

    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      // Upload attachment if provided
      let attachmentUrl: string | undefined;
      if (picked) {
        try {
          const timestamp = Date.now();
          const fileName = `${timestamp}_${picked.name}`;
          const path = `booking_attachments/${auth.currentUser.uid}/${fileName}`;
          attachmentUrl = await uploadFile(picked.uri, path);
        } catch (uploadError) {
          console.error('Upload error:', uploadError);
          Alert.alert('Upload Failed', 'Failed to upload document. Continue without attachment?', [
            { text: 'Cancel', style: 'cancel', onPress: () => setIsSubmitting(false) },
            { text: 'Continue', onPress: () => submitBooking(undefined) }
          ]);
          return;
        }
      }

      await submitBooking(attachmentUrl);
    } catch (error: any) {
      console.error('Booking error:', error);
      Alert.alert('Booking Failed', error.message || 'Failed to create booking. Please try again.');
      setIsSubmitting(false);
    }
  };

  const submitBooking = async (attachmentUrl?: string) => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      const selectedServiceData = services.find(s => s.id === selectedService);
      if (!selectedServiceData) {
        throw new Error('Invalid service selected');
      }

      const newAppointmentId = `APT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      const bookingData: Omit<Booking, 'id' | 'createdAt'> = {
        userId: auth.currentUser.uid,
        serviceId: selectedService!,
        serviceName: selectedServiceData.name,
        date: date.toISOString().split('T')[0],
        time: selectedTime!,
        status: 'pending',
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        address: address.trim(),
        district: district!,
        barangay: barangay!,
        notes: notes.trim(),
        fee: selectedServiceData.fee,
        appointmentId: newAppointmentId,
        ...(attachmentUrl && { attachmentUrl })
      };

      await createBooking(bookingData);
      
      setAppointmentId(newAppointmentId);
      setShowSuccess(true);
      
      // Reload bookings
      await loadMyBookings();
      
      // Reset form
      resetForm();
    } catch (error: any) {
      console.error('Submit error:', error);
      throw error;
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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading appointments...</Text>
      </View>
    );
  }

  const selectedServiceData = services.find(s => s.id === selectedService);
  
  // Group bookings by barangay
  const groupedByBarangay: Record<string, Booking[]> = myBookings.reduce((acc: Record<string, Booking[]>, curr: Booking) => {
    const key = curr.barangay || 'Unspecified Barangay';
    if (!acc[key]) acc[key] = [];
    acc[key].push(curr);
    return acc;
  }, {});

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header Section */}
        <View style={[styles.headerSection, { backgroundColor: '#007AFF' }]}>
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

        {/* District and Barangay Selection */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={[styles.sectionTitle, { color: colors.text }]}>Barangay Location</Title>
            <View style={styles.inputRow}>
              <View style={[styles.inputHalf, styles.pickerContainer]}>
                <Picker
                  selectedValue={district}
                  onValueChange={(val) => { 
                    setDistrict(val); 
                    setBarangay(null); 
                  }}
                  style={styles.picker}
                >
                  <Picker.Item label="Select District" value={null} />
                  {districts.map(d => (
                    <Picker.Item key={d} label={`${d} District`} value={d} />
                  ))}
                </Picker>
              </View>
              <View style={[styles.inputHalf, styles.pickerContainer]}>
                <Picker
                  enabled={!!district}
                  selectedValue={barangay}
                  onValueChange={setBarangay}
                  style={styles.picker}
                >
                  <Picker.Item 
                    label={district ? 'Select Barangay' : 'Choose District first'} 
                    value={null} 
                  />
                  {barangays.map(b => (
                    <Picker.Item key={b} label={b} value={b} />
                  ))}
                </Picker>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Date Selection */}
        <Card style={styles.card}>
          <Card.Content>
            <TouchableOpacity 
              onPress={openDatePicker} 
              activeOpacity={0.7}
              style={styles.clickableTitle}
            >
              <Title style={[styles.sectionTitle, { color: colors.text }]}>
                Select Date
              </Title>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.dateButton, { 
                borderColor: '#007AFF',
                backgroundColor: colors.background === '#000' ? '#1a1a1a' : '#fff'
              }]}
              onPress={openDatePicker}
              activeOpacity={0.7}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              accessible={true}
              accessibilityLabel="Select appointment date"
              accessibilityRole="button"
            >
              <IconSymbol name="calendar" size={20} color="#007AFF" />
              <Text style={[styles.dateText, { color: colors.text }]}>
                {formatDateDisplay(date)}
              </Text>
              <IconSymbol name="chevron-right" size={20} color="#007AFF" />
            </TouchableOpacity>
            {showDatePicker && (
              <>
                {Platform.OS === 'web' ? (
                  <View style={styles.webDatePickerContainer}>
                    <Text style={[styles.webDatePickerTitle, { color: colors.text }]}>
                      Select Date
                    </Text>
                    <View style={styles.webDateInputRow}>
                      <TextInput
                        style={[styles.webDateInput, { 
                          borderColor: colors.icon, 
                          color: colors.text,
                          backgroundColor: colors.background === '#000' ? '#1a1a1a' : '#fff'
                        }]}
                        value={formatDateForInput(date)}
                        onChangeText={(text) => {
                          if (text) {
                            const newDate = new Date(text);
                            if (!isNaN(newDate.getTime()) && newDate >= minDate) {
                              setDate(newDate);
                            }
                          }
                        }}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={colors.icon}
                        keyboardType="numeric"
                      />
                      <Text style={[styles.webDateHint, { color: colors.icon }]}>
                        Format: YYYY-MM-DD
                      </Text>
                    </View>
                    <View style={styles.webDatePickerButtons}>
                      <TouchableOpacity 
                        style={[styles.webDateButton, { borderColor: '#007AFF', backgroundColor: 'transparent' }]}
                        onPress={() => setShowDatePicker(false)}
                      >
                        <Text style={[styles.webDateButtonText, { color: '#007AFF' }]}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.webDateButton, { backgroundColor: '#007AFF', borderColor: '#007AFF' }]}
                        onPress={() => setShowDatePicker(false)}
                      >
                        <Text style={styles.webDateButtonTextActive}>Done</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <DateTimePicker 
                    value={date} 
                    mode="date" 
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onChangeDate} 
                    minimumDate={minDate}
                    textColor={colors.text}
                  />
                )}
              </>
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
                style={[styles.textInput, { borderColor: colors.icon }]}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your full name"
                placeholderTextColor={colors.icon}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Phone Number *</Text>
              <TextInput
                style={[styles.textInput, { borderColor: colors.icon }]}
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
                style={[styles.textInput, { borderColor: colors.icon }]}
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
                style={[styles.textInput, { borderColor: colors.icon }]}
                value={address}
                onChangeText={setAddress}
                placeholder="Enter your complete address"
                placeholderTextColor={colors.icon}
                multiline
                numberOfLines={2}
              />
            </View>
          </Card.Content>
        </Card>

        {/* Additional Notes */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={[styles.sectionTitle, { color: colors.text }]}>Additional Notes</Title>
            <TextInput
              style={[styles.textInput, styles.notesInput, { borderColor: colors.icon }]}
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
            <Title style={[styles.sectionTitle, { color: colors.text }]}>Upload Documents (Optional)</Title>
            <DocumentPicker onDocumentPicked={handleDocumentPicked} />
            {picked && (
              <View style={styles.pickedContainer}>
                <Text style={[styles.pickedText, { color: colors.icon }]}>
                  Selected: {picked.name}
                </Text>
                <TouchableOpacity onPress={() => setPicked(null)}>
                  <Text style={[styles.removeText, { color: colors.tint }]}>Remove</Text>
                </TouchableOpacity>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Book Appointment Button */}
        <TouchableOpacity
          style={[
            styles.bookButton,
            { 
              backgroundColor: canBookAppointment ? '#007AFF' : colors.icon + '30',
              opacity: canBookAppointment && !isSubmitting ? 1 : 0.6
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
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text style={[styles.emptyText, { color: colors.icon }]}>
                No bookings found. Book your first appointment above!
              </Text>
            </Card.Content>
          </Card>
        ) : (
          Object.entries(groupedByBarangay).map(([barangayName, bookings]) => (
            <View key={barangayName}>
              <Text style={[styles.groupHeader, { color: colors.text }]}>
                📍 {barangayName}
              </Text>
              {bookings.map((booking) => (
                <Card key={booking.id || booking.appointmentId} style={styles.bookingCard}>
                  <Card.Content>
                    <View style={styles.bookingHeader}>
                      <Text style={[styles.bookingId, { color: colors.tint }]}>
                        {booking.appointmentId || `#${booking.id}`}
                      </Text>
                      <View style={[
                        styles.statusBadge,
                        { 
                          backgroundColor: 
                            booking.status === 'approved' ? '#28a74520' : 
                            booking.status === 'rejected' ? '#dc354520' : 
                            '#ffa50020'
                        }
                      ]}>
                        <Text style={[
                          styles.statusText,
                          { 
                            color: 
                              booking.status === 'approved' ? '#28a745' : 
                              booking.status === 'rejected' ? '#dc3545' : 
                              '#ffa500'
                          }
                        ]}>
                          {booking.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.bookingDetails}>
                      <View style={styles.bookingRow}>
                        <IconSymbol name="business" size={16} color={colors.icon} />
                        <Text style={[styles.bookingText, { color: colors.text }]}>
                          {booking.serviceName || 'Service'}
                        </Text>
                      </View>
                      
                      <View style={styles.bookingRow}>
                        <IconSymbol name="calendar" size={16} color={colors.icon} />
                        <Text style={[styles.bookingText, { color: colors.text }]}>
                          {new Date(booking.date).toLocaleDateString()} at {booking.time}
                        </Text>
                      </View>
                      
                      <View style={styles.bookingRow}>
                        <IconSymbol name="location-on" size={16} color={colors.icon} />
                        <Text style={[styles.bookingText, { color: colors.text }]}>
                          {booking.district} District
                        </Text>
                      </View>
                      
                      <View style={styles.bookingRow}>
                        <IconSymbol name="attach-money" size={16} color={colors.icon} />
                        <Text style={[styles.bookingText, { color: colors.text }]}>
                          Fee: ₱{booking.fee}
                        </Text>
                      </View>
                    </View>
                    
                    {booking.attachmentUrl && (
                      <TouchableOpacity 
                        style={styles.attachmentButton}
                        onPress={() => Linking.openURL(booking.attachmentUrl!)}
                      >
                        <IconSymbol name="attachment" size={16} color={colors.tint} />
                        <Text style={[styles.linkText, { color: colors.tint }]}>
                          View Attached Document
                        </Text>
                      </TouchableOpacity>
                    )}
                  </Card.Content>
                </Card>
              ))}
            </View>
          ))
        )}
      </ScrollView>

      {/* Confirmation Dialog */}
      <Portal>
        <Dialog visible={showConfirmation} onDismiss={() => setShowConfirmation(false)}>
          <Dialog.Title style={styles.dialogTitle}>
            <IconSymbol name="event" size={24} color={colors.tint} />
            <Text style={[styles.dialogTitleText, { color: colors.text }]}>
              Confirm Appointment
            </Text>
          </Dialog.Title>
          <Dialog.ScrollArea>
            <View style={styles.dialogContent}>
              {buildConfirmationItem('Service', selectedServiceData?.name || '', 'business')}
              {buildConfirmationItem('Date', date.toLocaleDateString(), 'calendar')}
              {buildConfirmationItem('Time', selectedTime || '', 'access-time')}
              {buildConfirmationItem('Location', `${barangay}, ${district} District`, 'location-on')}
              {buildConfirmationItem('Fee', `₱${selectedServiceData?.fee || 0}`, 'attach-money')}
              {buildConfirmationItem('Name', fullName, 'person')}
              {buildConfirmationItem('Contact', phone, 'phone')}
              
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
            <Button onPress={() => setShowConfirmation(false)} textColor={colors.text}>
              Cancel
            </Button>
            <Button 
              mode="contained" 
              onPress={handleSubmit}
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              Confirm Booking
            </Button>
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
            <Text style={[styles.successTitle, { color: colors.tint }]}>
              Appointment Booked Successfully!
            </Text>
            <Text style={[styles.successMessage, { color: colors.text }]}>
              Your appointment has been scheduled and is pending approval.
            </Text>
            <View style={[styles.appointmentIdBox, { backgroundColor: colors.background, borderColor: colors.icon + '30' }]}>
              <Text style={[styles.appointmentIdLabel, { color: colors.icon }]}>
                Appointment ID
              </Text>
              <Text style={[styles.appointmentId, { color: colors.tint }]}>
                {appointmentId}
              </Text>
            </View>
            <Text style={[styles.notificationText, { color: colors.icon }]}>
              You will receive a confirmation notification once your appointment is approved.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button 
              mode="contained" 
              onPress={() => setShowSuccess(false)} 
              style={styles.doneButton}
            >
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
    elevation: 4,
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
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
    letterSpacing: 0.3,
    fontFamily: baseFont,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#fff',
    opacity: 0.9,
    fontFamily: baseFont,
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
    elevation: 2,
  },
  emptyCard: {
    marginTop: 8,
    borderRadius: 8,
  },
  
  // Section Titles
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    marginBottom: 12 
  },
  clickableTitle: {
    marginBottom: 8,
  },
  
  // Picker
  pickerContainer: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  picker: { 
    height: 50, 
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputHalf: {
    flex: 1,
  },
  
  // Date Selection
  dateSelectionContainer: {
    marginTop: 8,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1.5,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    minHeight: 56,
    justifyContent: 'space-between',
  },
  dateInfo: {
    flex: 1,
    marginLeft: 12,
  },
  dateLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    fontFamily: baseFont,
    marginBottom: 4,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  dateValue: {
    fontSize: 16,
    color: '#2c2c2c',
    fontWeight: '600',
    fontFamily: baseFont,
    letterSpacing: 0.2,
  },
  dateNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 4,
  },
  dateNoteText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
    fontFamily: baseFont,
    fontStyle: 'italic',
  },
  dateText: {
    marginLeft: 8,
    fontSize: 16,
    flex: 1,
  },
  webDatePickerContainer: {
    marginTop: 16,
    padding: 20,
    borderWidth: 1,
    borderRadius: 12,
    borderColor: '#ddd',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  webDatePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  webDateInputRow: {
    marginBottom: 20,
  },
  webDateInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  webDateHint: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  webDatePickerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  webDateButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  webDateButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  webDateButtonTextActive: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
    borderColor: '#007AFF', 
    borderRadius: 8, 
    alignItems: 'center', 
    backgroundColor: '#fff' 
  },
  slotDisabled: { 
    borderColor: '#ccc', 
    backgroundColor: '#f0f0f0' 
  },
  slotSelected: { 
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  slotText: { 
    fontSize: 12, 
    color: '#007AFF',
    fontWeight: '500',
    fontFamily: baseFont,
  },
  slotTextDisabled: { 
    color: '#999',
    fontFamily: baseFont,
  },
  slotTextSelected: { 
    color: '#fff',
    fontWeight: '600',
    fontFamily: baseFont,
  },
  
  // Form Inputs
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    fontFamily: baseFont,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#000',
    fontFamily: baseFont,
  },
  notesInput: {
    height: 100,
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
    fontFamily: baseFont,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  // Document Upload
  pickedContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  pickedText: { 
    flex: 1,
    fontSize: 14,
  },
  removeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Bookings List
  emptyText: { 
    textAlign: 'center', 
    fontSize: 16,
    lineHeight: 24,
    fontFamily: baseFont,
  },
  groupHeader: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: baseFont,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bookingId: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: baseFont,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  bookingDetails: {
    gap: 8,
  },
  bookingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bookingText: {
    fontSize: 14,
    flex: 1,
    fontFamily: baseFont,
  },
  attachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  linkText: { 
    fontSize: 14,
    textDecorationLine: 'underline',
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
    lineHeight: 22,
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
    lineHeight: 18,
  },
  doneButton: {
    width: '100%',
  },
});