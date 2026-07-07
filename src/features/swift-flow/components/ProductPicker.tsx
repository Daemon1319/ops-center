"use client";

import { useState } from "react";
import type { ProductSummary } from "../types/swiftFlow.types";

interface ProductPickerProps {
  products: ProductSummary[];
  isLoading: boolean;
  onCompare: (id: number) => Promise<void>;
  onClearCache: () => Promise<void>;
}

export function ProductPicker({
  products,
  isLoading,
  onCompare,
  onClearCache,
}: ProductPickerProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  // Group products by category for a nicer dropdown
  const categories = products.reduce<Record<string, ProductSummary[]>>(
    (acc, product) => {
      const list = acc[product.category] ?? [];
      list.push(product);
      acc[product.category] = list;
      return acc;
    },
    {}
  );

  const handleCompare = async () => {
    if (selectedId === null) return;
    await onCompare(selectedId);
  };

  const handleClearCache = async () => {
    setIsClearing(true);
    await onClearCache();
    setIsClearing(false);
  };

  return (
    <section className="bg-slate-900 rounded-xl p-6 shadow-lg border border-slate-800 h-full flex flex-col justify-center">
      <h3 className="mb-4 text-sm font-black uppercase tracking-widest text-white">
        Product Picker
      </h3>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={selectedId ?? ""}
          onChange={(e) => setSelectedId(Number(e.target.value) || null)}
          className="min-w-[260px] rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white"
        >
          <option value="">Select a product…</option>
          {Object.entries(categories)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([category, items]) => (
              <optgroup key={category} label={category}>
                {items.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} — ${product.price.toFixed(2)}
                  </option>
                ))}
              </optgroup>
            ))}
        </select>

        <button
          type="button"
          onClick={handleCompare}
          disabled={isLoading || selectedId === null}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isLoading ? "Comparing…" : "Compare"}
        </button>

        <button
          type="button"
          onClick={handleClearCache}
          disabled={isClearing}
          className="rounded-md border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isClearing ? "Clearing…" : "Clear Cache"}
        </button>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Click <strong>Compare</strong> to fire both a direct DB lookup and a cached lookup,
        then see the speed difference. Click <strong>Clear Cache</strong> to reset and watch
        the cold → warm transition.
      </p>
    </section>
  );
}
