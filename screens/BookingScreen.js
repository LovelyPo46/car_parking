// screens/BookingScreen.js (ฉบับแก้ไข: Final Syntax Fix)

import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { db, auth } from '../firebaseConfig';
import { collection, query, where, getDocs, addDoc, Timestamp, orderBy } from 'firebase/firestore';

// --- Component: HourBlock (แถบเวลาแต่ละชั่วโมง) ---
const HourBlock = ({ hour, status }) => {
    const isBooked = status === 'จองแล้ว';
    return (
        <View style={styles.hourRow}>
            <Text style={styles.hourLabel}>{`${hour.toString().padStart(2, '0')}:00`}</Text>
            <View style={[styles.statusBlock, isBooked ? styles.bookedBlock : styles.availableBlock]}>
                <Text style={isBooked ? styles.bookedText : styles.availableText}>{status}</Text>
            </View>
        </View>
    );
};

export default function BookingScreen({ route, navigation }) {
    const spotId = route.params?.spotId; 

    // --- State Management ---
    const [timelineDate, setTimelineDate] = useState(new Date()); 
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [isStartTimePicker, setIsStartTimePicker] = useState(true); 

    const [tempDate, setTempDate] = useState(new Date()); // State ชั่วคราวสำหรับ Picker
    
    const [startTime, setStartTime] = useState(() => {
        const now = new Date();
        now.setHours(now.getHours() + 1, 0, 0, 0);
        return now;
    });
    const [endTime, setEndTime] = useState(() => {
        const now = new Date();
        now.setHours(now.getHours() + 2, 0, 0, 0);
        return now;
    });
    const [saving, setSaving] = useState(false);
    const [bookedSlots, setBookedSlots] = useState([]);
    const [isLoadingSlots, setIsLoadingSlots] = useState(true);

    // VVV--- Guard Clause (แก้ไข Syntax) ---VVV
    if (!spotId) { 
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={32} color="#E53E3E" />
                    <Text style={styles.errorText}>ไม่พบรหัสช่องจอด</Text>
                    <Text style={styles.errorSubText}>กรุณาลองกลับไปหน้าหลักและกดจองใหม่อีกครั้ง</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.backHomeButton}>
                         <Text style={styles.backHomeText}>กลับหน้าหลัก</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }
    // ^^^---------------------------------^^^


    // --- Data Fetching (โค้ดเดิม) ---
    useEffect(() => {
        let isMounted = true; 
        const fetchBookedSlots = async () => {
            try {
                const startOfToday = new Date();
                startOfToday.setHours(0, 0, 0, 0);

                const q = query(
                    collection(db, 'bookings'), 
                    where('spotId', '==', spotId), 
                    where('endTime', '>=', Timestamp.fromDate(startOfToday))
                );
                const querySnapshot = await getDocs(q);
                const slots = querySnapshot.docs
                    .map(doc => ({
                        id: doc.id,
                        startTime: doc.data().startTime.toDate(),
                        endTime: doc.data().endTime.toDate(),
                    }))
                    .sort((a, b) => a.startTime - b.startTime);
                if (isMounted) {
                    setBookedSlots(slots);
                }
            } catch (error) { 
                console.error("Error fetching slots: ", error); 
                if (isMounted) {
                     Alert.alert("ข้อผิดพลาดในการโหลด", "ไม่สามารถดึงข้อมูลไทม์ไลน์ได้ กรุณาตรวจสอบการเชื่อมต่อ");
                }
            } 
            finally { 
                if (isMounted) {
                    setIsLoadingSlots(false); 
                }
            }
        };

        if (spotId) {
             fetchBookedSlots();
        }

        return () => {
            isMounted = false; 
        };
    }, [spotId]);

    // --- Timeline Generation (แก้ไข Logic ให้สมบูรณ์) ---
    const memoizedTimeline = useMemo(() => {
        const hours = Array.from({ length: 24 }, (_, i) => i);
        const dateToCheck = timelineDate;

        return hours.map(hour => {
            let status = 'ว่าง';
            for (const slot of bookedSlots) {
                const slotDateString = slot.startTime.toDateString();
                const checkDateString = dateToCheck.toDateString();
                
                if (slotDateString === checkDateString) {
                     if (hour >= slot.startTime.getHours() && hour < slot.endTime.getHours()) {
                        status = 'จองแล้ว';
                        break;
                    }
                }
            }
            return <HourBlock key={hour} hour={hour} status={status} />;
        });
    }, [bookedSlots, timelineDate]);

    // --- Handlers (โค้ดเดิม) ---
    const openPicker = (isStart) => {
        setIsStartTimePicker(isStart);
        setTempDate(isStart ? startTime : endTime); 
        setShowDatePicker(true);
    };

    const openTimePicker = (isStart) => {
        setIsStartTimePicker(isStart);
        setTempDate(isStart ? startTime : endTime);
        setShowTimePicker(true);
    };


    const onPickerChange = (event, selectedDate) => {
        if (selectedDate) {
            setTempDate(selectedDate);
        }
        
        if (Platform.OS === 'ios') return;
        
        if (event.type === 'dismissed') {
            setShowDatePicker(false);
            setShowTimePicker(false);
        }
    };
    
    const confirmDate = (type) => {
        setShowDatePicker(false);
        setShowTimePicker(false);

        const newDateTime = new Date(tempDate);
        
        if (type === 'DATE') {
            if (isStartTimePicker) {
                setStartTime(newDateTime);
                setTimelineDate(newDateTime); 
            } else {
                setEndTime(newDateTime);
            }
            if (Platform.OS === 'ios') {
                openTimePicker(isStartTimePicker); 
            }
        } else if (type === 'TIME') {
            if (isStartTimePicker) {
                setStartTime(newDateTime);
                setTimelineDate(newDateTime);
            } else {
                 if (newDateTime.getTime() > startTime.getTime()) {
                    setEndTime(newDateTime);
                } else {
                     Alert.alert('เวลาไม่ถูกต้อง', 'เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่มต้น');
                }
            }
        }
    };


    const handleConfirmBooking = async () => {
        if (!auth.currentUser) return Alert.alert('เกิดข้อผิดพลาด', 'ไม่พบข้อมูลผู้ใช้');
        if (endTime.getTime() <= startTime.getTime()) return Alert.alert('เวลาไม่ถูกต้อง', 'เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่มต้น');
        setSaving(true);
        try {
            const bookingsRef = collection(db, 'bookings');
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
            const overlapQuery = query(
                bookingsRef,
                where('spotId', '==', spotId),
                where('startTime', '<', Timestamp.fromDate(endTime))
            );
            const overlappingDocs = await getDocs(overlapQuery);
            let isOverlapping = false;
            overlappingDocs.forEach(doc => {
                if (doc.data().endTime.toDate() > startTime) { isOverlapping = true; }
            });
            if (isOverlapping) {
                setSaving(false);
                return Alert.alert('จองไม่สำเร็จ', 'ขออภัย ช่วงเวลาที่คุณเลือกมีผู้ใช้อื่นจองไปแล้ว');
            }
            await addDoc(bookingsRef, {
                spotId: spotId,
                userId: auth.currentUser.uid,
                userEmail: auth.currentUser.email,
                startTime: Timestamp.fromDate(startTime),
                endTime: Timestamp.fromDate(endTime),
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
    const formatTimelineDate = (date) => date.toLocaleString('th-TH', { weekday: 'long', day: 'numeric', month: 'long' });
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
                {/* Timeline Section */}
                <View style={styles.contentSection}>
                    <View style={styles.subHeaderContainer}>
                        <Ionicons name="time-outline" size={20} color="#2D3748" style={styles.subHeaderIcon} />
                        <Text style={styles.subHeader}>ไทม์ไลน์: {formatTimelineDate(timelineDate)}</Text>
                    </View>
                    
                    {isLoadingSlots ? <ActivityIndicator size="large" color="#4A5568" style={{ marginTop: 20 }}/> : memoizedTimeline}
                </View>

                <View style={styles.divider} />
                
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
                        <TouchableOpacity style={[styles.timeTableCell, { flex: 2.5 }]} onPress={() => openPicker(true)}>
                            <Text style={styles.pickerText}>{formatDateOnly(startTime)}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.timeTableCell, { flex: 2.5 }]} onPress={() => openPicker(false)}>
                            <Text style={styles.pickerText}>{formatDateOnly(endTime)}</Text>
                        </TouchableOpacity>
                    </View>
                    
                    {/* แถวที่ 2: เลือก Time */}
                    <View style={styles.timeTable}>
                        <TouchableOpacity style={[styles.timeTableCell, { flex: 2.5 }]} onPress={() => openTimePicker(true)}>
                            <Text style={styles.pickerText}>{formatTimeOnly(startTime)}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.timeTableCell, { flex: 2.5 }]} onPress={() => openTimePicker(false)}>
                            <Text style={styles.pickerText}>{formatTimeOnly(endTime)}</Text>
                        </TouchableOpacity>
                    </View>
                    

                    {/* ส่วนแสดง Picker และ ปุ่มยืนยัน (Conditional Rendering) */}
                    {(showDatePicker || showTimePicker) && (
                        <View style={styles.pickerModal}>
                            <View style={styles.pickerControls}>
                                <TouchableOpacity style={styles.cancelButton} onPress={() => { setShowDatePicker(false); setShowTimePicker(false); }}>
                                    <Text style={styles.cancelButtonText}>ยกเลิก</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={styles.confirmButtonSmall} 
                                    onPress={() => confirmDate(showDatePicker ? 'DATE' : 'TIME')}
                                >
                                    <Text style={styles.confirmButtonSmallText}>ตกลง</Text>
                                </TouchableOpacity>
                            </View>
                            
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
    label: { fontSize: 16, color: '#4A5568', marginBottom: 8, marginTop: 10, fontWeight: '500' },

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
    hourRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, },
    hourLabel: { width: 60, fontSize: 14, color: '#718096', },
    statusBlock: { flex: 1, paddingVertical: 10, borderRadius: 5, alignItems: 'center', },
    availableBlock: { backgroundColor: '#C6F6D5', },
    availableText: { color: '#2F855A', fontWeight: 'bold', },
    bookedBlock: { backgroundColor: '#E2E8F0', },
    bookedText: { color: '#4A5568', fontWeight: '500', },
    
    // Style สำหรับ Error
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, backgroundColor: '#fff' },
    errorText: { fontSize: 18, color: '#E53E3E', marginTop: 10, fontWeight: '600' },
    errorSubText: { fontSize: 14, color: '#718096', textAlign: 'center', marginTop: 5 },
    backHomeButton: { backgroundColor: '#3182ce', padding: 12, borderRadius: 8, marginTop: 20 },
    backHomeText: { color: '#fff', fontWeight: '600' }
});
