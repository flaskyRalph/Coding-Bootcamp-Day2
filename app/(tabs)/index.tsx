import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import React, { useEffect, useState } from "react";
import { Alert, Dimensions, Linking, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Button, Card, Dialog, FAB, Paragraph, Portal, TextInput, Title } from 'react-native-paper';
import { getAnnouncements } from '../../lib/Announcements';
import { useAuth } from '../../lib/AuthContext';

const { width } = Dimensions.get('window');

interface Announcement {
  id?: string;
  title: string;
  content: string;
  date: string;
  postedBy: string;
  priority?: 'high' | 'medium' | 'normal';
  category?: string;
  isBookmarked?: boolean;
}

interface ServiceShortcut {
  id: number;
  title: string;
  subtitle: string;
  icon: string;
  route: string;
}

interface QuickAction {
  id: number;
  title: string;
  description: string;
  icon: string;
  route: string;
}

interface EmergencyContact {
  id: number;
  name: string;
  phone: string;
  icon: string;
}

interface RecentActivity {
  id: number;
  title: string;
  status: 'approved' | 'pending' | 'in_progress' | 'rejected';
  date: string;
  type: string;
}

interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  location: string;
}

export default function HomeDashboard() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
  
  // State
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notificationCount] = useState(3);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [showServiceMenu, setShowServiceMenu] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceShortcut | null>(null);

  // Mock data (matching Flutter implementation)
  const serviceShortcuts: ServiceShortcut[] = [
    {
      id: 1,
      title: "Certificate Requests",
      subtitle: "Barangay Clearance",
      icon: "description",
      route: "/appointments-enhanced",
    },
    {
      id: 2,
      title: "Appointments",
      subtitle: "Schedule Visit",
      icon: "event",
      route: "/appointments-enhanced",
    },
    {
      id: 3,
      title: "Clearance Applications",
      subtitle: "Business Permit",
      icon: "business",
      route: "/appointments-enhanced",
    },
    {
      id: 4,
      title: "Document Status",
      subtitle: "Track Progress",
      icon: "track-changes",
      route: "/appointments-enhanced",
    },
  ];

  const quickActions: QuickAction[] = [
    {
      id: 1,
      title: "Book Service Appointment",
      description: "Schedule your visit to the barangay office",
      icon: "calendar-today",
      route: "/appointments-enhanced",
    },
    {
      id: 2,
      title: "Request Certificate",
      description: "Apply for barangay clearance and other documents",
      icon: "description",
      route: "/appointments-enhanced",
    },
    {
      id: 3,
      title: "Emergency Report",
      description: "Report emergencies or incidents in your area",
      icon: "report-problem",
      route: "/appointments-enhanced",
    },
  ];

  const emergencyContacts: EmergencyContact[] = [
    {
      id: 1,
      name: "Barangay Emergency Hotline",
      phone: "911",
      icon: "emergency",
    },
    {
      id: 2,
      name: "Barangay Captain",
      phone: "+63 912 345 6789",
      icon: "person",
    },
    {
      id: 3,
      name: "Health Center",
      phone: "+63 912 345 6790",
      icon: "local-hospital",
    },
  ];

  const recentActivities: RecentActivity[] = [
    {
      id: 1,
      title: "Barangay Clearance Application",
      status: "approved",
      date: "2025-09-01T09:00:00Z",
      type: "certificate",
    },
    {
      id: 2,
      title: "Business Permit Application",
      status: "pending",
      date: "2025-08-30T14:00:00Z",
      type: "permit",
    },
    {
      id: 3,
      title: "Health Certificate Request",
      status: "in_progress",
      date: "2025-08-28T11:30:00Z",
      type: "certificate",
    },
  ];

  const weatherData: WeatherData = {
    temperature: 28,
    condition: "partly_cloudy",
    humidity: 65,
    windSpeed: 12,
    location: "San Jose",
  };

  useEffect(() => {
    const loadAnnouncements = async () => {
      try {
        const fetchedAnnouncements = await getAnnouncements();
        setAnnouncements(fetchedAnnouncements);
      } catch (error: any) {
        Alert.alert('Error', error.message);
      } finally {
        setLoading(false);
      }
    };
    loadAnnouncements();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const fetchedAnnouncements = await getAnnouncements();
      setAnnouncements(fetchedAnnouncements);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setRefreshing(false);
    }
  };

  const toggleBookmark = (announcementId: string) => {
    setAnnouncements(prev => 
      prev.map(announcement => 
        announcement.id === announcementId 
          ? { ...announcement, isBookmarked: !announcement.isBookmarked }
          : announcement
      )
    );
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 17) return 'Afternoon';
    return 'Evening';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#28a745';
      case 'pending': return '#ffa500';
      case 'in_progress': return '#007bff';
      case 'rejected': return '#dc3545';
      default: return colors.icon;
    }
  };

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'sunny': return 'wb-sunny';
      case 'partly_cloudy': return 'wb-cloudy';
      case 'cloudy': return 'cloud';
      case 'rainy': return 'grain';
      default: return 'wb-sunny';
    }
  };

  const callEmergencyContact = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header Section */}
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.profileContainer}>
              <View style={[styles.profileImage, { borderColor: colors.tint }]}>
                <IconSymbol name="person" size={24} color={colors.icon} />
              </View>
            </TouchableOpacity>
            
            <View style={styles.greetingContainer}>
              <Text style={[styles.greeting, { color: colors.icon }]}>
                Good {getGreeting()}!
              </Text>
              <Text style={[styles.userName, { color: colors.text }]}>
                {user?.displayName || 'User'}
              </Text>
            </View>

            <TouchableOpacity 
              style={[styles.headerButton, { backgroundColor: colors.background }]}
              onPress={() => setShowSearchDialog(true)}
            >
              <IconSymbol name="search" size={20} color={colors.icon} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.headerButton, { backgroundColor: colors.background }]}
              onPress={() => Alert.alert('Notifications', 'Notifications feature coming soon')}
            >
              <IconSymbol name="notifications" size={20} color={colors.icon} />
              {notificationCount > 0 && (
                <View style={[styles.badge, { backgroundColor: '#dc3545' }]}>
                  <Text style={styles.badgeText}>
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Weather Widget */}
        <Card style={[styles.weatherCard, { backgroundColor: colors.background }]}>
          <Card.Content style={styles.weatherContent}>
            <View style={styles.weatherInfo}>
              <IconSymbol name={getWeatherIcon(weatherData.condition)} size={32} color={colors.tint} />
              <View style={styles.weatherDetails}>
                <Text style={[styles.temperature, { color: colors.text }]}>
                  {weatherData.temperature}°C
                </Text>
                <Text style={[styles.location, { color: colors.icon }]}>
                  {weatherData.location}
                </Text>
              </View>
            </View>
            <View style={styles.weatherStats}>
              <Text style={[styles.weatherStat, { color: colors.icon }]}>
                Humidity: {weatherData.humidity}%
              </Text>
              <Text style={[styles.weatherStat, { color: colors.icon }]}>
                Wind: {weatherData.windSpeed} km/h
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Quick Services Grid */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Services</Text>
          <View style={styles.servicesGrid}>
            {serviceShortcuts.map((service) => (
              <TouchableOpacity
                key={service.id}
                style={[styles.serviceCard, { backgroundColor: colors.background }]}
                onPress={() => Alert.alert('Service', `Navigate to ${service.title}`)}
                onLongPress={() => {
                  setSelectedService(service);
                  setShowServiceMenu(true);
                }}
              >
                <IconSymbol name={service.icon} size={32} color={colors.tint} />
                <Text style={[styles.serviceTitle, { color: colors.text }]}>
                  {service.title}
                </Text>
                <Text style={[styles.serviceSubtitle, { color: colors.icon }]}>
                  {service.subtitle}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={[styles.actionCard, { backgroundColor: colors.background }]}
              onPress={() => Alert.alert('Action', `Navigate to ${action.title}`)}
            >
              <View style={styles.actionContent}>
                <IconSymbol name={action.icon} size={24} color={colors.tint} />
                <View style={styles.actionText}>
                  <Text style={[styles.actionTitle, { color: colors.text }]}>
                    {action.title}
                  </Text>
                  <Text style={[styles.actionDescription, { color: colors.icon }]}>
                    {action.description}
                  </Text>
                </View>
                <IconSymbol name="chevron-right" size={20} color={colors.icon} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Emergency Contacts */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Emergency Contacts</Text>
          <View style={styles.emergencyGrid}>
            {emergencyContacts.map((contact) => (
              <TouchableOpacity
                key={contact.id}
                style={[styles.emergencyCard, { backgroundColor: colors.background }]}
                onPress={() => callEmergencyContact(contact.phone)}
              >
                <IconSymbol name={contact.icon} size={24} color={colors.tint} />
                <Text style={[styles.emergencyName, { color: colors.text }]}>
                  {contact.name}
                </Text>
                <Text style={[styles.emergencyPhone, { color: colors.icon }]}>
                  {contact.phone}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activity</Text>
          {recentActivities.map((activity) => (
            <View key={activity.id} style={[styles.activityCard, { backgroundColor: colors.background }]}>
              <View style={styles.activityContent}>
                <View style={styles.activityInfo}>
                  <Text style={[styles.activityTitle, { color: colors.text }]}>
                    {activity.title}
                  </Text>
                  <Text style={[styles.activityDate, { color: colors.icon }]}>
                    {new Date(activity.date).toLocaleDateString()}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(activity.status) }]}>
                  <Text style={styles.statusText}>
                    {activity.status.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Community Announcements */}
        <View style={styles.section}>
          <View style={styles.announcementHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Community Announcements
            </Text>
            <TouchableOpacity onPress={() => Alert.alert('View All', 'View all announcements')}>
              <Text style={[styles.viewAllText, { color: colors.tint }]}>View All</Text>
            </TouchableOpacity>
          </View>
          
      {announcements.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.icon }]}>
              No announcements posted yet.
            </Text>
          ) : (
            announcements.map((announcement) => (
              <Card key={announcement.id} style={[styles.announcementCard, { backgroundColor: colors.background }]}>
              <Card.Content>
                  <View style={styles.announcementHeader}>
                    <Title style={[styles.announcementTitle, { color: colors.text }]}>
                      {announcement.title}
                    </Title>
                    <TouchableOpacity onPress={() => toggleBookmark(announcement.id!)}>
                      <IconSymbol 
                        name={announcement.isBookmarked ? "bookmark" : "bookmark-border"} 
                        size={20} 
                        color={colors.tint} 
                      />
                    </TouchableOpacity>
                  </View>
                  <Paragraph style={[styles.announcementContent, { color: colors.text }]}>
                    {announcement.content}
                  </Paragraph>
                  <Text style={[styles.announcementDate, { color: colors.icon }]}>
                    Posted by: {announcement.postedBy} on {new Date(announcement.date).toLocaleDateString()}
                  </Text>
              </Card.Content>
            </Card>
            ))
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        style={[styles.fab, { backgroundColor: colors.tint }]}
        icon="add"
        label="Book Service"
        onPress={() => Alert.alert('Book Service', 'Navigate to appointment booking')}
      />

      {/* Search Dialog */}
      <Portal>
        <Dialog visible={showSearchDialog} onDismiss={() => setShowSearchDialog(false)}>
          <Dialog.Title>Search</Dialog.Title>
          <Dialog.Content>
            <TextInput
              placeholder="Search announcements and services..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowSearchDialog(false)}>Cancel</Button>
            <Button onPress={() => {
              setShowSearchDialog(false);
              Alert.alert('Search', `Searching for: ${searchQuery}`);
            }}>Search</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Service Menu Dialog */}
      <Portal>
        <Dialog visible={showServiceMenu} onDismiss={() => setShowServiceMenu(false)}>
          <Dialog.Title>{selectedService?.title}</Dialog.Title>
          <Dialog.Content>
            <TouchableOpacity style={styles.menuItem} onPress={() => setShowServiceMenu(false)}>
              <IconSymbol name="schedule" size={24} color={colors.tint} />
              <Text style={[styles.menuText, { color: colors.text }]}>Schedule Appointment</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => setShowServiceMenu(false)}>
              <IconSymbol name="info" size={24} color={colors.tint} />
              <Text style={[styles.menuText, { color: colors.text }]}>Service Information</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => setShowServiceMenu(false)}>
              <IconSymbol name="help" size={24} color={colors.tint} />
              <Text style={[styles.menuText, { color: colors.text }]}>Requirements</Text>
            </TouchableOpacity>
          </Dialog.Content>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
  },
  scrollView: {
    flex: 1,
  },
  
  // Header
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileContainer: {
    marginRight: 12,
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 12,
    opacity: 0.8,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    elevation: 1,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  
  // Weather Card
  weatherCard: {
    margin: 16,
    elevation: 3,
    borderRadius: 12,
  },
  weatherContent: {
    padding: 16,
  },
  weatherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  weatherDetails: {
    marginLeft: 12,
  },
  temperature: {
    fontSize: 24,
    fontWeight: '600',
  },
  location: {
    fontSize: 14,
    opacity: 0.8,
  },
  weatherStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weatherStat: {
    fontSize: 12,
  },
  
  // Sections
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  
  // Services Grid
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceCard: {
    width: (width - 48) / 2,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  serviceSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.8,
  },
  
  // Quick Actions
  actionCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 2,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    flex: 1,
    marginLeft: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    opacity: 0.8,
  },
  
  // Emergency Contacts
  emergencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  emergencyCard: {
    width: (width - 48) / 3,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
    elevation: 1,
  },
  emergencyName: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  emergencyPhone: {
    fontSize: 10,
    textAlign: 'center',
    opacity: 0.8,
  },
  
  // Recent Activity
  activityCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 1,
  },
  activityContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  activityDate: {
    fontSize: 12,
    opacity: 0.8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  
  // Announcements
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
    fontStyle: 'italic',
    marginVertical: 20,
  },
  announcementCard: {
    marginBottom: 12,
    elevation: 2,
    borderRadius: 8,
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  announcementContent: {
    fontSize: 14,
    marginBottom: 8,
  },
  announcementDate: {
    fontSize: 12,
    opacity: 0.8,
  },
  
  // FAB
  fab: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
  
  // Dialogs
  searchInput: {
    marginTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  menuText: {
    marginLeft: 12,
    fontSize: 16,
  },
});
