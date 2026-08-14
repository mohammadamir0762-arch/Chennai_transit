import { notFound } from "next/navigation";
import { Geist, Geist_Mono, Noto_Sans_Tamil } from "next/font/google";
import "../globals.css";
import { I18nProvider } from "../../components/I18nProvider";
import { getDictionary, isLocale, LOCALES } from "./dictionaries";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Geist has no Tamil glyphs, so Tamil text would fall back to whatever the
// device happens to have. Loaded alongside rather than instead of Geist: the
// browser picks per glyph, so Latin stop names keep the same face in both
// languages and only Tamil characters come from here.
const notoSansTamil = Noto_Sans_Tamil({
  variable: "--font-tamil",
  subsets: ["tamil"],
});

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }) {
  const { lang } = await params;
  if (!isLocale(lang)) return {};

  const dict = await getDictionary(lang);
  return { title: dict.app.title, description: dict.app.description };
}

export default async function RootLayout({ children, params }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const dict = await getDictionary(lang);

  return (
    <html
      lang={lang}
      className={`${geistSans.variable} ${geistMono.variable} ${notoSansTamil.variable}`}
    >
      <body>
        <I18nProvider lang={lang} dict={dict}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
