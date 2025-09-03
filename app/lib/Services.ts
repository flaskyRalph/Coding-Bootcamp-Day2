import NetInfo from '@react-native-community/netinfo';
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import { loadServicesLocally, saveServicesLocally } from './OfflineSync';

interface Service {
  id: string;
  name: string;
  requirements: string;
  fee: number;
}

export const getServices = async (): Promise<Service[]> => {
  const state = await NetInfo.fetch();

  if (!state.isConnected) {
    console.log("Offline: Loading services locally");
    return loadServicesLocally();
  }

  try {
    console.log("Online: Fetching services from Firestore");
    const servicesCollectionRef = collection(db, "services");
    const querySnapshot = await getDocs(servicesCollectionRef);
    const services: Service[] = [];
    querySnapshot.forEach((doc) => {
      services.push({ id: doc.id, ...doc.data() } as Service);
    });
    await saveServicesLocally(services);
    return services;
  } catch (error: any) {
    throw new Error(error.message);
  }
};
