"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "motion/react";

export type SearchSuggestion = { label: string; handle?: string | null; type: string };

type SearchBarProps = {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  suggestions?: SearchSuggestion[];
  onSelectSuggestion?: (s: SearchSuggestion) => void;
  showSuggestions?: boolean;
  setShowSuggestions?: (v: boolean) => void;
  placeholders?: string[];
  className?: string;
};

export function SearchBar({
  value,
  onChange,
  onSubmit,
  onFocus,
  onBlur,
  suggestions = [],
  onSelectSuggestion,
  showSuggestions,
  setShowSuggestions,
  placeholders = [
    "Bluzy premium",
    "Koszulki oversize",
    "Czapki beanie",
    "Sweatshirts L",
    "Global hoodie",
  ],
  className,
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [phIndex, setPhIndex] = useState(0);
  const [isVanishing, setIsVanishing] = useState(false);
  const [vanishChars, setVanishChars] = useState<string[]>([]);
  const suppressSuggestRef = useRef<number>(0);

  // Rotacja placeholderów gdy pole puste
  useEffect(() => {
    if (value) return;
    const id = setInterval(() => setPhIndex((i) => (i + 1) % placeholders.length), 2500)
    return () => clearInterval(id)
  }, [value, placeholders.length])

  // Skrót "/" do fokusu
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && !isInputLike(document.activeElement)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Zamknij sugestie gdy wartość krótsza niż 2 znaki
  useEffect(() => {
    if (!setShowSuggestions) return
    if (!value || value.length < 2) setShowSuggestions(false)
  }, [value, setShowSuggestions])

  // Ziarna animacji (losowe przesunięcia, rotacja, blur) i reverse-stagger
  const seeds = useMemo(() => {
    const n = vanishChars.length
    return vanishChars.map((_, idx) => {
      const step = 0.035
      const delay = (n - 1 - idx) * step
      const rand = (min: number, max: number) => min + Math.random() * (max - min)
      return { delay, x: rand(10, 24), y: rand(-8, 8), rot: rand(-10, 10), blur: rand(2, 6) }
    })
  }, [vanishChars])

  const currentPlaceholder = placeholders[phIndex] || "Szukaj";

  return (
    <div className={"relative w-full " + (className || "") }>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (value.trim()) {
            setVanishChars(value.split(""));
            setIsVanishing(true);
          }
          // zablokuj otwieranie sugestii na chwilę po submit
          suppressSuggestRef.current = Date.now() + 1000
          onSubmit();
          setShowSuggestions?.(false);
          if (value.trim()) {
            setTimeout(() => onChange(""), 420)
            setTimeout(() => { setIsVanishing(false); setVanishChars([]) }, 900)
          }
        }}
      >
        <div className="relative group">
          <Input
            ref={inputRef}
            value={value}
            onFocus={() => {
              onFocus?.();
              if (Date.now() > suppressSuggestRef.current && value && value.length >= 2) {
                setShowSuggestions?.(true)
              } else {
                setShowSuggestions?.(false)
              }
            }}
            onBlur={() => { onBlur?.() }}
            onChange={(e) => {
              const next = e.target.value
              onChange(next)
              if (Date.now() > suppressSuggestRef.current && next.length >= 2) {
                setShowSuggestions?.(true)
              } else {
                setShowSuggestions?.(false)
              }
            }}
            placeholder=""
            className={`pr-28 pl-10 h-11 rounded-xl border border-border bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40 focus-visible:ring-2 focus-visible:ring-primary/40 ${isVanishing ? 'text-transparent caret-foreground' : ''}`}
          />

          {/* Ikona lupy */}
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
          </div>

          {/* Przycisk submit */}
          <Button type="submit" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 px-4">Szukaj</Button>

          {/* Vanish overlay: rozproszenie liter od końca */}
          <AnimatePresence>
            {isVanishing && vanishChars.length > 0 && (
              <motion.div
                key={`vanish-${vanishChars.join("")}`}
                className="pointer-events-none absolute left-10 right-28 top-1/2 -translate-y-1/2 flex leading-[44px]"
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {vanishChars.map((ch, idx) => (
                  <motion.span
                    key={idx}
                    initial={{ opacity: 1, x: 0, y: 0, rotate: 0, filter: 'blur(0px)' }}
                    animate={{
                      opacity: 0,
                      x: seeds[idx]?.x || 16,
                      y: seeds[idx]?.y || 0,
                      rotate: seeds[idx]?.rot || 0,
                      filter: `blur(${Math.round(seeds[idx]?.blur || 4)}px)`
                    }}
                    transition={{ duration: 0.5, ease: 'easeOut', delay: seeds[idx]?.delay || 0 }}
                    className="text-sm text-foreground"
                  >
                    {ch === " " ? "\u00A0" : ch}
                  </motion.span>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Placeholder overlay */}
          {!value && !isVanishing && (
            <div className="pointer-events-none absolute left-10 right-28 top-1/2 -translate-y-1/2 text-sm text-muted-foreground/70">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={phIndex}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 0.7, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.35 }}
                  className="block truncate"
                >
                  {currentPlaceholder}
                </motion.span>
              </AnimatePresence>
            </div>
          )}

          {/* Skrót KBD */}
          <div className="pointer-events-none absolute right-24 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 text-xs text-muted-foreground/70">
            <kbd className="rounded border bg-muted px-1.5 py-0.5">/</kbd>
            <span>szukaj</span>
          </div>
        </div>
      </form>

      {/* Sugestie */}
      {showSuggestions && suggestions?.length > 0 && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-xl">
          <ul className="max-h-72 overflow-auto py-1">
            {suggestions.map((sug, idx) => (
              <li
                key={idx}
                className="px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer flex items-center justify-between"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onSelectSuggestion?.(sug)}
              >
                <span className="truncate">{sug.label}</span>
                <span className="ml-3 shrink-0 text-[11px] uppercase tracking-wide text-muted-foreground">{sug.type}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function isInputLike(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName?.toLowerCase();
  return tag === "input" || tag === "textarea" || (el as any).isContentEditable;
}
