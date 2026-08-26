import React from 'react';

interface BlueCoinGraphicProps {
  className?: string;
}

export const BlueCoinGraphic: React.FC<BlueCoinGraphicProps> = ({ className = "w-36 h-36 sm:w-44 sm:h-44" }) => {
  return (
    <div className={`relative flex items-center justify-center shrink-0 select-none ${className}`}>
      {/* Ambient Radial Blue Glow */}
      <div 
        className="absolute inset-0 bg-[#1E60F6]/30 rounded-full blur-2xl pointer-events-none transform scale-110" 
      />

      <svg 
        viewBox="0 0 200 200" 
        className="w-full h-full drop-shadow-[0_10px_25px_rgba(30,96,246,0.35)] overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gradients for 3D Blue Coin */}
          <linearGradient id="coinOuterRim" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E60F6" />
            <stop offset="50%" stopColor="#0B1A3D" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>

          <linearGradient id="coinFaceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0F2454" />
            <stop offset="50%" stopColor="#071026" />
            <stop offset="100%" stopColor="#0A1633" />
          </linearGradient>

          <linearGradient id="coinInnerRing" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1D4ED8" />
            <stop offset="50%" stopColor="#60A5FA" />
            <stop offset="100%" stopColor="#1E40AF" />
          </linearGradient>

          <linearGradient id="btcSymbolGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60A5FA" />
            <stop offset="50%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>

          <linearGradient id="baseRimGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#09132B" />
            <stop offset="30%" stopColor="#1E40AF" />
            <stop offset="70%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#070D1F" />
          </linearGradient>

          <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Stacked Lower Coin 2 (Bottom-most rim) */}
        <g transform="translate(10, 26)">
          <path 
            d="M 65 142 C 115 178, 175 142, 185 118 L 185 128 C 175 152, 115 188, 65 152 Z" 
            fill="url(#baseRimGrad)" 
            opacity="0.8"
          />
          <ellipse 
            cx="126" 
            cy="134" 
            rx="64" 
            ry="24" 
            fill="#081021" 
            stroke="#1E40AF" 
            strokeWidth="1.5"
            opacity="0.7"
          />
        </g>

        {/* Stacked Lower Coin 1 (Middle coin rim) */}
        <g transform="translate(6, 14)">
          <path 
            d="M 58 132 C 108 168, 172 132, 182 108 L 182 118 C 172 142, 108 178, 58 142 Z" 
            fill="url(#baseRimGrad)" 
            opacity="0.9"
          />
          <ellipse 
            cx="120" 
            cy="124" 
            rx="65" 
            ry="24" 
            fill="#0B152B" 
            stroke="#2563EB" 
            strokeWidth="2"
            opacity="0.85"
          />
        </g>

        {/* Top Main Tilted 3D Coin Body */}
        {/* Coin Edge 3D Side Thickness */}
        <path 
          d="M 45 106 C 90 148, 168 118, 178 86 L 178 96 C 168 128, 90 158, 45 116 Z" 
          fill="url(#coinOuterRim)" 
        />

        {/* Main Coin Face Ellipse */}
        <ellipse 
          cx="110" 
          cy="98" 
          rx="68" 
          ry="64" 
          fill="url(#coinFaceGrad)" 
          stroke="url(#coinOuterRim)" 
          strokeWidth="3.5"
          filter="url(#softGlow)"
        />

        {/* Inner Concentric Glow Ring */}
        <ellipse 
          cx="110" 
          cy="98" 
          rx="56" 
          ry="52" 
          fill="none" 
          stroke="url(#coinInnerRing)" 
          strokeWidth="2" 
          strokeDasharray="4 2"
          opacity="0.75"
        />

        {/* Inner Recessed Face */}
        <ellipse 
          cx="110" 
          cy="98" 
          rx="50" 
          ry="46" 
          fill="#060C1A" 
          stroke="#1E40AF" 
          strokeWidth="1.5" 
          opacity="0.9"
        />

        {/* Ambient Inner Lighting Rim */}
        <ellipse 
          cx="108" 
          cy="94" 
          rx="44" 
          ry="40" 
          fill="none" 
          stroke="#38BDF8" 
          strokeWidth="1" 
          opacity="0.3"
        />

        {/* Stylized Embossed Bitcoin '₿' Symbol */}
        <g transform="translate(110, 98) scale(0.95)" className="drop-shadow-[0_2px_8px_rgba(56,189,248,0.8)]">
          {/* Top serif lines */}
          <line x1="-3" y1="-28" x2="-3" y2="-22" stroke="#60A5FA" strokeWidth="3" strokeLinecap="round" />
          <line x1="5" y1="-28" x2="5" y2="-22" stroke="#60A5FA" strokeWidth="3" strokeLinecap="round" />
          
          {/* Bottom serif lines */}
          <line x1="-3" y1="22" x2="-3" y2="28" stroke="#60A5FA" strokeWidth="3" strokeLinecap="round" />
          <line x1="5" y1="22" x2="5" y2="28" stroke="#60A5FA" strokeWidth="3" strokeLinecap="round" />

          {/* Main Bitcoin letter path */}
          <path
            d="M -14 -22 
               L 4 -22 
               C 12 -22, 17 -18, 17 -11 
               C 17 -6, 13 -2, 7 0 
               C 15 2, 19 7, 19 14 
               C 19 22, 13 24, 3 24 
               L -14 24 
               Z
               M -6 -16 
               L -6 -4 
               L 3 -4 
               C 7 -4, 10 -6, 10 -10 
               C 10 -14, 7 -16, 3 -16 
               Z
               M -6 2 
               L -6 18 
               L 4 18 
               C 9 18, 12 16, 12 10 
               C 12 4, 9 2, 4 2 
               Z"
            fill="url(#btcSymbolGrad)"
            stroke="#38BDF8"
            strokeWidth="1"
          />
        </g>

        {/* Top Arc Specular Reflection Highlight */}
        <path 
          d="M 68 56 C 90 42, 135 44, 156 60" 
          fill="none" 
          stroke="#93C5FD" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          opacity="0.6"
        />
      </svg>
    </div>
  );
};
