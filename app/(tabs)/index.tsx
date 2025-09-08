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
  const [activeTab, setActiveTab] = useState(0); // 0 for Dashboard, 1 for Community Announcements

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
    if (hour >= 8 && hour < 12) return 'Morning';
    if (hour <= 17 && hour >= 12) return 'Afternoon';
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

  const callEmergencyContact = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return '#dc3545';
      case 'medium': return '#ffa500';
      default: return '#28a745';
    }
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

      {/* Tab Navigation */}
      <View style={[styles.tabContainer, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 0 && styles.activeTab]}
          onPress={() => setActiveTab(0)}
        >
          <IconSymbol name="dashboard" size={20} color={activeTab === 0 ? colors.tint : colors.icon} />
          <Text style={[styles.tabText, { color: activeTab === 0 ? colors.tint : colors.icon }]}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 1 && styles.activeTab]}
          onPress={() => setActiveTab(1)}
        >
          <IconSymbol name="campaign" size={20} color={activeTab === 1 ? colors.tint : colors.icon} />
          <Text style={[styles.tabText, { color: activeTab === 1 ? colors.tint : colors.icon }]}>Announcements</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {activeTab === 0 ? (
          // Dashboard Tab
          <>
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
          </>
        ) : (
          // Community Announcements Tab
          <View style={styles.announcementsContainer}>
            {/* Filter and Sort Options */}
            <View style={styles.filterContainer}>
              <TouchableOpacity style={[styles.filterButton, { borderColor: colors.tint }]}>
                <IconSymbol name="filter-list" size={18} color={colors.tint} />
                <Text style={[styles.filterText, { color: colors.tint }]}>Filter</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.filterButton, { borderColor: colors.tint }]}>
                <IconSymbol name="sort" size={18} color={colors.tint} />
                <Text style={[styles.filterText, { color: colors.tint }]}>Sort</Text>
              </TouchableOpacity>
            </View>

            {announcements.length === 0 ? (
              <Card style={[styles.emptyCard, { backgroundColor: colors.background }]}>
                <Card.Content style={styles.emptyContent}>
                  <IconSymbol name="campaign" size={48} color={colors.icon} />
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>
                    No Announcements Yet
                  </Text>
                  <Text style={[styles.emptyDescription, { color: colors.icon }]}>
                    Community announcements will appear here when posted by barangay officials
                  </Text>
                </Card.Content>
              </Card>
            ) : (
              announcements.map((announcement) => (
                <Card key={announcement.id} style={[styles.announcementCard, { backgroundColor: colors.background }]}>
                  <Card.Content>
                    <View style={styles.announcementHeader}>
                      <View style={styles.announcementTitleRow}>
                        {announcement.priority && (
                          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(announcement.priority) + '20' }]}>
                            <Text style={[styles.priorityText, { color: getPriorityColor(announcement.priority) }]}>
                              {announcement.priority.toUpperCase()}
                            </Text>
                          </View>
                        )}
                        <TouchableOpacity onPress={() => toggleBookmark(announcement.id!)}>
                          <IconSymbol 
                            name={announcement.isBookmarked ? "bookmark" : "bookmark-border"} 
                            size={22} 
                            color={colors.tint} 
                          />
                        </TouchableOpacity>
                      </View>
                      <Title style={[styles.announcementTitle, { color: colors.text }]}>
                        {announcement.title}
                      </Title>
                    </View>
                    
                    {announcement.category && (
                      <View style={[styles.categoryBadge, { backgroundColor: colors.tint + '15' }]}>
                        <Text style={[styles.categoryText, { color: colors.tint }]}>
                          {announcement.category}
                        </Text>
                      </View>
                    )}
                    
                    <Paragraph style={[styles.announcementContent, { color: colors.text }]}>
                      {announcement.content}
                    </Paragraph>
                    
                    <View style={styles.announcementFooter}>
                      <View style={styles.announcementMeta}>
                        <IconSymbol name="person" size={14} color={colors.icon} />
                        <Text style={[styles.announcementMetaText, { color: colors.icon }]}>
                          {announcement.postedBy}
                        </Text>
                      </View>
                      <View style={styles.announcementMeta}>
                        <IconSymbol name="calendar-today" size={14} color={colors.icon} />
                        <Text style={[styles.announcementMetaText, { color: colors.icon }]}>
                          {new Date(announcement.date).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.announcementActions}>
                      <TouchableOpacity style={[styles.actionButton, { borderColor: colors.tint }]}>
                        <IconSymbol name="share" size={16} color={colors.tint} />
                        <Text style={[styles.actionButtonText, { color: colors.tint }]}>Share</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.actionButton, { borderColor: colors.tint }]}>
                        <IconSymbol name="visibility" size={16} color={colors.tint} />
                        <Text style={[styles.actionButtonText, { color: colors.tint }]}>View Details</Text>
                      </TouchableOpacity>
                    </View>
                  </Card.Content>
                </Card>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        style={[styles.fab, { backgroundColor: colors.tint }]}
        icon={activeTab === 0 ? "add" : "campaign"}
        label={activeTab === 0 ? "Book Service" : "Filter"}
        onPress={() => {
          if (activeTab === 0) {
            Alert.alert('Book Service', 'Navigate to appointment booking');
          } else {
            Alert.alert('Filter', 'Filter announcements');
          }
        }}
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
  
  // Tab Navigation
  tabContainer: {
    flexDirection: 'row',
    elevation: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
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
    marginTop: 20,
    marginBottom: 20,
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
  
  // Announcements tab extras
  announcementsContainer: {
    padding: 16,
    gap: 12,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 20,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyCard: {
    elevation: 2,
    borderRadius: 12,
  },
  emptyContent: {
    alignItems: 'center',
    padding: 20,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyDescription: {
    fontSize: 13,
    textAlign: 'center',
  },
  announcementTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  announcementFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  announcementMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  announcementMetaText: {
    fontSize: 12,
  },
  announcementActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
