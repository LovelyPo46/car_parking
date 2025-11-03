// ไฟล์: screens/LoginScreen.js

import React, { useState } from 'react';
// v-- 1. เพิ่ม KeyboardAvoidingView, ScrollView, Platform --v
import { SafeAreaView, View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Image, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // ... (ฟังก์ชัน handleLogin เหมือนเดิม) ...
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('กรุณากรอกข้อมูล', 'โปรดใส่อีเมลและรหัสผ่าน');
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      let friendlyMessage = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
      if (err.code === 'auth/invalid-email') {
        friendlyMessage = 'รูปแบบอีเมลไม่ถูกต้อง';
      }
      Alert.alert('เข้าสู่ระบบไม่สำเร็จ', friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* v-- 2. เพิ่ม KeyboardAvoidingView เข้ามาครอบทั้งหมด --v */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} // ตั้งค่าการหลบคีย์บอร์ด
      >
        {/* v-- 3. ใช้ ScrollView เพื่อให้เลื่อนจอได้ถ้าเนื้อหาล้น --v */}
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Image source={require('../assets/logo-car.png')} style={styles.logo} />
            
            <Text style={styles.title}>ยินดีต้อนรับกลับมา!</Text>
            <Text style={styles.subtitle}>กรุณาเข้าสู่ระบบเพื่อใช้งานต่อ</Text>

            <TextInput
              placeholder="อีเมล"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
            />
            <TextInput
              placeholder="รหัสผ่าน"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              style={styles.input}
            />

            <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} disabled={loading} onPress={handleLogin}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>เข้าสู่ระบบ</Text>}
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate('Register')}>
                <Text style={styles.linkText}>ยังไม่มีบัญชี? สร้างบัญชีใหม่</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// v-- 4. ปรับแก้ Styles เล็กน้อย --v
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    // Style ใหม่สำหรับ ScrollView เพื่อจัดกลาง
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    card: {
        width: '100%',
        maxWidth: 380,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 24,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },
    logo: {
        width: 120,
        height: 80,
        resizeMode: 'contain',
        alignSelf: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center',
        color: '#1a202c',
    },
    subtitle: {
        fontSize: 14,
        color: '#718096',
        textAlign: 'center',
        marginBottom: 20,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 12,
    },
    button: {
        backgroundColor: '#2b6cb0',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 12,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    linkButton: {
        alignItems: 'center',
    },
    linkText: {
        color: '#2b6cb0',
        fontSize: 14,
    }
});