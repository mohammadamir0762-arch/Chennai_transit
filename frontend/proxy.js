import { NextResponse } from "next/server";
import { LOCALE_COOKIE, isLocale, matchLocale } from "./lib/locales";

// Every route lives under /[lang], so a bare "/" has to be sent somewhere.
// An explicit choice (the cookie the language toggle sets) wins over the
// browser's Accept-Language, which in turn beats the English default.
export function proxy(request) {
  const { pathname } = request.nextUrl;

  const firstSegment = pathname.split("/")[1];
  if (isLocale(firstSegment)) return;

  const preferred = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(preferred)
    ? preferred
    : matchLocale(request.headers.get("accept-language"));

  request.nextUrl.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  matcher: ["/((?!_next|leaflet|favicon.ico).*)"],
};
