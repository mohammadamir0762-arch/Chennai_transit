"use client";

import { useEffect, useId, useRef, useState } from "react";
import { searchStops } from "../lib/api";
import { useI18n } from "./I18nProvider";

export default function StopAutocomplete({ label, value, onChange, placeholder }) {
  const { t } = useI18n();
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  // -1 means "typing freely, nothing highlighted" — the rider's own text is
  // still what gets submitted until they explicitly move onto a suggestion.
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef(null);
  const id = useId();
  const listId = `${id}-listbox`;

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const stops = await searchStops(value);
        setSuggestions(stops);
        setActiveIndex(-1);
      } catch {
        setSuggestions([]);
        setActiveIndex(-1);
      }
    }, 250);
    return () => clearTimeout(debounceRef.current);
  }, [value]);

  const isOpen = open && suggestions.length > 0;

  function select(stop) {
    onChange(stop.name);
    setOpen(false);
    setActiveIndex(-1);
  }

  function move(delta) {
    setOpen(true);
    setActiveIndex((current) => {
      if (suggestions.length === 0) return -1;
      const next = current + delta;
      // Wrap, and treat -1 as "back to the typed text" at the top of the list.
      if (next < -1) return suggestions.length - 1;
      if (next >= suggestions.length) return -1;
      return next;
    });
  }

  function handleKeyDown(e) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        move(1);
        break;
      case "ArrowUp":
        e.preventDefault();
        move(-1);
        break;
      case "Enter":
        // Only swallow the key when it's choosing a suggestion; otherwise
        // Enter should still submit the form, as it does in any search box.
        if (isOpen && activeIndex >= 0) {
          e.preventDefault();
          select(suggestions[activeIndex]);
        }
        break;
      case "Escape":
        if (isOpen) {
          e.preventDefault();
          setOpen(false);
          setActiveIndex(-1);
        }
        break;
      case "Tab":
        setOpen(false);
        setActiveIndex(-1);
        break;
      default:
        break;
    }
  }

  return (
    <div className="autocomplete">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="text"
        value={value}
        placeholder={placeholder}
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          isOpen && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined
        }
        autoComplete="off"
        onKeyDown={handleKeyDown}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      <ul
        className="suggestions"
        id={listId}
        role="listbox"
        aria-label={t("autocomplete.listLabel", { field: label })}
        hidden={!isOpen}
      >
        {suggestions.map((stop, i) => (
          <li
            key={stop.id}
            id={`${listId}-${i}`}
            role="option"
            aria-selected={i === activeIndex}
            className={i === activeIndex ? "suggestion active" : "suggestion"}
            // mousedown, not click: the input's blur would close the list
            // before a click ever landed.
            onMouseDown={(e) => {
              e.preventDefault();
              select(stop);
            }}
            onMouseEnter={() => setActiveIndex(i)}
          >
            {stop.name}
          </li>
        ))}
      </ul>
      {/* Screen readers get no notification when a list silently appears
          below the box, so announce how many stops matched. */}
      <div role="status" aria-live="polite" className="visually-hidden">
        {isOpen
          ? t("autocomplete.status", { count: suggestions.length })
          : ""}
      </div>
    </div>
  );
}
