import React, { useEffect, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, View } from "react-native";
import { Card, Paragraph, Title } from 'react-native-paper';
import { getAnnouncements } from '../../app/lib/Announcements';

interface Announcement {
  id?: string;
  title: string;
  content: string;
  date: string;
  postedBy: string;
}

export default function CommunityScreen() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading announcements...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Title style={styles.title}>Community Feed</Title>
      {announcements.length === 0 ? (
        <Paragraph>No announcements posted yet.</Paragraph>
      ) : (
        <FlatList
          data={announcements}
          keyExtractor={(item) => item.id!}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <Card.Content>
                <Title style={styles.cardTitle}>{item.title}</Title>
                <Paragraph style={styles.text}>{item.content}</Paragraph>
                <Paragraph style={styles.dateText}>Posted by: {item.postedBy} on {new Date(item.date).toLocaleDateString()}</Paragraph>
              </Card.Content>
            </Card>
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
  dateText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
});
