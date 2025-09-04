// app/lib/api/bookings.ts
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { OfflineService } from '../services/offline.service';
import { ApiResponse, Booking, BookingStatus } from '../types';

export class BookingsAPI {
  private static instance: BookingsAPI;
  private offlineService: OfflineService;
  private readonly COLLECTION = 'bookings';

  private constructor() {
    this.offlineService = OfflineService.getInstance();
  }

  static getInstance(): BookingsAPI {
    if (!BookingsAPI.instance) {
      BookingsAPI.instance = new BookingsAPI();
    }
    return BookingsAPI.instance;
  }

  async createBooking(booking: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Booking>> {
    try {
      const docRef = doc(collection(db, this.COLLECTION));
      const newBooking: Booking = {
        ...booking,
        id: docRef.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        syncStatus: 'pending'
      };

      // Try online first
      try {
        await setDoc(docRef, {
          ...newBooking,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        newBooking.syncStatus = 'synced';
      } catch (error) {
        // Save offline if online fails
        await this.offlineService.saveBooking(newBooking);
      }

      return { success: true, data: newBooking };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create booking' 
      };
    }
  }

  async getBookings(userId?: string): Promise<ApiResponse<Booking[]>> {
    try {
      let q = query(collection(db, this.COLLECTION), orderBy('createdAt', 'desc'));
      
      if (userId) {
        q = query(q, where('userId', '==', userId));
      }

      try {
        const snapshot = await getDocs(q);
        const bookings = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        } as Booking));

        // Cache for offline
        await this.offlineService.cacheBookings(bookings);
        
        return { success: true, data: bookings };
      } catch (error) {
        // Load from cache if offline
        const cached = await this.offlineService.getCachedBookings(userId);
        return { success: true, data: cached };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch bookings' 
      };
    }
  }

  async updateBookingStatus(
    bookingId: string, 
    status: BookingStatus, 
    notes?: string
  ): Promise<ApiResponse<void>> {
    try {
      const updates = {
        status,
        ...(notes && { notes }),
        updatedAt: serverTimestamp()
      };

      try {
        await updateDoc(doc(db, this.COLLECTION, bookingId), updates);
      } catch (error) {
        // Queue for offline sync
        await this.offlineService.queueUpdate(this.COLLECTION, bookingId, updates);
      }

      return { success: true, message: 'Booking status updated successfully' };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update booking' 
      };
    }
  }

  subscribeToBookings(
    callback: (bookings: Booking[]) => void,
    userId?: string
  ): () => void {
    let q = query(collection(db, this.COLLECTION), orderBy('createdAt', 'desc'));
    
    if (userId) {
      q = query(q, where('userId', '==', userId));
    }

    return onSnapshot(q, 
      (snapshot) => {
        const bookings = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        } as Booking));
        callback(bookings);
      },
      (error) => {
        console.error('Subscription error:', error);
        // Fallback to cached data
        this.offlineService.getCachedBookings(userId).then(callback);
      }
    );
  }
}