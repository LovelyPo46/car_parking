// ไฟล์: firebaseConfig.js

import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Use your real Firebase config
export const firebaseConfig = {
  apiKey: 'AIzaSyDw7S2hVij4xfbNFzDoC4VscxfsZs5L-7Y',
  authDomain: 'car-parking-4fa9a.firebaseapp.com',
  projectId: 'car-parking-4fa9a',
  // ชื่อ bucket ต้องเป็นรูปแบบ <project-id>.appspot.com ไม่ใช่โดเมนดาวน์โหลด
  storageBucket: 'car-parking-4fa9a.appspot.com',
  messagingSenderId: '102062212291',
  appId: '1:102062212291:web:c8b431ab3117ee46624e76',
  measurementId: 'G-K19JHEVJHJ',
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
