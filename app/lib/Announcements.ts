import NetInfo from '@react-native-community/netinfo';
import { addDoc, collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "./firebase";
import { loadAnnouncementsLocally, saveAnnouncementsLocally } from './OfflineSync';

interface Announcement {
  id?: string;
  title: string;
  content: string;
  date: string;
  postedBy: string;
  isSynced?: boolean;
}

export const createAnnouncement = async (announcement: Omit<Announcement, "id" | "date">) => {
  const state = await NetInfo.fetch();
  const newAnnouncement: Announcement = {
    ...announcement,
    date: new Date().toISOString(),
    isSynced: state.isConnected || false, // Mark as synced if online, else unsynced
  };

  try {
    if (state.isConnected) {
      const docRef = await addDoc(collection(db, "announcements"), newAnnouncement);
      newAnnouncement.id = docRef.id; // Assign Firestore ID
      console.log("Online: Announcement added to Firestore");
    } else {
      console.log("Offline: Announcement saved locally");
    }
    
    // Always save locally (or update if already exists)
    const localAnnouncements = await loadAnnouncementsLocally();
    const updatedLocalAnnouncements = [...localAnnouncements, newAnnouncement];
    await saveAnnouncementsLocally(updatedLocalAnnouncements);

    return newAnnouncement.id;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const getAnnouncements = async (): Promise<Announcement[]> => {
  const state = await NetInfo.fetch();

  if (!state.isConnected) {
    console.log("Offline: Loading announcements locally");
    return loadAnnouncementsLocally();
  }

  try {
    console.log("Online: Fetching announcements from Firestore");
    const q = query(collection(db, "announcements"), orderBy("date", "desc"));
    const querySnapshot = await getDocs(q);
    const announcements: Announcement[] = [];
    querySnapshot.forEach((doc) => {
      announcements.push({ id: doc.id, ...doc.data(), isSynced: true } as Announcement);
    });
    await saveAnnouncementsLocally(announcements); // Save fetched announcements locally
    return announcements;
  } catch (error: any) {
    throw new Error(error.message);
  }
};
