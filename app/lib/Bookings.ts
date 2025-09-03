import NetInfo from '@react-native-community/netinfo';
import { addDoc, collection, doc, getDocs, orderBy, query, updateDoc, where } from "firebase/firestore";
import { db } from "./firebase";
import { loadBookingsLocally, saveBookingsLocally } from './OfflineSync';

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
  const newBooking: Booking = {
    ...booking,
    status: "pending", // Default status
    isSynced: state.isConnected || false, // Mark as synced if online, else unsynced
  };

  try {
    if (state.isConnected) {
      const docRef = await addDoc(collection(db, "bookings"), newBooking);
      newBooking.id = docRef.id; // Assign Firestore ID
      console.log("Online: Booking added to Firestore");
    } else {
      // For offline bookings, we generate a temporary ID
      newBooking.id = `offline-${Date.now()}`;
      console.log("Offline: Booking saved locally");
    }
    
    const localBookings = await loadBookingsLocally();
    const updatedLocalBookings = [...localBookings, newBooking];
    await saveBookingsLocally(updatedLocalBookings);

    return newBooking.id;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const getMyBookings = async (userId: string): Promise<Booking[]> => {
  const state = await NetInfo.fetch();

  if (!state.isConnected) {
    console.log("Offline: Loading user bookings locally");
    const localBookings = await loadBookingsLocally();
    return localBookings.filter(b => b.userId === userId);
  }

  try {
    console.log("Online: Fetching user bookings from Firestore");
    const q = query(collection(db, "bookings"), where("userId", "==", userId), orderBy("date", "desc"));
    const querySnapshot = await getDocs(q);
    const bookings: Booking[] = [];
    querySnapshot.forEach((doc) => {
      bookings.push({ id: doc.id, ...doc.data(), isSynced: true } as Booking);
    });
    await saveBookingsLocally(bookings); // Save fetched bookings locally
    return bookings;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const getAllBookings = async (): Promise<Booking[]> => {
  const state = await NetInfo.fetch();

  if (!state.isConnected) {
    console.log("Offline: Loading all bookings locally");
    return loadBookingsLocally();
  }

  try {
    console.log("Online: Fetching all bookings from Firestore");
    const q = query(collection(db, "bookings"), orderBy("date", "desc"));
    const querySnapshot = await getDocs(q);
    const bookings: Booking[] = [];
    querySnapshot.forEach((doc) => {
      bookings.push({ id: doc.id, ...doc.data(), isSynced: true } as Booking);
    });
    await saveBookingsLocally(bookings);
    return bookings;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const updateBookingStatus = async (bookingId: string, status: "pending" | "approved" | "rejected") => {
  const state = await NetInfo.fetch();

  try {
    if (state.isConnected) {
      console.log("Online: Updating booking status in Firestore");
      const bookingRef = doc(db, "bookings", bookingId);
      await updateDoc(bookingRef, {
        status: status,
        isSynced: true,
      });
    } else {
      console.log("Offline: Updating booking status locally");
      const localBookings = await loadBookingsLocally();
      const updatedLocalBookings = localBookings.map(b =>
        b.id === bookingId ? { ...b, status: status, isSynced: false } : b
      );
      await saveBookingsLocally(updatedLocalBookings);
    }
  } catch (error: any) {
    throw new Error(error.message);
  }
};
