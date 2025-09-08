import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Picker } from '@react-native-picker/picker';
import React, { useState } from 'react';
import { Alert, Dimensions, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator, Card, TextInput, Title } from 'react-native-paper';
import { loginUser, registerUser } from '../lib/Auth';
import { useAuth } from '../lib/AuthContext';

const { width } = Dimensions.get('window');

const LoginScreen = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [selectedRole, setSelectedRole] = useState('resident');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    console.log('Login button pressed!'); // Debug log
    console.log('Email:', email, 'Password:', password); // Debug log
    
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    // Password length validation
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    console.log('Starting login process...'); // Debug log

    // For testing purposes, add a simple fallback
    if (email === 'test@barangay.gov.ph' && password === 'test123') {
      console.log('Using test credentials - simulating successful login');
      setTimeout(() => {
        Alert.alert('Success', 'Test login successful! (This is a fallback for testing)');
        setIsLoading(false);
      }, 1000);
      return;
    }

    try {
      console.log('Calling loginUser...'); // Debug log
      await loginUser(email, password);
      console.log('Login successful!'); // Debug log
      // Success - AuthContext will handle navigation automatically
      Alert.alert('Success', 'Login successful!');
    } catch (error: any) {
      console.error('Login error:', error); // Debug log
      let errorMessage = 'Login failed. Please try again.';
      
      // Handle specific Firebase auth errors
      if (error.message.includes('user-not-found')) {
        errorMessage = 'No account found with this email address.';
      } else if (error.message.includes('wrong-password')) {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (error.message.includes('invalid-email')) {
        errorMessage = 'Invalid email address format.';
      } else if (error.message.includes('user-disabled')) {
        errorMessage = 'This account has been disabled.';
      } else if (error.message.includes('too-many-requests')) {
        errorMessage = 'Too many failed attempts. Please try again later.';
      } else if (error.message.includes('network-request-failed')) {
        errorMessage = 'Network error. Please check your internet connection.';
      }
      
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    console.log('Registration button pressed!'); // Debug log
    console.log('Registration data:', { email, name, contact, selectedRole }); // Debug log
    
    if (!email || !password || !name || !contact) {
      Alert.alert('Error', 'Please fill in all registration fields.');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    // Password length validation
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    // Name validation
    if (name.trim().length < 2) {
      Alert.alert('Error', 'Name must be at least 2 characters long');
      return;
    }

    // Contact validation (basic phone number check)
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(contact)) {
      Alert.alert('Error', 'Please enter a valid contact number');
      return;
    }
    
    setIsLoading(true);
    console.log('Starting registration process...'); // Debug log
    
    try {
      console.log('Calling registerUser...'); // Debug log
      const user = await registerUser(email, password, name, contact, '', '', selectedRole);
      console.log('Registration successful!', user.uid); // Debug log
      
      // Show success message
      Alert.alert(
        'Success', 
        'Account created successfully! You are now logged in.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Clear form fields
              setEmail('');
              setPassword('');
              setName('');
              setContact('');
              
              setIsRegistering(false);
              // The AuthContext will automatically handle navigation to dashboard
              // since the user is now authenticated
            }
          }
        ]
      );
      
    } catch (error: any) {
      console.error('Registration error:', error); // Debug log
      let errorMessage = 'Registration failed. Please try again.';
      
      // Handle specific Firebase auth errors
      if (error.message.includes('email-already-in-use')) {
        errorMessage = 'An account with this email already exists.';
      } else if (error.message.includes('invalid-email')) {
        errorMessage = 'Invalid email address format.';
      } else if (error.message.includes('weak-password')) {
        errorMessage = 'Password should be at least 6 characters long.';
      } else if (error.message.includes('network-request-failed')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.message.includes('operation-not-allowed')) {
        errorMessage = 'Email/password accounts are not enabled. Please contact support.';
      }
      
      Alert.alert('Registration Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Barangay Header */}
          <View style={styles.headerSection}>
            <View style={[styles.logoContainer, { backgroundColor: colors.tint }]}>
              <IconSymbol name="home" size={48} color="#fff" />
            </View>
            <Title style={[styles.appTitle, { color: colors.tint }]}>Barangay Buddy</Title>
            <Text style={[styles.appSubtitle, { color: colors.icon }]}>
              Your Digital Barangay Services
            </Text>
          </View>

          {/* Login Form Card */}
          <Card style={[styles.formCard, { backgroundColor: colors.background }]}>
            <Card.Content style={styles.formContent}>
              <Title style={[styles.welcomeTitle, { color: colors.text }]}>Welcome Back</Title>
              <Text style={[styles.welcomeSubtitle, { color: colors.icon }]}>
                Sign in to access your barangay services
              </Text>

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
                <Text style={[styles.inputLabel, { color: colors.text }]}>Password</Text>
                <TextInput
                  style={[styles.textInput, { borderColor: colors.icon, color: colors.text }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.icon}
                  secureTextEntry
                />
              </View>

              {/* Quick Fill for Testing */}
              <TouchableOpacity
                style={[styles.quickFillButton, { borderColor: colors.tint }]}
                onPress={() => {
                  if (isRegistering) {
                    // Fill registration form
                    setEmail('newuser@barangay.gov.ph');
                    setPassword('test123');
                    setName('John Doe');
                    setContact('09123456789');
                    
                    setSelectedRole('resident');
                  } else {
                    // Fill login form
                    setEmail('test@barangay.gov.ph');
                    setPassword('test123');
                  }
                }}
              >
                <Text style={[styles.quickFillText, { color: colors.tint }]}>
                  {isRegistering ? 'Quick Fill Registration Form' : 'Quick Fill Test Credentials'}
                </Text>
              </TouchableOpacity>

              {isRegistering && (
                <>
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
                    <Text style={[styles.inputLabel, { color: colors.text }]}>Contact Number</Text>
                    <TextInput
                      style={[styles.textInput, { borderColor: colors.icon, color: colors.text }]}
                      value={contact}
                      onChangeText={setContact}
                      placeholder="Enter your contact number"
                      placeholderTextColor={colors.icon}
                      keyboardType="phone-pad"
                    />
                  </View>

                  

                  <View style={styles.inputContainer}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>Register As</Text>
                    <View style={[styles.pickerContainer, { borderColor: colors.icon }]}>
                      <Picker
                        selectedValue={selectedRole}
                        onValueChange={setSelectedRole}
                        style={styles.picker}
                      >
                        <Picker.Item label="Resident" value="resident" />
                        <Picker.Item label="Admin" value="admin" />
                      </Picker>
                    </View>
                  </View>
                </>
              )}

              <TouchableOpacity
                style={[
                  styles.loginButton,
                  { 
                    backgroundColor: '#007AFF', // Blue color
                    opacity: isLoading ? 0.7 : 1
                  }
                ]}
                onPress={isRegistering ? handleRegister : handleLogin}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={[styles.loginButtonText, { marginLeft: 8 }]}>
                      {isRegistering ? 'Creating Account...' : 'Signing In...'}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.loginButtonText}>
                    {isRegistering ? 'Create Account' : 'Sign In'}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.toggleButton}
                onPress={() => setIsRegistering(!isRegistering)}
              >
                <Text style={[styles.toggleButtonText, { color: colors.tint }]}>
                  {isRegistering ? 'Already have an account? Sign In' : 'Don\'t have an account? Create Account'}
                </Text>
              </TouchableOpacity>
            </Card.Content>
          </Card>

          {/* Security Indicators */}
          <View style={styles.securitySection}>
            <View style={styles.securityItem}>
              <IconSymbol name="security" size={20} color={colors.icon} />
              <Text style={[styles.securityText, { color: colors.icon }]}>Secure Login</Text>
            </View>
            <View style={styles.securityItem}>
              <IconSymbol name="verified-user" size={20} color={colors.icon} />
              <Text style={[styles.securityText, { color: colors.icon }]}>Verified Users</Text>
            </View>
            <View style={styles.securityItem}>
              <IconSymbol name="privacy-tip" size={20} color={colors.icon} />
              <Text style={[styles.securityText, { color: colors.icon }]}>Privacy Protected</Text>
            </View>
          </View>

          {/* Test Credentials Info */}
          <Card style={[styles.testCard, { backgroundColor: colors.background }]}>
            <Card.Content>
              <Title style={[styles.testTitle, { color: colors.text }]}>Test Credentials</Title>
              <Text style={[styles.testText, { color: colors.icon }]}>
                For testing purposes:{'\n'}
                Email: test@barangay.gov.ph{'\n'}
                Password: test123{'\n'}
                {'\n'}Or create a new account using the registration form.
              </Text>
            </Card.Content>
          </Card>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  content: {
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  
  // Header Section
  headerSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 4,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  appSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
  },
  
  // Form Card
  formCard: {
    elevation: 8,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  formContent: {
    padding: 24,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    marginBottom: 24,
    opacity: 0.8,
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
    minHeight: 48,
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  picker: {
    height: 50,
  },
  
  // Login Button
  loginButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Quick Fill Button
  quickFillButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    alignItems: 'center',
  },
  quickFillText: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Toggle Button
  toggleButton: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  
  // Security Section
  securitySection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  securityItem: {
    alignItems: 'center',
    flex: 1,
  },
  securityText: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  
  // Test Credentials Card
  testCard: {
    elevation: 2,
    borderRadius: 12,
  },
  testTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  testText: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});

export default LoginScreen;
