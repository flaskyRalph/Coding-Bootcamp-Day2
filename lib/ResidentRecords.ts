import { addDoc, collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { db } from './firebase';

export interface ResidentRecord {
  id: string;
  userId: string;
  fullName: string;
  dateOfBirth: string;
  civilStatus: string;
  occupation: string;
  contactNumber: string;
  email: string;
  address: {
    houseNumber: string;
    street: string;
    purok: string;
    barangay: string;
  };
  householdMembers: Array<{
    name: string;
    relationship: string;
    age: number;
  }>;
  voterStatus: boolean;
  seniorCitizen: boolean;
  pwd: boolean;
  indigent: boolean;
  createdAt: string;
  updatedAt: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verifiedBy?: string;
  verificationDate?: string;
}

export const getResidentRecords = async (filters?: any): Promise<ResidentRecord[]> => {
  try {
    let q = query(collection(db, 'residentRecords'));
    
    if (filters?.purok) {
      q = query(q, where('address.purok', '==', filters.purok));
    }
    if (filters?.verificationStatus) {
      q = query(q, where('verificationStatus', '==', filters.verificationStatus));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ResidentRecord));
  } catch (error) {
    console.error('Error fetching resident records:', error);
    throw error;
  }
};

export const createResidentRecord = async (record: Omit<ResidentRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'residentRecords'), {
      ...record,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating resident record:', error);
    throw error;
  }
};

export const updateResidentRecord = async (
  recordId: string, 
  updates: Partial<ResidentRecord>
): Promise<void> => {
  try {
    const recordRef = doc(db, 'residentRecords', recordId);
    await updateDoc(recordRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating resident record:', error);
    throw error;
  }
};

export const verifyResident = async (
  recordId: string,
  verifierId: string,
  status: 'verified' | 'rejected'
): Promise<void> => {
  try {
    await updateResidentRecord(recordId, {
      verificationStatus: status,
      verifiedBy: verifierId,
      verificationDate: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error verifying resident:', error);
    throw error;
  }
};