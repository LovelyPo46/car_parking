// screens/HomeScreen.js (ฉบับอัปเดต: แก้ปัญหา N/A และแสดงช่วงเวลาจองทั้ง Start-End)

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView as SafeContextView } from 'react-native-safe-area-context';
import { auth, db, rtdb } from '../firebaseConfig'; 
import { collection, onSnapshot, doc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { ref, onValue, update } from 'firebase/database';
import { Ionicons } from '@expo/vector-icons';

// --- Component: BookingCard ---
const BookingCard = ({ spot, onCancel, navigation, userBooking }) => {
    
    // สถานะการจองปัจจุบันของ User
    const isReservedByCurrentUser = userBooking && userBooking.spotId === spot.spotName;
    const isPhysicallyOccupied = spot.isOccupiedByCar === true; 

    // สถานะการจองปัจจุบันของช่องจอด (โดยใครก็ได้)
    const isReservedNow = spot.isReserved === true || !!spot.currentBooking; 
    
    // 🟢 NEW LOGIC: เลือก Booking Object ที่จะใช้แสดงผล
    // Priority: 1. currentBooking (การจองที่กำลังใช้งานอยู่ตอนนี้) 
    //           2. booking แรกใน allActiveBookings (การจองที่กำลังจะเริ่มหรือเพิ่งเริ่ม)
    const bookingToDisplay = spot.currentBooking || (isReservedNow && spot.allActiveBookings.length > 0 
        ? spot.allActiveBookings[0] 
        : null);

    // 🟢 Helper Function สำหรับการแปลง Timestamp
    const timeFormatter = (timestamp) => timestamp 
        ? timestamp.toDate().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) 
        : 'N/A';
    
    // 🟢 ดึงเวลาเริ่มต้นและสิ้นสุดจาก bookingToDisplay (ถ้ามี)
    const currentBookingStartTime = bookingToDisplay 
        ? timeFormatter(bookingToDisplay.startTime) 
        : 'N/A';
        
    const reservedUntilTime = bookingToDisplay
        ? timeFormatter(bookingToDisplay.endTime) 
        : 'N/A'; // ไม่จำเป็นต้องใช้ RTDB reservedUntil เป็น Fallback แล้ว ถ้าใช้ Logic นี้


    let status, color, detailComponent;

    // --- 1. ตรวจสอบสถานะการจอดจริง (สีแดง/ส้ม: ไม่ว่าง) ---
    if (isPhysicallyOccupied) {
        status = 'ไม่ว่าง';
        
        if (isReservedByCurrentUser) {
            // กรณี 1: รถของผู้จองจอดอยู่จริง -> สีแดงเข้ม (#E53E3E)
            color = '#E53E3E'; 
            const startTime = userBooking.startTime.toDate().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
            const endTime = userBooking.endTime.toDate().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

            detailComponent = (
                <View>
                    <Text style={styles.cardDetailLabel}>รายละเอียด:</Text>
                    <Text style={[styles.cardDetailValue, { color: color, fontWeight: '700' }]}>
                        การจองของคุณ: {startTime} - {endTime} น. (รถจอดแล้ว)
                    </Text>
                </View>
            );
        } else if (isReservedNow) {
            // กรณี 2: มีคนอื่นจองและจอดอยู่ 
            color = '#DD6B20'; // ส้ม
            
            detailComponent = (
                <View>
                    <Text style={styles.cardDetailLabel}>รายละเอียด:</Text>
                    {/* แสดงช่วงเวลาของคนอื่นที่จอง (แบบมีรถจอด) */}
                    <Text style={[styles.cardDetailValue, { color: color, fontWeight: '700' }]}>
                       มีรถจอดอยู่ (จองโดยผู้อื่น: {currentBookingStartTime} - {reservedUntilTime} น.)
                   </Text>
                </View>
            );
        } else {
            // กรณี 3: มีรถจอดอยู่ แต่ไม่มีการจองที่ใช้งานอยู่
            color = '#DD6B20'; // ส้ม
            detailComponent = (
                 <View>
                     <Text style={styles.cardDetailLabel}>รายละเอียด:</Text>
                     <Text style={styles.cardDetailValue}>ไม่ว่าง (มีรถจอด)</Text>
                 </View>
             );
        }
    } 
    // --- 2. ว่างจริงตามเซ็นเซอร์ (สีเขียว/ฟ้า: ว่าง หรือ จองแล้ว) ---
    else {
        // เมื่อไม่มีรถจอดจริง
        const now = new Date();
        const futureBookingsToday = spot.allActiveBookings.filter(b => 
            b.startTime.toDate().toDateString() === now.toDateString() && b.endTime.toDate() > now
        );

        status = 'ว่าง';
        color = '#38A169'; // เขียว

        if (isReservedByCurrentUser) {
             // กรณีพิเศษ: ผู้ใช้จองไว้ แต่ยังไม่จอด
             color = '#3182ce'; // น้ำเงิน/ฟ้า (แสดงว่าจองแล้ว แต่ยังไม่จอด)
             status = 'จองแล้ว';

             const bookingToShow = userBooking;
             const startTime = bookingToShow.startTime.toDate().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
             const endTime = bookingToShow.endTime.toDate().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
            
            detailComponent = (
                <View>
                    <Text style={styles.cardDetailLabel}>รายละเอียด:</Text>
                    <Text style={[styles.cardDetailValue, { color: color, fontWeight: '700' }]}>
                        การจองของคุณ: {startTime} - {endTime} น. (รอรถเข้าจอด)
                    </Text>
                </View>
            );

        } else if (isReservedNow) {
            // 🟢 กรณีที่มีการจองจากเครื่องอื่น (isReservedNow เป็นจริง) แต่ช่องจอดว่าง
            color = '#DD6B20'; // ส้ม
            status = 'จองแล้ว';
            
            detailComponent = (
                <View>
                    <Text style={styles.cardDetailLabel}>รายละเอียด:</Text>
                    {/* 🟢 แสดงช่วงเวลาจองของคนอื่นที่ช่องว่าง */}
                    <Text style={[styles.cardDetailValue, { color: color, fontWeight: '700' }]}>
                        จองแล้ว: {currentBookingStartTime} - {reservedUntilTime} น.
                    </Text>
                </View>
            );

        } else if (futureBookingsToday.length > 0) {
            // มีคนอื่นจองในอนาคต แต่ตอนนี้ว่างจริง
            const bookingSummary = futureBookingsToday.map(booking => {
                const startTime = booking.startTime.toDate().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
                const endTime = booking.endTime.toDate().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
                return `${startTime} - ${endTime} น.`;
            }).join('\n'); 
            
            detailComponent = (
                <View>
                    <Text style={styles.cardDetailLabel}>จองแล้วในวันนี้ (ช่วงเวลาถัดไป):</Text>
                    <Text style={styles.cardDetailValue}>
                        {bookingSummary}
                    </Text>
                </View>
            );
        } else {
            // ว่างตลอดเวลา
            detailComponent = (
                <View>
                     <Text style={styles.cardDetailLabel}>รายละเอียด:</Text>
                     <Text style={styles.cardDetailValue}>ว่างตลอดเวลา</Text>
                </View>
            );
        }
    }
    // ^^^ ------------------------------------------------------------ ^^^


    return (
        <View style={[styles.card, { borderLeftColor: color }]}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>ช่องจอด: {spot.spotName}</Text>
                <View style={[styles.statusBadge, { backgroundColor: color }]}>
                    <Text style={styles.statusText}>{status}</Text>
                </View>
            </View>
            <View style={styles.detailRow}>
                {detailComponent}
            </View>
            <View style={styles.buttonRow}>
                {/* ปุ่มจองจะแสดงเมื่อว่างจริง, ผู้ใช้ไม่มีการจองอื่น, และช่องจอดนั้นยังไม่ถูกจองโดยใคร */}
                {!isPhysicallyOccupied && status === 'ว่าง' && !userBooking && !isReservedNow && (
                    <TouchableOpacity style={[styles.actionButton, styles.reserveButton]} onPress={() => navigation.navigate('Booking', { spotId: spot.spotName })}>
                        <Text style={styles.actionButtonText}>กดจอง</Text>
                    </TouchableOpacity>
                )}
                {/* ปุ่มยกเลิกจองจะแสดงเมื่อผู้ใช้จองช่องจอดนั้นไว้ */}
                {isReservedByCurrentUser && (
                    <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={() => onCancel(userBooking.id, userBooking.spotId)}>
                        <Text style={styles.actionButtonText}>ยกเลิกจอง</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

export default function HomeScreen({ navigation }) {
    const [parkingSpots, setParkingSpots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userBooking, setUserBooking] = useState(null);
    const [allBookings, setAllBookings] = useState([]);

    useEffect(() => {
        const now = new Date();
        
        // 1. Listen to parking spots data (Realtime DB)
        const spotsRef = ref(rtdb, 'parkingSpots/');
        const spotsUnsubscribe = onValue(spotsRef, (spotsSnapshot) => {
            const spotsData = spotsSnapshot.val();
            const allSpots = spotsData ? Object.keys(spotsData).map(key => ({
                id: key,
                spotName: key,
                isOccupiedByCar: spotsData[key].isOccupiedByCar,
                // ดึงสถานะ isReserved และ reservedUntil จาก RTDB
                isReserved: spotsData[key].isReserved || false, 
                reservedUntil: spotsData[key].reservedUntil || null,
            })) : [];

            // 2. Query active bookings (Firestore)
            const bookingsQuery = query(
                collection(db, 'bookings'), 
                where('endTime', '>=', now),
                orderBy('startTime', 'asc')
            );

            // 3. Listen to active bookings
            const bookingsUnsubscribe = onSnapshot(bookingsQuery, (bookingsSnapshot) => {
                const activeBookings = bookingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setAllBookings(activeBookings);
                
                // 4. Combine data 
                const combinedData = allSpots.map(spot => {
                    const bookingsForSpot = activeBookings.filter(b => b.spotId === spot.spotName);
                    
                    const currentBooking = bookingsForSpot.find(b => 
                        b.startTime.toDate() <= now && b.endTime.toDate() > now
                    );

                    return { 
                        ...spot, 
                        currentBooking: currentBooking || null,
                        allActiveBookings: bookingsForSpot.sort((a, b) => a.startTime.toDate() - b.startTime.toDate()), 
                    };
                });

                setParkingSpots(combinedData);
                if (loading) setLoading(false);
            });

            return () => bookingsUnsubscribe();
        });

        // 5. Listen to current user's active booking 
        let userUnsubscribe = () => {};
        if (auth.currentUser) {
            const userQuery = query(collection(db, 'bookings'), where('userId', '==', auth.currentUser.uid), where('endTime', '>=', now));
            userUnsubscribe = onSnapshot(userQuery, (snapshot) => {
                setUserBooking(snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
            });
        }

        return () => {
            spotsUnsubscribe();
            userUnsubscribe();
        };
    }, [loading]);

    // handleCancel function (พร้อมรีเซ็ต RTDB)
    const handleCancel = (bookingId, spotName) => {
        Alert.alert("ยืนยันการยกเลิก", `คุณต้องการยกเลิกการจองช่องจอด ${spotName} หรือไม่?`,
            [{ text: "ไม่", style: "cancel" },
            {
                text: "ยืนยัน", style: "destructive",
                onPress: async () => {
                    try {
                        // 1. ลบการจองออกจาก Firestore
                        await deleteDoc(doc(db, 'bookings', bookingId));
                        
                        // 2. รีเซ็ตสถานะการจองใน Realtime Database
                        await update(ref(rtdb, `parkingSpots/${spotName}`), {
                            isReserved: false,
                            reservedBy: null,
                            reservedUntil: null,
                        });
                        
                        Alert.alert("สำเร็จ", "การจองถูกยกเลิกแล้ว");
                    } catch (error) { Alert.alert("เกิดข้อผิดพลาด", "ยกเลิกไม่สำเร็จ: " + error.message); }
                }
            }]
        );
    };

    return (
        <SafeContextView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>ช่องจอดรถ</Text>
                
                <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.combinedButton}>
                    <Ionicons name="person-circle-outline" size={26} color="#4A5568" />
                    <Text style={styles.combinedButtonText}>ประวัติบัญชี</Text>
                </TouchableOpacity>
                
            </View>
            <ScrollView style={styles.scrollView}>
                {loading ? <ActivityIndicator size="large" color="#2b6cb0" style={{ marginTop: 50 }}/>
                : parkingSpots.map((spot) => (
                    <BookingCard
                        key={spot.id}
                        spot={spot}
                        onCancel={handleCancel}
                        navigation={navigation}
                        userBooking={userBooking}
                    />
                ))}
            </ScrollView>
        </SafeContextView>
    );
}

// (Styles)
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f4f8' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', minHeight: 60 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a202c' },
    combinedButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        backgroundColor: '#edf2f7',
    },
    combinedButtonText: {
        fontSize: 14,
        color: '#4A5568',
        fontWeight: '600',
        marginLeft: 4,
    },
    scrollView: { flex: 1 },
    card: { backgroundColor: '#fff', marginHorizontal: 16, marginVertical: 8, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, borderLeftWidth: 6 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, },
    cardTitle: { fontSize: 18, fontWeight: '600', color: '#2d3748' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    detailRow: { paddingHorizontal: 16, paddingBottom: 12, borderTopWidth: 1, borderTopColor: '#f7fafc', paddingTop: 12 },
    cardDetailLabel: { fontSize: 12, color: '#a0aec0', marginBottom: 2 },
    cardDetailValue: { 
        fontSize: 14, 
        color: '#4a5568', 
        fontWeight: '500',
        marginBottom: 2, 
    },
    currentBookingText: {
        fontWeight: '700', 
        color: '#DD6B20', 
    },
    buttonRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingRight: 16, paddingBottom: 16, minHeight: 40 },
    actionButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, justifyContent: 'center' },
    reserveButton: { backgroundColor: '#3182ce' },
    cancelButton: { backgroundColor: '#e53e3e' },
    actionButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});