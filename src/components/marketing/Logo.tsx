import React from "react";

export function Logo({ className = "w-7 h-auto" }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 48 48" 
      fill="none"
      className={className}
      aria-label="MakeMyMarriage Emblem"
      role="img"
    >
      <rect width="48" height="48" rx="10" fill="#762B3A" />
      <path 
        d="M12 34V21C12 16.5 15.5 13 20 13C22.5 13 24 14.8 24 17.5V34" 
        stroke="#FFFFFF" 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      <path 
        d="M36 34V21C36 16.5 32.5 13 28 13C25.5 13 24 14.8 24 17.5V34" 
        stroke="#FFFFFF" 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      <circle cx="24" cy="20" r="2" fill="#FBF8F4" />
    </svg>
  );
}
