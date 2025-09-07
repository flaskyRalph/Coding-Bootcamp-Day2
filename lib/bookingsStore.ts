export type Role = "Resident" | "Staff";

export type PaymentStatus = "unpaid" | "paid_on_site" | "waived";

export type BookingStatus = "Pending" | "Approved" | "Rejected" | "Completed";

export interface Booking {
  id: string;
  role: Role;
  service: string;
  date: string; // ISO or user-friendly
  documents?: string[];
  status: BookingStatus;
  notes?: string;
  fee_due: number; // 0 if none
  payment_status: PaymentStatus | null;
  payment_received_by?: string | null;
  payment_timestamp?: string | null;
}

// Simple in-memory store shared across route modules during app lifetime.
const bookings: Booking[] = [
  {
    id: "b1",
    role: "Resident",
    service: "Cedula Issuance",
    date: "2025-08-10 09:00",
    documents: ["ID.pdf"],
    status: "Completed",
    fee_due: 20,
    payment_status: "paid_on_site",
    payment_received_by: "AdminUser",
    payment_timestamp: new Date().toISOString(),
  },
  {
    id: "b2",
    role: "Resident",
    service: "Barangay Clearance",
    date: "2025-08-15 14:00",
    documents: [],
    status: "Pending",
    fee_due: 0,
    payment_status: null,
  },
];

export function getBookings() {
  return bookings;
}

export function addBooking(payload: Omit<Booking, "id">) {
  const id = `b_${Date.now()}`;
  const booking: Booking = { id, ...payload };
  bookings.unshift(booking);
  return booking;
}

export function updateBooking(id: string, patch: Partial<Booking>) {
  const idx = bookings.findIndex((b) => b.id === id);
  if (idx === -1) return null;
  bookings[idx] = { ...bookings[idx], ...patch };
  return bookings[idx];
}

export function findBooking(id: string) {
  return bookings.find((b) => b.id === id) || null;
}
