import React from 'react';

export const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-100 dark:border-[#1F1F1F] p-4 ${className}`}>
    {children}
  </div>
);