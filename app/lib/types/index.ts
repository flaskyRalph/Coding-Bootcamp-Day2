// app/lib/types/index.ts
export interface User {
  uid: string;
  email: string;
  role: 'resident' | 'admin';
  profile: UserProfile;
}

export interface UserProfile {
  name: string;
  contact: string;
  purok: string;
  householdInfo: string;
  pushToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Booking {
  id: string;
  userId: string;
  serviceId: string;
  date: string;
  time: string;
  status: BookingStatus;
  attachmentUrl?: string;
  notes?: string;
  payment?: Payment;
  createdAt: Date;
  updatedAt: Date;
  syncStatus: SyncStatus;
}

export enum BookingStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface Payment {
  amount: number;
  status: PaymentStatus;
  method?: string;
  receivedBy?: string;
  receivedAt?: Date;
}

export enum PaymentStatus {
  UNPAID = 'unpaid',
  PAID = 'paid',
  WAIVED = 'waived'
}

export interface Service {
  id: string;
  name: string;
  description: string;
  requirements: string[];
  fee: number;
  estimatedDuration: number; // in minutes
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: AnnouncementCategory;
  priority: Priority;
  authorId: string;
  authorName: string;
  attachments?: string[];
  isActive: boolean;
  publishedAt: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum AnnouncementCategory {
  GENERAL = 'general',
  EMERGENCY = 'emergency',
  EVENT = 'event',
  MAINTENANCE = 'maintenance',
  HEALTH = 'health'
}

export enum Priority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum SyncStatus {
  SYNCED = 'synced',
  PENDING = 'pending',
  FAILED = 'failed'
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}