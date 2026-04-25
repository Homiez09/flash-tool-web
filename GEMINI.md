# Project: Flash Tool Pro (v0.3.0 Alpha)

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

## Development Conventions

### Architecture
- **Hardware Layer (`src/lib/`):** Contains `fastboot.ts` and `maintenance.ts` which handle low-level USB communication and specialized repair commands.
- **Auth & Session:** Managed via `src/lib/auth.ts`. Logged-in users are automatically redirected from public pages to the dashboard.
- **Credit System:** Every paid operation (e.g., Unlock Bootloader) must validate user credits on the server side (`src/app/api/user/use-credits/route.ts`) before execution.

---

## Roadmap & Progress

### v0.1.0 Alpha (Completed)
- Initial foundation, Auth system, Credit UI, and basic WebUSB connection.

### v0.2.0 Alpha (Completed)
- **Flashing Engine:** Chunked transfer for large files, progress tracking, and partition selection.

### v0.3.0 Alpha (Current - Completed)
- **Automation & Detection:**
  - Auto-detect Chipset (Qualcomm, MTK, Samsung).
  - Advanced One-Click Tools: Remove Demo Mode, Clean Cache, Fix Bootloop.
  - Device Information Dashboard: Detailed specs on connection.

### v0.4.0 Alpha (Planned)
- Cloud Storage Sync (Flash from URL/GDrive).
- More brand-specific EDL/BROM protocols.

### v1.0.0 (Release)
- Stable release after user verification.
- Payment gateway integration.
