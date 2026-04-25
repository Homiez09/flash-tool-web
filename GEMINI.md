# Project: Flash Tool Pro (v0.7.0 Alpha)

## Project Overview
Flash Tool Pro is a professional, universal web-based mobile repair and flashing utility. It allows technicians to perform software maintenance on mobile devices (e.g., Flash ROM, Unlock Bootloader, Bypass FRP, Fix Bootloop) directly through a web browser using the **WebUSB API**.

> **CRITICAL:** All significant project updates, architectural decisions, and specific user instructions must be documented in this `GEMINI.md` file to maintain context across sessions.

### API Documentation
All API endpoints and security protocols are documented in `API.md`.

### Core Technologies
- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, Shadcn UI, Lucide Icons.
- **Backend:** Next.js API Routes, NextAuth.js (Credentials Provider).
- **Database:** PostgreSQL with Prisma ORM.
- **Hardware Communication:** WebUSB API (`navigator.usb`), custom Fastboot protocol implementation.
- **Security:** Rate limiting middleware, server-side credit validation, database transactions for financial integrity.

---

## Roadmap & Progress

### v0.1.0 - v0.6.0 Alpha (Completed)
- Foundation, Auth, Credit System, WebUSB integration, Chunked Transfer, Cloud Firmware Sync, and Admin Dashboard.

### v0.7.0 Alpha (Current - Completed)
- **Samsung & Root Integration:**
  - **Samsung Support:** Detection for Samsung devices and readiness for Odin/Loke operations.
  - **Auto Magisk Root:** Automated patching and flashing of `boot.img` for rooting devices.
  - **Odin Mode UI:** Specific actions and identification for Samsung handsets.
  - **Improved Specs Detection:** More accurate chipset and bootloader status reading.
- **UI Refinements:** Bold, premium typography with italics for a high-end software look.

### v0.8.0 Alpha (Planned)
- Official Samsung Odin protocol implementation (PIT parsing and flashing).
- Firmware Repository (Search and direct flash from cloud catalog).

### v1.0.0 (Release)
- Stable release after user verification.
- Payment gateway integration.
