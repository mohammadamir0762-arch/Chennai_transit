import { LOCALES, DEFAULT_LOCALE, isLocale } from "../../lib/locales";

// Loaded on the server and handed to the client provider as a prop, so only
// the active language's strings ever reach the browser.
const dictionaries = {
  en: () => import("./dictionaries/en.json").then((m) => m.default),
  ta: () => import("./dictionaries/ta.json").then((m) => m.default),
};

export const getDictionary = async (locale) =>
  dictionaries[isLocale(locale) ? locale : DEFAULT_LOCALE]();

export { LOCALES, DEFAULT_LOCALE, isLocale };
