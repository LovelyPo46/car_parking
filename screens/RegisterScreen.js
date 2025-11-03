import React, { useState } from 'react';
// 1. Import the necessary components
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('กรุณากรอกข้อมูล', 'โปรดกรอกข้อมูลให้ครบทุกช่อง');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('รหัสผ่านไม่ตรงกัน', 'กรุณาตรวจสอบรหัสผ่านและยืนยันรหัสผ่านอีกครั้ง');
      return;
    }
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (err) {
      let friendlyMessage = err.message;
      if (err.code === 'auth/email-already-in-use') {
        friendlyMessage = 'อีเมลนี้ถูกใช้งานแล้ว';
      } else if (err.code === 'auth/invalid-email') {
        friendlyMessage = 'รูปแบบอีเมลไม่ถูกต้อง';
      } else if (err.code === 'auth/weak-password') {
        friendlyMessage = 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร';
      }
      Alert.alert('ลงทะเบียนไม่สำเร็จ', friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 2. Add KeyboardAvoidingView and ScrollView */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Image source={require('../assets/logo-car.png')} style={styles.logo} />

            <Text style={styles.title}>สร้างบัญชีใหม่</Text>
            <Text style={styles.subtitle}>เริ่มต้นใช้งานแอปพลิเคชันของเรา</Text>

            <TextInput
              placeholder="อีเมล"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
            />
            <TextInput
              placeholder="รหัสผ่าน (6 ตัวอักษรขึ้นไป)"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              style={styles.input}
            />
            <TextInput
              placeholder="ยืนยันรหัสผ่าน"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              style={styles.input}
            />

            <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} disabled={loading} onPress={handleRegister}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>ลงทะเบียน</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate('Login')}>
              <Text style={styles.linkText}>มีบัญชีอยู่แล้ว? เข้าสู่ระบบที่นี่</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// 3. Adjust the styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
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
    backgroundColor: '#38A169', // Green for register
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
    color: '#38A169',
    fontSize: 14,
  },
});