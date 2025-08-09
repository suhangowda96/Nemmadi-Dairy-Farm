import React, { createContext, useContext, useState } from 'react';
import { WeeklyInspection, VaccinationChart, StaffAttendance } from '../types';

interface DataContextType {
  weeklyInspections: WeeklyInspection[];
  vaccinationCharts: VaccinationChart[];
  staffAttendance: StaffAttendance[];
  addWeeklyInspection: (inspection: Omit<WeeklyInspection, 'id'>) => void;
  addVaccinationChart: (chart: Omit<VaccinationChart, 'id'>) => void;
  addStaffAttendance: (attendance: Omit<StaffAttendance, 'id'>) => void;
  updateInspectionStatus: (id: string, status: 'Done' | 'Pending') => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [weeklyInspections, setWeeklyInspections] = useState<WeeklyInspection[]>([]);
  const [vaccinationCharts, setVaccinationCharts] = useState<VaccinationChart[]>([]);
  const [staffAttendance, setStaffAttendance] = useState<StaffAttendance[]>([]);

  const addWeeklyInspection = (inspection: Omit<WeeklyInspection, 'id'>) => {
    const newInspection: WeeklyInspection = {
      ...inspection,
      id: Date.now().toString()
    };
    setWeeklyInspections(prev => [...prev, newInspection]);
  };

  const addVaccinationChart = (chart: Omit<VaccinationChart, 'id'>) => {
    const newChart: VaccinationChart = {
      ...chart,
      id: Date.now().toString()
    };
    setVaccinationCharts(prev => [...prev, newChart]);
  };

  const addStaffAttendance = (attendance: Omit<StaffAttendance, 'id'>) => {
    const newAttendance: StaffAttendance = {
      ...attendance,
      id: Date.now().toString()
    };
    setStaffAttendance(prev => [...prev, newAttendance]);
  };

  const updateInspectionStatus = (id: string, status: 'Done' | 'Pending') => {
    setWeeklyInspections(prev =>
      prev.map(inspection =>
        inspection.id === id ? { ...inspection, status } : inspection
      )
    );
  };

  const value: DataContextType = {
    weeklyInspections,
    vaccinationCharts,
    staffAttendance,
    addWeeklyInspection,
    addVaccinationChart,
    addStaffAttendance,
    updateInspectionStatus
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};