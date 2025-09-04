// app/lib/hooks/useBookings.ts
import { useCallback, useEffect, useState } from 'react';
import { BookingsAPI } from '../api/bookings';
import { Booking } from '../types';

export function useBookings(userId?: string) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const api = BookingsAPI.getInstance();

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const loadBookings = async () => {
      setLoading(true);
      try {
        // Set up real-time subscription
        unsubscribe = api.subscribeToBookings(
          (data) => {
            setBookings(data);
            setLoading(false);
          },
          userId
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load bookings');
        setLoading(false);
      }
    };

    loadBookings();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [userId]);

  const refreshBookings = useCallback(async () => {
    const result = await api.getBookings(userId);
    if (result.success && result.data) {
      setBookings(result.data);
    }
  }, [userId]);

  const createBooking = useCallback(async (bookingData: any) => {
    const result = await api.createBooking(bookingData);
    if (result.success) {
      await refreshBookings();
    }
    return result;
  }, [refreshBookings]);

  return {
    bookings,
    loading,
    error,
    refreshBookings,
    createBooking,
  };
}