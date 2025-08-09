import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  BookOpenCheck, Boxes, Brush, Bug, CalendarCheck2, Users2,
  CalendarClock, CalendarDays, CalendarRange, ClipboardCheck,
  ClipboardList, ClipboardSignature, Clock9, CloudRain, Construction,
  Contact2, Droplets, Eraser, FileBarChart2, FileText, Stethoscope, CalendarCheck,
  Fingerprint, FlaskConical, FolderKanban, FolderOpen, GaugeCircle, Hand, Archive,
  ScrollText, Dna, Wallet, Banknote, CalendarSearch, Salad, BrainCircuit, Hammer,
  HardDriveDownload, IndianRupee, LayoutDashboard, CupSoda, HeartPulse, // Fixed IndianRupee import
  LineChart, ListTodo, LocateFixed, NotepadText, FilePlus, FileClock,
  Pill, PlaneTakeoff, Scale, Settings, Settings2, ShieldAlert, Wheat, ClipboardType, PackageSearch,
  Sparkles, Sprout, SprayCan, Stamp, SunMedium, Syringe, Target, TestTube,
  Thermometer, ThermometerSun, Utensils, UtensilsCrossed, Warehouse, Search, X
} from 'lucide-react';

import { useParams } from 'react-router-dom';

interface DashboardProps {
  isSupervisorView?: boolean;
  supervisorId?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  isSupervisorView = false, 
  supervisorId: propSupervisorId = '' 
}) => {
  const location = useLocation();
  const params = useParams<{ userId?: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Use supervisor ID from URL params if available
  const supervisorId = params.userId || propSupervisorId;

  // Add supervisorId to all links if in supervisor view
  const getLink = (path: string) => {
    let queryParams = new URLSearchParams(location.search);
    
    if (isSupervisorView && supervisorId) {
      queryParams.set('supervisorId', supervisorId);
    }
    
    return `${path}?${queryParams.toString()}`;
  };

  // Color scheme for different categories
  const categoryColors = [
    { bg: 'from-emerald-50 to-green-50', border: 'border-emerald-200', icon: 'text-emerald-600', active: 'bg-emerald-100 border-emerald-300' },
    { bg: 'from-blue-50 to-indigo-50', border: 'border-blue-200', icon: 'text-blue-600', active: 'bg-blue-100 border-blue-300' },
    { bg: 'from-purple-50 to-violet-50', border: 'border-purple-200', icon: 'text-purple-600', active: 'bg-purple-100 border-purple-300' },
    { bg: 'from-orange-50 to-amber-50', border: 'border-orange-200', icon: 'text-orange-600', active: 'bg-orange-100 border-orange-300' },
    { bg: 'from-teal-50 to-cyan-50', border: 'border-teal-200', icon: 'text-teal-600', active: 'bg-teal-100 border-teal-300' },
    { bg: 'from-rose-50 to-pink-50', border: 'border-rose-200', icon: 'text-rose-600', active: 'bg-rose-100 border-rose-300' },
    { bg: 'from-slate-50 to-gray-50', border: 'border-slate-200', icon: 'text-slate-600', active: 'bg-slate-100 border-slate-300' },
  ];

  // Categorized menu items
  const categories = [
    {
      name: "Tracking Dashboard",
      items: [
        { path: '/tracking-dashboard', icon: LayoutDashboard, label: 'Farm Tracking' },
        { path: '/Employee-Management', icon: Users2, label: 'Employee Management' },
      ]
    },
    {
      name: "Daily Records",
      items: [
        { path: '/MMTDaily-Yield-Records', icon: FileBarChart2, label: 'Daily Yield Records' },
        { path: '/SADaily-Attendance', icon: ClipboardCheck, label: 'Daily Attendance' },
        { path: '/FTDailyFeed-Register', icon: ScrollText, label: 'Daily Feed Register' },
        { path: '/CRF-Daily-Calf-FeedRegister', icon: Wheat, label: 'Daily Calf Feed Register' },
        { path: '/daily-health-log', icon: ClipboardList, label: 'Daily Health Log' },
        { icon: Utensils, label: 'Daily Observation', path: '/FWADaily-Observation' },
        { path: '/MQCDaily-Quality-Test', icon: FlaskConical, label: 'Daily Quality Test' },
        { icon: FlaskConical, label: 'Quality Inspection', path: '/FWAQuality-Inspection' },
      ]
    },
    {
      name: "Milk Yield Tracking",
      items: [
        { path: '/MMT-Weekly-Tracking', icon:  CupSoda, label: 'Milk Yield Weekly Tracking' },
        { path: '/MMTWeekly-Summary', icon: CalendarRange, label: 'Weekly Summary' },
        { path: '/milk-yield-tracking', icon: CalendarCheck2, label: 'Monthly Summary' },
      ]
    },
    {
      name: "Procurement Vendor",
      items: [
        { path: '/PVPurchase-Approvals', icon: Stamp, label: 'Purchase Approval' },
        { path: '/PVPo-Tracker', icon: LocateFixed, label: 'PO Tracker' },
        { path: '/PVVendor-Master', icon: Contact2, label: 'Vendor Master' },
        { path: '/PVDelivery-Inspection', icon: ClipboardSignature, label: 'Delivery Inspection' },
      ]
    },
    {
    name: "Inventory",
    items: [
      { path: '/feed-tracking', icon: Salad, label: 'Feed Inventory' },
      { path: '/CalfFeed-Inventory', icon: PackageSearch, label: 'Calf Feed Inventory' },
      { path: '/vaccine-inventor', icon: Boxes, label: 'Vaccine Inventory' },
      { path: '/Medicine-Inventory', icon: HeartPulse, label: 'Medicine Inventory' },
      { path: '/equipment-maintenance', icon: Settings, label: 'Spare Parts Inventory' },
      { path: '/EMEquipment-RegisterPage', icon: Hammer, label: 'Equipment Inventory' },
    ]
  },
  {
      name: "Health Management",
      items: [
        { path: '/deworming-schedule', icon: Pill, label: 'Deworming Schedule' },
        { path: '/health-record', icon: FileText, label: 'Health Summary' },
      ]
    },
    {
      name: "Vaccination Management",
      items: [
        { path: '/Vaccine-Register', icon: FilePlus, label: 'Vaccine Register' },
        { path: '/health-vaccination-records', icon: Syringe, label: 'Vaccination Record' },
        { path: '/vaccination-monthly-status', icon: CalendarDays, label: 'Vaccination Monthly Status' },
      ]
    },
    {
      name: "Medicine Management",
      items: [
        { path: '/Medicine-Register', icon: BrainCircuit, label: 'Medicine Register' },
        { path: '/Health-Medicine-Records', icon: Stethoscope, label: 'Medicine Records' },
        { path: '/Medicine-Monthly-Status', icon: CalendarCheck, label: 'Monthly Medicine Status' },
      ]
    },
  {
    name: "Feed Tracking",
    items: [
      { path: '/feed-water-observation', icon: Warehouse, label: 'Feed Stock Register' },
      { path: '/FTWeekly-Summary', icon: CalendarSearch, label: 'Weekly Summary' },
      { path: '/FTMonthly-Efficiency', icon: Scale, label: 'Monthly Efficiency' },
    ]
  },
  {
      name: "Staff Attendance",
      items: [
        { path: '/SATask-Assignment', icon: ListTodo, label: 'Task Assignment' },
        { path: '/SAWeekly-Shift-Schedule', icon: Clock9, label: 'Weekly Shift Schedule' },
        { path: '/SAMonthly-Performance', icon: GaugeCircle, label: 'Monthly Performance' },
        { path: '/staff-attendance', icon: PlaneTakeoff, label: 'Leave Tracker' },
      ]
    },
    {
    name: "Breed Management",
    items: [
      { path: '/Breeding-Calendar', icon: CalendarClock, label: 'Breeding Calendar' },
      { path: '/breeding-heart-detection', icon: ThermometerSun, label: 'Heat Detection' },
      { path: '/Breeding-AI-Records', icon: BookOpenCheck, label: 'AI Record' },
      { path: '/breeding-pregnancy-diagnosis', icon: TestTube, label: 'Pregnancy Diagnosis' },
      { path: '/BreedingCalving-Record', icon: Dna, label: 'Calving Record' },
      { path: '/breeding-tracking', icon: Target, label: 'Breeding Reports' },
    ]
  },
    {
    name: "Calf Management",
    items: [
      { path: '/Calf-Identification', icon: Fingerprint, label: 'Calf Identification' },
      { path: '/Cal-feeding-Log', icon: UtensilsCrossed, label: 'Calf Colostrum Feeding' },
      { path: '/Calf-Growth', icon: LineChart, label: 'Calf Growth' },
      { path: '/Weaned-Calf', icon: Sprout, label: 'Weaned Calf' },

      { path: '/CFR-Calf-feed-register', icon: ClipboardType, label: 'Calf feed Stock register' },
      { path: '/Calving-Death-Or-SoldLog', icon: FileClock, label: 'Calving Death/Sold Log' },
    ]
  },
  
    {
      name: "Milk Quality Check",
      items: [
        { path: '/MQCUtensil-Hygiene', icon: Brush, label: 'Utensil Hygiene' },
        { path: '/milk-quality-checks', icon: ShieldAlert, label: 'Rejection & Action' },
      ]
    },
    {
      name: "Milking Hygiene",
      items: [
        { path: '/MHMilking-Hygiene', icon: SprayCan, label: 'Milking Hygiene' },
        { path: '/MHEquipment-Cleaning', icon: Sparkles, label: 'Equipment Cleaning' },
        { path: '/MHMilker-Hygiene', icon: Hand, label: 'Milker Hygiene' },
        { path: '/MHMilk-Quality', icon: Droplets, label: 'Milk Quality' },
        { path: '/milking-hygiene', icon: Thermometer, label: 'Mastitis Monitoring' },
      ]
    },
    {
      name: "Equipment Management",
      items: [
        { path: '/EMService-AMC', icon: Settings2, label: 'Service & AMC' },
      ]
    },
    
    {
      name: "Record Maintenance",
      items: [
        { path: '/RMDaily-Log', icon: FolderOpen, label: 'Daily Log' },
        { path: '/RMRecord-Category', icon: FolderKanban, label: 'Record Categories' },
        { path: '/RMAudit-Checklist', icon: NotepadText, label: 'Audit Checklist' },
        { path: '/record-maintenance', icon: HardDriveDownload, label: 'Backup Tracker' },
      ]
    },
    {
    name: "Shed Environment",
    items: [
      { path: '/SECleaning', icon: Eraser, label: 'Shed Cleaning' },
      { path: '/SEVentilation-Lighting', icon: SunMedium, label: 'Ventilation & Lighting' },
      { path: '/SEPest-Control', icon: Bug, label: 'Pest Control' },
      {path: '/SERepairs-Log', icon: Construction, label: 'Repairs Log' },
      { path: '/Shed-Environment', icon: CloudRain, label: 'Drainage Observation' },
    ]
  },
  
{
  name: "Financial Records",
  items: [
    { path: '/FRDaily-FinancialLog', icon: FileText, label: 'Daily Financial Log' },
    { path: '/FRInventory-Register', icon: Archive, label: 'Inventory Register' },
    { path: '/FRMonthly-Expense', icon: Wallet, label: 'Monthly Expenses' },
    { path: '/FRMonthly-Income', icon: Banknote, label: 'Monthly Income' },
    { path: '/financial-record', icon: IndianRupee, label: 'Profitability Statement' }, // Fixed icon name
  ]
},

  ];

  // Filter categories and items based on search query
  const filteredCategories = categories
    .map(category => {
      const matchesCategory = category.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      const filteredItems = category.items.filter(item => 
        matchesCategory || 
        item.label.toLowerCase().includes(searchQuery.toLowerCase())
      );

      return filteredItems.length > 0
        ? { ...category, items: filteredItems }
        : null;
    })
    .filter(Boolean) as typeof categories;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header Section with Enhanced Design */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 rounded-2xl p-6 shadow-lg">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="text-white">
                <h1 className="text-3xl font-bold mb-2">
                  Nemmadhi Dairy Farming
                </h1>
                {isSupervisorView ? (
                  <div className="flex items-center gap-3">
                    <span className="text-green-100 text-lg">Supervisor Dashboard</span>
                    <div className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg border border-white/30">
                      ID: {supervisorId}
                    </div>
                  </div>
                ) : (
                  <p className="text-green-100 text-lg">Farm Management System</p>
                )}
              </div>
              
              {/* Enhanced Search Bar */}
              <div className="relative w-full lg:max-w-md">
                <div className="flex absolute inset-y-0 left-0 items-center pl-4 pointer-events-none">
                  <Search className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search categories or modules..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-12 pr-12 py-4 rounded-xl border-0 bg-white/95 backdrop-blur-sm shadow-lg focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white transition-all duration-200 placeholder-gray-500"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        {filteredCategories.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 inline-block p-6 rounded-full mb-6 shadow-inner">
              <Search className="w-16 h-16 text-gray-400" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-700 mb-3">No matches found</h3>
            <p className="text-gray-500 text-lg">
              No categories or modules match "{searchQuery}"
            </p>
            <button 
              onClick={() => setSearchQuery('')}
              className="mt-4 px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="space-y-10">
            {filteredCategories.map((category, categoryIndex) => {
              const colorScheme = categoryColors[categoryIndex % categoryColors.length];
              
              return (
                <div key={category.name} className="group">
                  {/* Category Header */}
                  <div className={`bg-gradient-to-r ${colorScheme.bg} border ${colorScheme.border} rounded-xl p-4 mb-6 shadow-sm`}>
                    <h2 className={`text-xl font-bold ${colorScheme.icon} flex items-center gap-2`}>
                      <div className={`w-2 h-2 rounded-full ${colorScheme.icon.replace('text-', 'bg-')}`}></div>
                      {category.name}
                      <span className={`ml-auto text-sm px-3 py-1 rounded-full bg-white/60 ${colorScheme.icon}`}>
                        {category.items.length} modules
                      </span>
                    </h2>
                  </div>
                  
                  {/* Category Items Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {category.items.map((item) => (
                      <NavLink
                        key={item.path}
                        to={getLink(item.path)}
                        className={({ isActive }) => 
                          `group/item relative flex flex-col items-center p-4 rounded-xl shadow-sm border transition-all duration-300 hover:shadow-lg hover:-translate-y-1
                          ${isActive 
                            ? `${colorScheme.active} ${colorScheme.border} shadow-md` 
                            : `bg-white hover:bg-gradient-to-br hover:${colorScheme.bg} border-gray-200 hover:${colorScheme.border}`
                          }`
                        }
                      >
                        {/* Icon with animated background */}
                        <div className={`relative p-3 rounded-xl mb-3 transition-all duration-300 ${
                          'bg-gray-50 group-hover/item:bg-white group-hover/item:shadow-sm'
                        }`}>
                          <item.icon className={`w-6 h-6 transition-all duration-300 ${
                            `text-gray-600 group-hover/item:${colorScheme.icon}`
                          }`} />
                        </div>
                        
                        {/* Label */}
                        <span className="text-center text-sm font-medium text-gray-700 leading-tight group-hover/item:text-gray-900 transition-colors duration-200">
                          {item.label}
                        </span>
                        
                        {/* Active indicator */}
                        <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${colorScheme.icon.replace('text-', 'bg-')} shadow-sm ${
                          'opacity-0 group-hover/item:opacity-100 transition-opacity duration-300'
                        }`}></div>
                      </NavLink>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;