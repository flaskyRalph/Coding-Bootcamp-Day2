import { Picker } from '@react-native-picker/picker'; // Import Picker
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Button, TextInput } from 'react-native-paper';
import { loginUser, registerUser } from './lib/Auth';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [purok, setPurok] = useState('');
  const [householdInfo, setHouseholdInfo] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [selectedRole, setSelectedRole] = useState('resident'); // State for role selection

  const handleLogin = async () => {
    try {
      await loginUser(email, password);
      Alert.alert('Success', 'Logged in successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleRegister = async () => {
    if (!name || !contact || !purok || !householdInfo) {
      Alert.alert('Error', 'Please fill in all registration fields.');
      return;
    }
    try {
      await registerUser(email, password, name, contact, purok, householdInfo, selectedRole); // Pass selectedRole
      Alert.alert('Success', 'Registered successfully!');
      setIsRegistering(false);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Barangay Buddy</Text>

      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
        mode="outlined"
      />
      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
        mode="outlined"
      />

      {isRegistering && (
        <>
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
          <Picker
            selectedValue={selectedRole}
            onValueChange={(itemValue) => setSelectedRole(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="Register as Resident" value="resident" />
            <Picker.Item label="Register as Admin" value="admin" />
          </Picker>
        </>
      )}

      <Button mode="contained" onPress={isRegistering ? handleRegister : handleLogin} style={styles.button}>
        <Text>{isRegistering ? 'Register' : 'Login'}</Text>
      </Button>
      <Button mode="text" onPress={() => setIsRegistering(!isRegistering)} style={styles.button}>
        <Text>{isRegistering ? 'Already have an account? Login' : 'Don\'t have an account? Register'}</Text>
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
    fontSize: 32,
    marginBottom: 30,
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
  picker: {
    width: '100%',
    marginBottom: 10,
    height: 50,
    backgroundColor: '#fff',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
  },
});

export default LoginScreen;
