"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from "react";
import type { AppAction, AppData } from "./app-data";

const emptyData: AppData = { users: [], staff: [], orders: [], menu: [], transactions: [] };

export function useAppData() {
  const [data, setData] = useState<AppData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/app-data", { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to load application data.");
      setData(body.data);
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load application data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const runAction = useCallback(async (payload: AppAction) => {
    const response = await fetch("/api/app-data", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "The request could not be completed.");
    setData(body.data);
    setError("");
    return body.result;
  }, []);

  return { data, loading, error, refresh, runAction };
}
