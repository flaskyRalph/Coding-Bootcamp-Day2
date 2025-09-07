import NetInfo from '@react-native-community/netinfo';
import { addDoc, collection, doc, getDocs, orderBy, query, updateDoc, where } from "firebase/firestore";
import { db } from "./firebase";

interface Booking {
  id?: string;
  userId: string;
  serviceId: string;
  date: string;
  time: string;
  status: "pending" | "approved" | "rejected";
  attachmentUrl?: string;
  isSynced?: boolean;
}

export const createBooking = async (booking: Omit<Booking, "id" | "status">) => {
  const state = await NetInfo.fetch();
  if (!state.isConnected) throw new Error('Offline mode not supported for bookings');

  const newBooking: Booking = {
    ...booking,
    status: "pending",
  };

  try {
    const docRef = await addDoc(collection(db, "bookings"), newBooking);
    console.log("Booking added to Firestore", docRef.id);
    return docRef.id;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const getMyBookings = async (userId: string): Promise<Booking[]> => {
  const state = await NetInfo.fetch();
  if (!state.isConnected) throw new Error('Offline mode not supported for bookings');

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
  const state = await NetInfo.fetch();
  if (!state.isConnected) throw new Error('Offline mode not supported for bookings');

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
  const state = await NetInfo.fetch();
  if (!state.isConnected) throw new Error('Offline mode not supported for bookings');

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
  const state = await NetInfo.fetch();
  if (!state.isConnected) throw new Error('Offline mode not supported for bookings');

  try {
    const bookingRef = doc(db, "bookings", bookingId);
    await updateDoc(bookingRef, {
      status: status,
    });
  } catch (error: any) {
    throw new Error(error.message);
  }
};
