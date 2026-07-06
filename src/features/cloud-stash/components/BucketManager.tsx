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
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-4">
        Buckets
      </h3>

      <select
        value={selectedBucket ?? ""}
        onChange={(event) => onSelectBucket(event.target.value || null)}
        disabled={isLoading}
        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        <option value="">Select a bucket…</option>
        {buckets.map((bucket) => (
          <option key={bucket.name} value={bucket.name}>
            {bucket.name}
          </option>
        ))}
      </select>
    </div>
  );
}