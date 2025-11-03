// ไฟล์: firebaseConfig.js (ฉบับอัปเดต)
// *** GEMINI FIX: เราต้องอ่านจาก 2 ที่! ***

import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'; // <--- สำหรับ Bookings
import { getStorage } from 'firebase/storage';
// <--- *** GEMINI FIX: 1. Import getDatabase *** --->
import { getDatabase } from 'firebase/database'; // <--- สำหรับ Parking Status

// Use your real Firebase config
export const firebaseConfig = {
  apiKey: 'AIzaSyDw7S2hVij4xfbNFzDoC4VscxfsZs5L-7Y',
  authDomain: 'car-parking-4fa9a.firebaseapp.com',
  projectId: 'car-parking-4fa9a',
  storageBucket: 'car-parking-4fa9a.appspot.com',
  messagingSenderId: '102062212291',
  appId: '1:102062212291:web:c8b431ab3117ee46624e76',
  measurementId: 'G-K19JHEVJHJ',
  
  // <--- *** GEMINI FIX: 2. เพิ่ม Database URL ที่ "ถูกต้อง" (จากรูปของคุณ) *** --->
  databaseURL: "https://car-parking-4fa9a-default-rtdb.asia-southeast1.firebasedatabase.app",
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app); // นี่คือ Firestore (สำหรับ Bookings)
export const storage = getStorage(app);

// <--- *** GEMINI FIX: 3. Export Realtime Database (rtdb) *** --->
export const rtdb = getDatabase(app); // นี่คือ Realtime Database (สำหรับสถานะช่องจอด)
