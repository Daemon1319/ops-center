import { useState } from "react";
import { JOB_TYPES, JobType, CreateJobRequest } from "../types/taskYard.types";

interface CreateJobPanelProps {
  onCreate: (req: CreateJobRequest) => void;
  isLoading: boolean;
}

const TYPE_INFO: Record<JobType, { label: string }> = {
  EMAIL: { label: "Email" },
  INVENTORY: { label: "Inventory" },
  WAREHOUSE: { label: "Warehouse" },
  ANALYTICS: { label: "Analytics" },
};

export default function CreateJobPanel({ onCreate, isLoading }: CreateJobPanelProps) {
  const [selectedType, setSelectedType] = useState<JobType>("EMAIL");

  const handlePlaceOrder = () => {
    onCreate({ jobType: selectedType });
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-4">
        Place an Order
      </h3>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {JOB_TYPES.map((type) => {
          const isActive = selectedType === type;
          return (
            <button
              key={type}
              type="button"
              onClick={() => setSelectedType(type)}
              disabled={isLoading}
              className={`p-3 rounded-lg border text-left transition-all ${
                isActive
                  ? "bg-blue-50 border-blue-500 ring-1 ring-blue-500"
                  : "bg-gray-50 border-gray-200 hover:bg-gray-100"
              } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <div className={`font-bold text-xs ${isActive ? "text-blue-700" : "text-gray-700"}`}>
                {TYPE_INFO[type].label}
              </div>
            </button>
          );
        })}
      </div>

      <button
        onClick={handlePlaceOrder}
        disabled={isLoading}
        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-black uppercase tracking-widest transition-colors disabled:opacity-50 text-xs"
      >
        {isLoading ? "Placing Order..." : "Place Order"}
      </button>
    </div>
  );
}