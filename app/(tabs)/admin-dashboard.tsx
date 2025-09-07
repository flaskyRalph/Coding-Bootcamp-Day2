import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Badge, Card, Paragraph, Title } from 'react-native-paper';
import AdminGuard from '../../components/AdminGuard';
import { useAuth } from '../../lib/AuthContext';
import { getAllBookings } from '../../lib/Bookings';

function AdminDashboard() {
  const router = useRouter();
  const { userRole } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  
  useEffect(() => {
    loadPendingCount();
  }, []);

  const loadPendingCount = async () => {
    try {
      const bookings = await getAllBookings();
      const pending = bookings.filter(b => b.status === 'pending').length;
      setPendingCount(pending);
    } catch (error) {
      console.error('Error loading pending count:', error);
    }
  };

  const adminModules = [
    {
      id: 'bookings',
      title: 'Manage Bookings',
      description: 'Approve or reject service requests',
      icon: '📋',
      screen: 'admin',
      badge: pendingCount,
    },
    {
      id: 'announcements',
      title: 'Post Announcement',
      description: 'Share news with the community',
      icon: '📢',
      screen: 'post-announcement',
    },
    {
      id: 'reports',
      title: 'Reports & Analytics',
      description: 'View service statistics',
      icon: '📊',
      screen: 'reports',
    },
    {
      id: 'residents',
      title: 'Resident Records',
      description: 'Manage resident information',
      icon: '👥',
      screen: 'resident-records',
    },
    {
      id: 'services',
      title: 'Service Management',
      description: 'Configure available services',
      icon: '⚙️',
      screen: 'service-management',
    },
    {
      id: 'payments',
      title: 'Payment Records',
      description: 'Track on-site payments',
      icon: '💰',
      screen: 'payment-records',
    },
  ];

  const handleModulePress = (screen: string) => {
    router.push((`/(tabs)/${screen}`) as any);
  };

  return (
    <AdminGuard>
      <ScrollView style={styles.container}>
        <Title style={styles.title}>Admin Dashboard</Title>
        <View style={styles.grid}>
          {adminModules.map((module) => (
            <TouchableOpacity 
              key={module.id} 
              style={styles.moduleCard}
              onPress={() => handleModulePress(module.screen)}
            >
              <Card style={styles.card}>
                <Card.Content>
                  <Text style={styles.icon}>{module.icon}</Text>
                  <Title style={styles.moduleTitle}>{module.title}</Title>
                  <Paragraph style={styles.description}>{module.description}</Paragraph>
                  {module.badge && module.badge > 0 && (
                    <Badge style={styles.badge}>{module.badge}</Badge>
                  )}
                </Card.Content>
              </Card>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </AdminGuard>
  );
}

export default AdminDashboard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    padding: 20,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    justifyContent: 'space-between',
  },
  moduleCard: {
    width: '48%',
    marginBottom: 15,
  },
  card: {
    elevation: 3,
    borderRadius: 12,
  },
  icon: {
    fontSize: 40,
    textAlign: 'center',
    marginBottom: 10,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  description: {
    fontSize: 12,
    textAlign: 'center',
    color: '#666',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ff4444',
  },
});
