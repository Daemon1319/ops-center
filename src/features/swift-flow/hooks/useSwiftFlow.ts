"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  ApiProblem,
  ComparisonResult,
  ProductResponse,
  ProductSummary,
} from "../types/swiftFlow.types";

const API_URL = process.env.NEXT_PUBLIC_SWIFT_FLOW_API_URL;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, init);

  if (!response.ok) {
    const problem = (await response.json().catch(() => null)) as ApiProblem | null;
    throw new Error(problem?.detail ?? `Request failed with status ${response.status}`);
  }

  const text = await response.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

export interface UseSwiftFlowResult {
  products: ProductSummary[];
  comparisons: ComparisonResult[];
  isLoading: boolean;
  error: string | null;
  compare: (id: number) => Promise<void>;
  clearCache: () => Promise<void>;
  clearHistory: () => void;
}

export function useSwiftFlow(): UseSwiftFlowResult {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [comparisons, setComparisons] = useState<ComparisonResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch product list on mount
  useEffect(() => {
    request<ProductSummary[]>("/api/products")
      .then(setProducts)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load products")
      );
  }, []);

  const compare = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);

    try {
      // Fire both requests in parallel
      const [direct, cached] = await Promise.all([
        request<ProductResponse>(`/api/products/${id}`),
        request<ProductResponse>(`/api/products/${id}/cached`),
      ]);

      const speedup =
        cached.responseTimeMs > 0
          ? direct.responseTimeMs / cached.responseTimeMs
          : direct.responseTimeMs > 0
            ? Infinity
            : 1;

      const result: ComparisonResult = {
        key: `${id}-${Date.now()}`,
        productId: direct.id,
        productName: direct.name,
        productCategory: direct.category,
        directTimeMs: direct.responseTimeMs,
        cachedTimeMs: cached.responseTimeMs,
        speedup,
        timestamp: Date.now(),
      };

      setComparisons((prev) => [result, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Comparison failed");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearCache = useCallback(async () => {
    try {
      await request<void>("/api/products/cache", { method: "DELETE" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clear cache");
    }
  }, []);

  const clearHistory = useCallback(() => {
    setComparisons([]);
  }, []);

  return {
    products,
    comparisons,
    isLoading,
    error,
    compare,
    clearCache,
    clearHistory,
  };
}