import { NextRequest, NextResponse } from "next/server";
import { sealData, unsealData } from "iron-session";
import { sessionOptions } from "./lib/session-options";
import ServerEndpoint from "./lib/server-endpoint";

const AUTH_TOKEN_COOKIE = "ELITE_ERA_AUTH_TOKEN";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/auth/login" || pathname === "/auth/register") {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_TOKEN_COOKIE)?.value;
  const sealedSession = request.cookies.get(sessionOptions.cookieName)?.value;

  const response = NextResponse.next();

  if (sealedSession) {
    try {
      const sessionData = await unsealData(sealedSession, sessionOptions);

      const newSealed = await sealData(sessionData, sessionOptions);
      response.cookies.set(sessionOptions.cookieName, newSealed, {
        ...sessionOptions.cookieOptions,
        maxAge: 60 * 5,
      });
    } catch (err) {
      console.error(err);
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
  }

  if (!token) {
    response.cookies.delete(sessionOptions.cookieName);
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  try {
    const apiRes = await ServerEndpoint.get("/auth/status", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (apiRes.status !== 200) throw new Error("Invalid token");

    const sealed = await sealData(apiRes.data, sessionOptions);

    response.cookies.set(sessionOptions.cookieName, sealed, {
      ...sessionOptions.cookieOptions,
      maxAge: 60 * 5,
    });

    return response;
  } catch (err) {
    console.error(err);

    const redirectResponse = NextResponse.redirect(
      new URL("/auth/login", request.url)
    );

    response.cookies.delete(sessionOptions.cookieName);

    return redirectResponse;
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login).*)"],
};
