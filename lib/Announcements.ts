import NetInfo from '@react-native-community/netinfo';
import { addDoc, collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "./firebase";
// Offline sync removed: use direct Firestore operations only

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
  if (!state.isConnected) throw new Error('Offline mode not supported for announcements');

  const newAnnouncement: Announcement = {
    ...announcement,
    date: new Date().toISOString(),
  };

  try {
    const docRef = await addDoc(collection(db, "announcements"), newAnnouncement);
    console.log("Announcement added to Firestore", docRef.id);
    return docRef.id;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const getAnnouncements = async (): Promise<Announcement[]> => {
  const state = await NetInfo.fetch();
  if (!state.isConnected) throw new Error('Offline mode not supported for announcements');

  try {
    const q = query(collection(db, "announcements"), orderBy("date", "desc"));
    const querySnapshot = await getDocs(q);
    const announcements: Announcement[] = [];
    querySnapshot.forEach((doc) => {
      announcements.push({ id: doc.id, ...doc.data() } as Announcement);
    });
    return announcements;
  } catch (error: any) {
    throw new Error(error.message);
  }
};
