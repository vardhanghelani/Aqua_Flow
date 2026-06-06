import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { api } from '@/lib/api';
import type { Delivery, TodayDeliveryItem } from '@/types';

interface DriverDataContextType {
  todayItems: TodayDeliveryItem[] | null;
  summary: Record<string, number | string> | null;
  historyItems: Delivery[] | null;
  loadingToday: boolean;
  loadingHistory: boolean;
  refreshToday: () => Promise<TodayDeliveryItem[]>;
  ensureHistory: () => Promise<Delivery[]>;
  patchCustomerAfterDelivery: (
    customerId: string,
    patch: { filledGiven: number; emptyReturned: number }
  ) => void;
  updateSummaryCounts: (delta: { delivered?: number; notDelivered?: number; pending?: number }) => void;
}

const DriverDataContext = createContext<DriverDataContextType | null>(null);

export function DriverDataProvider({ children }: { children: ReactNode }) {
  const [todayItems, setTodayItems] = useState<TodayDeliveryItem[] | null>(null);
  const [summary, setSummary] = useState<Record<string, number | string> | null>(null);
  const [historyItems, setHistoryItems] = useState<Delivery[] | null>(null);
  const [loadingToday, setLoadingToday] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const historyPromise = useRef<Promise<Delivery[]> | null>(null);
  const todayPromise = useRef<Promise<TodayDeliveryItem[]> | null>(null);

  const refreshToday = useCallback(async () => {
    if (todayPromise.current) return todayPromise.current;

    todayPromise.current = (async () => {
      const [items, sum] = await Promise.all([api.getTodayDeliveries(), api.getTodaySummary()]);
      setTodayItems(items);
      setSummary(sum);
      return items;
    })();

    try {
      return await todayPromise.current;
    } finally {
      todayPromise.current = null;
    }
  }, []);

  useEffect(() => {
    let active = true;
    refreshToday()
      .catch(() => {
        if (active) {
          setTodayItems([]);
          setSummary(null);
        }
      })
      .finally(() => {
        if (active) setLoadingToday(false);
      });
    return () => {
      active = false;
    };
  }, [refreshToday]);

  const ensureHistory = useCallback(async () => {
    if (historyItems !== null) return historyItems;
    if (historyPromise.current) return historyPromise.current;

    setLoadingHistory(true);
    historyPromise.current = api
      .getDeliveryHistory({ limit: '100' })
      .then((d) => {
        setHistoryItems(d.items);
        return d.items;
      })
      .finally(() => {
        historyPromise.current = null;
        setLoadingHistory(false);
      });

    return historyPromise.current;
  }, [historyItems]);

  const patchCustomerAfterDelivery = useCallback(
    (customerId: string, patch: { filledGiven: number; emptyReturned: number }) => {
      setTodayItems((prev) =>
        prev
          ? prev.map((item) =>
              item.customer._id === customerId
                ? {
                    ...item,
                    customer: {
                      ...item.customer,
                      currentBalance:
                        item.customer.currentBalance + patch.filledGiven - patch.emptyReturned,
                      lastDeliveryDate: new Date().toISOString(),
                    },
                  }
                : item
            )
          : prev
      );
    },
    []
  );

  const updateSummaryCounts = useCallback(
    (delta: { delivered?: number; notDelivered?: number; pending?: number }) => {
      setSummary((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          delivered: Number(prev.delivered) + (delta.delivered ?? 0),
          notDelivered: Number(prev.notDelivered) + (delta.notDelivered ?? 0),
          pending: Math.max(0, Number(prev.pending) + (delta.pending ?? 0)),
        };
      });
    },
    []
  );

  return (
    <DriverDataContext.Provider
      value={{
        todayItems,
        summary,
        historyItems,
        loadingToday,
        loadingHistory,
        refreshToday,
        ensureHistory,
        patchCustomerAfterDelivery,
        updateSummaryCounts,
      }}
    >
      {children}
    </DriverDataContext.Provider>
  );
}

export function useDriverData() {
  const ctx = useContext(DriverDataContext);
  if (!ctx) throw new Error('useDriverData must be used within DriverDataProvider');
  return ctx;
}
