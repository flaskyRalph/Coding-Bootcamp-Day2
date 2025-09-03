import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Button, TextInput } from 'react-native-paper';
import { logoutUser } from '../../app/lib/Auth'; // Import logoutUser
import { auth } from '../../app/lib/firebase'; // Adjust path as needed
import { fetchUserProfile, updateUserProfile } from '../../app/lib/User'; // Adjust path as needed

const ProfileScreen = () => {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [purok, setPurok] = useState('');
  const [householdInfo, setHouseholdInfo] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      if (auth.currentUser) {
        const profile = await fetchUserProfile(auth.currentUser.uid);
        if (profile) {
          setName(profile.name || '');
          setContact(profile.contact || '');
          setPurok(profile.purok || '');
          setHouseholdInfo(profile.householdInfo || '');
        }
      }
      setLoading(false);
    };
    loadProfile();
  }, []);

  const handleUpdateProfile = async () => {
    if (auth.currentUser) {
      try {
        await updateUserProfile(auth.currentUser.uid, {
          name,
          contact,
          purok,
          householdInfo,
        });
        Alert.alert('Success', 'Profile updated successfully!');
      } catch (error: any) {
        Alert.alert('Error', error.message);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      Alert.alert('Logged Out', 'You have been successfully logged out.');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Profile</Text>
      <TextInput
        label="Name"
        value={name}
        onChangeText={setName}
        style={styles.input}
        mode="outlined"
      />
      <TextInput
        label="Contact"
        value={contact}
        onChangeText={setContact}
        keyboardType="phone-pad"
        style={styles.input}
        mode="outlined"
      />
      <TextInput
        label="Purok"
        value={purok}
        onChangeText={setPurok}
        style={styles.input}
        mode="outlined"
      />
      <TextInput
        label="Household Info"
        value={householdInfo}
        onChangeText={setHouseholdInfo}
        style={styles.input}
        mode="outlined"
      />
      <Button mode="contained" onPress={handleUpdateProfile} style={styles.button}>
        <Text>Update Profile</Text>
      </Button>
      <Button mode="outlined" onPress={handleLogout} style={[styles.button, { marginTop: 10 }]}>
        <Text>Logout</Text>
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: 'bold',
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

export default ProfileScreen;
