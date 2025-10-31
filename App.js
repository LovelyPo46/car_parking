import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import { auth } from './firebaseConfig';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

// Screens
import SplashScreen from './screens/SplashScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import BookingScreen from './screens/BookingScreen';
import ProfileScreen from './screens/ProfileScreen';
import HistoryScreen from './screens/HistoryScreen';

const Stack = createStackNavigator();

// --- ส่วนจัดการ Notification (ถูกต้องแล้ว) ---
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function registerForPushNotificationsAsync() {
  let token;
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('คุณต้องเปิดอนุญาตการแจ้งเตือนเพื่อใช้งานฟีเจอร์นี้!');
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log("Expo Push Token:", token);
  } else {
    // alert('ต้องใช้บนอุปกรณ์จริงเท่านั้นสำหรับ Push Notifications'); // ปิด alert นี้ไปก่อน
  }
  return token;
}
// --- จบส่วน Notification ---


export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);
  const [splashTimerDone, setSplashTimerDone] = useState(false);

  // --- useEffects (ส่วนนี้ถูกต้องแล้ว) ---
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(currentUser => {
      setUser(currentUser);
      if (initializing) {
        setInitializing(false);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    setTimeout(() => {
      setSplashTimerDone(true);
    }, 2500); // Splash screen duration
  }, []);

  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);


  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {initializing || !splashTimerDone ? (
              <Stack.Screen name="Splash" component={SplashScreen} />
            ) : user ? (
              <>
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="Booking" component={BookingScreen} />
                <Stack.Screen name="Profile" component={ProfileScreen} />
                <Stack.Screen name="History" component={HistoryScreen} />
              </>
            ) : (
              // --- vvv นี่คือส่วนที่แก้ไขแล้ว vvv ---
              <>
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Register" component={RegisterScreen} />
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
