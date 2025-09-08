import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { UserProfile } from "./User";

export const registerUser = async (
  email: string,
  password: string,
  name: string,
  contact: string,
  purok: string,
  householdInfo: string,
  role: string
) => {
  try {
    console.log('Starting user registration...', { email, name, role });
    
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('Firebase Auth user created:', user.uid);
    
    // Create comprehensive user profile in Firestore
    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email!,
      role: role,
      name: name.trim(),
      contact: contact.trim(),
      validIdImage: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isVerified: false, // Default to unverified for new registrations
      isActive: true,
      lastLogin: null,
      profileComplete: true,
      // Additional fields for better data management
      registrationSource: 'mobile_app',
      emailVerified: user.emailVerified,
    };
    
    console.log('Creating user profile in Firestore:', userProfile);
    
    // Save to Firestore (single source of truth)
    await setDoc(doc(db, "users", user.uid), {
      ...userProfile,
      searchableName: name.toLowerCase(),
      searchableEmail: email.toLowerCase(),
    });
    
    console.log('User profile saved successfully to Firestore (users collection only)');
    console.log('User registration completed successfully');
    
    return user;
  } catch (error: any) {
    console.error('Registration error:', error);
    // Re-throw Firebase auth errors with original error codes
    throw error;
  }
};

export const loginUser = async (email: string, password: string) => {
  try {
    console.log('Starting user login...', { email });
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('User login successful:', user.uid);
    
    // Update last login time and login count
    try {
      await updateDoc(doc(db, "users", user.uid), {
        lastLogin: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      console.log('Last login time updated successfully');
    } catch (updateError) {
      // Don't fail login if update fails
      console.warn('Failed to update last login time:', updateError);
    }
    
    return user;
  } catch (error: any) {
    console.error('Login error:', error);
    // Re-throw Firebase auth errors with original error codes
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error: any) {
    throw new Error(error.message);
  }
};
