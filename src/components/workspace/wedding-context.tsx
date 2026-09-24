"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";

export interface UserWeddingItem {
  id: string;
  title: string;
  brideName: string;
  groomName: string;
  primaryWeddingDate: string;
  role: string;
}

interface ApiWeddingResponse {
  wedding: {
    id?: string;
    _id?: string;
    title: string;
    bride: { name: string };
    groom: { name: string };
    primaryWeddingDate: string;
  };
  role: string;
}

interface WeddingContextType {
  weddings: UserWeddingItem[];
  activeWedding: UserWeddingItem | null;
  loading: boolean;
  error: string | null;
  switchWedding: (weddingId: string) => void;
  refreshWeddings: () => Promise<void>;
}

const WeddingContext = createContext<WeddingContextType | undefined>(undefined);

function setRecencyCookie(weddingId: string) {
  if (typeof document !== "undefined") {
    document.cookie = `last_accessed_wedding_id=${weddingId}; path=/; max-age=2592000; SameSite=Lax`;
  }
}

export function WeddingProvider({
  children,
  initialWeddingId,
}: {
  children: React.ReactNode;
  initialWeddingId?: string;
}) {
  const [weddings, setWeddings] = useState<UserWeddingItem[]>([]);
  const [activeWedding, setActiveWedding] = useState<UserWeddingItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();

  const currentWeddingId = (params?.weddingId as string) || initialWeddingId;

  const fetchWeddings = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/weddings");
      const json = await res.json();

      if (json.success && Array.isArray(json.data)) {
        const formatted: UserWeddingItem[] = json.data.map((item: ApiWeddingResponse) => {
          const wId = item.wedding.id || item.wedding._id || "";
          return {
            id: wId,
            title: item.wedding.title,
            brideName: item.wedding.bride.name,
            groomName: item.wedding.groom.name,
            primaryWeddingDate: item.wedding.primaryWeddingDate,
            role: item.role,
          };
        });

        setWeddings(formatted);

        if (currentWeddingId) {
          const matched = formatted.find((w) => w.id === currentWeddingId);
          const active = matched || formatted[0] || null;
          setActiveWedding(active);
          if (active) {
            setRecencyCookie(active.id);
          }
        } else if (formatted.length > 0) {
          setActiveWedding(formatted[0]);
          setRecencyCookie(formatted[0].id);
        }
      } else {
        setError(json.error?.message || "Failed to load weddings");
      }
    } catch (err) {
      console.error("Error loading user weddings:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, [currentWeddingId]);

  useEffect(() => {
    let isSubscribed = true;
    async function loadData() {
      if (isSubscribed) {
        await fetchWeddings();
      }
    }
    loadData();
    return () => {
      isSubscribed = false;
    };
  }, [fetchWeddings]);

  const switchWedding = (weddingId: string) => {
    const selected = weddings.find((w) => w.id === weddingId);
    if (selected) {
      setActiveWedding(selected);
      setRecencyCookie(weddingId);
      router.push(`/workspace/${weddingId}`);
    }
  };

  return (
    <WeddingContext.Provider
      value={{
        weddings,
        activeWedding,
        loading,
        error,
        switchWedding,
        refreshWeddings: fetchWeddings,
      }}
    >
      {children}
    </WeddingContext.Provider>
  );
}

export function useWedding() {
  const context = useContext(WeddingContext);
  if (!context) {
    throw new Error("useWedding must be used within a WeddingProvider");
  }
  return context;
}
