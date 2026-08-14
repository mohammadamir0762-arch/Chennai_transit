"use client";

import { useEffect, useRef, useState } from "react";
import { searchStops } from "../lib/api";

export default function StopAutocomplete({ label, value, onChange, placeholder }) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const stops = await searchStops(value);
        setSuggestions(stops);
      } catch {
        setSuggestions([]);
      }
    }, 250);
    return () => clearTimeout(debounceRef.current);
  }, [value]);

  return (
    <div className="autocomplete">
      <label>{label}</label>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && suggestions.length > 0 && (
        <ul className="suggestions">
          {suggestions.map((stop) => (
            <li
              key={stop.id}
              onMouseDown={() => {
                onChange(stop.name);
                setOpen(false);
              }}
            >
              {stop.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
