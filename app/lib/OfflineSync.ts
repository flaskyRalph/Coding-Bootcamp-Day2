import AsyncStorage from '@react-native-async-storage/async-storage';
import { addDoc, collection, getDocs } from 'firebase/firestore';
import { auth, db } from './firebase';
import { getUserRole } from './User'; // Import getUserRole

const OFFLINE_BOOKINGS_KEY = 'offline_bookings';
const OFFLINE_ANNOUNCEMENTS_KEY = 'offline_announcements';
const OFFLINE_SERVICES_KEY = 'offline_services';

interface Booking {
  id?: string;
  userId: string;
  serviceId: string;
  date: string;
  time: string;
  status: "pending" | "approved" | "rejected";
  attachmentUrl?: string;
  isSynced?: boolean; // To track if the booking is synced with Firestore
}

interface Announcement {
  id?: string;
  title: string;
  content: string;
  date: string;
  postedBy: string;
  isSynced?: boolean;
}

interface Service {
  id: string;
  name: string;
  requirements: string;
  fee: number;
  isSynced?: boolean;
}

export const saveBookingsLocally = async (bookings: Booking[]) => {
  try {
    await AsyncStorage.setItem(OFFLINE_BOOKINGS_KEY, JSON.stringify(bookings));
  } catch (error: any) {
    throw new Error(`Failed to save bookings locally: ${error.message}`);
  }
};

export const loadBookingsLocally = async (): Promise<Booking[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(OFFLINE_BOOKINGS_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (error: any) {
    throw new Error(`Failed to load bookings locally: ${error.message}`);
  }
};

export const saveAnnouncementsLocally = async (announcements: Announcement[]) => {
  try {
    await AsyncStorage.setItem(OFFLINE_ANNOUNCEMENTS_KEY, JSON.stringify(announcements));
  } catch (error: any) {
    throw new Error(`Failed to save announcements locally: ${error.message}`);
  }
};

export const loadAnnouncementsLocally = async (): Promise<Announcement[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(OFFLINE_ANNOUNCEMENTS_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (error: any) {
    throw new Error(`Failed to load announcements locally: ${error.message}`);
  }
};

export const saveServicesLocally = async (services: Service[]) => {
  try {
    await AsyncStorage.setItem(OFFLINE_SERVICES_KEY, JSON.stringify(services));
  } catch (error: any) {
    throw new Error(`Failed to save services locally: ${error.message}`);
  }
};

export const loadServicesLocally = async (): Promise<Service[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(OFFLINE_SERVICES_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (error: any) {
    throw new Error(`Failed to load services locally: ${error.message}`);
  }
};

export const syncBookingsWithFirestore = async () => {
  try {
    const localBookings = await loadBookingsLocally();
    const newBookings = localBookings.filter(b => !b.isSynced);

    for (const booking of newBookings) {
      const { isSynced, ...bookingData } = booking;
      await addDoc(collection(db, "bookings"), bookingData);
      const updatedLocalBookings = localBookings.map(b =>
        b.id === booking.id ? { ...b, isSynced: true } : b
      );
      await saveBookingsLocally(updatedLocalBookings);
    }

    const firestoreBookingsSnapshot = await getDocs(collection(db, "bookings"));
    const firestoreBookings = firestoreBookingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), isSynced: true })) as Booking[];

    const mergedBookings = [...localBookings.filter(b => b.isSynced), ...firestoreBookings.filter(fb => !localBookings.some(lb => lb.id === fb.id))];
    await saveBookingsLocally(mergedBookings);
  } catch (error: any) {
    throw new Error(`Failed to sync bookings: ${error.message}`);
  }
};

export const syncAnnouncementsWithFirestore = async () => {
  try {
    const localAnnouncements = await loadAnnouncementsLocally();
    const newAnnouncements = localAnnouncements.filter(a => !a.isSynced);
    
    // Only attempt to add new announcements to Firestore if the user is an admin
    if (auth.currentUser) {
      const userRole = await getUserRole(auth.currentUser.uid);
      if (userRole === 'admin') {
        for (const announcement of newAnnouncements) {
          const { isSynced, ...announcementData } = announcement;
          await addDoc(collection(db, "announcements"), announcementData);
          const updatedLocalAnnouncements = localAnnouncements.map(a =>
            a.id === announcement.id ? { ...a, isSynced: true } : a
          );
          await saveAnnouncementsLocally(updatedLocalAnnouncements);
        }
      } else {
        console.log("User is not admin, skipping pushing new announcements to Firestore.");
      }
    } else {
      console.log("User not authenticated, skipping pushing new announcements to Firestore.");
    }

    const firestoreAnnouncementsSnapshot = await getDocs(collection(db, "announcements"));
    const firestoreAnnouncements = firestoreAnnouncementsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), isSynced: true })) as Announcement[];

    const mergedAnnouncements = [...localAnnouncements.filter(a => a.isSynced), ...firestoreAnnouncements.filter(fa => !localAnnouncements.some(la => la.id === fa.id))];
    await saveAnnouncementsLocally(mergedAnnouncements);
  } catch (error: any) {
    throw new Error(`Failed to sync announcements: ${error.message}`);
  }
};

export const syncServicesWithFirestore = async () => {
  try {
    const localServices = await loadServicesLocally();
    const newServices = localServices.filter(s => !s.isSynced);

    for (const service of newServices) {
      const { isSynced, ...serviceData } = service;
    }

    const firestoreServicesSnapshot = await getDocs(collection(db, "services"));
    const firestoreServices = firestoreServicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), isSynced: true })) as Service[];

    await saveServicesLocally(firestoreServices);
  } catch (error: any) {
    throw new Error(`Failed to sync services: ${error.message}`);
  }
};
