import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "./firebase";

export const uploadFile = async (fileUri: string, path: string) => {
  try {
    const response = await fetch(fileUri);
    const blob = await response.blob();
    const storageRef = ref(storage, path);
    const uploadTask = await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(uploadTask.ref);
    return downloadURL;
  } catch (error: any) {
    throw new Error(error.message);
  }
};
