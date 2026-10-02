"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { formatINR } from "@/lib/utils/money";
import {
  SearchResponseDTO,
  SearchEventResultDTO,
  SearchTaskResultDTO,
  SearchGuestResultDTO,
  SearchVendorResultDTO,
  SearchExpenseResultDTO,
  SearchDocumentResultDTO,
} from "@/modules/search/dto/search.dto";

interface WorkspaceSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  weddingId?: string;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

type FlatResultItem =
  | { type: "EVENT"; data: SearchEventResultDTO }
  | { type: "TASK"; data: SearchTaskResultDTO }
  | { type: "GUEST"; data: SearchGuestResultDTO }
  | { type: "VENDOR"; data: SearchVendorResultDTO }
  | { type: "EXPENSE"; data: SearchExpenseResultDTO }
  | { type: "DOCUMENT"; data: SearchDocumentResultDTO };

export function WorkspaceSearchModal({
  isOpen,
  onClose,
  weddingId,
  triggerRef,
}: WorkspaceSearchModalProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchData, setSearchData] = useState<SearchResponseDTO | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  // Adjust search state when query or modal opens
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const [prevQuery, setPrevQuery] = useState(debouncedQuery);
  if (isOpen !== prevIsOpen || debouncedQuery !== prevQuery) {
    setPrevIsOpen(isOpen);
    setPrevQuery(debouncedQuery);
    if (!isOpen) {
      setQuery("");
      setDebouncedQuery("");
      setSearchData(null);
      setError(null);
      setSelectedIndex(0);
    } else if (debouncedQuery.length < 2) {
      setSearchData(null);
      setError(null);
      setLoading(false);
    }
  }

  // Flatten results for keyboard ArrowUp/ArrowDown selection
  const flatItems: FlatResultItem[] = React.useMemo(() => {
    if (!searchData?.results) return [];
    const items: FlatResultItem[] = [];

    (searchData.results.events || []).forEach((e) => items.push({ type: "EVENT", data: e }));
    (searchData.results.tasks || []).forEach((t) => items.push({ type: "TASK", data: t }));
    (searchData.results.guests || []).forEach((g) => items.push({ type: "GUEST", data: g }));
    (searchData.results.vendors || []).forEach((v) => items.push({ type: "VENDOR", data: v }));
    (searchData.results.expenses || []).forEach((ex) => items.push({ type: "EXPENSE", data: ex }));
    (searchData.results.documents || []).forEach((d) => items.push({ type: "DOCUMENT", data: d }));

    return items;
  }, [searchData]);

  // Debounce query string (250ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 250);
    return () => clearTimeout(handler);
  }, [query]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Manual search trigger for retry
  const performSearch = useCallback(
    (q: string) => {
      if (!weddingId || q.length < 2) return;
      setLoading(true);
      setError(null);
      fetch(`/api/v1/weddings/${weddingId}/search?q=${encodeURIComponent(q)}&limit=5`)
        .then((res) => res.json())
        .then((json) => {
          if (json.success) {
            setSearchData(json.data);
            setSelectedIndex(0);
          } else {
            setError(json.error?.message || "Failed to load search results.");
          }
        })
        .catch((err: unknown) => {
          console.error("Error executing workspace search:", err);
          setError("Network error occurred. Please try again.");
        })
        .finally(() => {
          setLoading(false);
        });
    },
    [weddingId]
  );

  // Fetch search results asynchronously on debouncedQuery change
  useEffect(() => {
    let ignore = false;
    if (debouncedQuery.length < 2 || !weddingId) {
      return;
    }

    const controller = new AbortController();
    Promise.resolve().then(() => {
      if (!ignore) {
        setLoading(true);
        setError(null);
      }
    });

    fetch(`/api/v1/weddings/${weddingId}/search?q=${encodeURIComponent(debouncedQuery)}&limit=5`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((json) => {
        if (ignore) return;
        if (json.success) {
          setSearchData(json.data);
          setSelectedIndex(0);
        } else {
          setError(json.error?.message || "Failed to load search results.");
        }
      })
      .catch((err: unknown) => {
        if (ignore || (err instanceof Error && err.name === "AbortError")) return;
        console.error("Error executing workspace search:", err);
        setError("Network error occurred. Please try again.");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [debouncedQuery, weddingId]);

  // Handle Result Item Click / Navigation
  const handleSelectItem = useCallback(
    (targetUrl: string) => {
      onClose();
      if (triggerRef?.current && document.body.contains(triggerRef.current)) {
        triggerRef.current.focus();
      }
      router.push(targetUrl);
    },
    [onClose, router, triggerRef]
  );

  // Global & Dialog Keyboard Listener
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isOpen) return;

      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        if (triggerRef?.current && document.body.contains(triggerRef.current)) {
          triggerRef.current.focus();
        }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          flatItems.length > 0 ? (prev + 1) % flatItems.length : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          flatItems.length > 0 ? (prev - 1 + flatItems.length) % flatItems.length : 0
        );
      } else if (e.key === "Enter") {
        if (flatItems.length > 0 && flatItems[selectedIndex]) {
          e.preventDefault();
          const targetUrl = flatItems[selectedIndex].data.targetUrl;
          handleSelectItem(targetUrl);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, flatItems, selectedIndex, handleSelectItem, onClose, triggerRef]);

  if (!isOpen) return null;

  let currentItemOffset = 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="workspace-search-title"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-2xl bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container-high overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header Search Input */}
        <div className="flex items-center px-4 py-3 bg-surface-container-low border-b border-surface-container-high/60 gap-3">
          <span className="material-symbols-outlined text-primary text-[22px]">
            search
          </span>
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={Boolean(searchData)}
            aria-autocomplete="list"
            aria-controls="workspace-search-results"
            placeholder="Search events, tasks, guests, vendors, expenses, documents..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-on-surface font-body-sm text-sm focus:outline-none placeholder:text-on-surface-variant/60"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="p-1 rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 rounded bg-surface-container-high font-mono text-[10px] text-on-surface-variant font-semibold border border-outline-variant/40">
            ESC
          </kbd>
        </div>

        {/* Content Body */}
        <div
          id="workspace-search-results"
          role="listbox"
          className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[60vh]"
        >
          {/* State 1: Idle / Prompt */}
          {!debouncedQuery && (
            <div className="py-8 text-center space-y-2">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/40">
                manage_search
              </span>
              <p className="text-xs font-semibold text-on-surface-variant">
                Search your active wedding workspace
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] text-on-surface-variant/70 pt-2 font-mono">
                <span className="inline-flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-surface-container-high">↑</kbd>
                  <kbd className="px-1.5 py-0.5 rounded bg-surface-container-high">↓</kbd>
                  <span>Navigate</span>
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <kbd className="px-2 py-0.5 rounded bg-surface-container-high">↵</kbd>
                  <span>Select</span>
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-surface-container-high">ESC</kbd>
                  <span>Close</span>
                </span>
              </div>
            </div>
          )}

          {/* State 2: Query length < 2 */}
          {debouncedQuery.length === 1 && (
            <div className="py-6 text-center text-xs text-on-surface-variant italic">
              Type at least 2 characters to search...
            </div>
          )}

          {/* State 3: Loading */}
          {loading && (
            <div className="py-8 flex flex-col items-center justify-center gap-2">
              <span className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <span className="text-xs text-on-surface-variant font-medium">
                Searching workspace...
              </span>
            </div>
          )}

          {/* State 6: Error */}
          {error && !loading && (
            <div className="p-4 rounded-xl bg-error-container/40 border border-error/30 text-on-error-container text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-error">error</span>
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => performSearch(debouncedQuery)}
                className="px-3 py-1 rounded bg-error text-on-error font-bold text-[11px] hover:opacity-90 transition-opacity"
              >
                Retry
              </button>
            </div>
          )}

          {/* State 5: No Results */}
          {!loading && !error && debouncedQuery.length >= 2 && searchData?.totalMatches === 0 && (
            <div className="py-8 text-center space-y-2">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/40">
                search_off
              </span>
              <p className="text-xs font-bold text-on-surface">
                No matches found for &quot;{searchData.query}&quot;
              </p>
              <p className="text-[11px] text-on-surface-variant max-w-sm mx-auto">
                Check for typos or try searching for another ceremony, guest name, task title, or vendor category.
              </p>
            </div>
          )}

          {/* State 4: Results Display */}
          {!loading && !error && searchData && searchData.totalMatches > 0 && (
            <div className="space-y-4">
              {/* Events Section */}
              {searchData.results.events?.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-on-surface-variant uppercase tracking-wider px-2">
                    <span className="flex items-center gap-1.5 text-primary">
                      <span className="material-symbols-outlined text-[16px]">event</span>
                      <span>Events ({searchData.results.events.length})</span>
                    </span>
                  </div>
                  <div className="space-y-1">
                    {searchData.results.events.map((e) => {
                      const itemIndex = currentItemOffset++;
                      const isSelected = selectedIndex === itemIndex;
                      return (
                        <button
                          key={e.id}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => handleSelectItem(e.targetUrl)}
                          className={`w-full text-left px-3.5 py-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                            isSelected
                              ? "bg-primary-container/20 border-primary-container shadow-xs"
                              : "bg-surface-container-low border-surface-container-high/40 hover:bg-surface-container"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="px-2 py-0.5 rounded bg-surface-container font-label-sm text-[10px] font-bold text-primary shrink-0 uppercase">
                              {e.eventType}
                            </span>
                            <span className="text-xs font-semibold text-on-surface truncate">
                              {e.name}
                            </span>
                          </div>
                          <span className="material-symbols-outlined text-[16px] text-on-surface-variant shrink-0 ml-2">
                            chevron_right
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tasks Section */}
              {searchData.results.tasks?.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-on-surface-variant uppercase tracking-wider px-2">
                    <span className="flex items-center gap-1.5 text-primary">
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      <span>Tasks ({searchData.results.tasks.length})</span>
                    </span>
                  </div>
                  <div className="space-y-1">
                    {searchData.results.tasks.map((t) => {
                      const itemIndex = currentItemOffset++;
                      const isSelected = selectedIndex === itemIndex;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => handleSelectItem(t.targetUrl)}
                          className={`w-full text-left px-3.5 py-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                            isSelected
                              ? "bg-primary-container/20 border-primary-container shadow-xs"
                              : "bg-surface-container-low border-surface-container-high/40 hover:bg-surface-container"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="px-2 py-0.5 rounded bg-surface-container font-label-sm text-[10px] font-bold text-on-surface-variant shrink-0 uppercase">
                              {t.status}
                            </span>
                            <span className="text-xs font-semibold text-on-surface truncate">
                              {t.title}
                            </span>
                          </div>
                          <span className="material-symbols-outlined text-[16px] text-on-surface-variant shrink-0 ml-2">
                            chevron_right
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Guests Section */}
              {searchData.results.guests?.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-on-surface-variant uppercase tracking-wider px-2">
                    <span className="flex items-center gap-1.5 text-primary">
                      <span className="material-symbols-outlined text-[16px]">groups</span>
                      <span>Guests ({searchData.results.guests.length})</span>
                    </span>
                  </div>
                  <div className="space-y-1">
                    {searchData.results.guests.map((g) => {
                      const itemIndex = currentItemOffset++;
                      const isSelected = selectedIndex === itemIndex;
                      return (
                        <button
                          key={g.id}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => handleSelectItem(g.targetUrl)}
                          className={`w-full text-left px-3.5 py-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                            isSelected
                              ? "bg-primary-container/20 border-primary-container shadow-xs"
                              : "bg-surface-container-low border-surface-container-high/40 hover:bg-surface-container"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {g.side && (
                              <span className="px-2 py-0.5 rounded bg-surface-container font-label-sm text-[10px] font-bold text-on-surface-variant shrink-0 uppercase">
                                {g.side}
                              </span>
                            )}
                            <span className="text-xs font-semibold text-on-surface truncate">
                              {g.name} ({g.memberCount} guests)
                            </span>
                          </div>
                          <span className="material-symbols-outlined text-[16px] text-on-surface-variant shrink-0 ml-2">
                            chevron_right
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Vendors Section */}
              {searchData.results.vendors?.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-on-surface-variant uppercase tracking-wider px-2">
                    <span className="flex items-center gap-1.5 text-primary">
                      <span className="material-symbols-outlined text-[16px]">storefront</span>
                      <span>Vendors ({searchData.results.vendors.length})</span>
                    </span>
                  </div>
                  <div className="space-y-1">
                    {searchData.results.vendors.map((v) => {
                      const itemIndex = currentItemOffset++;
                      const isSelected = selectedIndex === itemIndex;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => handleSelectItem(v.targetUrl)}
                          className={`w-full text-left px-3.5 py-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                            isSelected
                              ? "bg-primary-container/20 border-primary-container shadow-xs"
                              : "bg-surface-container-low border-surface-container-high/40 hover:bg-surface-container"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="px-2 py-0.5 rounded bg-surface-container font-label-sm text-[10px] font-bold text-on-surface-variant shrink-0 uppercase">
                              {v.category}
                            </span>
                            <span className="text-xs font-semibold text-on-surface truncate">
                              {v.name}
                            </span>
                          </div>
                          <span className="material-symbols-outlined text-[16px] text-on-surface-variant shrink-0 ml-2">
                            chevron_right
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Expenses Section */}
              {searchData.results.expenses?.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-on-surface-variant uppercase tracking-wider px-2">
                    <span className="flex items-center gap-1.5 text-primary">
                      <span className="material-symbols-outlined text-[16px]">payments</span>
                      <span>Expenses ({searchData.results.expenses.length})</span>
                    </span>
                  </div>
                  <div className="space-y-1">
                    {searchData.results.expenses.map((ex) => {
                      const itemIndex = currentItemOffset++;
                      const isSelected = selectedIndex === itemIndex;
                      return (
                        <button
                          key={ex.id}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => handleSelectItem(ex.targetUrl)}
                          className={`w-full text-left px-3.5 py-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                            isSelected
                              ? "bg-primary-container/20 border-primary-container shadow-xs"
                              : "bg-surface-container-low border-surface-container-high/40 hover:bg-surface-container"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-xs font-semibold text-on-surface truncate">
                              {ex.title}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-primary shrink-0 ml-2">
                            {formatINR(ex.amountPaise)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Documents Section */}
              {searchData.results.documents?.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-on-surface-variant uppercase tracking-wider px-2">
                    <span className="flex items-center gap-1.5 text-primary">
                      <span className="material-symbols-outlined text-[16px]">description</span>
                      <span>Documents ({searchData.results.documents.length})</span>
                    </span>
                  </div>
                  <div className="space-y-1">
                    {searchData.results.documents.map((d) => {
                      const itemIndex = currentItemOffset++;
                      const isSelected = selectedIndex === itemIndex;
                      return (
                        <button
                          key={d.id}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => handleSelectItem(d.targetUrl)}
                          className={`w-full text-left px-3.5 py-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                            isSelected
                              ? "bg-primary-container/20 border-primary-container shadow-xs"
                              : "bg-surface-container-low border-surface-container-high/40 hover:bg-surface-container"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="px-2 py-0.5 rounded bg-surface-container font-label-sm text-[10px] font-bold text-on-surface-variant shrink-0 uppercase">
                              {d.fileType}
                            </span>
                            <span className="text-xs font-semibold text-on-surface truncate">
                              {d.title}
                            </span>
                          </div>
                          <span className="material-symbols-outlined text-[16px] text-on-surface-variant shrink-0 ml-2">
                            chevron_right
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
