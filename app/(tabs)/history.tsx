import { useLocalSearchParams } from "expo-router";
import React from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Booking, getBookings, updateBooking } from "../../lib/bookingsStore";

export default function HistoryScreen() {
  const params = useLocalSearchParams();
  const role = (params.role as string) || "Resident";

  const [bookings, setBookings] = React.useState<Booking[]>(getBookings());

  React.useEffect(() => {
    setBookings(getBookings());
  }, []);

  function approve(id: string) {
    updateBooking(id, { status: "Approved" });
    setBookings(getBookings());
  }

  function reject(id: string) {
    updateBooking(id, { status: "Rejected" });
    setBookings(getBookings());
  }

  function markPaid(id: string) {
    updateBooking(id, { payment_status: "paid_on_site", payment_received_by: "StaffUser", payment_timestamp: new Date().toISOString() });
    setBookings(getBookings());
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{role} Booking History</Text>
      <FlatList
        data={bookings.filter((b) => (role === "Staff" ? true : b.role === "Resident"))}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.text}>#{item.id} — {item.service}</Text>
            <Text style={styles.text}>User Role: {item.role}</Text>
            <Text style={styles.text}>Date: {item.date}</Text>
            <Text style={styles.text}>Status: {item.status}</Text>
            <Text style={styles.text}>Fee Due: ₱{item.fee_due}</Text>
            <Text style={styles.text}>Payment: {item.payment_status || 'n/a'}</Text>
            {role === "Staff" && (
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity style={styles.smallButton} onPress={() => approve(item.id)}>
                  <Text style={styles.buttonText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.smallButton} onPress={() => reject(item.id)}>
                  <Text style={styles.buttonText}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.smallButton} onPress={() => markPaid(item.id)}>
                  <Text style={styles.buttonText}>Mark Paid</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        style={{ width: "100%" }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff", alignItems: "center" },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
  card: { backgroundColor: "#f8f9fa", padding: 12, borderRadius: 8, marginVertical: 8, width: "100%" },
  text: { marginVertical: 3 },
  smallButton: { backgroundColor: "#007bff", padding: 8, borderRadius: 6, marginTop: 8 },
  buttonText: { color: "#fff", fontWeight: "600" },
});
