import { NextRequest, NextResponse } from "next/server";
import { sealData, unsealData } from "iron-session";

import { sessionOptions } from "./lib/session-options";

const AUTH_TOKEN_COOKIE = "ELITE_ERA_AUTH_TOKEN";
const SESSION_MAX_AGE_SECONDS = 60 * 5;

function isPublicRoute(pathname: string): boolean {
  return (
    pathname === "/auth/login" ||
    pathname === "/auth/register" ||
    pathname === "/auth/reset-password" ||
    pathname.startsWith("/auth/reset-password/")
  );
}

function redirectToLogin(request: NextRequest): NextResponse {
  const response = NextResponse.redirect(new URL("/auth/login", request.url));
  response.cookies.delete(sessionOptions.cookieName);
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_TOKEN_COOKIE)?.value;

  if (!token) {
    return redirectToLogin(request);
  }

  const sealedSession = request.cookies.get(sessionOptions.cookieName)?.value;

  if (sealedSession) {
    try {
      const sessionData = await unsealData(sealedSession, sessionOptions);
      const refreshedSession = await sealData(sessionData, sessionOptions);
      const response = NextResponse.next();

      response.cookies.set(sessionOptions.cookieName, refreshedSession, {
        ...sessionOptions.cookieOptions,
        maxAge: SESSION_MAX_AGE_SECONDS,
      });

      return response;
    } catch {
      // The JWT is still checked below and a new frontend session is created.
    }
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "");

  if (!apiUrl) {
    return redirectToLogin(request);
  }

  try {
    const apiResponse = await fetch(`${apiUrl}/auth/status`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!apiResponse.ok) {
      return redirectToLogin(request);
    }

    const user = await apiResponse.json();
    const sealed = await sealData(user, sessionOptions);
    const response = NextResponse.next();

    response.cookies.set(sessionOptions.cookieName, sealed, {
      ...sessionOptions.cookieOptions,
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    return response;
  } catch {
    return redirectToLogin(request);
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon.png).*)"],
};
