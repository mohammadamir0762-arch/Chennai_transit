"use client";

import { useEffect, useState } from "react";
import StopAutocomplete from "./StopAutocomplete";

function currentTimeValue() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

export default function SearchForm({ onSearch, loading }) {
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
        label="From"
        value={from}
        onChange={setFrom}
        placeholder="Starting point"
      />
      <button
        type="button"
        className="swap-button"
        onClick={swap}
        aria-label="Swap from and to"
      >
        ⇅
      </button>
      <StopAutocomplete
        label="To"
        value={to}
        onChange={setTo}
        placeholder="Destination"
      />
      <label className="time-field">
        Leaving at
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
              onClick={() => setTime(currentTimeValue())}
            >
              Now
            </button>
          )}
        </span>
      </label>
      <button type="submit" className="find-routes-button" disabled={loading}>
        {loading ? "Finding routes…" : "Find routes"}
      </button>
    </form>
  );
}
