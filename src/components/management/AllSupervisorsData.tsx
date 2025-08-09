import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import {
  Syringe, CalendarClock, Search, X, FolderOpen, Droplets, FileText, ClipboardList, Pill, 
  ThermometerSun, Scale, BookOpenCheck, Settings, Target, LayoutDashboard, Boxes, CalendarDays,
  TestTube, Fingerprint, UtensilsCrossed, FileBarChart2, Tag, CalendarRange, CalendarCheck2, Wheat, ClipboardType, PackageSearch,
  Stamp, Eraser, SunMedium, ScrollText, CalendarSearch, CheckCircle, FilePlus,Dna, CupSoda,Users2,Archive,
  Wallet, Banknote, Salad, Utensils, Warehouse, Bug,BrainCircuit,Stethoscope,CalendarCheck,HeartPulse,
  Construction, CloudRain, LocateFixed, Contact2, NotepadText, FolderKanban, HardDriveDownload, ClipboardSignature, FlaskConical,
  Brush, ClipboardCheck, ListTodo, Hammer, Settings2, Clock9, GaugeCircle, PlaneTakeoff, ShieldAlert,
  SprayCan, Sparkles, Hand, Thermometer, LineChart, Sprout, IndianRupee,FileClock,
} from 'lucide-react';

import StaffAttendance from './staff attendance management/StaffAttendance';
import RecordMaintenance from './Record mantainance/RecordMaintenance';
import MilkingHygiene from './milking higne management/MilkingHygiene';
import MilkYieldTracking from './Milk yield tracking/MilkYieldTracking';
import HealthSummary from './HealthRecord/helthsummery';
import FinancialRecord from './financial records/FinancialRecord';
import FeedWaterObservation from './Feed & water observatin/FeedWaterObservation';
import FeedTracking from './Feed Tracking/FeedTracking';
import EquipmentMaintenance from './Equipment maintenance Management/EquipmentMaintenance';
import CalfRecords from './calfe management/CalfRecords';
import BreedingTracking from './breeding tracking/BreedingTracking';
import TrackingDashboard from '.././tracking/TrackingDashboard';
import ShedEnvironment from './Shed Environment/ShedEnvironment';
import Comingsoon from '../../components/layout/Comingsoon';
import DailyHealthLog from './HealthRecord/DailyHealthLog';
import TreatmentRecord from './HealthRecord/TreatmentRecord';
import DewormingSchedule from './HealthRecord/DewormingSchedule';
import HealthVaccinationRecords from './VaccinationDashboard/HealthVaccinationRecords';
import VaccinationMonthlyStatus from './VaccinationDashboard/VaccinationMonthlyStatus';
import VaccineInventory from './VaccinationDashboard/VaccineInventory';
import BreedingAIRecords from './breeding tracking/BreedingAIRecords';
import BreedingHeartDetection from './breeding tracking/BreedingHeartDetection';
import BreedingPregnancyDiagnosis from './breeding tracking/BreedingPregnancyDiagnosis';
import BreedingCalendar from './breeding tracking/BreedingCalendar';
import CalfGrowth from './calfe management/CalfGrowth';
import CalfIdentification from './calfe management/CalfIdentification';
import WeanedCalf from './calfe management/WeanedCalf';
import CalfFeedingLog from './calfe management/CalfFeedingLog';
import MMTDailyYieldRecords from './Milk yield tracking/MMTDailyYieldRecords';
import MMTWeeklySummary from './Milk yield tracking/MMTWeeklySummary';
import MQCCollectionQuality from './Milk daily quality check/MQCCollectionQuality';
import MQCDailyQualityTest from './Milk daily quality check/MQCDailyQualityTest';
import MQCUtensilHygiene from './Milk daily quality check/MQCUtensilHygiene';
import MHMilkQuality from './milking higne management/MHMilkQuality';
import MHEquipmentCleaning from './milking higne management/MHEquipmentCleaning';
import MHMilkingHygiene from './milking higne management/MHMilkingHygiene';
import MHMilkerHygiene from './milking higne management/MHMilkerHygiene';
import SATaskAssignment from './staff attendance management/SATaskAssignment';
import SADailyAttendance from './staff attendance management/SADailyAttendance';
import SAWeeklyShiftSchedule from './staff attendance management/SAWeeklyShiftSchedule';
import SAMonthlyPerformance from './staff attendance management/SAMonthlyPerformance';
import EMEquipmentRegisterPage from './Equipment maintenance Management/EMEquipmentRegisterPage';
import EMServiceAMC from './Equipment maintenance Management/EMServiceAMC';
import PVDeliveryInspection from './Procurement Vendors management/PVDeliveryInspection';
import PVPurchaseApprovals from './Procurement Vendors management/PVPurchaseApprovals';
import PVPoTracker from './Procurement Vendors management/PVPoTracker';
import PVVendorMaster from './Procurement Vendors management/PVVendorMaster';
import RMAuditChecklist from './Record mantainance/RMAuditChecklist';
import RMDailyLog from './Record mantainance/RMDailyLog';
import RMRecordCategory from './Record mantainance/RMRecordCategory';
import SECleaning from './Shed Environment/SECleaning';
import SEVentilationLighting from './Shed Environment/SEVentilationLighting';
import SEPestControl from './Shed Environment/SEPestControl';
import SERepairsLog from './Shed Environment/SERepairsLog';
import FWADailyObservation from './Feed & water observatin/FWADailyObservation';
import FWAQualityInspection from './Feed & water observatin/FWAQualityInspection';
import FTDailyFeedRegister from './Feed Tracking/FTDailyFeedRegister';
import FTMonthlyEfficiency from './Feed Tracking/FTMonthlyEfficiency';
import FTWeeklySummary from './Feed Tracking/FTWeeklySummary';
import FRDailyFinancialLog from './financial records/FRDailyFinancialLog';
import FRInventoryRegister from './financial records/FRInventoryRegister';
import FRMonthlyExpense from './financial records/FRMonthlyExpense';
import FRMonthlyIncome from './financial records/FRMonthlyIncome';
import AnimalManagement from './AnimalManagement';
import ApprovalPage from './ApprovalPage';
import VaccineRegister from './VaccinationDashboard/vacinationregister';
import BreedingCalvingRecord from './breeding tracking/breedingCalvingRecord';
import MilkQualityChecks from './Milk daily quality check/MilkQualityChecks';
import MedicineRegister from './Medicinemanagement/MedicineRegister';
import HealthMedicineRecords from './Medicinemanagement/HealthMedicineRecords';
import MedicineInventory from './Medicinemanagement/MedicineInventory';
import MedicineMonthlyStatus from './Medicinemanagement/MedicineMonthlyStatus';
import MMTWeeklyTracking from './Milk yield tracking/MMTWeeklyTracking';
import EmployeeManagement from './EmployeeManagement';
import CFRCalffeedregister from './calfe management/CFRCalffeedregister';
import CRFDailyCalfFeedRegister from './calfe management/CRFDailyCalfFeedRegister';
import CalfFeedInventory from './calfe management/CalfFeedInventory';
import CalvingDeathOrSoldLog from './calfe management/CalvingDeathOrSoldRecord';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

const AllSupervisorsData: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeModule, setActiveModule] = useState<string | null>(searchParams.get('module'));
  const [supervisors, setSupervisors] = useState<User[]>([]);
  const [selectedSupervisor, setSelectedSupervisor] = useState(searchParams.get('supervisor') || 'all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSupervisorDropdownOpen, setIsSupervisorDropdownOpen] = useState(false);
  const [supervisorSearchQuery, setSupervisorSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const categoryColors = [
    { bg: 'from-emerald-50 to-green-50', border: 'border-emerald-200', icon: 'text-emerald-600', active: 'bg-emerald-100 border-emerald-300' },
    { bg: 'from-blue-50 to-indigo-50', border: 'border-blue-200', icon: 'text-blue-600', active: 'bg-blue-100 border-blue-300' },
    { bg: 'from-purple-50 to-violet-50', border: 'border-purple-200', icon: 'text-purple-600', active: 'bg-purple-100 border-purple-300' },
    { bg: 'from-orange-50 to-amber-50', border: 'border-orange-200', icon: 'text-orange-600', active: 'bg-orange-100 border-orange-300' },
    { bg: 'from-teal-50 to-cyan-50', border: 'border-teal-200', icon: 'text-teal-600', active: 'bg-teal-100 border-teal-300' },
    { bg: 'from-rose-50 to-pink-50', border: 'border-rose-200', icon: 'text-rose-600', active: 'bg-rose-100 border-rose-300' },
    { bg: 'from-slate-50 to-gray-50', border: 'border-slate-200', icon: 'text-slate-600', active: 'bg-slate-100 border-slate-300' },
  ];

  // Throttled scroll position saver
  const saveScrollPosition = useCallback(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      const scrollY = window.scrollY;
      localStorage.setItem('allSupervisorsScrollPosition', scrollY.toString());
    }, 100);
  }, []);

  // Set up scroll listener
  useEffect(() => {
    window.addEventListener('scroll', saveScrollPosition);
    return () => {
      window.removeEventListener('scroll', saveScrollPosition);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [saveScrollPosition]);

  // Restore scroll position on mount and when activeModule changes
  useLayoutEffect(() => {
    const savedPosition = localStorage.getItem('allSupervisorsScrollPosition');
    if (savedPosition) {
      window.scrollTo(0, parseInt(savedPosition));
    }
    
    // Save current position when unmounting
    return () => {
      const currentPosition = window.scrollY;
      localStorage.setItem('allSupervisorsScrollPosition', currentPosition.toString());
    };
  }, [activeModule]);

  const filteredSupervisors = supervisors.filter(supervisor =>
    supervisor.username.toLowerCase().includes(supervisorSearchQuery.toLowerCase()) ||
    supervisor.email.toLowerCase().includes(supervisorSearchQuery.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsSupervisorDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getToken = () => {
    const userData = localStorage.getItem('dairyFarmUser');
    if (!userData) return null;
    
    try {
      const parsedUser = JSON.parse(userData);
      return parsedUser.token;
    } catch (err) {
      console.error('Error parsing user data:', err);
      return null;
    }
  };

  useEffect(() => {
    const fetchSupervisors = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = getToken();
        if (!token) {
          setError('Authentication token not found');
          setLoading(false);
          return;
        }
        
        const response = await axios.get('https://nemmadi-dairy-farm.koyeb.app/api/users/', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.status !== 200) {
          if (response.status === 401) {
            setError('Session expired. Please login again.');
          } else {
            throw new Error('Failed to fetch users');
          }
          return;
        }
        
        // Filter for supervisors only
        const supervisorList = response.data.filter((user: User) => user.role === 'supervisor');
        setSupervisors(supervisorList);
        setLoading(false);
      } catch (err) {
        let errorMessage = 'Failed to load supervisors';
        if (axios.isAxiosError(err)) {
          if (err.response?.status === 401) {
            errorMessage = 'Session expired. Please login again.';
          } else {
            errorMessage = err.response?.data?.detail || err.message;
          }
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }
        setError(errorMessage);
        setLoading(false);
      }
    };

    fetchSupervisors();
  }, []);

  useEffect(() => {
    // Update URL params when filter changes
    const params = new URLSearchParams();
    if (selectedSupervisor !== 'all') {
      params.set('supervisor', selectedSupervisor);
    }
    if (activeModule) {
      params.set('module', activeModule);
    }
    setSearchParams(params);
  }, [selectedSupervisor, activeModule, setSearchParams]);

  const getQuery = () => {
    if (selectedSupervisor === 'all') {
      return '?all_supervisors=true';
    }
    return `?supervisorId=${selectedSupervisor}`;
  };

  const renderModule = () => {
    const query = getQuery();
    
    switch(activeModule) {
      case 'tracking-dashboard':
        return <TrackingDashboard key={query} query={query} />;

      //Medicine
      case 'Health-Medicine-Records':
        return <HealthMedicineRecords key={query} query={query} />;
      case 'Medicine-Inventory':
        return <MedicineInventory key={query} query={query} />;
      case 'Medicine-Register':
        return <MedicineRegister key={query} query={query} />;
      case 'Medicine-Monthly-Status':
        return <MedicineMonthlyStatus key={query} query={query} />;

      //SA
      case 'staff-attendance':
        return <StaffAttendance key={query} query={query} />;
      case 'SATask-Assignment':
        return <SATaskAssignment key={query} query={query} />;
      case 'SADaily-Attendance':
        return <SADailyAttendance key={query} query={query} />;
      case 'SAWeekly-Shift-Schedule':
        return <SAWeeklyShiftSchedule key={query} query={query} />;
      case 'SAMonthly-Performance':
        return <SAMonthlyPerformance key={query} query={query} />;

      //RM
      case 'record-maintenance':
        return <RecordMaintenance key={query} query={query} />;
      case 'RMAudit-Checklist':
        return <RMAuditChecklist key={query} query={query} />;
      case 'RMDaily-Log':
        return <RMDailyLog key={query} query={query} />;
      case 'RMRecord-Category':
        return <RMRecordCategory key={query} query={query} />;

      //PV
      case 'PVPurchase-Approvals':
        return <PVPurchaseApprovals key={query} query={query} />;
      case 'PVPo-Tracker':
        return <PVPoTracker key={query} query={query} />;
      case 'PVVendor-Master':
        return <PVVendorMaster key={query} query={query} />;
      case 'PVDelivery-Inspection':
        return <PVDeliveryInspection key={query} query={query} />;

      //MH
      case 'milking-hygiene':
        return <MilkingHygiene key={query} query={query} />;
      case 'MHEquipment-Cleaning':
        return <MHEquipmentCleaning key={query} query={query} />;
      case 'MHMilker-Hygiene':
        return <MHMilkerHygiene key={query} query={query} />;
      case 'MHMilking-Hygiene':
        return <MHMilkingHygiene key={query} query={query} />;
      case 'MHMilk-Quality':
        return <MHMilkQuality key={query} query={query} />;

      //MMT
      case 'milk-yield-tracking':
        return <MilkYieldTracking key={query} query={query} />;
       case 'MMTWeekly-Summary':
        return <MMTWeeklySummary key={query} query={query} />;
       case 'MMTDaily-Yield-Records':
        return <MMTDailyYieldRecords key={query} query={query} />;
      case 'MMTWeekly-Tracking':
        return <MMTWeeklyTracking key={query} query={query} />;

      //MQC
      case 'MQCCollection-Quality':
        return <MQCCollectionQuality key={query} query={query} />;
      case 'MQCDaily-Quality-Test':
        return <MQCDailyQualityTest key={query} query={query} />;
      case 'MQCUtensil-Hygiene':
        return <MQCUtensilHygiene key={query} query={query} />;
      case 'MilkQuality-Checks':
        return <MilkQualityChecks key={query} query={query} />;
      
      // health records
      case 'health-record':
        return <HealthSummary key={query} query={query} />;
      case 'daily-health-log':
        return <DailyHealthLog key={query} query={query} />;
      case 'treatment-record':
        return <TreatmentRecord key={query} query={query} />;
      case 'deworming-schedule':
        return <DewormingSchedule key={query} query={query} />;
      case 'health-vaccination-records':
        return <HealthVaccinationRecords key={query} query={query} />;
      

      //vacination
      case 'vaccination-schedule':
        return <Comingsoon title="Vaccination Schedule" />;
      case 'vaccination-monthly-status':
        return <VaccinationMonthlyStatus key={query} query={query} />;
      case 'vaccine-inventor':
        return <VaccineInventory key={query} query={query} />;
      case 'Vaccine-Register':
        return <VaccineRegister key={query} query={query} />;
      

      //FR
      case 'financial-record':
        return <FinancialRecord key={query} query={query} />;
      case 'FRDaily-FinancialLog':
        return <FRDailyFinancialLog key={query} query={query} />;
      case 'FRInventory-Register':
        return <FRInventoryRegister key={query} query={query} />;
      case 'FRMonthly-Income':
        return <FRMonthlyIncome key={query} query={query} />;
      case 'FRMonthly-Expense':
        return <FRMonthlyExpense key={query} query={query} />;

      //FT
      case 'feed-tracking':
        return <FeedTracking key={query} query={query} />;
      case 'FTDailyFeed-Register':
        return <FTDailyFeedRegister key={query} query={query} />;
      case 'FTWeekly-Summary':
        return <FTWeeklySummary key={query} query={query} />;
      case 'FTMonthly-Efficiency':
        return <FTMonthlyEfficiency key={query} query={query} />;

      //FWA
      case 'feed-water-observation':
        return <FeedWaterObservation key={query} query={query} />;
      case 'FWAQuality-Inspection':
        return <FWAQualityInspection key={query} query={query} />;
      case 'FWADaily-Observation':
        return <FWADailyObservation key={query} query={query} />;

      //equpments
      case 'equipment-maintenance':
        return <EquipmentMaintenance key={query} query={query} />;
      case 'EMEquipment-RegisterPage':
        return <EMEquipmentRegisterPage key={query} query={query} />;
      case 'EMService-AMC':
        return <EMServiceAMC key={query} query={query} />;
      
      //calf
      case 'calf-record':
        return <CalfRecords key={query} query={query} />;
      case 'Calf-Growth':
        return <CalfGrowth key={query} query={query} />;
      case 'Calf-Identification':
        return <CalfIdentification key={query} query={query} />;
      case 'Weaned-Calf':
        return <WeanedCalf key={query} query={query} />;
      case 'Calf-Feeding-Log':
        return <CalfFeedingLog key={query} query={query} />;
      case 'Calving-Death-Or-SoldLog':
        return <CalvingDeathOrSoldLog key={query} query={query} />;


      case 'CalfFeed-Inventory':
        return <CalfFeedInventory key={query} query={query} />;
      case 'CRF-Daily-Calf-FeedRegister':
        return <CRFDailyCalfFeedRegister key={query} query={query} />;
      case 'CFR-Calf-feed-register':
        return <CFRCalffeedregister key={query} query={query} />;
      

      // SE
      case 'shed-environment':
        return <ShedEnvironment key={query} query={query} />;
      case 'SERepairs-Log':
        return <SERepairsLog key={query} query={query} />;
      case 'SEPest-Control':
        return <SEPestControl key={query} query={query} />;
      case 'SEVentilation-Lighting':
        return <SEVentilationLighting key={query} query={query} />;
      case 'SECleaning':
        return <SECleaning key={query} query={query} />;

      //breed tracking
      case 'breeding-tracking':
        return <BreedingTracking key={query} query={query} />;
      case 'Breeding-AI-Records':
        return <BreedingAIRecords key={query} query={query} />;
      case 'breeding-heart-detection':
        return <BreedingHeartDetection key={query} query={query} />;
      case 'breeding-pregnancy-diagnosis':
        return <BreedingPregnancyDiagnosis key={query} query={query} />;
      case 'BreedingCalving-Record':
        return <BreedingCalvingRecord key={query} query={query} />;
      case 'Breeding-Calendar':
        return <BreedingCalendar key={query} query={query} />;
      
      // Inside renderModule() function
      case 'animal-management':
        return <AnimalManagement />;
      case 'Approval-Page':
        return <ApprovalPage key={query} query={query} />;
      case 'Employee-Management':
        return <EmployeeManagement key={query} query={query} />;

      default:
        return null;
    }
  };

  // Categorized menu items
  // Categorized menu items - identical to Dashboard
  const categories = [
    {
      name: "Tracking Dashboard",
      items: [
        { id: 'tracking-dashboard', icon: LayoutDashboard, label: 'Farm Tracking' },
        { id: 'animal-management', icon: Tag, label: 'Animal Management' },
        { id: 'Employee-Management', icon: Users2, label: 'Employee Management' },
        { id: 'Approval-Page', icon: CheckCircle, label: 'Approval Page' },
      ]
    },
    {
      name: "Daily Records",
      items: [
        { id: 'MMTDaily-Yield-Records', icon: FileBarChart2, label: 'Daily Yield Records' },
        { id: 'SADaily-Attendance', icon: ClipboardCheck, label: 'Daily Attendance' },
        { id: 'FTDailyFeed-Register', icon: ScrollText, label: 'Daily Feed Register' },
        { id: 'CRF-Daily-Calf-FeedRegister', icon: Wheat, label: 'Daily Calf Feed Register' },
        { id: 'daily-health-log', icon: ClipboardList, label: 'Daily Health Log' },
        { id: 'FWADaily-Observation', icon: Utensils, label: 'Daily Observation' },
        { id: 'MQCDaily-Quality-Test', icon: FlaskConical, label: 'Daily Quality Test' },
        { id: 'FWAQuality-Inspection', icon: FlaskConical, label: 'Quality Inspection' },
      ]
    },
    {
      name: "Milk Yield Tracking",
      items: [
        { id: 'MMTWeekly-Tracking', icon: CupSoda, label: 'Milk Yield Weekly Tracking' },
        { id: 'MMTWeekly-Summary', icon: CalendarRange, label: 'Weekly Summary' },
        { id: 'milk-yield-tracking', icon: CalendarCheck2, label: 'Monthly Summary' },
      ]
    },
    {
      name: "Procurement Vendor",
      items: [
        { id: 'PVPurchase-Approvals', icon: Stamp, label: 'Purchase Approval' },
        { id: 'PVPo-Tracker', icon: LocateFixed, label: 'PO Tracker' },
        { id: 'PVVendor-Master', icon: Contact2, label: 'Vendor Master' },
        { id: 'PVDelivery-Inspection', icon: ClipboardSignature, label: 'Delivery Inspection' },
      ]
    },
    {
      name: "Inventory",
      items: [
        { id: 'feed-tracking', icon: Salad, label: 'Feed Inventory' },
        { id: 'CalfFeed-Inventory', icon: PackageSearch, label: 'Calf Feed Inventory' },
        { id: 'vaccine-inventor', icon: Boxes, label: 'Vaccine Inventory' },
        { id: 'Medicine-Inventory', icon: HeartPulse, label: 'Medicine Inventory' },
        { id: 'equipment-maintenance', icon: Settings, label: 'Spare Parts Inventory' },
        { id: 'EMEquipment-RegisterPage', icon: Hammer, label: 'Equipment Inventory' },
      ]
    },
    {
      name: "Health Management",
      items: [
        { id: 'deworming-schedule', icon: Pill, label: 'Deworming Schedule' },
        { id: 'health-record', icon: FileText, label: 'Health Summary' },
      ]
    },
    {
      name: "Vaccination Management",
      items: [
        { id: 'Vaccine-Register', icon: FilePlus, label: 'Vaccine Register' },
        { id: 'health-vaccination-records', icon: Syringe, label: 'Vaccination Record' },
        { id: 'vaccination-monthly-status', icon: CalendarDays, label: 'Vaccination Monthly Status' },
      ]
    },
    {
      name: "Medicine Management",
      items: [
        { id: 'Medicine-Register', icon: BrainCircuit, label: 'Medicine Register' },
        { id: 'Health-Medicine-Records', icon: Stethoscope, label: 'Medicine Records' },
        { id: 'Medicine-Monthly-Status', icon: CalendarCheck, label: 'Monthly Medicine Status' },
      ]
    },
    {
      name: "Feed Tracking",
      items: [
        { id: 'feed-water-observation', icon: Warehouse, label: 'Feed Stock Register' },
        { id: 'FTWeekly-Summary', icon: CalendarSearch, label: 'Weekly Summary' },
        { id: 'FTMonthly-Efficiency', icon: Scale, label: 'Monthly Efficiency' },
      ]
    },
    {
      name: "Staff Attendance",
      items: [
        { id: 'SATask-Assignment', icon: ListTodo, label: 'Task Assignment' },
        { id: 'SAWeekly-Shift-Schedule', icon: Clock9, label: 'Weekly Shift Schedule' },
        { id: 'SAMonthly-Performance', icon: GaugeCircle, label: 'Monthly Performance' },
        { id: 'staff-attendance', icon: PlaneTakeoff, label: 'Leave Tracker' },
      ]
    },
    {
      name: "Breed Management",
      items: [
        { id: 'Breeding-Calendar', icon: CalendarClock, label: 'Breeding Calendar' },
        { id: 'breeding-heart-detection', icon: ThermometerSun, label: 'Heat Detection' },
        { id: 'Breeding-AI-Records', icon: BookOpenCheck, label: 'AI Record' },
        { id: 'breeding-pregnancy-diagnosis', icon: TestTube, label: 'Pregnancy Diagnosis' },
        { id: 'BreedingCalving-Record', icon: Dna, label: 'Calving Record' },
        { id: 'breeding-tracking', icon: Target, label: 'Breeding Reports' },
      ]
    },
    {
      name: "Calf Management",
      items: [
        { id: 'Calf-Identification', icon: Fingerprint, label: 'Calf Identification' },
        { id: 'Cal-feeding-Log', icon: UtensilsCrossed, label: 'Calf Colostrum Feeding' },
        { id: 'Calf-Growth', icon: LineChart, label: 'Calf Growth' },
        { id: 'Weaned-Calf', icon: Sprout, label: 'Weaned Calf' },
        { id: 'CFR-Calf-feed-register', icon: ClipboardType, label: 'Calf feed Stock register' },
        { id: 'Calving-Death-Or-SoldLog', icon: FileClock, label: 'Calving Death/Sold Log' },
      ]
    },
    {
      name: "Milk Quality Check",
      items: [
        { id: 'MQCUtensil-Hygiene', icon: Brush, label: 'Utensil Hygiene' },
        { id: 'milk-quality-checks', icon: ShieldAlert, label: 'Rejection & Action' },
      ]
    },
    {
      name: "Milking Hygiene",
      items: [
        { id: 'MHMilking-Hygiene', icon: SprayCan, label: 'Milking Hygiene' },
        { id: 'MHEquipment-Cleaning', icon: Sparkles, label: 'Equipment Cleaning' },
        { id: 'MHMilker-Hygiene', icon: Hand, label: 'Milker Hygiene' },
        { id: 'MHMilk-Quality', icon: Droplets, label: 'Milk Quality' },
        { id: 'milking-hygiene', icon: Thermometer, label: 'Mastitis Monitoring' },
      ]
    },
    {
      name: "Equipment Management",
      items: [
        { id: 'EMService-AMC', icon: Settings2, label: 'Service & AMC' },
      ]
    },
    {
      name: "Record Maintenance",
      items: [
        { id: 'RMDaily-Log', icon: FolderOpen, label: 'Daily Log' },
        { id: 'RMRecord-Category', icon: FolderKanban, label: 'Record Categories' },
        { id: 'RMAudit-Checklist', icon: NotepadText, label: 'Audit Checklist' },
        { id: 'record-maintenance', icon: HardDriveDownload, label: 'Backup Tracker' },
      ]
    },
    {
      name: "Shed Environment",
      items: [
        { id: 'SECleaning', icon: Eraser, label: 'Shed Cleaning' },
        { id: 'SEVentilation-Lighting', icon: SunMedium, label: 'Ventilation & Lighting' },
        { id: 'SEPest-Control', icon: Bug, label: 'Pest Control' },
        { id: 'SERepairs-Log', icon: Construction, label: 'Repairs Log' },
        { id: 'Shed-Environment', icon: CloudRain, label: 'Drainage Observation' },
      ]
    },
    {
      name: "Financial Records",
      items: [
        { id: 'FRDaily-FinancialLog', icon: FileText, label: 'Daily Financial Log' },
        { id: 'FRInventory-Register', icon: Archive, label: 'Inventory Register' },
        { id: 'FRMonthly-Expense', icon: Wallet, label: 'Monthly Expenses' },
        { id: 'FRMonthly-Income', icon: Banknote, label: 'Monthly Income' },
        { id: 'financial-record', icon: IndianRupee, label: 'Profitability Statement' },
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

  const handleModuleClick = (moduleId: string) => {
    setActiveModule(moduleId);
  };

  const handleBackToDashboard = () => {
    setActiveModule(null);
    setSearchQuery('');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-lg">Loading supervisors...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-2 text-blue-600 hover:text-blue-800"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

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
                <div className="flex items-center gap-3">
                  <span className="text-green-100 text-lg">Supervisor Data Dashboard</span>
                  <div className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg border border-white/30">
                    ID: {selectedSupervisor === 'all' ? 'All' : selectedSupervisor}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:max-w-2xl">
                {/* Supervisor Dropdown */}
                <div className="w-full sm:w-64 relative" ref={dropdownRef}>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsSupervisorDropdownOpen(!isSupervisorDropdownOpen)}
                      className="w-full flex justify-between items-center border border-white/40 rounded-xl px-4 py-3 bg-white/10 backdrop-blur-sm shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                    >
                      <span className="truncate">
                        {selectedSupervisor === 'all' 
                          ? 'All Supervisors' 
                          : supervisors.find(s => s.id === selectedSupervisor)?.username || 'Select supervisor'}
                      </span>
                      <svg
                        className={`h-5 w-5 text-white/80 transition-transform duration-200 ${
                          isSupervisorDropdownOpen ? 'transform rotate-180' : ''
                        }`}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>

                    {isSupervisorDropdownOpen && (
                      <div className="absolute z-10 mt-1 w-full rounded-xl bg-white shadow-lg border border-gray-200 max-h-60 overflow-auto">
                        <div className="p-2 border-b">
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Search className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                              type="text"
                              placeholder="Search supervisors..."
                              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              value={supervisorSearchQuery}
                              onChange={(e) => setSupervisorSearchQuery(e.target.value)}
                              autoFocus
                            />
                          </div>
                        </div>
                        <ul className="py-1">
                          <li
                            key="all"
                            className={`px-4 py-2 text-sm cursor-pointer hover:bg-emerald-50 ${
                              selectedSupervisor === 'all' ? 'bg-emerald-100 text-emerald-800' : 'text-gray-800'
                            }`}
                            onClick={() => {
                              setSelectedSupervisor('all');
                              setIsSupervisorDropdownOpen(false);
                              setSupervisorSearchQuery('');
                            }}
                          >
                            <div className="flex items-center">
                              <span>All Supervisors</span>
                            </div>
                          </li>
                          {filteredSupervisors.length > 0 ? (
                            filteredSupervisors.map((supervisor) => (
                              <li
                                key={supervisor.id}
                                className={`px-4 py-2 text-sm cursor-pointer hover:bg-emerald-50 ${
                                  selectedSupervisor === supervisor.id ? 'bg-emerald-100 text-emerald-800' : 'text-gray-800'
                                }`}
                                onClick={() => {
                                  setSelectedSupervisor(supervisor.id);
                                  setIsSupervisorDropdownOpen(false);
                                  setSupervisorSearchQuery('');
                                }}
                              >
                                <div className="flex flex-col">
                                  <span className="font-medium">{supervisor.username}</span>
                                  <span className="text-xs text-gray-500 truncate">{supervisor.email}</span>
                                </div>
                              </li>
                            ))
                          ) : (
                            <li className="px-4 py-2 text-sm text-gray-500 italic">
                              No supervisors found
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Module Search */}
                <div className="w-full">
                  <div className="relative">
                    <div className="flex absolute inset-y-0 left-0 items-center pl-4 pointer-events-none">
                      <Search className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search categories or modules..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="block w-full pl-12 pr-12 py-3 rounded-xl border-0 bg-white/95 backdrop-blur-sm shadow-lg focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white transition-all duration-200 placeholder-gray-500"
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
          </div>
        </div>

        {/* Content Section */}
        {activeModule ? (
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
            <button 
              onClick={handleBackToDashboard}
              className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to Dashboard
            </button>
            {renderModule()}
          </div>
        ) : filteredCategories.length === 0 ? (
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
                      <button
                        key={item.id}
                        onClick={() => handleModuleClick(item.id)}
                        className={`group/item relative flex flex-col items-center p-4 rounded-xl shadow-sm border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-white hover:bg-gradient-to-br hover:${colorScheme.bg} border-gray-200 hover:${colorScheme.border}`}
                      >
                        {/* Icon with animated background */}
                        <div className={`relative p-3 rounded-xl mb-3 transition-all duration-300 bg-gray-50 group-hover/item:bg-white group-hover/item:shadow-sm`}>
                          <item.icon className={`w-6 h-6 transition-all duration-300 text-gray-600 group-hover/item:${colorScheme.icon}`} />
                        </div>
                        
                        {/* Label */}
                        <span className="text-center text-sm font-medium text-gray-700 leading-tight group-hover/item:text-gray-900 transition-colors duration-200">
                          {item.label}
                        </span>
                        
                        {/* Active indicator */}
                        <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${colorScheme.icon.replace('text-', 'bg-')} shadow-sm opacity-0 group-hover/item:opacity-100 transition-opacity duration-300`}></div>
                      </button>
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

export default AllSupervisorsData;