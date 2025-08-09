import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home, Calendar, Syringe, Droplet, Users, AlertTriangle,
  FolderOpen, Truck, Droplets, BarChart3, CheckCircle,
  Heart, TrendingUp, IndianRupeeIcon, Package, Scale,
  Settings, Eye, Stethoscope, Baby, Target, X
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const menuItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/weekly-inspection', icon: Calendar, label: 'Weekly Inspection' },
    { path: '/vaccination-chart', icon: Syringe, label: 'Vaccination Chart' },
    { path: '/milk-yield-management', icon: Droplet, label: 'Milk Yield Management' },
    { path: '/staff-attendance', icon: Users, label: 'Staff Attendance' },
    { path: '/red-flags', icon: AlertTriangle, label: 'Red Flags' },
    { path: '/record-maintenance', icon: FolderOpen, label: 'Record Maintenance' },
    { path: '/procurement-vendor', icon: Truck, label: 'Procurement & Vendor' },
    { path: '/milking-hygiene', icon: Droplets, label: 'Milking Hygiene' },
    { path: '/milk-yield-tracking', icon: BarChart3, label: 'Milk Yield Tracking' },
    { path: '/milk-quality-checks', icon: CheckCircle, label: 'Milk Quality Checks' },
    { path: '/health-record', icon: Heart, label: 'Health Record' },
    { path: '/genetic-improvement', icon: TrendingUp, label: 'Genetic Improvement' },
    { path: '/financial-record', icon: IndianRupeeIcon, label: 'Financial Record' },
    { path: '/feed-water-observation', icon: Package, label: 'Feed & Water Observation' },
    { path: '/feed-tracking', icon: Scale, label: 'Feed Tracking' },
    { path: '/extended-dairy-farm-management', icon: Settings, label: 'Extended Dairy Management' },
    { path: '/equipment-maintenance', icon: Settings, label: 'Equipment Maintenance' },
    { path: '/daily-animal-observation', icon: Eye, label: 'Daily Animal Observation' },
    { path: '/cow-health-observation', icon: Stethoscope, label: 'Cow Health Observation' },
    { path: '/calf-record', icon: Baby, label: 'Calf Record' },
    { path: '/breeding-tracking', icon: Target, label: 'Breeding Tracking' },
  ];

  return (
    <>
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 bg-white shadow-lg w-64 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:static`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-blue-600">Farm Management</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 rounded-lg transition-colors duration-200 ${
                    isActive
                      ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="ml-3 text-sm font-medium">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
      
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" 
          onClick={onClose}
        />
      )}
    </>
  );
};

export default Sidebar;