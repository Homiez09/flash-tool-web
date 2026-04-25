import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS = 50;

export function middleware(request: NextRequest) {
  // Exclude auth routes from rate limiting to prevent CLIENT_FETCH_ERROR
  if (request.nextUrl.pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const ip = request.ip ?? "127.0.0.1";
  const now = Date.now();
  
  const userRateLimit = rateLimitMap.get(ip) || { count: 0, lastReset: now };
  
  if (now - userRateLimit.lastReset > RATE_LIMIT_WINDOW) {
    userRateLimit.count = 1;
    userRateLimit.lastReset = now;
  } else {
    userRateLimit.count++;
  }
  
  rateLimitMap.set(ip, userRateLimit);
  
  if (userRateLimit.count > MAX_REQUESTS) {
    return NextResponse.json(
      { message: "Too many requests" },
      { status: 429 }
    );
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
