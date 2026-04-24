import React from 'react';

interface Props {
  children: React.ReactNode;
}

export const PageWrapper: React.FC<Props> = ({ children }) => {
  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto max-w-[1440px] mx-auto w-full">
      <div className="animate-fade-in-up">
        {children}
      </div>
    </div>
  );
};
