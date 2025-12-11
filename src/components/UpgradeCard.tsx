import { useState } from 'react';
import { Upgrade } from '../types/game';

interface UpgradeCardProps {
  upgrade: Upgrade;
  onClick: (upgrade: Upgrade) => void;
}

export function UpgradeCard({ upgrade, onClick }: UpgradeCardProps) {
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    setMouseX(x);
    setMouseY(y);
  };

  const handleMouseLeave = () => {
    setMouseX(0);
    setMouseY(0);
    setIsHovered(false);
  };

  const rotateX = (mouseY / 150) * -45;
  const rotateY = (mouseX / 150) * 45;
  const scale = isHovered ? 1.08 : 1;

  const glintX = ((mouseX + 170) / 340) * 100;
  const glintY = ((mouseY + 200) / 400) * 100;

  return (
    <button
      onClick={() => onClick(upgrade)}
      onMouseMove={(e) => {
        setIsHovered(true);
        handleMouseMove(e);
      }}
      onMouseLeave={handleMouseLeave}
      className="relative h-40 w-32 rounded-2xl border-4 border-yellow-200 overflow-visible focus:outline-none transition-transform duration-100"
      style={{
        transform: `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`,
        transformStyle: 'preserve-3d' as const,
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 via-orange-500 to-orange-600 rounded-2xl" />

      <div
        className="absolute inset-0 opacity-60 pointer-events-none rounded-2xl"
        style={{
          background: `conic-gradient(from ${Math.atan2(mouseY, mouseX) * (180 / Math.PI)}deg,
            rgba(255,100,200,0.4) 0deg,
            rgba(255,200,100,0.3) 90deg,
            rgba(100,200,255,0.4) 180deg,
            rgba(200,100,255,0.3) 270deg,
            rgba(255,100,200,0.4) 360deg)`,
        }}
      />

      <div
        className="absolute inset-0 opacity-70 pointer-events-none rounded-2xl"
        style={{
          background: `radial-gradient(ellipse at ${glintX}% ${glintY}%, rgba(255,255,255,0.9) 0%, rgba(255,220,150,0.4) 30%, transparent 60%)`,
        }}
      />

      <div className="relative h-full w-full flex flex-col items-center justify-center p-4 text-center rounded-2xl">
        <div className="text-4xl mb-2 drop-shadow-lg">{upgrade.emoji}</div>
        <div className="text-lg font-bold text-white drop-shadow-md leading-tight text-xs mb-1">
          {upgrade.name}
        </div>
        <div className="text-xs text-yellow-100 drop-shadow-md">{upgrade.description}</div>
      </div>

      {isHovered && (
        <div className="absolute inset-0 rounded-2xl border-2 border-yellow-100 opacity-60 pointer-events-none shadow-lg"
          style={{
            boxShadow: `0 0 30px 2px rgba(255, 255, 100, 0.5), inset 0 0 20px rgba(255, 200, 100, 0.3)`,
          }}
        />
      )}
    </button>
  );
}
