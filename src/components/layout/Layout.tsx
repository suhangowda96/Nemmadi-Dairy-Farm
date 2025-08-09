import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;