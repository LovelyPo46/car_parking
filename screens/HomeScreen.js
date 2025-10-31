// screens/HomeScreen.js (ฉบับแก้ไข: Final Solution - รวม Text)

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView as SafeContextView } from 'react-native-safe-area-context';
import { auth, db } from '../firebaseConfig';
import { collection, onSnapshot, doc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

const BookingCard = ({ spot, onCancel, navigation, userBooking }) => {
    
    const isReservedByCurrentUser = userBooking && userBooking.spotId === spot.spotName;
    const isCurrentlyOccupied = spot.currentBooking || isReservedByCurrentUser;

    let status, color, detailComponent;

    // --- 1. จองแล้ว ณ เวลานี้ (สีส้ม) ---
    if (isCurrentlyOccupied) {
        status = 'ไม่ว่าง';
        color = '#DD6B20'; // ส้ม
        
        const bookingToShow = spot.currentBooking || userBooking; 
        
        if (bookingToShow) {
            const startTime = bookingToShow.startTime.toDate().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
            const endTime = bookingToShow.endTime.toDate().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
            
            detailComponent = (
                <View>
                    <Text style={styles.cardDetailLabel}>รายละเอียด:</Text>
                    <Text style={[styles.cardDetailValue, styles.currentBookingText]}>
                        การจองของฉัน: {startTime} - {endTime} น.
                    </Text>
                </View>
            );
        } else {
            detailComponent = (
                <View>
                    <Text style={styles.cardDetailLabel}>รายละเอียด:</Text>
                    <Text style={styles.cardDetailValue}>ไม่ว่าง (ไม่ระบุเวลา)</Text>
                </View>
            );
        }
    } 
    // VVV --- 2. ว่าง แต่มีคิวจองในอนาคต (สีเขียว) หรือ ว่างตลอดเวลา --- VVV
    else {
        const now = new Date();
        const futureBookingsToday = spot.allActiveBookings.filter(b => 
            b.startTime.toDate().toDateString() === now.toDateString() && b.endTime.toDate() > now
        );

        status = 'ว่าง';
        color = '#38A169'; // เขียว

        if (futureBookingsToday.length > 0) {
            // VVV--- แก้ไข: รวมข้อความทั้งหมดใน Text เดียวกัน ---VVV
            const bookingSummary = futureBookingsToday.map(booking => {
                const startTime = booking.startTime.toDate().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
                const endTime = booking.endTime.toDate().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
                return `${startTime} - ${endTime} น.`;
            }).join('\n'); // ใช้ \n เพื่อขึ้นบรรทัดใหม่
            
            detailComponent = (
                <View>
                    <Text style={styles.cardDetailLabel}>จองแล้วในวันนี้:</Text>
                    <Text style={styles.cardDetailValue}>
                        {bookingSummary}
                    </Text>
                </View>
            );
            // ^^^ --------------------------------------------- ^^^
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
                {status === 'ว่าง' && !userBooking && (
                    <TouchableOpacity style={[styles.actionButton, styles.reserveButton]} onPress={() => navigation.navigate('Booking', { spotId: spot.spotName })}>
                        <Text style={styles.actionButtonText}>กดจอง</Text>
                    </TouchableOpacity>
                )}
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
    const userEmail = auth.currentUser?.email || 'ผู้ใช้';

    useEffect(() => {
        const now = new Date();
        
        const spotsUnsubscribe = onSnapshot(collection(db, 'parkingSpots'), (spotsSnapshot) => {
            const allSpots = spotsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const bookingsQuery = query(
                collection(db, 'bookings'), 
                where('endTime', '>=', now),
                orderBy('startTime', 'asc')
            );

            const bookingsUnsubscribe = onSnapshot(bookingsQuery, (bookingsSnapshot) => {
                const activeBookings = bookingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                
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
    }, []);

    const handleCancel = (bookingId, spotName) => {
        Alert.alert("ยืนยันการยกเลิก", `คุณต้องการยกเลิกการจองช่องจอด ${spotName} หรือไม่?`,
            [{ text: "ไม่", style: "cancel" },
            {
                text: "ยืนยัน", style: "destructive",
                onPress: async () => {
                    try {
                        await deleteDoc(doc(db, 'bookings', bookingId));
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
    // VVV--- Style สำหรับรายการจอง ---VVV
    cardDetailValue: { 
        fontSize: 14, 
        color: '#4a5568', 
        fontWeight: '500',
        marginBottom: 2, 
    },
    currentBookingText: {
        fontWeight: '700', // เน้นตัวหนาสำหรับการจองปัจจุบัน
        color: '#DD6B20', // ใช้สีส้มเพื่อให้เห็นชัด
    },
    // ^^^---------------------------------^^^
    buttonRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingRight: 16, paddingBottom: 16, minHeight: 40 },
    actionButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, justifyContent: 'center' },
    reserveButton: { backgroundColor: '#3182ce' },
    cancelButton: { backgroundColor: '#e53e3e' },
    actionButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});