import React, { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { Card, Paragraph, Text, Title } from 'react-native-paper';
import AdminGuard from '../../components/AdminGuard';
import { getAllBookings } from '../../lib/Bookings';
import { getServices } from '../../lib/Services';

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

function ReportsScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  useEffect(() => {
    const loadReportsData = async () => {
      try {
        const fetchedBookings = await getAllBookings();
        setBookings(fetchedBookings);

        const fetchedServices = await getServices();
        setServices(fetchedServices);

        const total = fetchedBookings.length;
        const pending = fetchedBookings.filter(b => b.status === 'pending').length;
        const approved = fetchedBookings.filter(b => b.status === 'approved').length;
        const rejected = fetchedBookings.filter(b => b.status === 'rejected').length;

        setStats({ total, pending, approved, rejected });

      } catch (error: any) {
        Alert.alert('Error', error.message);
      } finally {
        setLoading(false);
      }
    };
    loadReportsData();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading reports...</Text>
      </View>
    );
  }

  return (
    <AdminGuard>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
        <Title style={styles.title}>Reports & Analytics</Title>

        <Card style={styles.statsCard}>
          <Card.Content>
            <Title style={styles.statsCardTitle}>Booking Overview</Title>
            <Paragraph style={styles.statsText}>Total Bookings: {stats.total}</Paragraph>
            <Paragraph style={styles.statsText}>Pending: {stats.pending}</Paragraph>
            <Paragraph style={styles.statsText}>Approved: {stats.approved}</Paragraph>
            <Paragraph style={styles.statsText}>Rejected: {stats.rejected}</Paragraph>
          </Card.Content>
        </Card>

        <Title style={[styles.title, { marginTop: 20 }]}>Recent Bookings</Title>
        {bookings.length === 0 ? (
          <Paragraph>No recent bookings to display.</Paragraph>
        ) : (
          bookings.slice(0, 5).map(item => (
            <Card key={item.id} style={styles.bookingCard}>
              <Card.Content>
                <Title style={styles.cardTitle}>Booking ID: {item.id}</Title>
                <Paragraph style={styles.text}>Service: {services.find(s => s.id === item.serviceId)?.name}</Paragraph>
                <Paragraph style={styles.text}>Date: {item.date}</Paragraph>
                <Paragraph style={styles.text}>Status: {item.status}</Paragraph>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>
    </AdminGuard>
  );
}

export default ReportsScreen;

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    width: '100%',
  },
  container: {
    flexGrow: 1,
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
  statsCard: {
    width: '100%',
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
  },
  statsCardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  statsText: {
    fontSize: 16,
    marginBottom: 5,
  },
  bookingCard: {
    width: '100%',
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1.0,
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
});
