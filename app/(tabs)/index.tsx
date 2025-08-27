import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from "react-native";
import { useRouter } from "expo-router";


// This is the main screen for the (tabs)/index route in Expo Router
export default function HomeScreen() {
  const router = useRouter();
  // Dummy Data for History
  const logs = [
    { id: "1", user: "Juan Dela Cruz", date: "2025-08-10", status: "Completed" },
    { id: "2", user: "Maria Santos", date: "2025-08-15", status: "Pending" },
  ];

  const [role, setRole] = React.useState<string | null>(null);

  if (!role) {
    // Role selection screen
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Barangay Buddy App</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setRole("Resident")}
        >
          <Text style={styles.buttonText}>I am a Resident</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setRole("Staff")}
        >
          <Text style={styles.buttonText}>I am a Barangay Staff</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Dashboard
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{role} Dashboard</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setRole(null)}
      >
        <Text style={styles.buttonText}>Back to Role Selection</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push({ pathname: "/(tabs)/appointments", params: { role } })}
      >
        <Text style={styles.buttonText}>Appointments</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push({ pathname: "/(tabs)/history", params: { role } })}
      >
        <Text style={styles.buttonText}>Booking History</Text>
      </TouchableOpacity>
      {/* Optionally show a static history preview */}
      <Text style={[styles.title, { fontSize: 18, marginTop: 30 }]}>Sample History</Text>
      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.text}>👤 {item.user}</Text>
            <Text style={styles.text}>📅 {item.date}</Text>
            <Text style={styles.text}>✅ {item.status}</Text>
          </View>
        )}
        style={{ width: "100%" }}
      />
    </View>
  );
}

// ✅ Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f8f9fa",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#2c3e50",
  },
  button: {
    backgroundColor: "#007bff",
    padding: 15,
    borderRadius: 10,
    marginVertical: 8,
    width: "80%",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  text: {
    fontSize: 16,
    marginVertical: 5,
  },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    marginVertical: 8,
    borderRadius: 10,
    width: "100%",
    elevation: 2,
  },
});
