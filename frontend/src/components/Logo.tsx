import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export default function Logo({ className = '', size = 80 }: LogoProps) {
  return (
    <svg 
      viewBox="0 0 200 120" 
      width={size} 
      height={(size * 120) / 200} 
      className={className}
      fill="currentColor"
    >
      {/* 
        Stylized "JG" Geometric Emblem
        Accurately reflecting the slanted hexagonal cuts of the João Guilherme logo.
      */}
      <g transform="skewX(-15) translate(20, 10)">
        {/* Top bar and down-right slant of the 'G' / outer shell */}
        <path 
          d="M 30,10 L 130,10 L 150,30 L 70,30 L 60,40 L 120,40 L 95,65 L 60,65 L 45,80 L 100,80 L 75,105 L 15,105 L 45,75 L 30,75 Z" 
          className="transition-all duration-300"
        />
        {/* Inner core block of the 'G' */}
        <polygon points="85,50 110,50 95,65 70,65" />
      </g>
    </svg>
  );
}
