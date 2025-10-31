// screens/ProfileScreen.js (ฉบับแก้ไข Warning)

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// VVV--- ใช้ชื่อที่สอดคล้องกับไฟล์อื่นๆ เพื่อป้องกันความสับสน ---VVV
import { SafeAreaView as SafeContextView } from 'react-native-safe-area-context';
// ^^^-------------------------------------------------------^^^
import { auth } from '../firebaseConfig';
import { signOut, sendPasswordResetEmail } from 'firebase/auth';

export default function ProfileScreen({ navigation }) {
  // เพิ่มค่า default 'N/A' ป้องกันกรณีที่ user ไม่มี email
  const userEmail = auth.currentUser?.email || 'N/A';

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถออกจากระบบได้: ' + (error?.message || ''));
    }
  };

  const handlePasswordReset = () => {
    if (auth.currentUser?.email) {
      sendPasswordResetEmail(auth, auth.currentUser.email)
        .then(() => {
          Alert.alert("ส่งอีเมลสำเร็จ", "ระบบได้ส่งลิงก์สำหรับเปลี่ยนรหัสผ่านไปยังอีเมลของคุณแล้ว กรุณาตรวจสอบ");
        })
        .catch((error) => {
          Alert.alert("เกิดข้อผิดพลาด", error.message);
        });
    } else {
        Alert.alert("ไม่พบอีเมล", "ไม่สามารถดำเนินการได้เนื่องจากไม่พบอีเมลผู้ใช้");
    }
  };

  return (
    // VVV--- เปลี่ยนไปใช้ SafeContextView ที่ import มา ---VVV
    <SafeContextView style={styles.container}>
      {/* Topbar */}
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back-outline" size={28} color="#2D3748" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>บัญชีผู้ใช้</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.infoCard}>
          <Text style={styles.label}>อีเมล:</Text>
          <Text style={styles.emailText}>{userEmail}</Text>
        </View>

        <TouchableOpacity style={styles.menuButton} onPress={() => navigation.navigate('History')}>
          <Text style={styles.menuButtonText}>ประวัติการจอง</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuButton} onPress={handlePasswordReset}>
          <Text style={styles.menuButtonText}>เปลี่ยนรหัสผ่าน</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
          <Text style={styles.logoutButtonText}>ออกจากระบบ</Text>
        </TouchableOpacity>
      </View>
    </SafeContextView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7f7' },
  topbar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      height: 50,
      backgroundColor: '#fff',
      borderBottomWidth: 1,
      borderBottomColor: '#e2e8f0',
  },
  backBtn: {
      justifyContent: 'center',
      alignItems: 'center',
      width: 44,
      height: 44,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1a202c' },
  content: { flex: 1, padding: 16, },
  infoCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 20, },
  label: { fontSize: 14, color: '#718096', },
  emailText: { fontSize: 16, color: '#2d3748', marginTop: 4, fontWeight: '600', },
  menuButton: { backgroundColor: '#fff', borderRadius: 12, paddingVertical: 16, paddingHorizontal: 16, marginBottom: 10, alignItems: 'center', },
  menuButtonText: { color: '#2b6cb0', fontSize: 16, fontWeight: '600', },
  logoutButton: { backgroundColor: '#c53030', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 'auto', marginBottom: 20, },
  logoutButtonText: { color: '#fff', fontSize: 16, fontWeight: '700', },
});