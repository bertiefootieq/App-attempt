import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface GameTimerProps {
  timeLeft: number;
  onTimeUpdate: (time: number) => void;
  onTimeUp: () => void;
  isActive?: boolean;
  className?: string;
}

export default function GameTimer({ 
  timeLeft, 
  onTimeUpdate, 
  onTimeUp, 
  isActive = true,
  className = ""
}: GameTimerProps) {
  const [localTimeLeft, setLocalTimeLeft] = useState(timeLeft);

  useEffect(() => {
    setLocalTimeLeft(timeLeft);
  }, [timeLeft]);

  useEffect(() => {
    if (!isActive || localTimeLeft <= 0) return;

    const timer = setInterval(() => {
      setLocalTimeLeft((prev) => {
        const newTime = prev - 1;
        onTimeUpdate(newTime);
        
        if (newTime <= 0) {
          onTimeUp();
          return 0;
        }
        
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, localTimeLeft, onTimeUpdate, onTimeUp]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (localTimeLeft <= 5) return "text-red-500";
    if (localTimeLeft <= 10) return "text-orange-500";
    return "text-white";
  };

  const getProgressColor = () => {
    if (localTimeLeft <= 5) return "bg-red-500";
    if (localTimeLeft <= 10) return "bg-orange-500";
    return "bg-green-500";
  };

  const progressPercentage = Math.max(0, (localTimeLeft / timeLeft) * 100);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className={`text-3xl font-bold transition-colors ${getTimerColor()}`}>
        {formatTime(localTimeLeft)}
      </div>
      
      {/* Progress Ring */}
      <div className="relative w-16 h-16 mt-2">
        <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
          {/* Background circle */}
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth="4"
          />
          {/* Progress circle */}
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 28}`}
            strokeDashoffset={`${2 * Math.PI * 28 * (1 - progressPercentage / 100)}`}
            className={`transition-all duration-1000 ${
              localTimeLeft <= 5 ? "text-red-500" :
              localTimeLeft <= 10 ? "text-orange-500" :
              "text-green-500"
            }`}
            style={{
              filter: localTimeLeft <= 5 ? "drop-shadow(0 0 8px rgba(239, 68, 68, 0.8))" : "none"
            }}
          />
        </svg>
        
        {/* Clock icon in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Clock className={`w-6 h-6 ${getTimerColor()}`} />
        </div>
      </div>

      {/* Warning animations */}
      {localTimeLeft <= 5 && isActive && (
        <div className="animate-pulse mt-1">
          <span className="text-red-500 text-xs font-bold">TIME'S UP!</span>
        </div>
      )}
    </div>
  );
}
