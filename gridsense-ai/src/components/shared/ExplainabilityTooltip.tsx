import React, { useState } from 'react';

interface Props {
  explanation: string;
  children: React.ReactNode;
}

export const ExplainabilityTooltip: React.FC<Props> = ({ explanation, children }) => {
  const [show, setShow] = useState(false);

  return (
    <div 
      className="relative inline-flex items-center justify-center"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div className="absolute z-50 w-64 p-2 mt-2 text-xs font-sans text-text-primary bg-grid-slate border border-border-active rounded-md shadow-[0_4px_24px_rgba(0,229,255,0.04)] top-full left-1/2 -translate-x-1/2 pointer-events-none whitespace-normal text-left">
          {explanation}
        </div>
      )}
    </div>
  );
};
