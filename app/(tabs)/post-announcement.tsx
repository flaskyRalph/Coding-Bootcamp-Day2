import React, { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { ActivityIndicator, Button, TextInput, Title } from 'react-native-paper';
import { createAnnouncement } from '../../lib/Announcements';
import { useAuth } from '../../lib/AuthContext';
import { auth } from '../../lib/firebase';

export default function PostAnnouncementScreen() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, userRole, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Only allow admins to use this screen
  if (!user || userRole !== 'admin') {
    return (
      <View style={styles.container}>
        <Title style={styles.title}>Post New Announcement</Title>
        <View style={styles.accessDenied}>
          <Text style={styles.accessText}>Access denied — you do not have permission to post announcements.</Text>
        </View>
      </View>
    );
  }

  const handlePostAnnouncement = async () => {
    if (!title || !content) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    if (!auth.currentUser) {
      Alert.alert('Error', 'You must be logged in to post an announcement.');
      return;
    }

    if (userRole !== 'admin') {
      Alert.alert('Unauthorized', 'Only administrators can post announcements.');
      return;
    }

    setLoading(true);
    try {
      await createAnnouncement({
        title,
        content,
        postedBy: auth.currentUser.email || 'Admin', // Use email or a default name
      });
      Alert.alert('Success', 'Announcement posted successfully!');
      setTitle('');
      setContent('');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Title style={styles.title}>Post New Announcement</Title>
      <TextInput
        label="Title"
        value={title}
        onChangeText={setTitle}
        style={styles.input}
        mode="outlined"
      />
      <TextInput
        label="Content"
        value={content}
        onChangeText={setContent}
        multiline
        numberOfLines={4}
        style={styles.input}
        mode="outlined"
      />
      <Button
        mode="contained"
        onPress={handlePostAnnouncement}
        loading={loading}
        disabled={loading}
        style={styles.button}
      >
        Post Announcement
      </Button>
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accessDenied: {
    marginTop: 24,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    elevation: 2,
  },
  accessText: {
    color: '#333',
    fontSize: 16,
    textAlign: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    color: '#333',
  },
  input: {
    width: '100%',
    marginBottom: 10,
  },
  button: {
    width: '100%',
    marginTop: 10,
  },
});
