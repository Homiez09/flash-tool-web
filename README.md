# Flash Tool Pro - ระบบจัดการและซ่อมแซมมือถือออนไลน์

**Flash Tool Pro** เป็น Web Application สำหรับช่างซ่อมมือถือมืออาชีพ ที่ช่วยให้คุณสามารถสื่อสารกับโทรศัพท์มือถือผ่านโปรโตคอล Fastboot และ ADB ได้โดยตรงจากเบราว์เซอร์ โดยใช้เทคโนโลยี WebUSB ไม่ต้องติดตั้งโปรแกรมเสริมที่ซับซ้อน

## 🚀 ฟีเจอร์หลัก (Key Features)
- **WebUSB Connection:** เชื่อมต่อและตรวจจับอุปกรณ์ (VID/PID/Serial) ได้ทันทีจาก Chrome/Edge
- **Fastboot Protocol:** สั่งงาน Reboot และเช็คสถานะผ่าน Fastboot Interface
- **One-Click Tools:** สคริปต์อัตโนมัติสำหรับการปลดล็อก Bootloader, Bypass FRP และแก้ไขปัญหา Bootloop
- **Credit System:** ระบบสมาชิกและเครดิตสำหรับการเข้าใช้งานฟีเจอร์ต่างๆ (พร้อมระบบตรวจสอบความปลอดภัยฝั่ง Server)
- **Activity Logs:** หน้าจอ Terminal สำหรับดูการทำงานของระบบแบบ Real-time
- **SEO Optimized:** รองรับการค้นหาผ่าน Search Engine และระบบจัดการ Metadata ที่สมบูรณ์

---

## 🛠 การติดตั้งและตั้งค่า (Installation)

### 1. ความต้องการของระบบ (Prerequisites)
- **Node.js:** เวอร์ชั่น 20 ขึ้นไป
- **Docker & Docker Compose:** สำหรับรันฐานข้อมูล PostgreSQL
- **Web Browser:** Google Chrome หรือ Microsoft Edge (ที่รองรับ WebUSB API)

### 2. ดาวน์โหลดโปรเจกต์ (Clone Project)
```bash
git clone https://github.com/Homiez09/flash-tool-web.git
cd flash-tool-web
```

### 3. ติดตั้ง Dependencies
```bash
npm install
```

### 4. ตั้งค่า Environment Variables
คัดลอกไฟล์ตัวอย่างและแก้ไขค่าต่างๆ ให้ถูกต้อง
```bash
cp .env.example .env
```
เปิดไฟล์ `.env` และตั้งค่า:
- `DATABASE_URL`: URL สำหรับเชื่อมต่อฐานข้อมูล (ถ้าใช้ Docker ตามโปรเจกต์นี้ ค่าเริ่มต้นคือ `postgresql://admin:12345678@localhost:6000/flash_tool_db?schema=public`)
- `NEXTAUTH_SECRET`: รหัสลับสำหรับระบบ Token (สร้างใหม่ได้ด้วยคำสั่ง `openssl rand -base64 32`)

### 5. เริ่มต้นใช้งาน Database (Docker)
รันฐานข้อมูล PostgreSQL ผ่าน Docker Compose:
```bash
docker-compose up -d
```
หลังจากนั้นรันคำสั่งสร้างตารางในฐานข้อมูล:
```bash
npx prisma db push
```

### 6. เริ่มรันแอปพลิเคชัน
```bash
npm run dev
```
เข้าใช้งานได้ที่: `http://localhost:3000`

---

## 📅 แผนการพัฒนาในอนาคต (Future Updates)
- [ ] **Advanced Flashing:** ระบบอัปโหลดและ Flash ไฟล์ Firmware ขนาดใหญ่ (.img, .bin)
- [ ] **More Protocols:** เพิ่มการรองรับโหมด **EDL (Qualcomm)** และ **BROM (MediaTek)**
- [ ] **Auto Magisk Patcher:** ระบบดึงไฟล์ boot.img มา Patch Magisk และ Root ให้อัตโนมัติ
- [ ] **Firmware Library:** คลังดาวน์โหลด Firmware ศูนย์ที่อัปเดตตลอดเวลา
- [ ] **Payment Integration:** ระบบเติมเครดิตผ่าน PromptPay และ Stripe
- [ ] **Multi-language:** รองรับการเปลี่ยนภาษา (ไทย/อังกฤษ) ทั่วทั้งแอปพลิเคชัน

---

## 👤 ผู้พัฒนา (Developer)
- **GitHub:** [@Homiez09](https://github.com/Homiez09)

---
*หมายเหตุ: โปรแกรมนี้พัฒนาขึ้นเพื่อวัตถุประสงค์ทางการศึกษาและสำหรับช่างเทคนิคที่เชี่ยวชาญเท่านั้น การใช้งานมีความเสี่ยงต่อข้อมูลในตัวเครื่อง โปรดใช้งานด้วยความระมัดระวัง*
