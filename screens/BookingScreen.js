// screens/BookingScreen.js (ฉบับง่ายที่สุด: ลบ Timeline ออก)

import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
// 🟢 ต้อง import rtdb และ ref/update เพื่ออัปเดตสถานะ
import { db, auth, rtdb } from '../firebaseConfig'; 
import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { ref, update } from 'firebase/database'; // <--- ต้องมี update สำหรับ Realtime DB

// ลบ Component HourBlock ออก

export default function BookingScreen({ route, navigation }) {
    const spotId = route.params?.spotId; 

    // --- State Management ---
    // ไม่ใช้ timelineDate, bookedSlots, isLoadingSlots
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [isStartTimePicker, setIsStartTimePicker] = useState(true); 

    const [tempDate, setTempDate] = useState(new Date()); 
    
    // ตั้งเวลาเริ่มต้นให้เป็น 1 ชั่วโมงข้างหน้า
    const [startTime, setStartTime] = useState(() => {
        const now = new Date();
        now.setHours(now.getHours() + 1, 0, 0, 0);
        return now;
    });
    // ตั้งเวลาสิ้นสุดให้เป็น 2 ชั่วโมงข้างหน้า
    const [endTime, setEndTime] = useState(() => {
        const now = new Date();
        now.setHours(now.getHours() + 2, 0, 0, 0);
        return now;
    });
    const [saving, setSaving] = useState(false);
    
    // ไม่ต้องใช้ useEffect เพื่อ fetchBookedSlots

    // VVV--- Guard Clause ---VVV
    if (!spotId) { 
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={32} color="#E53E3E" />
                    <Text style={styles.errorText}>ไม่พบรหัสช่องจอด</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.backHomeButton}>
                         <Text style={styles.backHomeText}>กลับหน้าหลัก</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }
    // ^^^-----------------------^^^


    // --- Handlers (ปรับปรุงให้ใช้ Date/Time Picker ง่ายขึ้น) ---
    const openPicker = (isStart, mode) => {
        setIsStartTimePicker(isStart);
        setTempDate(isStart ? startTime : endTime); 
        setShowDatePicker(mode === 'date');
        setShowTimePicker(mode === 'time');
    };

    const onPickerChange = (event, selectedDate) => {
        if (selectedDate) {
            setTempDate(selectedDate);
        }
        
        if (Platform.OS === 'ios') return;
        
        if (event.type === 'dismissed' || selectedDate) {
            setShowDatePicker(false);
            setShowTimePicker(false);
            
            if (selectedDate) {
                // Apply date/time changes directly
                if (isStartTimePicker) {
                    // สำหรับเวลาเริ่มต้น
                    setStartTime(selectedDate);
                    // ถ้าเวลาเริ่มต้นใหม่ไปอยู่หลังเวลาสิ้นสุดเดิม ให้ขยายเวลาสิ้นสุดออกไป 1 ชม.
                    if (selectedDate.getTime() >= endTime.getTime()) {
                        const newEndTime = new Date(selectedDate);
                        newEndTime.setHours(newEndTime.getHours() + 1, newEndTime.getMinutes());
                        setEndTime(newEndTime);
                    }
                } else {
                    // สำหรับเวลาสิ้นสุด
                    if (selectedDate.getTime() > startTime.getTime()) {
                        setEndTime(selectedDate);
                    } else {
                        Alert.alert('เวลาไม่ถูกต้อง', 'เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่มต้น');
                    }
                }
            }
        }
    };
    
    const confirmDateIOS = () => {
        setShowDatePicker(false);
        setShowTimePicker(false);

        const newDateTime = new Date(tempDate);
        
        if (isStartTimePicker) {
            setStartTime(newDateTime);
            if (newDateTime.getTime() >= endTime.getTime()) {
                const newEndTime = new Date(newDateTime);
                newEndTime.setHours(newEndTime.getHours() + 1, newEndTime.getMinutes());
                setEndTime(newEndTime);
            }
        } else {
             if (newDateTime.getTime() > startTime.getTime()) {
                setEndTime(newDateTime);
            } else {
                 Alert.alert('เวลาไม่ถูกต้อง', 'เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่มต้น');
            }
        }
    };


    const handleConfirmBooking = async () => {
        // ... (Guard Clauses เดิม)
        if (!auth.currentUser) return Alert.alert('เกิดข้อผิดพลาด', 'ไม่พบข้อมูลผู้ใช้');
        if (endTime.getTime() <= startTime.getTime()) return Alert.alert('เวลาไม่ถูกต้อง', 'เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่มต้น');
        setSaving(true);
        
        try {
            const bookingsRef = collection(db, 'bookings');
            
            // 1. ตรวจสอบการจองของผู้ใช้ปัจจุบัน (ทำได้แค่ 1 สิทธิ์)
            const userCheckQuery = query(
                bookingsRef, 
                where('userId', '==', auth.currentUser.uid),
                where('endTime', '>=', Timestamp.now())
            );
            const userBookingSnap = await getDocs(userCheckQuery);
            if (!userBookingSnap.empty) {
                setSaving(false);
                return Alert.alert('จองไม่สำเร็จ', 'คุณมีการจองที่ยังใช้งานอยู่แล้ว สามารถจองได้ครั้งละ 1 ช่องจอดเท่านั้น');
            }
            
            // 2. ตรวจสอบการจองทับซ้อนในช่องจอดนี้
            const overlapQuery = query(
                bookingsRef,
                where('spotId', '==', spotId),
                where('startTime', '<', Timestamp.fromDate(endTime)) // จองที่เริ่มก่อนเวลาสิ้นสุดของเรา
            );
            const overlappingDocs = await getDocs(overlapQuery);
            let isOverlapping = false;
            overlappingDocs.forEach(doc => {
                // และเวลาสิ้นสุดของเขาต้องเกินเวลาเริ่มต้นของเราด้วย (จึงจะทับซ้อน)
                if (doc.data().endTime.toDate() > startTime) { isOverlapping = true; }
            });
            if (isOverlapping) {
                setSaving(false);
                return Alert.alert('จองไม่สำเร็จ', 'ขออภัย ช่วงเวลาที่คุณเลือกมีผู้ใช้อื่นจองไปแล้ว');
            }
            
            // 3. บันทึกข้อมูลการจองใน Firestore
            await addDoc(bookingsRef, {
                spotId: spotId,
                userId: auth.currentUser.uid,
                userEmail: auth.currentUser.email,
                startTime: Timestamp.fromDate(startTime),
                endTime: Timestamp.fromDate(endTime),
            });
            
            // 4. อัปเดต Realtime Database ให้เครื่องอื่นเห็นสถานะจองทันที
            await update(ref(rtdb, `parkingSpots/${spotId}`), {
                isReserved: true, // ตั้งสถานะเป็นจองแล้ว
                reservedBy: auth.currentUser.uid, // เก็บ ID ผู้จอง
                reservedUntil: endTime.getTime(), // เก็บเวลาสิ้นสุด (เป็น millisecond)
            });

            Alert.alert('จองสำเร็จ!', `คุณได้จองช่องจอด ${spotId} เรียบร้อยแล้ว`, [
                { text: 'ตกลง', onPress: () => navigation.navigate('Home') },
            ]);
        } catch (error) {
            console.error("Booking Error: ", error);
            Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถทำการจองได้: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    // --- UI Helpers ---
    const formatDateOnly = (date) => date.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
    const formatTimeOnly = (date) => date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.topbar}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><Ionicons name="chevron-back-outline" size={28} color="#2D3748" /></TouchableOpacity>
                <Text style={styles.headerTitle}>จองช่องจอด {spotId}</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView style={styles.scrollView}>
                {/* ลบ Timeline Section ออก */}
                
                {/* Picker Section */}
                <View style={styles.contentSection}>
                    <View style={styles.subHeaderContainer}>
                        <Ionicons name="calendar-outline" size={20} color="#2D3748" style={styles.subHeaderIcon} />
                        <Text style={styles.subHeader}>เลือกเวลาของคุณ</Text>
                    </View>
                    
                    {/* ตารางเลือกเวลา: Header */}
                    <View style={styles.timeTable}>
                        <Text style={[styles.timeTableText, styles.timeTableLabel, { flex: 2.5 }]}>เวลาเริ่มต้น</Text>
                        <Text style={[styles.timeTableText, styles.timeTableLabel, { flex: 2.5 }]}>เวลาสิ้นสุด</Text>
                    </View>
                    
                    {/* แถวที่ 1: เลือก Date */}
                    <View style={styles.timeTable}>
                        <TouchableOpacity style={[styles.timeTableCell, { flex: 2.5 }]} onPress={() => openPicker(true, 'date')}>
                            <Text style={styles.pickerText}>{formatDateOnly(startTime)}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.timeTableCell, { flex: 2.5 }]} onPress={() => openPicker(false, 'date')}>
                            <Text style={styles.pickerText}>{formatDateOnly(endTime)}</Text>
                        </TouchableOpacity>
                    </View>
                    
                    {/* แถวที่ 2: เลือก Time */}
                    <View style={styles.timeTable}>
                        <TouchableOpacity style={[styles.timeTableCell, { flex: 2.5 }]} onPress={() => openPicker(true, 'time')}>
                            <Text style={styles.pickerText}>{formatTimeOnly(startTime)}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.timeTableCell, { flex: 2.5 }]} onPress={() => openPicker(false, 'time')}>
                            <Text style={styles.pickerText}>{formatTimeOnly(endTime)}</Text>
                        </TouchableOpacity>
                    </View>
                    

                    {/* ส่วนแสดง Picker และ ปุ่มยืนยัน (Conditional Rendering) */}
                    {(showDatePicker || showTimePicker) && (
                         // สำหรับ iOS ต้องมีปุ่มยืนยัน
                        <View style={styles.pickerModal}>
                            {Platform.OS === 'ios' && (
                                <View style={styles.pickerControls}>
                                    <TouchableOpacity style={styles.cancelButton} onPress={() => { setShowDatePicker(false); setShowTimePicker(false); }}>
                                        <Text style={styles.cancelButtonText}>ยกเลิก</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={styles.confirmButtonSmall} 
                                        onPress={confirmDateIOS}
                                    >
                                        <Text style={styles.confirmButtonSmallText}>ตกลง</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                            
                            {/* Date Picker Component */}
                            {showDatePicker && (
                                <DateTimePicker 
                                    value={tempDate} 
                                    mode="date" 
                                    onChange={onPickerChange} 
                                    minimumDate={new Date()} 
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                />
                            )}
                            
                            {/* Time Picker Component */}
                            {showTimePicker && (
                                <DateTimePicker 
                                    value={tempDate} 
                                    mode="time" 
                                    onChange={onPickerChange} 
                                    is24Hour={true}
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                />
                            )}
                        </View>
                    )}

                    <TouchableOpacity style={[styles.confirmButton, saving && styles.buttonDisabled]} onPress={handleConfirmBooking} disabled={saving}>
                        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmButtonText}>ยืนยันการจอง</Text>}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f7f7f7' },
    scrollView: { flex: 1 },
    topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, height: 50, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
    backBtn: { justifyContent: 'center', alignItems: 'center', width: 44, height: 44 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#1a202c' },
    contentSection: { paddingHorizontal: 20, paddingVertical: 15 },
    subHeaderContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, },
    subHeaderIcon: { marginRight: 8, },
    subHeader: { fontSize: 18, fontWeight: 'bold', color: '#2D3748', },
    divider: { height: 8, backgroundColor: '#E2E8F0', },
    
    timeTable: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, },
    timeTableLabel: { fontSize: 14, fontWeight: '700', color: '#718096', textAlign: 'center', },
    timeTableText: { marginBottom: 4, },
    timeTableCell: { backgroundColor: '#fff', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#CBD5E0', alignItems: 'center', marginHorizontal: 4, flex: 1, },
    pickerText: { fontSize: 16, color: '#2D3748' },

    pickerModal: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        paddingTop: Platform.OS === 'ios' ? 0 : 20,
        paddingHorizontal: Platform.OS === 'ios' ? 0 : 20,
        zIndex: 100,
    },
    pickerControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    cancelButton: {
        padding: 10,
    },
    cancelButtonText: {
        color: '#718096',
        fontSize: 16,
    },
    confirmButtonSmall: {
        padding: 10,
        backgroundColor: '#2b6cb0',
        borderRadius: 5,
    },
    confirmButtonSmallText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },

    confirmButton: { backgroundColor: '#2b6cb0', paddingVertical: 15, borderRadius: 10, alignItems: 'center', marginTop: 30 },
    buttonDisabled: { opacity: 0.6 },
    confirmButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    
    // Style สำหรับ Error
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, backgroundColor: '#fff' },
    errorText: { fontSize: 18, color: '#E53E3E', marginTop: 10, fontWeight: '600' },
    backHomeButton: { backgroundColor: '#3182ce', padding: 12, borderRadius: 8, marginTop: 20 },
    backHomeText: { color: '#fff', fontWeight: '600' }
});