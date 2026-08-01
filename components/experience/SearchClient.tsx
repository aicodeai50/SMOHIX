"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { searchIndex, type SearchEntry } from "@/lib/experience/search-index";
import { mBody, mBodySm, mFocusRing } from "@/lib/marketing-layout";

const CATEGORY_LABEL: Record<SearchEntry["category"], string> = {
  product: "Product",
  documentation: "Documentation",
  page: "Page",
};

export function SearchClient({ initialQuery = "" }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const results = useMemo(() => searchIndex(query), [query]);

  return (
    <div>
      <label htmlFor="site-search" className="sr-only">
        Search Zentro
      </label>
      <input
        id="site-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search products, docs, and pages…"
        autoFocus
        className="w-full rounded-xl border border-white/[0.1] bg-surface px-4 py-3 text-base focus-visible:border-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/20"
      />
      <p className={`mt-2 ${mBodySm}`}>
        Static index — {results.length} result{results.length === 1 ? "" : "s"}
      </p>
      <ul className="mt-6 space-y-2" aria-live="polite">
        {results.length === 0 ? (
          <li className={mBody}>No matches. Try products, API, demo, or developers.</li>
        ) : (
          results.map((entry) => (
            <li key={entry.id}>
              <Link
                href={entry.href}
                className={`block rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 transition-[border-color] hover:border-accent/30 ${mFocusRing}`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-foreground">{entry.title}</span>
                  <span className="rounded-full border border-white/[0.12] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                    {CATEGORY_LABEL[entry.category]}
                  </span>
                </div>
                <p className={`mt-1 text-sm ${mBody}`}>{entry.description}</p>
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
