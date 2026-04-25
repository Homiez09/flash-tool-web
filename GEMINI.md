# Project: Flash Tool Pro (v0.5.0 Alpha)

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

## Building and Running

### Prerequisites
- Node.js 20+
- Docker & Docker Compose (for PostgreSQL)
- Chrome or Edge Browser (supporting WebUSB)

### Setup Commands
1. **Clone & Install:**
   ```bash
   npm install
   ```
2. **Environment Configuration:**
   ```bash
   cp .env.example .env
   # Edit .env with your DATABASE_URL and NEXTAUTH_SECRET
   ```
3. **Database Setup:**
   ```bash
   docker-compose up -d
   npx prisma db push
   ```
4. **Development Mode:**
   ```bash
   npm run dev
   ```
5. **Production Build:**
   ```bash
   npm run build
   ```

---

## Roadmap & Progress

### v0.1.0 - v0.4.0 Alpha (Completed)
- Foundation, Auth, Credit System, WebUSB integration, Chunked Transfer, and Cloud Firmware Sync.

### v0.5.0 Alpha (Current - Completed)
- **Advanced Dashboard & History:**
  - Real Activity History API and UI (No more mocks).
  - **Console Log Export:** Save terminal output to `.txt` files for documentation.
  - **Premium UI Overhaul:** Extremely high-end dashboard design with refined typography and spacing.
  - Enhanced device specifications detection and hardware info card.
  - Improved "One-Click" tools layout and interaction.

### v0.6.0 Alpha (Planned)
- Implementation of brand-specific protocols (Odin/Loke for Samsung).
- Local storage for recent device specs to allow offline review.

### v1.0.0 (Release)
- Stable release after user verification.
- Payment gateway integration.
