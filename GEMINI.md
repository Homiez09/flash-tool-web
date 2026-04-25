# Project: Flash Tool Pro (v0.6.0 Alpha)

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

### v0.1.0 - v0.5.0 Alpha (Completed)
- Foundation, Auth, Credit System, WebUSB integration, Chunked Transfer, Cloud Firmware Sync, and Console Export.

### v0.6.0 Alpha (Current - Completed)
- **Admin Management Dashboard:**
  - Dedicated UI for administrators (`/admin`).
  - **User Management:** View all users and adjust credits manually (Fix top-up issues).
  - **System Configuration:** Global feature flags (Enable/Disable features) and dynamic pricing management.
  - **Role-Based Access Control:** Strict ADMIN/USER separation.
  - **Database Seeding:** Default admin account (`admin@flashtool.pro` / `12345678`) created during setup.
- **Integration:** User dashboard now dynamically responds to admin-configured prices and feature availability.

### v0.7.0 Alpha (Planned)
- Implementation of Samsung-specific protocols (Odin/Loke).
- Automated Magisk patcher integration.

### v1.0.0 (Release)
- Stable release after user verification.
- Payment gateway integration.
