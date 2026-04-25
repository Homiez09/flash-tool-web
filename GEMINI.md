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
- Foundation, Auth, Credit System, WebUSB integration, Chunked Transfer, Cloud Firmware Sync, Admin Dashboard, and History Tracking.

### v0.7.0 Alpha (Current - Completed)
- **UI Refinement & Root Integration:**
  - **Compact UI Overhaul:** Maintenance cards and action buttons resized for better usability and consistency.
  - **Auto Magisk Root:** Automated patching and flashing of `boot.img` via a dedicated one-click tool.
  - **Dynamic Config Integration:** UI now correctly responds to Admin-set pricing and feature toggles.
  - **Real History Dashboard:** Users can view their real transaction history and export session logs.
  - **Samsung Detection:** Enhanced hardware specs detection specifically for Samsung handsets.

### v0.8.0 Alpha (Planned)
- Implementation of Samsung Odin protocol (PIT/Tar flashing).
- Firmware Cloud Catalog (Search and direct stream flash).

### v1.0.0 (Release)
- Stable release after user verification.
- Payment gateway integration (PromptPay/Stripe).
