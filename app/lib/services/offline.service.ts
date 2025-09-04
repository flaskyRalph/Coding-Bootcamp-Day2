// app/lib/services/offline.service.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface QueuedOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  collection: string;
  documentId?: string;
  data: any;
  timestamp: Date;
  retries: number;
}

export class OfflineService {
  private static instance: OfflineService;
  private readonly QUEUE_KEY = '@offline_queue';
  private readonly CACHE_PREFIX = '@cache_';
  private isOnline = true;
  private syncInProgress = false;

  private constructor() {
    this.initNetworkListener();
  }

  static getInstance(): OfflineService {
    if (!OfflineService.instance) {
      OfflineService.instance = new OfflineService();
    }
    return OfflineService.instance;
  }

  private initNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected || false;
      
      if (wasOffline && this.isOnline) {
        this.syncQueue();
      }
    });
  }

  async queueOperation(operation: Omit<QueuedOperation, 'id' | 'timestamp' | 'retries'>) {
    const queue = await this.getQueue();
    const newOp: QueuedOperation = {
      ...operation,
      id: `${Date.now()}_${Math.random()}`,
      timestamp: new Date(),
      retries: 0
    };
    
    queue.push(newOp);
    await AsyncStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
    
    if (this.isOnline) {
      this.syncQueue();
    }
  }

  private async getQueue(): Promise<QueuedOperation[]> {
    try {
      const data = await AsyncStorage.getItem(this.QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  async syncQueue() {
    if (this.syncInProgress || !this.isOnline) return;
    
    this.syncInProgress = true;
    const queue = await this.getQueue();
    const failedOps: QueuedOperation[] = [];

    for (const operation of queue) {
      try {
        await this.executeOperation(operation);
      } catch (error) {
        operation.retries++;
        if (operation.retries < 3) {
          failedOps.push(operation);
        } else {
          console.error('Operation failed after 3 retries:', operation);
        }
      }
    }

    await AsyncStorage.setItem(this.QUEUE_KEY, JSON.stringify(failedOps));
    this.syncInProgress = false;
  }

  private async executeOperation(operation: QueuedOperation) {
    switch (operation.type) {
      case 'create':
        if (operation.documentId) {
          await setDoc(doc(db, operation.collection, operation.documentId), operation.data);
        }
        break;
      case 'update':
        if (operation.documentId) {
          await updateDoc(doc(db, operation.collection, operation.documentId), operation.data);
        }
        break;
      case 'delete':
        // Implement delete logic
        break;
    }
  }

  async cache(key: string, data: any) {
    await AsyncStorage.setItem(`${this.CACHE_PREFIX}${key}`, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  }

  async getCache(key: string, maxAge = 3600000) { // 1 hour default
    try {
      const cached = await AsyncStorage.getItem(`${this.CACHE_PREFIX}${key}`);
      if (!cached) return null;
      
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp > maxAge) {
        await AsyncStorage.removeItem(`${this.CACHE_PREFIX}${key}`);
        return null;
      }
      
      return data;
    } catch {
      return null;
    }
  }

  async saveBooking(booking: any) {
    await this.queueOperation({
      type: 'create',
      collection: 'bookings',
      documentId: booking.id,
      data: booking
    });
  }

  async queueUpdate(collection: string, documentId: string, updates: any) {
    await this.queueOperation({
      type: 'update',
      collection,
      documentId,
      data: updates
    });
  }

  async cacheBookings(bookings: any[]) {
    await this.cache('bookings', bookings);
  }

  async getCachedBookings(userId?: string) {
    const bookings = await this.getCache('bookings') || [];
    return userId ? bookings.filter((b: any) => b.userId === userId) : bookings;
  }
}