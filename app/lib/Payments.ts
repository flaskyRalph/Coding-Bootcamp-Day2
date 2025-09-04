import { addDoc, collection, doc, getDocs, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { db } from './firebase';

export interface Payment {
  id?: string;
  bookingId: string;
  serviceId: string;
  userId: string;
  amount: number;
  paymentMethod: 'cash' | 'gcash' | 'bank_deposit';
  paymentStatus: 'pending' | 'paid' | 'waived';
  paymentDate?: string;
  receivedBy?: string;
  orNumber?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export const createPaymentRecord = async (payment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'payments'), {
      ...payment,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating payment record:', error);
    throw error;
  }
};

export const updatePaymentStatus = async (
  paymentId: string,
  status: 'paid' | 'waived',
  receivedBy: string,
  orNumber?: string
): Promise<void> => {
  try {
    const paymentRef = doc(db, 'payments', paymentId);
    await updateDoc(paymentRef, {
      paymentStatus: status,
      paymentDate: new Date().toISOString(),
      receivedBy,
      orNumber,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating payment:', error);
    throw error;
  }
};

export const getPaymentsByDateRange = async (
  startDate: string,
  endDate: string
): Promise<Payment[]> => {
  try {
    const q = query(
      collection(db, 'payments'),
      where('paymentDate', '>=', startDate),
      where('paymentDate', '<=', endDate),
      where('paymentStatus', '==', 'paid'),
      orderBy('paymentDate', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Payment));
  } catch (error) {
    console.error('Error fetching payments:', error);
    throw error;
  }
};

export const generateDailyReport = async (date: string) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const payments = await getPaymentsByDateRange(
    startOfDay.toISOString(),
    endOfDay.toISOString()
  );
  
  const totalCash = payments
    .filter(p => p.paymentMethod === 'cash')
    .reduce((sum, p) => sum + p.amount, 0);
    
  const totalGCash = payments
    .filter(p => p.paymentMethod === 'gcash')
    .reduce((sum, p) => sum + p.amount, 0);
    
  return {
    date,
    totalTransactions: payments.length,
    totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
    totalCash,
    totalGCash,
    payments,
  };
};
