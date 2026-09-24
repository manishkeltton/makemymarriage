"use client";

import React from "react";

export interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  message?: string;
  children: React.ReactNode;
}

export function ActionButton({ message, onClick, children, ...props }: ActionButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (message) {
      alert(message);
    }
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button type="button" onClick={handleClick} {...props}>
      {children}
    </button>
  );
}
