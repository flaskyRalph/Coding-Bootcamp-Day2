import { addDoc, collection, doc, getDocs, orderBy, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
// NetInfo removed; keep imports minimal to avoid runtime issues in environments without native modules
import { db } from "./firebase";

interface Booking {
  id?: string;
  userId: string;
  serviceId: string;
  date: string;
  time: string;
  status: "pending" | "approved" | "rejected";
  attachmentUrl?: string;
  district?: string;
  barangay?: string;
  createdAt?: any;
  isSynced?: boolean;
}

export const createBooking = async (booking: Omit<Booking, "id" | "status">) => {
  const newBooking: Booking = {
    ...booking,
    status: "pending",
  };

  try {
    // Attach server timestamp and write to top-level bookings
    const bookingToSave = { ...newBooking, createdAt: serverTimestamp() };
    const docRef = await addDoc(collection(db, "bookings"), bookingToSave as any);
    console.log("Booking added to Firestore", docRef.id);

    // Mirror write under users/{uid}/bookings for per-user collection access
    try {
      await addDoc(collection(db, "users", booking.userId, "bookings"), {
        ...newBooking,
        id: docRef.id,
        createdAt: serverTimestamp(),
      } as any);
    } catch (e) {
      console.warn("Failed to mirror booking to user subcollection", e);
    }

    return docRef.id;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const getMyBookings = async (userId: string): Promise<Booking[]> => {
  try {
    const q = query(collection(db, "bookings"), where("userId", "==", userId), orderBy("date", "desc"));
    const querySnapshot = await getDocs(q);
    const bookings: Booking[] = [];
    querySnapshot.forEach((doc) => {
      bookings.push({ id: doc.id, ...doc.data() } as Booking);
    });
    return bookings;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const getAllBookings = async (): Promise<Booking[]> => {
  try {
    const q = query(collection(db, "bookings"), orderBy("date", "desc"));
    const querySnapshot = await getDocs(q);
    const bookings: Booking[] = [];
    querySnapshot.forEach((doc) => {
      bookings.push({ id: doc.id, ...doc.data() } as Booking);
    });
    return bookings;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const getBookingsForDate = async (date: string): Promise<Booking[]> => {
  try {
    const q = query(
      collection(db, "bookings"),
      where("date", "==", date),
      orderBy("time", "asc")
    );
    const querySnapshot = await getDocs(q);
    const bookings: Booking[] = [];
    querySnapshot.forEach((doc) => {
      bookings.push({ id: doc.id, ...doc.data() } as Booking);
    });
    return bookings;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const updateBookingStatus = async (bookingId: string, status: "pending" | "approved" | "rejected") => {
  // No NetInfo check here to avoid dependency on native module in web/tsc environment
  try {
    const bookingRef = doc(db, "bookings", bookingId);
    await updateDoc(bookingRef, {
      status: status,
    });
  } catch (error: any) {
    throw new Error(error.message);
  }
};
