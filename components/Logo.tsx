import React from 'react';

// Recreated SVG Logo based on the "Part Phone" design
// Phone outline, Gears, Orange Text
const svgString = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 160">
  <defs>
    <style>
      .text-main { font-family: sans-serif; font-weight: 900; font-size: 56px; fill: #ea580c; }
      .text-sub { font-family: sans-serif; font-weight: 700; font-size: 16px; fill: #000; letter-spacing: 0.3em; }
    </style>
  </defs>
  
  <!-- Icon Section (Left) -->
  <g transform="translate(10, 10)">
      <!-- Phone Outline -->
      <path d="M20,0 H70 A10,10 0 0,1 80,10 V130 A10,10 0 0,1 70,140 H20 A10,10 0 0,1 10,130 V10 A10,10 0 0,1 20,0 Z" 
            fill="none" stroke="black" stroke-width="5" />
      <line x1="35" y1="130" x2="55" y2="130" stroke="black" stroke-width="4" stroke-linecap="round" />
      <line x1="45" y1="8" x2="55" y2="8" stroke="black" stroke-width="3" stroke-linecap="round" />
      
      <!-- Gears (Overlay) -->
      <g transform="translate(80, 45)">
        <circle r="20" fill="white" stroke="black" stroke-width="4" />
        <circle r="6" fill="black" />
        <!-- Gear Teeth -->
        <path d="M0,-24 V-16 M17,-17 L11,-11 M24,0 H16 M17,17 L11,11 M0,24 V16 M-17,17 L-11,11 M-24,0 H-16 M-17,-17 L-11,-11" stroke="black" stroke-width="4" />
      </g>
      <g transform="translate(65, 95)">
         <circle r="15" fill="white" stroke="black" stroke-width="4" />
         <circle r="5" fill="black" />
         <path d="M0,-19 V-12 M13,-13 L8,-8 M19,0 H12 M13,13 L8,8 M0,19 V12 M-13,13 L-8,8 M-19,0 H-12 M-13,-13 L-8,-8" stroke="black" stroke-width="4" />
      </g>
      <g transform="translate(95, 85)">
         <circle r="12" fill="white" stroke="black" stroke-width="4" />
         <circle r="4" fill="black" />
         <path d="M0,-16 V-10 M11,-11 L7,-7 M16,0 H10 M11,11 L7,7 M0,16 V10 M-11,11 L-7,7 M-16,0 H-10 M-11,-11 L-7,-7" stroke="black" stroke-width="4" />
      </g>
  </g>

  <!-- Text Section (Right) -->
  <text x="140" y="65" class="text-main">PART</text>
  <text x="140" y="115" class="text-main">PHONE</text>
  <text x="142" y="145" class="text-sub">DISTRIBUIDORA</text>
</svg>
`;

// Export as a base64 Data URI
export const LOGO_URL = `data:image/svg+xml;base64,${btoa(svgString)}`;

export const Logo: React.FC = () => {
  return (
    <div className="w-full h-full flex items-center justify-center p-1">
      <img 
        src={LOGO_URL} 
        alt="Part Phone Logo" 
        className="max-h-full max-w-full object-contain"
      />
    </div>
  );
};
