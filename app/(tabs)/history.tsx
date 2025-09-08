import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import {
  collection,
  getDocs,
  query,
  Timestamp,
  where
} from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { Card } from 'react-native-paper';
import { auth, db } from "../../lib/firebase";

interface Booking {
  id?: string;
  userId: string;
  serviceId: string;
  serviceName: string;
  date: string;
  time: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
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

// Helper function to fetch user bookings
const getMyBookings = async (userId: string): Promise<Booking[]> => {
  try {
    console.log('Fetching bookings for userId:', userId);
    
    // Query the main bookings collection
    const bookingsRef = collection(db, 'bookings');
    const q = query(bookingsRef, where('userId', '==', userId));
    
    const querySnapshot = await getDocs(q);
    const bookings: Booking[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log('Found booking:', doc.id, data);
      bookings.push({ 
        id: doc.id, 
        ...data
      } as Booking);
    });
    
    // Sort by date manually (newest first)
    bookings.sort((a, b) => {
      // First try to sort by createdAt if available
      if (a.createdAt && b.createdAt) {
        const dateA = a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt as any);
        const dateB = b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt as any);
        return dateB.getTime() - dateA.getTime();
      }
      // Fallback to sorting by appointment date
      const dateA = new Date(a.date + ' ' + a.time);
      const dateB = new Date(b.date + ' ' + b.time);
      return dateB.getTime() - dateA.getTime();
    });
    
    console.log(`Found ${bookings.length} bookings for user ${userId}`);
    return bookings;
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    return [];
  }
};

export default function HistoryScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [currentUser, setCurrentUser] = useState(auth.currentUser);

  const loadBookings = useCallback(async () => {
    try {
      const user = auth.currentUser;
      
      if (!user) {
        console.log('No authenticated user found');
        setBookings([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      console.log('Loading bookings for user:', user.uid);
      
      // Fetch bookings for the current user
      const data = await getMyBookings(user.uid);
      
      // Apply filter if not 'all'
      const filteredData = filter === 'all' 
        ? data 
        : data.filter(booking => booking.status === filter);
      
      console.log(`Displaying ${filteredData.length} bookings after filter`);
      setBookings(filteredData);
    } catch (error) {
      console.error('Error loading bookings:', error);
      setBookings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    // Listen to auth state changes
    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log('Auth state changed:', user ? user.uid : 'No user');
      setCurrentUser(user);
      
      if (user) {
        loadBookings();
      } else {
        setBookings([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Reload when filter changes
    if (currentUser) {
      loadBookings();
    }
  }, [filter, loadBookings]);

  const onRefresh = () => {
    setRefreshing(true);
    loadBookings();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return '#28a745';
      case 'rejected':
        return '#dc3545';
      case 'completed':
        return '#17a2b8';
      case 'cancelled':
        return '#6c757d';
      case 'pending':
      default:
        return '#ffa500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return 'check-circle';
      case 'rejected':
        return 'cancel';
      case 'completed':
        return 'task-alt';
      case 'cancelled':
        return 'block';
      case 'pending':
      default:
        return 'schedule';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString; // Return original if invalid
      }
      return date.toLocaleDateString('en-US', { 
        weekday: 'short',
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  const isUpcoming = (dateString: string) => {
    try {
      const bookingDate = new Date(dateString);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return bookingDate >= today;
    } catch {
      return false;
    }
  };

  const FilterChip = ({ label, value }: { label: string; value: string }) => (
    <TouchableOpacity 
      onPress={() => setFilter(value)}
      style={[
        styles.filterChip,
        { 
          backgroundColor: filter === value ? colors.tint : colors.background,
          borderColor: filter === value ? colors.tint : colors.icon + '30',
        }
      ]}
    >
      <Text style={[
        styles.filterChipText,
        { color: filter === value ? '#fff' : colors.text }
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderBookingCard = ({ item }: { item: Booking }) => {
    const upcoming = isUpcoming(item.date);
    const statusColor = getStatusColor(item.status);
    const statusIcon = getStatusIcon(item.status);

    return (
      <Card style={[styles.card, { backgroundColor: colors.background }]}>
        <Card.Content>
          {/* Header with Appointment ID and Status */}
          <View style={styles.cardHeader}>
            <View style={styles.appointmentInfo}>
              <Text style={[styles.appointmentId, { color: colors.tint }]}>
                {item.appointmentId || `#${item.id?.substring(0, 8).toUpperCase()}`}
              </Text>
              {upcoming && (
                <View style={styles.upcomingBadge}>
                  <Text style={styles.upcomingText}>UPCOMING</Text>
                </View>
              )}
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
              <IconSymbol name={statusIcon as any} size={16} color={statusColor} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {item.status.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Service Name */}
          <Text style={[styles.serviceName, { color: colors.text }]}>
            {item.serviceName || item.serviceId || 'Barangay Service'}
          </Text>

          {/* Date and Time */}
          <View style={styles.infoRow}>
            <IconSymbol name="calendar" size={16} color={colors.icon} />
            <Text style={[styles.infoText, { color: colors.text }]}>
              {formatDate(item.date)}
            </Text>
            {item.time && (
              <>
                <Text style={[styles.separator, { color: colors.icon }]}>•</Text>
                <IconSymbol name="access-time" size={16} color={colors.icon} />
                <Text style={[styles.infoText, { color: colors.text }]}>
                  {item.time}
                </Text>
              </>
            )}
          </View>

          {/* Location */}
          {(item.barangay || item.district) && (
            <View style={styles.infoRow}>
              <IconSymbol name="location-on" size={16} color={colors.icon} />
              <Text style={[styles.infoText, { color: colors.text }]} numberOfLines={1}>
                {item.barangay}{item.barangay && item.district ? ', ' : ''}{item.district ? `${item.district} District` : ''}
              </Text>
            </View>
          )}

          {/* Fee */}
          {item.fee !== undefined && (
            <View style={styles.infoRow}>
              <IconSymbol name="attach-money" size={16} color={colors.icon} />
              <Text style={[styles.infoText, { color: colors.text }]}>
                Service Fee: ₱{item.fee}
              </Text>
            </View>
          )}

          {/* Applicant Info */}
          {item.fullName && (
            <View style={[styles.applicantInfo, { backgroundColor: colors.icon + '05', borderColor: colors.icon + '20' }]}>
              <Text style={[styles.applicantLabel, { color: colors.icon }]}>Applicant:</Text>
              <Text style={[styles.applicantName, { color: colors.text }]}>{item.fullName}</Text>
              {item.phone && (
                <Text style={[styles.applicantDetail, { color: colors.icon }]}>📞 {item.phone}</Text>
              )}
            </View>
          )}

          {/* Notes if available */}
          {item.notes && (
            <View style={[styles.notesContainer, { backgroundColor: colors.icon + '10' }]}>
              <Text style={[styles.notesLabel, { color: colors.icon }]}>Notes:</Text>
              <Text style={[styles.notesText, { color: colors.text }]}>
                {item.notes}
              </Text>
            </View>
          )}

          {/* Attachment */}
          {item.attachmentUrl && (
            <TouchableOpacity 
              style={styles.attachmentButton}
              onPress={() => Linking.openURL(item.attachmentUrl!)}
            >
              <IconSymbol name="attachment" size={16} color={colors.tint} />
              <Text style={[styles.attachmentText, { color: colors.tint }]}>
                View Attached Document
              </Text>
            </TouchableOpacity>
          )}

          {/* Created Date */}
          {item.createdAt && (
            <Text style={[styles.createdDate, { color: colors.icon }]}>
              Booked on {
                item.createdAt.toDate 
                  ? new Date(item.createdAt.toDate()).toLocaleDateString() 
                  : new Date(item.createdAt as any).toLocaleDateString()
              }
            </Text>
          )}
        </Card.Content>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading booking history...</Text>
      </View>
    );
  }

  if (!currentUser) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.tint }]}>
          <View style={styles.headerContent}>
            <IconSymbol name="history" size={28} color="#fff" />
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Booking History</Text>
              <Text style={styles.headerSubtitle}>Sign in to view your bookings</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.emptyContainer}>
          <IconSymbol name="lock" size={64} color={colors.icon + '50'} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Authentication Required
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.icon }]}>
            Please sign in to view your booking history
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: '#007AFF' }]}>
        <View style={styles.headerContent}>
          <IconSymbol name="history" size={28} color="#fff" />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>My Booking History</Text>
            <Text style={styles.headerSubtitle}>
              {bookings.length} {bookings.length === 1 ? 'booking' : 'bookings'} found
            </Text>
          </View>
        </View>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterContainer}>
        <FilterChip label="All" value="all" />
        <FilterChip label="Pending" value="pending" />
        <FilterChip label="Approved" value="approved" />
        <FilterChip label="Completed" value="completed" />
        <FilterChip label="Rejected" value="rejected" />
      </View>

      {/* Bookings List */}
      {bookings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <IconSymbol name="event-busy" size={64} color={colors.icon + '50'} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No {filter !== 'all' ? filter : ''} bookings found
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.icon }]}>
            {filter !== 'all' 
              ? 'Try selecting a different filter or pull to refresh'
              : 'Your booking history will appear here once you make a booking'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id || item.appointmentId || Math.random().toString()}
          contentContainerStyle={styles.listContent}
          renderItem={renderBookingCard}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.tint]}
              tintColor={colors.tint}
            />
          }
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Header
  header: {
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
    marginTop: 2,
  },
  
  // Filter
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Loading
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  
  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // List
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  
  // Card
  card: { 
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  appointmentInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appointmentId: {
    fontSize: 14,
    fontWeight: '600',
  },
  upcomingBadge: {
    backgroundColor: '#28a745',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  upcomingText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  
  // Info Rows
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  infoText: {
    fontSize: 14,
    flex: 1,
  },
  separator: {
    marginHorizontal: 4,
  },
  
  // Applicant Info
  applicantInfo: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  applicantLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  applicantName: {
    fontSize: 14,
    fontWeight: '500',
  },
  applicantDetail: {
    fontSize: 12,
    marginTop: 2,
  },
  
  // Notes
  notesContainer: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
  },
  
  // Attachment
  attachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  attachmentText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  
  // Created Date
  createdDate: {
    fontSize: 12,
    marginTop: 12,
    fontStyle: 'italic',
  },
});