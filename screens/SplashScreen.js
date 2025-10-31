import React from 'react';
import { View, Image, StyleSheet, StatusBar, Text } from 'react-native';

const SplashScreen = () => {

  return (
    // ใช้ View เป็น Container หลัก
    <View style={styles.container}>
      {/* 1. แก้ไข backgroundColor ให้ตรงกับพื้นหลัง (สีขาว) */}
      <StatusBar barStyle="dark-content" backgroundColor="#ffffffff" />
      
      {/* Container สีขาวสำหรับโลโก้เพื่อให้มีขอบโค้งมน */}
      <View style={styles.logoContainer}>
        <Image
          source={require('../assets/logo-car.png')} 
          style={styles.logo}
        />
        {/* 2. แก้ไขข้อความ tagline ที่เพี้ยน */}
        <Text style={styles.tagline}>Car Parking </Text>
      </View>
    </View>
  );
};

// Stylesheet สำหรับจัดรูปแบบหน้าจอ
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // ตั้งค่าพื้นหลังเป็นสีขาว
    backgroundColor: '#ffffffff', 
  },
  logoContainer: {
    // 1. เอา height: 160 ออก
    //    เพื่อให้ container นี้สูงพอดีกับโลโก้และข้อความ
    width: 300, 
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    // 2. กำหนดขนาดที่แน่นอนที่เหมาะสม
    //    (คุณสามารถปรับตัวเลข 250, 150 นี้ได้ตามต้องการ)
    width: 450,
    height: 300,
    resizeMode: 'contain', // ทำให้สัดส่วนภาพถูกต้อง
  },
  tagline: {
    marginTop: 1, // ตอนนี้ marginTop: 1 จะทำงานถูกต้องแล้ว
    fontSize: 40,
    color: '#333333',
    textAlign: 'center', // จัดให้อยู่กึ่งกลาง
    fontWeight: '300',
  },
});

export default SplashScreen;