# Project: Flash Tool Pro

## Project Overview
Flash Tool Pro is a professional, universal web-based mobile repair and flashing utility. It allows technicians to perform software maintenance on mobile devices (e.g., Flash ROM, Unlock Bootloader, Bypass FRP, Fix Bootloop) directly through a web browser using the **WebUSB API**.

> **CRITICAL:** All significant project updates, architectural decisions, and specific user instructions must be documented in this `GEMINI.md` file to maintain context across sessions.

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

### Coding Standards
- **Strict Typing:** Always use TypeScript and ensure `npx tsc --noEmit` passes.
- **UI Components:** Use Radix-based components via Shadcn UI. Buttons should always have `cursor-pointer`.
- **Security:** Never commit `.env` files. Maintain `.env.example`.
- **Hardware Safety:** Always use try-catch blocks when communicating with USB devices to handle unexpected disconnects or permission errors.

### Git Workflow
- Perform `npm run build` before every commit to ensure structural integrity.
- Use descriptive commit messages (e.g., `feat:`, `fix:`, `chore:`, `docs:`).
- Always push to `origin main` after successful verification.

---

## Future Roadmap
- Implementation of EDL (Qualcomm) and BROM (MediaTek) protocols.
- Large file flashing support (Chunked streaming over WebUSB).
- Automated Magisk boot image patching.
- Real-world payment gateway integration.
