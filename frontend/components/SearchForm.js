"use client";

import { useState } from "react";
import StopAutocomplete from "./StopAutocomplete";

export default function SearchForm({ onSearch, loading }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [time, setTime] = useState("");

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
      <label>
        Departure time (optional)
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
        />
      </label>
      <button type="submit" className="find-routes-button" disabled={loading}>
        {loading ? "Finding routes…" : "Find routes"}
      </button>
    </form>
  );
}
