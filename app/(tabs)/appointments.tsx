import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, TextInput, FlatList } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { addBooking, getBookings, updateBooking, Booking, Role } from "../lib/bookingsStore";

export default function AppointmentsScreen() {
  const params = useLocalSearchParams();
  const role = (params.role as Role) || "Resident";

  const [service, setService] = React.useState("");
  const [date, setDate] = React.useState("");
  const [fee, setFee] = React.useState<number>(0);
  const [bookings, setBookings] = React.useState<Booking[]>(getBookings());

  React.useEffect(() => {
    setBookings(getBookings());
  }, []);

  function submitBooking() {
    if (!service || !date) return;
    const newB = addBooking({
      role,
      service,
      date,
      documents: [],
      status: "Pending",
      fee_due: fee,
      payment_status: fee > 0 ? "unpaid" : null,
    });
    setBookings(getBookings());
    // simple feedback
    setService("");
    setDate("");
    setFee(0);
    alert(`Booking requested: ${newB.id}`);
  }

  function toggleApprove(id: string) {
    const b = getBookings().find((x) => x.id === id);
    if (!b) return;
    const next: any = b.status === "Pending" ? "Approved" : b.status === "Approved" ? "Completed" : "Pending";
    updateBooking(id, { status: next });
    setBookings(getBookings());
  }

  function markPaidOnSite(id: string) {
    updateBooking(id, { payment_status: "paid_on_site", payment_received_by: "StaffUser", payment_timestamp: new Date().toISOString() });
    setBookings(getBookings());
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{role} Appointments</Text>

      {role === "Resident" ? (
        <View style={{ width: "100%" }}>
          <TextInput placeholder="Service name" value={service} onChangeText={setService} style={styles.input} />
          <TextInput placeholder="Date & time" value={date} onChangeText={setDate} style={styles.input} />
          <TextInput placeholder="Fee if any (numeric)" value={String(fee)} onChangeText={(t) => setFee(Number(t) || 0)} style={styles.input} keyboardType="numeric" />
          <TouchableOpacity style={styles.button} onPress={submitBooking}>
            <Text style={styles.buttonText}>Request Booking</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ width: "100%" }}>
          <Text style={styles.text}>Staff Booking Management</Text>
        </View>
      )}

      <Text style={[styles.title, { fontSize: 18, marginTop: 20 }]}>All Bookings</Text>
      <FlatList
        data={bookings}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.text}>#{item.id} — {item.service}</Text>
            <Text style={styles.text}>Date: {item.date}</Text>
            <Text style={styles.text}>Status: {item.status}</Text>
            <Text style={styles.text}>Fee due: ₱{item.fee_due}</Text>
            <Text style={styles.text}>Payment: {item.payment_status || "n/a"}</Text>
            {role === "Staff" && (
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity style={styles.smallButton} onPress={() => toggleApprove(item.id)}>
                  <Text style={styles.buttonText}>Toggle Approve/Complete</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.smallButton} onPress={() => markPaidOnSite(item.id)}>
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
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
  input: { borderWidth: 1, borderColor: "#ddd", padding: 10, borderRadius: 8, marginBottom: 8 },
  button: { backgroundColor: "#007bff", padding: 12, borderRadius: 8, alignItems: "center" },
  smallButton: { backgroundColor: "#28a745", padding: 8, borderRadius: 6, marginTop: 8 },
  buttonText: { color: "#fff", fontWeight: "600" },
  text: { marginVertical: 4 },
  card: { backgroundColor: "#f8f9fa", padding: 12, borderRadius: 8, marginVertical: 8 },
});
