import React from 'react';

export const Badge = ({ children, color = '#64748B' }) => (
  <span 
    className="px-2 py-1 rounded-full text-xs font-semibold text-white inline-flex items-center"
    style={{ backgroundColor: color }}
  >
    {children}
  </span>
);