// screens/HistoryScreen.js

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView as SafeContextView } from 'react-native-safe-area-context';
import { auth, db } from '../firebaseConfig';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';

const HistoryItem = ({ item }) => {
    const formatTimestamp = (timestamp) => {
        if (!timestamp || typeof timestamp.toDate !== 'function') return 'ไม่มีข้อมูล';
        return timestamp.toDate().toLocaleString('th-TH', {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <View style={styles.card}>
            <Text style={styles.cardTitle}>ช่องจอด: {item.spotId}</Text>
            <Text style={styles.cardDetail}>
                ตั้งแต่: {formatTimestamp(item.startTime)} น.
            </Text>
            <Text style={styles.cardDetail}>
                ถึง: {formatTimestamp(item.endTime)} น.
            </Text>
        </View>
    );
};

export default function HistoryScreen({ navigation }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (auth.currentUser) {
            const q = query(
                collection(db, 'bookings'), 
                where('userId', '==', auth.currentUser.uid), 
                orderBy('startTime', 'desc')
            );
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const userHistory = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setHistory(userHistory);
                setLoading(false);
            }, (error) => {
                console.error("Failed to fetch history:", error);
                setLoading(false);
            });
            return () => unsubscribe();
        } else {
            setLoading(false);
        }
    }, []);

    return (
        <SafeContextView style={styles.container}>
            <View style={styles.topbar}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back-outline" size={28} color="#2D3748" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>ประวัติการจอง</Text>
                <TouchableOpacity style={styles.profileButton} onPress={() => navigation.navigate('Profile')}>
                    <Ionicons name="person-outline" size={24} color="#4A5568" />
                </TouchableOpacity>
            </View>

            {loading ? <ActivityIndicator size="large" color="#2b6cb0" style={{ marginTop: 20 }} />
                : history.length > 0 ? (
                    <FlatList
                        data={history}
                        renderItem={({ item }) => <HistoryItem item={item} />}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContainer}
                    />
                ) : (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.noHistoryText}>ยังไม่มีประวัติการจอง</Text>
                    </View>
                )}
        </SafeContextView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f7f7f7' },
    topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, height: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
    backBtn: { justifyContent: 'center', alignItems: 'center', width: 44, height: 44 },
    profileButton: { justifyContent: 'center', alignItems: 'center', width: 44, height: 44 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#1a202c' },
    listContainer: { padding: 16 },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    cardTitle: { fontSize: 16, fontWeight: '600', color: '#2d3748', marginBottom: 8 },
    cardDetail: { fontSize: 14, color: '#4a5568', marginTop: 4 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    noHistoryText: { textAlign: 'center', marginTop: 30, fontSize: 16, color: '#718096' },
});