// src/components/dashboard/SupervisorDashboard.tsx
import React from 'react';
import { useParams } from 'react-router-dom';
import Dashboard from './Dashboard';

const SupervisorDashboard: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  
  return (
    <Dashboard 
      isSupervisorView={true} 
      supervisorId={userId || ''} 
    />
  );
};

export default SupervisorDashboard;