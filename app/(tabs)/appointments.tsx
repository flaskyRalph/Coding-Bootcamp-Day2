// app/(tabs)/appointments.tsx
import { BookingForm } from '@/components/bookings/BookingForm';
import { BookingList } from '@/components/bookings/BookingList';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useAuth } from '../lib/context/AuthContext';
import { useBookings } from '../lib/hooks/useBookings';
import { useServices } from '../lib/hooks/useServices';

export default function AppointmentsScreen() {
  const { user } = useAuth();
  const { bookings, loading, error, refreshBookings, createBooking } = useBookings(user?.uid);
  const { services, loading: servicesLoading } = useServices();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshBookings();
    setRefreshing(false);
  }, [refreshBookings]);

  const handleBookingSubmit = useCallback(async (bookingData: any) => {
    const result = await createBooking(bookingData);
    if (result.success) {
      // Show success message
      await refreshBookings();
    } else {
      // Show error message
    }
  }, [createBooking, refreshBookings]);

  if (loading || servicesLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.section}>
          <BookingForm
            services={services}
            onSubmit={handleBookingSubmit}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Bookings</Text>
          {bookings.length > 0 ? (
            <BookingList bookings={bookings} services={services} />
          ) : (
            <EmptyState
              title="No bookings yet"
              message="Your booking requests will appear here"
            />
          )}
        </View>
      </ScrollView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    paddingBottom: 100,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
});