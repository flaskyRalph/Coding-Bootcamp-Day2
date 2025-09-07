import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../lib/AuthContext';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { userRole, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (userRole !== 'admin') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Access Denied</Text>
        <Text style={styles.message}>You do not have permission to view this page.</Text>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  message: { color: '#666', textAlign: 'center' },
});


