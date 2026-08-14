"use client";

import { useEffect, useState } from "react";
import StopAutocomplete from "./StopAutocomplete";
import { useI18n } from "./I18nProvider";

function currentTimeValue() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

export default function SearchForm({ onSearch, loading }) {
  const { t } = useI18n();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [time, setTime] = useState("");

  // Most trips are planned standing at the stop right now, so prefill the
  // current time rather than making the rider set it. Done on mount, not in
  // useState, because rendering a clock-dependent value on the server would
  // mismatch the client on hydration.
  useEffect(() => {
    setTime(currentTimeValue());
  }, []);

  const isNow = time === currentTimeValue();

  function swap() {
    setFrom(to);
    setTo(from);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!from.trim() || !to.trim()) return;
    onSearch({ from, to, time });
  }

  return (
    <form className="search-form" onSubmit={handleSubmit}>
      <StopAutocomplete
        label={t("search.from")}
        value={from}
        onChange={setFrom}
        placeholder={t("search.fromPlaceholder")}
      />
      <button
        type="button"
        className="swap-button"
        onClick={swap}
        aria-label={t("search.swap")}
      >
        <span aria-hidden="true">⇅</span>
      </button>
      <StopAutocomplete
        label={t("search.to")}
        value={to}
        onChange={setTo}
        placeholder={t("search.toPlaceholder")}
      />
      <label className="time-field">
        {t("search.leavingAt")}
        <span className="time-input-row">
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
          {!isNow && (
            <button
              type="button"
              className="now-button"
              title={t("search.nowHint")}
              onClick={() => setTime(currentTimeValue())}
            >
              {t("search.now")}
            </button>
          )}
        </span>
      </label>
      <button type="submit" className="find-routes-button" disabled={loading}>
        {loading ? t("search.submitting") : t("search.submit")}
      </button>
    </form>
  );
}
