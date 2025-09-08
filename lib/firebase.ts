import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { Platform } from 'react-native';
import { firebaseConfig } from "./firebaseConfig";

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const storage = getStorage(app);
let authInstance: any;
if (Platform.OS === 'ios' || Platform.OS === 'android') {
  try {
    // Dynamically require native-only modules to avoid TS/type resolution issues on web/tsc
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { initializeAuth } = require('firebase/auth');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getReactNativePersistence } = require('firebase/auth/react-native');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const RNAsyncStorage = require('@react-native-async-storage/async-storage').default;
    authInstance = initializeAuth(app, { persistence: getReactNativePersistence(RNAsyncStorage) });
  } catch {
    authInstance = getAuth(app);
  }
} else {
  authInstance = getAuth(app);
}

export const auth = authInstance as ReturnType<typeof getAuth>;

// Analytics is not supported on React Native; keep null to avoid runtime issues
export const analytics = null as any;

