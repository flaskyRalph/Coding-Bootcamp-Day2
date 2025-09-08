import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

export interface UserProfile {
  uid?: string;
  email: string;
  role: string; // 'resident' | 'admin' | 'staff'
  name: string;
  contact: string;
  // Optional extended profile fields
  address?: string;
  dateOfBirth?: string;
  civilStatus?: string;
  occupation?: string;
  profileImage?: string | null;
  validIdImage?: string | null;
  pushToken?: string;
  // System fields
  createdAt?: string;
  updatedAt?: string;
  isVerified?: boolean;
  isActive?: boolean;
  lastLogin?: string | null;
  profileComplete?: boolean;
  registrationSource?: string;
  emailVerified?: boolean;
  searchableName?: string;
  searchableEmail?: string;
}

export const getUserRole = async (uid: string) => {
  try {
    console.log('Fetching user role for UID:', uid);
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      const role = userDoc.data().role;
      console.log('User role found:', role);
      return role;
    } else {
      console.log('User document not found for UID:', uid);
      return null; // User document not found
    }
  } catch (error: any) {
    console.error('Error fetching user role:', error);
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
