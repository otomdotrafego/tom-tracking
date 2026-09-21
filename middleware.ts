import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Rotas públicas — sem proteção
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/r") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes("favicon")
  ) {
    return NextResponse.next();
  }

  // Verifica se tem qualquer cookie de sessão do Supabase
  const cookies = request.cookies.getAll();
  const temSessao = cookies.some(
    (c) => c.name.includes("sb-") && c.name.includes("auth-token")
  );

  if (!temSessao) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
