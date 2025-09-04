import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useState } from "react";
import { Alert, FlatList, Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Button, Card, Dialog, Portal, Title, useTheme } from 'react-native-paper';
import { createBooking, getBookingsForDate, getMyBookings } from '../../app/lib/Bookings';
import { auth } from '../../app/lib/firebase';
import { getServices } from '../../app/lib/Services';
import { uploadFile } from '../../app/lib/Storage';
import DocumentPicker from '../../components/DocumentPicker';

interface Service {
  id: string;
  name: string;
  requirements: string;
  fee: number;
}

interface Booking {
  id?: string;
  userId: string;
  serviceId: string;
  date: string;
  time: string;
  status: "pending" | "approved" | "rejected";
  attachmentUrl?: string;
}

const timeSlots = [
  '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM',
  '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
  '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
];

type TimeSlot = { time: string; available: boolean };

interface TimeSlotPickerProps {
  selectedDate: string;
  onTimeSelect: (time: string) => void;
  selectedTime?: string | null;
}

const TimeSlotPicker = ({ selectedDate, onTimeSelect, selectedTime }: TimeSlotPickerProps) => {
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  
  useEffect(() => {
    const loadAvailability = async () => {
      const bookings = await getBookingsForDate(selectedDate);
      const bookedSlots = bookings.map(b => b.time);
      
      const slots = timeSlots.map((slot) => ({
        time: slot,
        available: !bookedSlots.includes(slot),
      }));
      setAvailableSlots(slots);
    };
    loadAvailability();
  }, [selectedDate]);

  return (
    <View style={styles.timeSlotContainer}>
      <Title style={styles.slotTitle}>Select Time</Title>
      <View style={styles.slotGrid}>
        {availableSlots.map(({ time, available }) => (
          <TouchableOpacity
            key={time}
            style={[
              styles.timeSlot,
              !available && styles.unavailableSlot,
              selectedTime === time && styles.selectedSlot,
            ]}
            onPress={() => available && onTimeSelect(time)}
            disabled={!available}
          >
            <Text style={[
              styles.slotText,
              !available && styles.unavailableText,
              selectedTime === time && styles.selectedText,
            ]}>
              {time}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default function AppointmentsEnhancedScreen() {
  const theme = useTheme();
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickedDocument, setPickedDocument] = useState<{ uri: string; name: string } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const fetchedServices = await getServices();
        setServices(fetchedServices);
        if (fetchedServices.length > 0) {
          setSelectedService(fetchedServices[0].id);
        }

        if (auth.currentUser) {
          const fetchedBookings = await getMyBookings(auth.currentUser.uid);
          setMyBookings(fetchedBookings);
        }
      } catch (error: any) {
        Alert.alert('Error', error.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const onChangeDate = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
    setSelectedTime(null); // Reset time selection when date changes
  };

  const handleDocumentPicked = (uri: string, name: string) => {
    setPickedDocument({ uri, name });
  };

  const handleSubmitBooking = async () => {
    if (!selectedService || !auth.currentUser || !selectedTime) {
      Alert.alert('Error', 'Please select a service, date, and time.');
      return;
    }

    let attachmentUrl: string | undefined;
    if (pickedDocument) {
      try {
        const path = `booking_attachments/${auth.currentUser.uid}/${pickedDocument.name}`;
        attachmentUrl = await uploadFile(pickedDocument.uri, path);
      } catch (error: any) {
        Alert.alert('Error', `Failed to upload document: ${error.message}`);
        return;
      }
    }

    try {
      await createBooking({
        userId: auth.currentUser.uid,
        serviceId: selectedService,
        date: date.toISOString().split('T')[0],
        time: selectedTime,
        attachmentUrl,
      });
      Alert.alert('Success', 'Booking request submitted!');

      if (auth.currentUser) {
        const fetchedBookings = await getMyBookings(auth.currentUser.uid);
        setMyBookings(fetchedBookings);
      }
      setPickedDocument(null);
      setSelectedTime(null);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading services and bookings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.container}>
        <Text style={styles.title}>Book a Service</Text>

        <Card style={styles.card}>
          <Card.Content>
            <Title>Select Service</Title>
            <Picker
              selectedValue={selectedService}
              onValueChange={(itemValue) => setSelectedService(itemValue)}
              style={styles.picker}
            >
              {services.map((service) => (
                <Picker.Item key={service.id} label={`${service.name} - ₱${service.fee}`} value={service.id} />
              ))}
            </Picker>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Title>Select Date</Title>
            <Button mode="outlined" onPress={() => setShowDatePicker(true)} style={styles.dateButton}>
              {date.toLocaleDateString()}
            </Button>
            <Portal>
              <Dialog visible={showDatePicker} onDismiss={() => setShowDatePicker(false)}>
                <Dialog.Title>Select Date</Dialog.Title>
                <Dialog.Content>
                  <DateTimePicker
                    testID="datePicker"
                    value={date}
                    mode="date"
                    display="spinner"
                    onChange={onChangeDate}
                    minimumDate={new Date()}
                  />
                </Dialog.Content>
                <Dialog.Actions>
                  <Button onPress={() => setShowDatePicker(false)}>Confirm</Button>
                </Dialog.Actions>
              </Dialog>
            </Portal>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <TimeSlotPicker
              selectedDate={date.toISOString().split('T')[0]}
              onTimeSelect={setSelectedTime}
              selectedTime={selectedTime}
            />
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Title>Upload Documents</Title>
            <DocumentPicker onDocumentPicked={handleDocumentPicked} />
            {pickedDocument && <Text style={styles.documentText}>Selected: {pickedDocument.name}</Text>}
          </Card.Content>
        </Card>

        <Button 
          mode="contained" 
          onPress={handleSubmitBooking} 
          style={styles.submitButton}
          disabled={!selectedTime}
        >
          Submit Booking Request
        </Button>

        <Title style={[styles.title, { marginTop: 30 }]}>My Bookings</Title>
        {myBookings.length === 0 ? (
          <Text style={styles.emptyText}>No bookings found.</Text>
        ) : (
          <FlatList
            data={myBookings}
            keyExtractor={(item) => item.id!}
            renderItem={({ item }) => (
              <Card style={styles.bookingCard}>
                <Card.Content>
                  <Text style={styles.bookingText}>Service: {services.find(s => s.id === item.serviceId)?.name}</Text>
                  <Text style={styles.bookingText}>Date: {item.date}</Text>
                  <Text style={styles.bookingText}>Time: {item.time}</Text>
                  <Text style={[styles.bookingText, styles[item.status]]}>Status: {item.status.toUpperCase()}</Text>
                  {item.attachmentUrl && (
                    <TouchableOpacity onPress={() => Linking.openURL(item.attachmentUrl!)}>
                      <Text style={styles.link}>View Document</Text>
                    </TouchableOpacity>
                  )}
                </Card.Content>
              </Card>
            )}
            scrollEnabled={false}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  card: {
    marginBottom: 15,
    elevation: 3,
  },
  picker: {
    height: 50,
    marginTop: 10,
  },
  dateButton: {
    marginTop: 10,
  },
  timeSlotContainer: {
    marginTop: 10,
  },
  slotTitle: {
    fontSize: 16,
    marginBottom: 10,
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  timeSlot: {
    width: '23%',
    padding: 10,
    margin: '1%',
    borderWidth: 1,
    borderColor: '#007bff',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  unavailableSlot: {
    borderColor: '#ccc',
    backgroundColor: '#f0f0f0',
  },
  selectedSlot: {
    backgroundColor: '#007bff',
  },
  slotText: {
    fontSize: 12,
    color: '#007bff',
  },
  unavailableText: {
    color: '#999',
  },
  selectedText: {
    color: '#fff',
  },
  documentText: {
    marginTop: 10,
    fontStyle: 'italic',
    color: '#666',
  },
  submitButton: {
    marginTop: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
  },
  bookingCard: {
    marginBottom: 10,
  },
  bookingText: {
    marginVertical: 2,
    fontSize: 14,
  },
  pending: {
    color: '#ffa500',
  },
  approved: {
    color: '#28a745',
  },
  rejected: {
    color: '#dc3545',
  },
  link: {
    color: '#007bff',
    textDecorationLine: 'underline',
    marginTop: 5,
  },
});
