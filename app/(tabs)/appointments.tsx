import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useState } from "react";
import { Alert, FlatList, Linking, Platform, StyleSheet, Text, View } from "react-native";
import { Button, Dialog, Portal, useTheme } from 'react-native-paper';

import { createBooking, getMyBookings } from '../../app/lib/Bookings';
import { auth } from '../../app/lib/firebase';
import { getServices } from '../../app/lib/Services';
import { uploadFile } from '../../app/lib/Storage'; // Import uploadFile
import DocumentPicker from '../../components/DocumentPicker'; // Import DocumentPicker

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

export default function AppointmentsScreen() {
  const theme = useTheme();
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [time, setTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickedDocument, setPickedDocument] = useState<{ uri: string; name: string } | null>(null); // State for picked document

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
  };

  const onChangeTime = (event: any, selectedTime?: Date) => {
    const currentTime = selectedTime || time;
    setShowTimePicker(Platform.OS === 'ios');
    setTime(currentTime);
  };

  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  const showTimepicker = () => {
    setShowTimePicker(true);
  };

  const handleDocumentPicked = (uri: string, name: string) => {
    setPickedDocument({ uri, name });
  };

  const handleSubmitBooking = async () => {
    if (!selectedService || !auth.currentUser) {
      Alert.alert('Error', 'Please select a service and ensure you are logged in.');
      return;
    }

    let attachmentUrl: string | undefined;
    if (pickedDocument) {
      try {
        const path = `booking_attachments/${auth.currentUser.uid}/${pickedDocument.name}`;
        attachmentUrl = await uploadFile(pickedDocument.uri, path);
        Alert.alert('Success', 'Document uploaded!');
      } catch (error: any) {
        Alert.alert('Error', `Failed to upload document: ${error.message}`);
        return;
      }
    }

    try {
      const service = services.find(s => s.id === selectedService);
      if (!service) {
        Alert.alert('Error', 'Selected service not found.');
        return;
      }

      await createBooking({
        userId: auth.currentUser.uid,
        serviceId: selectedService,
        date: date.toISOString().split('T')[0],
        time: time.toTimeString().split(' ')[0],
        attachmentUrl, // Include attachmentUrl in the booking
      });
      Alert.alert('Success', 'Booking request submitted!');

      if (auth.currentUser) {
        const fetchedBookings = await getMyBookings(auth.currentUser.uid);
        setMyBookings(fetchedBookings);
      }
      setPickedDocument(null); // Clear picked document after submission
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
    <View style={styles.container}>
      <Text style={styles.title}>Book a Service</Text>

      <Picker
        selectedValue={selectedService}
        onValueChange={(itemValue) => setSelectedService(itemValue)}
        style={styles.picker}
      >
        {services.map((service) => (
          <Picker.Item key={service.id} label={service.name} value={service.id} />
        ))}
      </Picker>

      <View style={styles.dateTimeContainer}>
        <Button mode="outlined" onPress={showDatepicker} style={styles.dateTimeButton}>
          Select Date: {date.toLocaleDateString()}
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
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setShowDatePicker(false)}>Confirm</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        <Button mode="outlined" onPress={showTimepicker} style={styles.dateTimeButton}>
          Select Time: {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Button>
        <Portal>
          <Dialog visible={showTimePicker} onDismiss={() => setShowTimePicker(false)}>
            <Dialog.Title>Select Time</Dialog.Title>
            <Dialog.Content>
              <DateTimePicker
                testID="timePicker"
                value={time}
                mode="time"
                is24Hour={false}
                display="spinner"
                onChange={onChangeTime}
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setShowTimePicker(false)}>Confirm</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </View>

      <DocumentPicker onDocumentPicked={handleDocumentPicked} />
      {pickedDocument && <Text style={styles.documentText}>Selected: {pickedDocument.name}</Text>}

      <Button mode="contained" onPress={handleSubmitBooking} style={styles.button}>
        Submit Booking Request
      </Button>

      <Text style={[styles.title, { marginTop: 30 }]}>My Bookings</Text>
      {myBookings.length === 0 ? (
        <Text>No bookings found.</Text>
      ) : (
        <FlatList
          data={myBookings}
          keyExtractor={(item) => item.id!}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.text}>Service: {services.find(s => s.id === item.serviceId)?.name}</Text>
              <Text style={styles.text}>Date: {item.date}</Text>
              <Text style={styles.text}>Time: {item.time}</Text>
              <Text style={styles.text}>Status: {item.status}</Text>
              {item.attachmentUrl && (
                <Text style={styles.text}>Attachment: <Text style={styles.link} onPress={() => Linking.openURL(item.attachmentUrl!)}>View Document</Text></Text>
              )}
            </View>
          )}
          style={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    color: '#333',
  },
  picker: {
    height: 50,
    width: '100%',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  dateTimeButton: {},
  button: {
    width: '100%',
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  list: {
    width: '100%',
  },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginVertical: 8,
    width: '100%',
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  text: {
    marginVertical: 4,
    fontSize: 16,
  },
  documentText: {
    marginTop: 10,
    fontStyle: 'italic',
  },
  link: {
    color: '#007bff',
    textDecorationLine: 'underline',
  },
});
