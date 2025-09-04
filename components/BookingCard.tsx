// components/bookings/BookingCard.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Booking, Service, BookingStatus } from '@/app/lib/types';
import { formatDate, formatTime } from '@/app/lib/utils/helpers';

interface BookingCardProps {
  booking: Booking;
  service?: Service;
  onPress?: () => void;
  showActions?: boolean;
  onApprove?: () => void;
  onReject?: () => void;
}

export const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  service,
  onPress,
  showActions,
  onApprove,
  onReject,
}) => {
  const getStatusColor = (status: BookingStatus) => {
    const colors = {
      [BookingStatus.PENDING]: '#FFA500',
      [BookingStatus.APPROVED]: '#4CAF50',
      [BookingStatus.REJECTED]: '#F44336',
      [BookingStatus.COMPLETED]: '#2196F3',
      [BookingStatus.CANCELLED]: '#9E9E9E',
    };
    return colors[status];
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.header}>
        <Text style={styles.serviceName}>{service?.name || 'Service'}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
          <Text style={styles.statusText}>{booking.status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Date:</Text>
          <Text style={styles.value}>{formatDate(booking.date)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Time:</Text>
          <Text style={styles.value}>{formatTime(booking.time)}</Text>
        </View>
        {booking.notes && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Notes:</Text>
            <Text style={styles.value}>{booking.notes}</Text>
          </View>
        )}
      </View>

      {showActions && booking.status === BookingStatus.PENDING && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={onApprove}
          >
            <Text style={styles.actionButtonText}>Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}