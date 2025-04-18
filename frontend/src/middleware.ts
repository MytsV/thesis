import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getApiUrl } from "@/lib/api";

const protectedPaths = ["/dashboard"];
const authPaths = ["/login", "/register"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("session")?.value;
  const response = NextResponse.next();

  // Handle unauthenticated requests to protected routes
  if (!sessionCookie && isProtectedPath(pathname)) {
    return redirectToLogin(request, pathname);
  }

  // No further processing needed if no session exists
  if (!sessionCookie) {
    return response;
  }

  try {
    const userData = await validateSession(sessionCookie);

    // Valid session
    if (userData) {
      addUserHeadersToResponse(response, userData);

      // Redirect authenticated users away from auth pages
      if (isAuthPath(pathname)) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
    // Invalid session
    else {
      response.cookies.delete("session");

      if (isProtectedPath(pathname)) {
        return redirectToLogin(request, pathname);
      }
    }
  } catch (error) {
    console.error("Error validating session:", error);
    response.cookies.delete("session");

    if (isProtectedPath(pathname)) {
      return redirectToLogin(request, pathname);
    }
  }

  return response;
}

// Helper functions
async function validateSession(sessionCookie: string) {
  const validateResponse = await fetch(`${getApiUrl()}/auth/validate`, {
    method: "GET",
    headers: {
      Cookie: `session=${sessionCookie}`,
    },
    credentials: "include",
  });

  if (!validateResponse.ok) {
    return null;
  }

  return await validateResponse.json();
}

function addUserHeadersToResponse(response: NextResponse, userData: any) {
  response.headers.set("x-user-id", userData.id.toString());
  response.headers.set("x-user-name", userData.username);
  response.headers.set("x-user-email", userData.email);
}

function isProtectedPath(pathname: string) {
  return protectedPaths.some((path) => pathname.startsWith(path));
}

function isAuthPath(pathname: string) {
  return authPaths.some((path) => pathname.startsWith(path));
}

function redirectToLogin(request: NextRequest, pathname: string) {
  return NextResponse.redirect(
    new URL(`/login?returnUrl=${encodeURIComponent(pathname)}`, request.url),
  );
}

export const config = {
  matcher: ["/login", "/register", "/dashboard", "/"],
};
