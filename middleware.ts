import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { ROLE_HOME } from "@/lib/roles";

const SESSION_COOKIE = "leaders_session";
if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("JWT_SECRET is not configured");
}
const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "insecure-dev-secret");

const PROTECTED_PREFIXES: { prefix: string; roles: string[] }[] = [
  { prefix: "/student", roles: ["STUDENT"] },
  { prefix: "/parent", roles: ["PARENT"] },
  { prefix: "/supervisor", roles: ["SUPERVISOR"] },
  { prefix: "/admin", roles: ["ADMIN"] },
  { prefix: "/pending", roles: ["PENDING", "STUDENT", "PARENT", "SUPERVISOR", "ADMIN"] },
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const match = PROTECTED_PREFIXES.find((p) => pathname.startsWith(p.prefix));
  if (!match) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    const role = payload.role as string;
    if (!match.roles.includes(role)) {
      const home = ROLE_HOME[role] ?? "/login";
      return NextResponse.redirect(new URL(home, req.url));
    }
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/student/:path*", "/parent/:path*", "/supervisor/:path*", "/admin/:path*", "/pending"],
};
