"use client";

import type { Bucket } from "../types/cloudStash.types";

interface BucketManagerProps {
  buckets: Bucket[];
  selectedBucket: string | null;
  isLoading: boolean;
  onSelectBucket: (name: string | null) => void;
}

export function BucketManager({
  buckets,
  selectedBucket,
  isLoading,
  onSelectBucket,
}: BucketManagerProps) {
  return (
    <section className="rounded-lg border border-slate-700 bg-slate-800 p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
        Buckets
      </h2>

      <select
        value={selectedBucket ?? ""}
        onChange={(event) => onSelectBucket(event.target.value || null)}
        disabled={isLoading}
        className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50 sm:w-auto"
      >
        <option value="">Select a bucket…</option>
        {buckets.map((bucket) => (
          <option key={bucket.name} value={bucket.name}>
            {bucket.name}
          </option>
        ))}
      </select>
    </section>
  );
}