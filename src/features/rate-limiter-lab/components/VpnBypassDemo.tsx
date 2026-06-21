import { useState } from "react";

interface VpnBypassDemoProps {
  currentIp: string;
  onIpChange: (newIp: string) => void;
}

const PRESET_IPS = ["192.168.1.1", "10.0.0.55", "172.16.0.99", "203.0.113.42"];

export default function VpnBypassDemo({ currentIp, onIpChange }: VpnBypassDemoProps) {
  const [hasChanged, setHasChanged] = useState(false);

  const cycleIp = () => {
    const currentIndex = PRESET_IPS.indexOf(currentIp);
    const nextIndex = (currentIndex + 1) % PRESET_IPS.length;
    onIpChange(PRESET_IPS[nextIndex]);
    setHasChanged(true);
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-4 flex items-center gap-2">
        <span>🌍</span> VPN Proxy Router
      </h3>

      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            Current Origin IP
          </span>
          <span className="font-mono text-sm font-black text-blue-600">
            {currentIp}
          </span>
        </div>

        <button
          onClick={cycleIp}
          className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-black uppercase tracking-widest transition-colors text-xs"
        >
          Change VPN / New IP
        </button>
      </div>
    </div>
  );
}