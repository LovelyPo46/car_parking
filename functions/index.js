// functions/index.js (ฉบับแก้ไข)

const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const TIMEZONE = "Asia/Bangkok";

exports.cleanupExpiredBookings = functions.region("asia-southeast1")
  .pubsub.schedule("every 1 hour") // อาจจะไม่ต้องรันบ่อยเท่าเดิม
  .timeZone(TIMEZONE)
  .onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();
    const db = admin.firestore();

    console.log(`Running cleanup function at ${new Date().toLocaleString("th-TH")}`);

    // 1. ค้นหาการจองทั้งหมดที่เวลาสิ้นสุด (endTime) ผ่านมาแล้ว
    const query = db.collection("bookings").where("endTime", "<", now);
    const snapshot = await query.get();

    if (snapshot.empty) {
      console.log("No expired bookings found to cleanup.");
      return null;
    }

    const batch = db.batch();
    snapshot.forEach(doc => {
      // 2. เพิ่มคำสั่งลบลงใน Batch
      batch.delete(doc.ref);
    });

    // 3. ส่งคำสั่งลบทั้งหมด
    await batch.commit();
    console.log(`Successfully cleaned up ${snapshot.size} expired booking(s).`);

    return null;
  });