// src/components/layout/Comingsoon.tsx
import React from 'react';

interface ComingSoonProps {
  title: string;
}

const Comingsoon: React.FC<ComingSoonProps> = ({ title }) => {
  return (
    <div className="flex flex-col items-center justify-center h-64">
      <div className="bg-gray-100 p-8 rounded-xl text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">{title}</h2>
        <p className="text-gray-600 mb-6">
          This feature is coming soon. We're working hard to bring you the best experience!
        </p>
        <div className="inline-flex items-center bg-blue-100 text-blue-800 px-4 py-2 rounded-lg">
          <span>Coming Soon</span>
        </div>
      </div>
    </div>
  );
};

export default Comingsoon;