import NetInfo from '@react-native-community/netinfo';
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";
// Offline sync removed: use direct Firestore operations only

interface Service {
  id: string;
  name: string;
  requirements: string;
  fee: number;
}

export const getServices = async (): Promise<Service[]> => {
  const state = await NetInfo.fetch();
  if (!state.isConnected) throw new Error('Offline mode not supported for services');

  try {
    const servicesCollectionRef = collection(db, "services");
    const querySnapshot = await getDocs(servicesCollectionRef);
    const services: Service[] = [];
    querySnapshot.forEach((doc) => {
      services.push({ id: doc.id, ...doc.data() } as Service);
    });
    return services;
  } catch (error: any) {
    throw new Error(error.message);
  }
};
