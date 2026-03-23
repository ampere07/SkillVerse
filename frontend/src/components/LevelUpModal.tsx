import { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface LevelUpModalProps {
  level: number;
  onClose: () => void;
}

const LevelUpModal = ({ level, onClose }: LevelUpModalProps) => {
  useEffect(() => {
    // Launch confetti!
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      zIndex: 10000
    });
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-sm bg-white rounded-[32px] p-8 shadow-2xl animate-in zoom-in slide-in-from-bottom-10 duration-500 text-center">
        <div className="flex flex-col items-center gap-6">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-[#757575] uppercase tracking-[0.2em]">You Leveled Up</h2>
            <h1 className="text-5xl font-black text-[#212121] tracking-tight">Level {level}</h1>
          </div>

          <button
            onClick={onClose}
            className="w-full py-4 bg-[#212121] text-white rounded-2xl font-bold text-base transition-all active:scale-95 hover:bg-[#333] shadow-lg shadow-black/10"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default LevelUpModal;
