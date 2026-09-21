import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Rotas públicas
  const rotasPublicas = ["/login", "/cadastro", "/r", "/api", "/_next", "/favicon"];
  if (rotasPublicas.some((r) => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  // Verifica cookie de sessão do Supabase
  const token = request.cookies.get("sb-unxpulwbdwoeiqtrodmu-auth-token");
  const tokenLegacy = request.cookies.get("supabase-auth-token");

  if (!token && !tokenLegacy) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
