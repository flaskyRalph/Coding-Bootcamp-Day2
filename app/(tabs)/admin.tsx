import React, { useEffect, useState } from "react";
import { Alert, FlatList, Linking, StyleSheet, Text, View } from "react-native";
import { Button, Card, Paragraph, Title } from 'react-native-paper';
import AdminGuard from '../../components/AdminGuard';
import { getAllBookings, updateBookingStatus } from '../../lib/Bookings';
import { sendPushNotification } from '../../lib/Notifications';
import { getServices } from '../../lib/Services';
import { fetchUserProfile, UserProfile } from '../../lib/User';

interface Booking {
  id?: string;
  userId: string;
  serviceId: string;
  date: string;
  time: string;
  status: "pending" | "approved" | "rejected";
  attachmentUrl?: string;
}

interface Service {
  id: string;
  name: string;
  requirements: string;
  fee: number;
}

function AdminScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [users, setUsers] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const fetchedBookings = await getAllBookings();
        setBookings(fetchedBookings);

        const fetchedServices = await getServices();
        setServices(fetchedServices);

        const userIds = Array.from(new Set(fetchedBookings.map(b => b.userId)));
        const usersData: Record<string, UserProfile> = {};
        for (const userId of userIds) {
          const userProfile = await fetchUserProfile(userId);
          if (userProfile) {
            usersData[userId] = userProfile;
          }
        }
        setUsers(usersData);

      } catch (error: any) {
        Alert.alert('Error', error.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleUpdateStatus = async (bookingId: string, userId: string, status: "pending" | "approved" | "rejected") => {
    try {
      await updateBookingStatus(bookingId, status);
      Alert.alert('Success', `Booking ${status} successfully!`);

      const bookingUser = users[userId];
      if (bookingUser && bookingUser.pushToken) {
        const serviceName = services.find(s => s.id === bookings.find(b => b.id === bookingId)?.serviceId)?.name || 'a service';
        await sendPushNotification(
          bookingUser.pushToken,
          'Booking Status Update',
          `Your booking for ${serviceName} has been ${status}.`
        );
      }

      const fetchedBookings = await getAllBookings();
      setBookings(fetchedBookings);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading admin dashboard...</Text>
      </View>
    );
  }

  return (
    <AdminGuard>
      <View style={styles.container}>
        <Title style={styles.title}>Admin Dashboard</Title>
        {bookings.length === 0 ? (
          <Paragraph>No bookings found.</Paragraph>
        ) : (
          <FlatList
            data={bookings}
            keyExtractor={(item) => item.id!}
            renderItem={({ item }) => (
              <Card style={styles.card}>
                <Card.Content>
                  <Title style={styles.cardTitle}>Booking ID: {item.id}</Title>
                  <Paragraph style={styles.text}>Service: {services.find(s => s.id === item.serviceId)?.name}</Paragraph>
                  <Paragraph style={styles.text}>Date: {item.date}</Paragraph>
                  <Paragraph style={styles.text}>Time: {item.time}</Paragraph>
                  <Paragraph style={styles.text}>Status: {item.status}</Paragraph>
                  <Paragraph style={styles.text}>Requested by: {users[item.userId]?.name || 'N/A'} ({users[item.userId]?.email || 'N/A'})</Paragraph>
                  {item.attachmentUrl && (
                    <Paragraph style={styles.text}>Attachment: <Text style={styles.link} onPress={() => Linking.openURL(item.attachmentUrl!)}>View Document</Text></Paragraph>
                  )}
                </Card.Content>
                <Card.Actions style={styles.cardActions}>
                  <Button
                    mode="contained"
                    onPress={() => handleUpdateStatus(item.id!, item.userId, 'approved')}
                    style={styles.button}
                    labelStyle={styles.buttonText}
                  >
                    Approve
                  </Button>
                  <Button
                    mode="contained"
                    onPress={() => handleUpdateStatus(item.id!, item.userId, 'rejected')}
                    style={[styles.button, styles.rejectButton]}
                    labelStyle={styles.buttonText}
                  >
                    Reject
                  </Button>
                </Card.Actions>
              </Card>
            )}
            style={styles.list}
          />
        )}
      </View>
    </AdminGuard>
  );
}

export default AdminScreen;

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
  list: {
    width: '100%',
  },
  card: {
    marginVertical: 8,
    width: '100%',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  text: {
    fontSize: 16,
    marginBottom: 2,
  },
  cardActions: {
    justifyContent: 'space-around',
    paddingTop: 10,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
  },
  rejectButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: '#fff',
  },
  link: {
    color: '#007bff',
    textDecorationLine: 'underline',
  },
});
