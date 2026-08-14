"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LOCALES, LOCALE_COOKIE } from "../lib/locales";
import { useI18n } from "./I18nProvider";

export default function LanguageToggle() {
  const { lang, t } = useI18n();
  const pathname = usePathname();

  // Swap the leading /en or /ta and keep the rest of the path.
  const rest = pathname.replace(/^\/[^/]+/, "");

  // Record whichever language is actually being shown, so the next visit to
  // "/" lands in the same one — `proxy.js` reads this cookie. Keyed on the
  // rendered language rather than written from the click handler, so it also
  // captures a language that came from Accept-Language or a shared link.
  useEffect(() => {
    document.cookie = `${LOCALE_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`;
  }, [lang]);

  return (
    <nav className="language-toggle" aria-label={t("language.label")}>
      {LOCALES.map((locale) => (
        <Link
          key={locale}
          href={`/${locale}${rest}`}
          lang={locale}
          hrefLang={locale}
          aria-current={locale === lang ? "true" : undefined}
          className={locale === lang ? "language-option current" : "language-option"}
        >
          {t(`language.${locale}`)}
        </Link>
      ))}
    </nav>
  );
}
