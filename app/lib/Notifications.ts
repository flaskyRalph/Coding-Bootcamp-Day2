import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { doc, updateDoc } from "firebase/firestore";
import { Platform } from 'react-native';
import { db } from "./firebase";

interface PushNotificationState {
  expoPushToken?: string;
  notification?: Notifications.Notification;
}

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Constants.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log(token);
  } else {
    alert('Must use physical device for Push Notifications');
  }

  return token;
}

export const savePushTokenToFirestore = async (userId: string, token: string) => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      pushToken: token,
    });
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const sendPushNotification = async (targetExpoPushToken: string, title: string, body: string) => {
  const message = {
    to: targetExpoPushToken,
    sound: 'default',
    title,
    body,
    data: { someData: 'goes here' },
  };

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });
};
