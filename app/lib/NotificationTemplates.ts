import { sendPushNotification } from './Notifications';
import { fetchUserProfile } from './User';

export const notificationTemplates = {
  BOOKING_APPROVED: {
    title: 'Booking Approved ✅',
    body: 'Your booking for {service} on {date} has been approved. Please proceed to the barangay office.',
  },
  BOOKING_REJECTED: {
    title: 'Booking Update ❌',
    body: 'Your booking for {service} has been rejected. Reason: {reason}',
  },
  REMINDER_TOMORROW: {
    title: 'Appointment Reminder 📅',
    body: 'You have an appointment tomorrow at {time} for {service}',
  },
  DOCUMENT_READY: {
    title: 'Document Ready 📄',
    body: 'Your {document} is ready for pickup at the barangay office.',
  },
  ANNOUNCEMENT: {
    title: 'Community Announcement 📢',
    body: '{title}: {preview}',
  },
  PAYMENT_DUE: {
    title: 'Payment Required 💰',
    body: 'Please settle your payment of ₱{amount} for {service}',
  },
};

export const sendTemplatedNotification = async (
  userId: string,
  template: keyof typeof notificationTemplates,
  data: Record<string, string>
) => {
  const user = await fetchUserProfile(userId) as any;
  if (!user?.pushToken) return;
  
  let { title, body } = notificationTemplates[template];
  
  Object.entries(data).forEach(([key, value]) => {
    title = title.replace(`{${key}}`, value);
    body = body.replace(`{${key}}`, value);
  });
  
  await sendPushNotification(user.pushToken, title, body);
};


