import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button, Card, Dialog, Divider, List, Portal, Switch, TextInput, Title } from 'react-native-paper';
import { useAuth } from '../../lib/AuthContext';
import { auth } from '../../lib/firebase';
import { uploadFile } from '../../lib/Storage';
import { fetchUserProfile, updateUserProfile } from '../../lib/User';

const { width } = Dimensions.get('window');

interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

interface Document {
  type: string;
  status: 'verified' | 'pending' | 'rejected';
  expiryDate: string;
  uploadDate: string;
}

const ProfileScreen = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { logout } = useAuth();
  
  // Profile data
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [contact, setContact] = useState('');
  const [address, setAddress] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [civilStatus, setCivilStatus] = useState('');
  const [occupation, setOccupation] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [validIdImage, setValidIdImage] = useState<string | null>(null);
  const [validIdUploading, setValidIdUploading] = useState(false);
  
  // Emergency contacts
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  
  // Documents
  const [documents, setDocuments] = useState<Document[]>([]);
  
  // Settings
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [selectedTheme, setSelectedTheme] = useState('Light');
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [showEmergencyDialog, setShowEmergencyDialog] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (auth.currentUser) {
        try {
          const profile = await fetchUserProfile(auth.currentUser.uid);
          if (profile) {
            setName(profile.name || '');
            setEmail(profile.email || '');
            setContact(profile.contact || '');
            setAddress((profile as any).address || '');
            setDateOfBirth((profile as any).dateOfBirth || '');
            setCivilStatus((profile as any).civilStatus || '');
            setOccupation((profile as any).occupation || '');
            setProfileImage((profile as any).profileImage || null);
            setIsVerified((profile as any).isVerified || false);
            setValidIdImage((profile as any).validIdImage || null);
          }
        } catch (error) {
          console.error('Error loading profile:', error);
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
          email,
          contact,
          address,
          dateOfBirth,
          civilStatus,
          occupation,
          profileImage,
        } as any);
        Alert.alert('Success', 'Profile updated successfully!');
      } catch (error: any) {
        Alert.alert('Error', error.message);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setShowLogoutDialog(false);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
      setShowPhotoOptions(false);
    }
  };

  const pickValidId = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 2],
      quality: 0.8,
    });
    if (!result.canceled) {
      setValidIdImage(result.assets[0].uri);
    }
  };

  const uploadValidId = async () => {
    if (!auth.currentUser || !validIdImage) {
      Alert.alert('Error', 'Please select a Valid ID image first.');
      return;
    }
    try {
      setValidIdUploading(true);
      const path = `valid_ids/${auth.currentUser.uid}/${Date.now()}.jpg`;
      const url = await uploadFile(validIdImage, path);
      await updateUserProfile(auth.currentUser.uid, { validIdImage: url } as any);
      setValidIdImage(url);
      Alert.alert('Success', 'Valid ID uploaded successfully');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to upload Valid ID');
    } finally {
      setValidIdUploading(false);
    }
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
      setShowPhotoOptions(false);
    }
  };

  const exportData = async () => {
    try {
      const userData = {
        'Personal Information': {
          'Full Name': name,
          'Email': email,
          'Phone': contact,
          'Address': address,
          'Date of Birth': dateOfBirth,
          'Civil Status': civilStatus,
          'Occupation': occupation,
        },
        'Emergency Contacts': emergencyContacts,
        'Documents': documents,
        'Export Date': new Date().toISOString(),
      };

      const jsonString = JSON.stringify(userData, null, 2);
      const fileName = `profile_data_${Date.now()}.json`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      await FileSystem.writeAsStringAsync(fileUri, jsonString);
      // Note: Sharing functionality would need expo-sharing package
      Alert.alert('Success', 'Profile data exported successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to export data');
    }
  };

  const addEmergencyContact = () => {
    setEditingContact(null);
    setShowEmergencyDialog(true);
  };

  const editEmergencyContact = (contact: EmergencyContact) => {
    setEditingContact(contact);
    setShowEmergencyDialog(true);
  };

  const deleteEmergencyContact = (index: number) => {
    Alert.alert(
      'Delete Contact',
      'Are you sure you want to delete this emergency contact?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setEmergencyContacts(prev => prev.filter((_, i) => i !== index));
          },
        },
      ]
    );
  };

  const callEmergencyContact = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <Title style={[styles.headerTitle, { color: colors.text }]}>Profile</Title>
        <TouchableOpacity style={styles.settingsButton}>
          <IconSymbol name="settings" size={24} color={colors.tint} />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={[styles.tabContainer, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 0 && styles.activeTab]}
          onPress={() => setActiveTab(0)}
        >
          <IconSymbol name="person" size={20} color={activeTab === 0 ? colors.tint : colors.icon} />
          <Text style={[styles.tabText, { color: activeTab === 0 ? colors.tint : colors.icon }]}>Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 1 && styles.activeTab]}
          onPress={() => setActiveTab(1)}
        >
          <IconSymbol name="settings" size={20} color={activeTab === 1 ? colors.tint : colors.icon} />
          <Text style={[styles.tabText, { color: activeTab === 1 ? colors.tint : colors.icon }]}>Settings</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {activeTab === 0 ? (
          // Profile Tab
          <>
            {/* Profile Header */}
            <Card style={styles.profileCard}>
              <Card.Content style={styles.profileHeader}>
                <TouchableOpacity onPress={() => setShowPhotoOptions(true)}>
                  <View style={[styles.profileImageContainer, { borderColor: colors.tint }]}>
                    {profileImage ? (
                      <Image
                        source={{ uri: profileImage }}
                        style={styles.profileImage}
                      />
                    ) : (
                      <IconSymbol name="person" size={40} color={colors.icon} />
                    )}
                    <View style={[styles.editIcon, { backgroundColor: colors.tint }]}>
                      <IconSymbol name="camera-alt" size={16} color="#fff" />
                    </View>
                  </View>
                </TouchableOpacity>
                <View style={styles.profileInfo}>
                  <Title style={[styles.profileName, { color: colors.text }]}>{name}</Title>
                  <View style={styles.verificationBadge}>
                    <IconSymbol 
                      name={isVerified ? "check-circle" : "pending"} 
                      size={16} 
                      color={isVerified ? "#28a745" : "#ffa500"} 
                    />
                    <Text style={[styles.verificationText, { color: isVerified ? "#28a745" : "#ffa500" }]}>
                      {isVerified ? "Verified" : "Pending Verification"}
                    </Text>
                  </View>
                </View>
              </Card.Content>
            </Card>

            {/* Personal Information */}
            <Card style={styles.card}>
              <Card.Content>
                <Title style={[styles.sectionTitle, { color: colors.text }]}>Personal Information</Title>
                
                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Full Name</Text>
                  <TextInput
                    style={[styles.textInput, { borderColor: colors.icon, color: colors.text }]}
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter your full name"
                    placeholderTextColor={colors.icon}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Email Address</Text>
                  <TextInput
                    style={[styles.textInput, { borderColor: colors.icon, color: colors.text }]}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your email"
                    placeholderTextColor={colors.icon}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Phone Number</Text>
                  <TextInput
                    style={[styles.textInput, { borderColor: colors.icon, color: colors.text }]}
                    value={contact}
                    onChangeText={setContact}
                    placeholder="Enter your phone number"
                    placeholderTextColor={colors.icon}
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Address</Text>
                  <TextInput
                    style={[styles.textInput, styles.multilineInput, { borderColor: colors.icon, color: colors.text }]}
                    value={address}
                    onChangeText={setAddress}
                    placeholder="Enter your address"
                    placeholderTextColor={colors.icon}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Date of Birth</Text>
                  <TextInput
                    style={[styles.textInput, { borderColor: colors.icon, color: colors.text }]}
                    value={dateOfBirth}
                    onChangeText={setDateOfBirth}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.icon}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Civil Status</Text>
                  <TextInput
                    style={[styles.textInput, { borderColor: colors.icon, color: colors.text }]}
                    value={civilStatus}
                    onChangeText={setCivilStatus}
                    placeholder="e.g., Single, Married, Widowed"
                    placeholderTextColor={colors.icon}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Occupation</Text>
                  <TextInput
                    style={[styles.textInput, { borderColor: colors.icon, color: colors.text }]}
                    value={occupation}
                    onChangeText={setOccupation}
                    placeholder="Enter your occupation"
                    placeholderTextColor={colors.icon}
                  />
                </View>

                <Button mode="contained" onPress={handleUpdateProfile} style={styles.updateButton}>
                  Update Profile
                </Button>
              </Card.Content>
            </Card>

            {/* Valid ID */}
            <Card style={styles.card}>
              <Card.Content>
                <Title style={[styles.sectionTitle, { color: colors.text }]}>Valid ID</Title>
                {validIdImage ? (
                  <View style={styles.validIdPreview}>
                    <Image source={{ uri: validIdImage }} style={styles.validIdImage} />
                  </View>
                ) : (
                  <Text style={[styles.emptyText, { color: colors.icon }]}>No Valid ID uploaded</Text>
                )}
                <View style={styles.validIdActions}>
                  <TouchableOpacity onPress={pickValidId} style={[styles.validIdButton, { borderColor: colors.tint }]}>
                    <IconSymbol name="photo-library" size={18} color={colors.tint} />
                    <Text style={[styles.validIdButtonText, { color: colors.tint }]}>Choose Image</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={uploadValidId} disabled={!validIdImage || validIdUploading} style={[styles.validIdUpload, { backgroundColor: '#007AFF', opacity: !validIdImage || validIdUploading ? 0.6 : 1 }]}>
                    <Text style={styles.validIdUploadText}>{validIdUploading ? 'Uploading...' : 'Upload'}</Text>
                  </TouchableOpacity>
                </View>
              </Card.Content>
            </Card>

            {/* Emergency Contacts */}
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.sectionHeader}>
                  <Title style={[styles.sectionTitle, { color: colors.text }]}>Emergency Contacts</Title>
                  <TouchableOpacity onPress={addEmergencyContact} style={styles.addButton}>
                    <IconSymbol name="add" size={20} color={colors.tint} />
                  </TouchableOpacity>
                </View>
                
                {emergencyContacts.length === 0 ? (
                  <Text style={[styles.emptyText, { color: colors.icon }]}>No emergency contacts added</Text>
                ) : (
                  emergencyContacts.map((contact, index) => (
                    <View key={index} style={styles.contactItem}>
                      <View style={styles.contactInfo}>
                        <Text style={[styles.contactName, { color: colors.text }]}>{contact.name}</Text>
                        <Text style={[styles.contactRelationship, { color: colors.icon }]}>{contact.relationship}</Text>
                        <Text style={[styles.contactPhone, { color: colors.text }]}>{contact.phone}</Text>
                      </View>
                      <View style={styles.contactActions}>
                        <TouchableOpacity onPress={() => callEmergencyContact(contact.phone)}>
                          <IconSymbol name="phone" size={20} color={colors.tint} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => editEmergencyContact(contact)}>
                          <IconSymbol name="edit" size={20} color={colors.icon} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => deleteEmergencyContact(index)}>
                          <IconSymbol name="delete" size={20} color="#dc3545" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </Card.Content>
            </Card>
          </>
        ) : (
          // Settings Tab
          <>
            {/* Notifications */}
            <Card style={styles.card}>
              <Card.Content>
                <Title style={[styles.sectionTitle, { color: colors.text }]}>Notifications</Title>
                <List.Item
                  title="Push Notifications"
                  description="Receive appointment reminders and updates"
                  left={() => <IconSymbol name="notifications" size={24} color={colors.icon} />}
                  right={() => (
                    <Switch
                      value={notificationsEnabled}
                      onValueChange={setNotificationsEnabled}
                    />
                  )}
                />
              </Card.Content>
            </Card>

            {/* Preferences */}
            <Card style={styles.card}>
              <Card.Content>
                <Title style={[styles.sectionTitle, { color: colors.text }]}>Preferences</Title>
                <List.Item
                  title="Language"
                  description={selectedLanguage}
                  left={() => <IconSymbol name="language" size={24} color={colors.icon} />}
                  right={() => <IconSymbol name="chevron-right" size={20} color={colors.icon} />}
                  onPress={() => {
                    Alert.alert('Language', 'Language selection not implemented');
                  }}
                />
                <Divider />
                <List.Item
                  title="Theme"
                  description={selectedTheme}
                  left={() => <IconSymbol name="palette" size={24} color={colors.icon} />}
                  right={() => <IconSymbol name="chevron-right" size={20} color={colors.icon} />}
                  onPress={() => {
                    Alert.alert('Theme', 'Theme selection not implemented');
                  }}
                />
              </Card.Content>
            </Card>

            {/* Security */}
            <Card style={styles.card}>
              <Card.Content>
                <Title style={[styles.sectionTitle, { color: colors.text }]}>Security</Title>
                <List.Item
                  title="Biometric Authentication"
                  description="Use fingerprint or face recognition"
                  left={() => <IconSymbol name="fingerprint" size={24} color={colors.icon} />}
                  right={() => (
                    <Switch
                      value={biometricEnabled}
                      onValueChange={setBiometricEnabled}
                    />
                  )}
                />
                <Divider />
                <List.Item
                  title="Change Password"
                  description="Update your account password"
                  left={() => <IconSymbol name="lock" size={24} color={colors.icon} />}
                  right={() => <IconSymbol name="chevron-right" size={20} color={colors.icon} />}
                  onPress={() => {
                    Alert.alert('Change Password', 'Password change not implemented');
                  }}
                />
              </Card.Content>
            </Card>

            {/* Data & Privacy */}
            <Card style={styles.card}>
              <Card.Content>
                <Title style={[styles.sectionTitle, { color: colors.text }]}>Data & Privacy</Title>
                <List.Item
                  title="Export Data"
                  description="Download your personal information"
                  left={() => <IconSymbol name="download" size={24} color={colors.icon} />}
                  right={() => <IconSymbol name="chevron-right" size={20} color={colors.icon} />}
                  onPress={exportData}
                />
                <Divider />
                <List.Item
                  title="Privacy Policy"
                  description="View our privacy policy"
                  left={() => <IconSymbol name="privacy-tip" size={24} color={colors.icon} />}
                  right={() => <IconSymbol name="chevron-right" size={20} color={colors.icon} />}
                  onPress={() => {
                    Alert.alert('Privacy Policy', 'Privacy policy not implemented');
                  }}
                />
              </Card.Content>
            </Card>

            {/* Sign Out */}
            <TouchableOpacity
              style={[styles.signOutButton, { backgroundColor: '#dc3545' }]}
              onPress={() => setShowLogoutDialog(true)}
            >
              <IconSymbol name="logout" size={20} color="#fff" />
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Photo Options Modal */}
      <Portal>
        <Dialog visible={showPhotoOptions} onDismiss={() => setShowPhotoOptions(false)}>
          <Dialog.Title>Update Profile Photo</Dialog.Title>
          <Dialog.Content>
            <View style={styles.photoOptions}>
              <TouchableOpacity style={styles.photoOption} onPress={takePhoto}>
                <View style={[styles.photoOptionIcon, { backgroundColor: colors.tint + '20' }]}>
                  <IconSymbol name="camera-alt" size={32} color={colors.tint} />
                </View>
                <Text style={[styles.photoOptionText, { color: colors.text }]}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.photoOption} onPress={pickImage}>
                <View style={[styles.photoOptionIcon, { backgroundColor: colors.tint + '20' }]}>
                  <IconSymbol name="photo-library" size={32} color={colors.tint} />
                </View>
                <Text style={[styles.photoOptionText, { color: colors.text }]}>Gallery</Text>
              </TouchableOpacity>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowPhotoOptions(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Logout Confirmation */}
      <Portal>
        <Dialog visible={showLogoutDialog} onDismiss={() => setShowLogoutDialog(false)}>
          <Dialog.Title>Sign Out</Dialog.Title>
          <Dialog.Content>
            <Text style={[styles.dialogText, { color: colors.text }]}>
              Are you sure you want to sign out of your account?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowLogoutDialog(false)}>Cancel</Button>
            <Button mode="contained" onPress={handleLogout} style={{ backgroundColor: '#dc3545' }}>
              Sign Out
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

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
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  settingsButton: {
    padding: 8,
  },
  
  // Tab Navigation
  tabContainer: {
    flexDirection: 'row',
    elevation: 1,
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
    borderBottomColor: '#007bff',
  },
  tabText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  
  // Profile Card
  profileCard: {
    marginBottom: 16,
    elevation: 3,
    borderRadius: 12,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  profileImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    position: 'relative',
  },
  profileImage: {
    width: 74,
    height: 74,
    borderRadius: 37,
  },
  editIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verificationText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '500',
  },
  
  // Cards
  card: {
    marginBottom: 16,
    elevation: 3,
    borderRadius: 12,
  },
  
  // Section Titles
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addButton: {
    padding: 8,
  },
  
  // Form Inputs
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'transparent',
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  updateButton: {
    marginTop: 16,
  },
  
  // Emergency Contacts
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
    fontStyle: 'italic',
    marginVertical: 20,
  },
  validIdPreview: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    marginBottom: 12,
  },
  validIdImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  validIdActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  validIdButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  validIdButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  validIdUpload: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  validIdUploadText: {
    color: '#fff',
    fontWeight: '700',
  },
  contactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  contactRelationship: {
    fontSize: 12,
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 14,
  },
  contactActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  // Settings
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    marginHorizontal: 16,
  },
  signOutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  
  // Photo Options
  photoOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
  },
  photoOption: {
    alignItems: 'center',
  },
  photoOptionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  photoOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Dialog
  dialogText: {
    fontSize: 16,
    lineHeight: 24,
  },
});

export default ProfileScreen;
