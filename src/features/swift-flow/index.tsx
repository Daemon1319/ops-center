"use client";

import { useSwiftFlow } from "./hooks/useSwiftFlow";
import { ProductPicker } from "./components/ProductPicker";
import { SpeedComparison } from "./components/SpeedComparison";
import { ComparisonHistory } from "./components/ComparisonHistory";

export default function SwiftFlow() {
  const {
    products,
    comparisons,
    isLoading,
    error,
    compare,
    clearCache,
    clearHistory,
  } = useSwiftFlow();

  const latestComparison = comparisons.length > 0 ? comparisons[0] : null;

  return (
    <section className="w-full max-w-6xl mx-auto p-4 flex flex-col gap-6">
      <header className="bg-slate-900 rounded-xl p-6 border border-slate-800 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Swift Flow</h2>
          <p className="text-sm text-gray-500 mt-2 max-w-2xl font-mono">
            Cache vs database speed comparison — see how much faster cached lookups are
          </p>
        </div>
      </header>

      {error && (
        <div className="rounded-md border border-red-800 bg-red-950 px-4 py-3 text-sm text-red-300 font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ProductPicker
          products={products}
          isLoading={isLoading}
          onCompare={compare}
          onClearCache={clearCache}
        />

        <SpeedComparison comparison={latestComparison} />
      </div>

      <ComparisonHistory comparisons={comparisons} onClear={clearHistory} />
    </section>
  );
}