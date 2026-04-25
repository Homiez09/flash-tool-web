# Flash Tool Pro - API Documentation

เอกสารนี้ระบุ Endpoint ทั้งหมดที่ใช้งานในระบบ Flash Tool Pro เพื่อการตรวจสอบและพัฒนาต่อยอด

## 1. Authentication (NextAuth.js)

### **POST** `/api/auth/signin`
- **Description:** เข้าสู่ระบบด้วย Email และ Password
- **Payload:** `{ email, password }`
- **Response:** Session Token (Managed by NextAuth)

### **POST** `/api/register`
- **Description:** สมัครสมาชิกใหม่ (รับฟรี 100 Credits)
- **Payload:** `{ name, email, password }`
- **Validation:** Zod (name: min 2, email: valid, password: min 6)
- **Response:** `201 Created` พร้อมข้อมูล User ID

---

## 2. User & Credits

### **POST** `/api/user/topup`
- **Description:** เติมเครดิตจำลอง (Phase 1 Hardcode)
- **Authorization:** ต้อง Login เท่านั้น
- **Payload:** `{ amount: number }`
- **Response:** `{ message: "Success", credits: number }`

### **POST** `/api/user/use-credits`
- **Description:** หักเครดิตเมื่อใช้งานฟีเจอร์ซ่อมแซม
- **Authorization:** ต้อง Login เท่านั้น
- **Payload:** `{ amount: number, description: string }`
- **Validation:** ตรวจสอบยอดเงินคงเหลือจาก Database ก่อนหัก
- **Response:** `200 OK` หรือ `400 Insufficient credits`

---

## 3. Device Operations (WebUSB - Client Side Only)
*หมายเหตุ: ส่วนนี้ทำงานบน Browser (lib/fastboot.ts) ไม่ได้เรียกผ่าน API หลังบ้านเพื่อความเร็วสูงสุด*

- **Internal Command:** `download:<hex_size>` (เตรียมรับข้อมูล)
- **Internal Command:** `flash:<partition>` (เขียนข้อมูลลง partition)
- **Internal Command:** `erase:<partition>` (ล้างข้อมูล)
- **Internal Command:** `reboot` (สั่งเริ่มระบบใหม่)

---

## 4. Planned APIs (Future)

### **GET** `/api/firmware`
- **Description:** ดึงรายการ Firmware จาก Cloud Repository
- **Query:** `?model=...&brand=...`

### **GET** `/api/history`
- **Description:** ดึงประวัติการซ่อมแซมของผู้ใช้
- **Response:** Array ของรายการ Transaction และ Device Info

---

## Security Protocol
1. **Rate Limiting:** จำกัดจำนวน Request ต่อ IP เพื่อป้องกัน DDoS
2. **Server-Side Validation:** ตรวจสอบยอดเครดิตทุกครั้งที่ Server ก่อนเริ่มทำงาน
3. **Database Transactions:** ใช้ Transaction ของ Prisma เพื่อป้องกันข้อมูลผิดพลาดกรณี Error ระหว่างหักเครดิต
