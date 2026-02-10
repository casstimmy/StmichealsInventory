/**
 * Unified Loader Component - Consistent across all pages
 * Uses store logo from store data, cached permanently in localStorage
 * Supports real progress tracking via useProgress hook
 */

import { useState, useEffect } from "react";
import { getCachedLogo, fetchAndCacheLogo } from "@/lib/storeLogo";

export default function Loader({ 
  size = "md", 
  text = "Loading", 
  fullScreen = false,
  variant = "spin",
  color = "sky",
  progress = null, // optional 0-100 for determinate progress
}) {
  const [logoUrl, setLogoUrl] = useState(getCachedLogo());

  useEffect(() => {
    fetchAndCacheLogo().then((url) => setLogoUrl(url));
  }, []);

  // Size configurations - responsive to parent container
  const sizeClasses = {
    sm: "w-8 h-8 sm:w-10 sm:h-10",
    md: "w-12 h-12 sm:w-16 sm:h-16",
    lg: "w-20 h-20 sm:w-24 sm:h-24",
  };

  const sizeClass = sizeClasses[size];

  const getPhaseLabel = (pct) => {
    if (pct <= 0) return "Initializing...";
    if (pct < 15) return "Connecting...";
    if (pct < 50) return "Fetching data...";
    if (pct < 85) return "Processing...";
    if (pct < 100) return "Almost done...";
    return "Complete!";
  };

  const loaderContent = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className={`${sizeClass}`} style={{ perspective: '1000px' }}>
        <div className={`animate-spin-y ${sizeClass}`}>
          <img 
            src={logoUrl} 
            alt="Loading" 
            className="w-full h-full rounded-full object-cover filter drop-shadow-lg"
          />
        </div>
      </div>
      {text && progress === null && <p className="text-gray-600 font-medium text-center">{text}</p>}
      {progress !== null && (
        <div className="w-48 sm:w-64">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-500 font-medium">{getPhaseLabel(progress)}</span>
            <span className="text-cyan-600 font-bold tabular-nums">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div
              className="h-2.5 rounded-full transition-all duration-300 ease-out"
              style={{
                width: `${Math.min(100, Math.max(0, progress))}%`,
                background: progress >= 100
                  ? "linear-gradient(90deg, #10b981, #34d399)"
                  : "linear-gradient(90deg, #06b6d4, #0ea5e9)",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
        {loaderContent}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-6">
      {loaderContent}
    </div>
  );
}