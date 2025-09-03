import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

interface UserProfile {
  email: string;
  role: string;
  name: string;
  contact: string;
  purok: string;
  householdInfo: string;
}

export const getUserRole = async (uid: string) => {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      return userDoc.data().role;
    } else {
      return null; // User document not found
    }
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const fetchUserProfile = async (uid: string) => {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    } else {
      return null; // User document not found
    }
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const updateUserProfile = async (uid: string, profile: Partial<UserProfile>) => {
  try {
    await updateDoc(doc(db, "users", uid), profile);
  } catch (error: any) {
    throw new Error(error.message);
  }
};
