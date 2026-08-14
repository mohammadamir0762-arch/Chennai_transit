"use client";

import { createContext, useContext, useMemo } from "react";

const I18nContext = createContext(null);

function lookup(dict, path) {
  return path.split(".").reduce((node, key) => (node == null ? node : node[key]), dict);
}

function interpolate(template, vars) {
  return template.replace(/\{(\w+)\}/g, (match, name) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match
  );
}

export function I18nProvider({ lang, dict, children }) {
  const value = useMemo(() => {
    const plurals = new Intl.PluralRules(lang);

    // t("results.minutes", { count: 25 }). A value that is an object rather
    // than a string is a plural form, selected with the language's own rules
    // instead of an English-shaped `count === 1` test.
    function t(path, vars = {}) {
      let entry = lookup(dict, path);

      if (entry && typeof entry === "object") {
        entry = entry[plurals.select(vars.count ?? 0)] ?? entry.other;
      }
      // Show the key rather than nothing, so a missing translation is obvious
      // in review instead of silently rendering an empty label to a rider.
      if (typeof entry !== "string") return path;

      return interpolate(entry, vars);
    }

    return { lang, t };
  }, [lang, dict]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used inside an I18nProvider");
  return context;
}
