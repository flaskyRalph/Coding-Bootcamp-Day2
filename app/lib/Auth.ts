import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

export const registerUser = async (
  email: string,
  password: string,
  name: string,
  contact: string,
  purok: string,
  householdInfo: string,
  role: string // Add role parameter
) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      role: role, // Use the provided role
      name: name,
      contact: contact,
      purok: purok,
      householdInfo: householdInfo,
    });
    return user;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const loginUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error: any) {
    throw new Error(error.message);
  }
};
