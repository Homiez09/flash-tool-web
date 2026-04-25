# Project: Flash Tool Pro (v0.9.0 Alpha)

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

### v0.1.0 - v0.8.0 Alpha (Completed)
- Foundation, Auth, Credit System, WebUSB integration, Chunked Transfer, Cloud Firmware Sync, Admin Dashboard, and Firmware Catalog.

### v0.9.0 Alpha (Current - Completed)
- **Samsung Specialized Protocol:**
  - Initial implementation of **Samsung Odin/Loke** protocol handler (`src/lib/odin.ts`).
  - **PIT Interface:** Support for reading Partition Information Table (PIT) from Samsung devices in Download Mode.
  - **Odin Handshake:** Basic communication startup for Samsung-specific hardware.
  - **Context-Aware Reboot:** System automatically uses Odin reboot or Fastboot reboot based on chipset detection.
- **Maintenance Tools v2:** Integration of Samsung-specific tools into the main workflow.

### v0.9.5 Alpha (Planned)
- Admin Firmware Management (Add/Edit/Delete Firmware from Web UI).

### v1.0.0 (Release Candidate)
- Stable release after user verification.
- Payment gateway integration (PromptPay/Stripe).
