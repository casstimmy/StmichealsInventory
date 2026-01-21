/**
 * Unified Loader Component - Consistent across all pages
 * Supports multiple variants and sizes
 */

export default function Loader({ 
  size = "md", 
  text = "Loading", 
  fullScreen = false,
  variant = "spin",
  color = "sky"
}) {
  // Size configurations
  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-16 h-16",
    lg: "w-24 h-24",
  };

  const sizeClass = sizeClasses[size];

  const loaderContent = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className={`${sizeClass}`} style={{ perspective: '1000px' }}>
        <div className={`animate-spin-y ${sizeClass}`}>
          <img 
            src="/images/st-micheals-logo.png" 
            alt="Loading" 
            className="w-full h-full rounded-full object-cover filter drop-shadow-lg"
          />
        </div>
      </div>
      {text && <p className="text-gray-600 font-medium text-center">{text}</p>}
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