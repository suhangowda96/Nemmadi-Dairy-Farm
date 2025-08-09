import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import Layout from './components/layout/Layout';
import StaffAttendance from './components/management/staff attendance management/StaffAttendance';
import RecordMaintenance from './components/management/Record mantainance/RecordMaintenance';
import MilkingHygiene from './components/management/milking higne management/MilkingHygiene';
import MilkYieldTracking from './components/management/Milk yield tracking/MilkYieldTracking';
import HealthRecord from './components/management/HealthRecord/helthsummery';
import FinancialRecord from './components/management/financial records/FinancialRecord';
import FeedWaterObservation from './components/management/Feed & water observatin/FeedWaterObservation';
import FeedTracking from './components/management/Feed Tracking/FeedTracking';
import EquipmentMaintenance from './components/management/Equipment maintenance Management/EquipmentMaintenance';
import CalfRecords from './components/management/calfe management/CalfRecords';
import BreedingTracking from './components/management/breeding tracking/BreedingTracking';
import Dashboard from './components/dashboard/Dashboard';
import ProfilePage from './components/profile/Profile';
import TrackingDashboard from './components/tracking/TrackingDashboard';
import AllSupervisorsData from './components/management/AllSupervisorsData';
import SupervisorDashboard from './components/dashboard/SupervisorDashboard';
import AddUserPage from'./components/auth/Addusers'
import NotificationPage from './components/layout/NotificationPage';
import ShedEnvironment from './components/management/Shed Environment/ShedEnvironment';
import DailyHealthLog from './components/management/HealthRecord/DailyHealthLog';
import TreatmentRecord from './components/management/HealthRecord/TreatmentRecord';
import DewormingSchedule from './components/management/HealthRecord/DewormingSchedule';
import HealthVaccinationRecords from './components/management/VaccinationDashboard/HealthVaccinationRecords';
import VaccinationMonthlyStatus from './components/management/VaccinationDashboard/VaccinationMonthlyStatus';
import VaccineInventory from './components/management/VaccinationDashboard/VaccineInventory';
import BreedingHeartDetection from './components/management/breeding tracking/BreedingHeartDetection';
import BreedingPregnancyDiagnosis from './components/management/breeding tracking/BreedingPregnancyDiagnosis';
import BreedingAIRecords from './components/management/breeding tracking/BreedingAIRecords';
import BreedingCalendar from './components/management/breeding tracking/BreedingCalendar';
import CalfIdentification from './components/management/calfe management/CalfIdentification';
import CalfGrowth from './components/management/calfe management/CalfGrowth';
import CalfFeedingLog from './components/management/calfe management/CalfFeedingLog';
import WeanedCalf from './components/management/calfe management/WeanedCalf';
import MMTDailyYieldRecords from './components/management/Milk yield tracking/MMTDailyYieldRecords';
import MMTWeeklySummary from './components/management/Milk yield tracking/MMTWeeklySummary';
import MQCCollectionQuality from './components/management/Milk daily quality check/MQCCollectionQuality';
import MQCDailyQualityTest from './components/management/Milk daily quality check/MQCDailyQualityTest';
import MQCUtensilHygiene from './components/management/Milk daily quality check/MQCUtensilHygiene';
import MHEquipmentCleaning from './components/management/milking higne management/MHEquipmentCleaning';
import MHMilkingHygiene from './components/management/milking higne management/MHMilkingHygiene';
import MHMilkerHygiene from './components/management/milking higne management/MHMilkerHygiene';
import MHMilkQuality from './components/management/milking higne management/MHMilkQuality';
import SATaskAssignment from './components/management/staff attendance management/SATaskAssignment';
import SADailyAttendance from './components/management/staff attendance management/SADailyAttendance';
import SAWeeklyShiftSchedule from './components/management/staff attendance management/SAWeeklyShiftSchedule';
import SAMonthlyPerformance from './components/management/staff attendance management/SAMonthlyPerformance';
import EMEquipmentRegisterPage from './components/management/Equipment maintenance Management/EMEquipmentRegisterPage';
import EMServiceAMC from './components/management/Equipment maintenance Management/EMServiceAMC';
import PVPurchaseApprovals from './components/management/Procurement Vendors management/PVPurchaseApprovals';
import PVPoTracker from './components/management/Procurement Vendors management/PVPoTracker';
import PVVendorMaster from './components/management/Procurement Vendors management/PVVendorMaster';
import PVDeliveryInspection from './components/management/Procurement Vendors management/PVDeliveryInspection';
import RMAuditChecklist from './components/management/Record mantainance/RMAuditChecklist';
import RMDailyLog from './components/management/Record mantainance/RMDailyLog';
import RMRecordCategory from './components/management/Record mantainance/RMRecordCategory';
import SECleaning from './components/management/Shed Environment/SECleaning';
import SEVentilationLighting from './components/management/Shed Environment/SEVentilationLighting';
import SEPestControl from './components/management/Shed Environment/SEPestControl';
import SERepairsLog from './components/management/Shed Environment/SERepairsLog';
import FWADailyObservation from './components/management/Feed & water observatin/FWADailyObservation';
import FWAQualityInspection from './components/management/Feed & water observatin/FWAQualityInspection';
import FTDailyFeedRegister from './components/management/Feed Tracking/FTDailyFeedRegister';
import FTMonthlyEfficiency from './components/management/Feed Tracking/FTMonthlyEfficiency';
import FTWeeklySummary from './components/management/Feed Tracking/FTWeeklySummary';
import FRDailyFinancialLog from './components/management/financial records/FRDailyFinancialLog';
import FRInventoryRegister from './components/management/financial records/FRInventoryRegister';
import FRMonthlyExpense from './components/management/financial records/FRMonthlyExpense';
import FRMonthlyIncome from './components/management/financial records/FRMonthlyIncome';
import BreedingCalvingRecord from './components/management/breeding tracking/breedingCalvingRecord';
import VaccineRegister from './components/management/VaccinationDashboard/vacinationregister';
import MilkQualityChecks from './components/management/Milk daily quality check/MilkQualityChecks';
import MedicineRegister from './components/management/Medicinemanagement/MedicineRegister';
import HealthMedicineRecords from './components/management/Medicinemanagement/HealthMedicineRecords';
import MedicineInventory from './components/management/Medicinemanagement/MedicineInventory';
import MedicineMonthlyStatus from './components/management/Medicinemanagement/MedicineMonthlyStatus';
import MMTWeeklyTracking from './components/management/Milk yield tracking/MMTWeeklyTracking';
import EmployeeManagement from './components/management/EmployeeManagement';
import CFRCalffeedregister from './components/management/calfe management/CFRCalffeedregister';
import CRFDailyCalfFeedRegister from './components/management/calfe management/CRFDailyCalfFeedRegister';
import CalfFeedInventory from './components/management/calfe management/CalfFeedInventory';
import CalvingDeathOrSoldLog from './components/management/calfe management/CalvingDeathOrSoldRecord';

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Layout />}>
        {/* Public routes */}
        <Route path="/signup" element={<Signup />} />
        
        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          {/* Role-based home page */}
          <Route index element={
            user?.role === 'admin' 
              ? <AllSupervisorsData /> 
              : <Dashboard />
          } />

              
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="tracking-dashboard" element={<TrackingDashboard />} />
              <Route path="supervisor-dashboard/:userId" element={<SupervisorDashboard />} />

              {/* Madicine data */}
              <Route path="Medicine-Register" element={<MedicineRegister />} />
              <Route path="Health-Medicine-Records" element={<HealthMedicineRecords />} />
              <Route path="Medicine-Inventory" element={<MedicineInventory />} />
              <Route path="Medicine-Monthly-Status" element={<MedicineMonthlyStatus />} />


              {/* vacination data */}
             <Route path="health-vaccination-records" element={<HealthVaccinationRecords />} />
              <Route path="vaccination-monthly-status" element={<VaccinationMonthlyStatus />} />
              <Route path="vaccine-inventor" element={<VaccineInventory />} />
              <Route path="Vaccine-Register" element={<VaccineRegister />} />

              {/* SA */}
              <Route path="staff-attendance" element={<StaffAttendance />} />
              <Route path="SATask-Assignment" element={<SATaskAssignment />} /> 
              <Route path="SADaily-Attendance" element={<SADailyAttendance />} /> 
              <Route path="SAWeekly-Shift-Schedule" element={<SAWeeklyShiftSchedule />} /> 
              <Route path="SAMonthly-Performance" element={<SAMonthlyPerformance />} />  

              {/* RM */}
              <Route path="record-maintenance" element={<RecordMaintenance />} />
              <Route path="RMAudit-Checklist" element={<RMAuditChecklist />} />
              <Route path="RMDaily-Log" element={<RMDailyLog />} />
              <Route path="RMRecord-Category" element={<RMRecordCategory />} />

              {/* PV */}
              <Route path="PVPurchase-Approvals" element={<PVPurchaseApprovals />} />
              <Route path="PVPo-Tracker" element={< PVPoTracker />} />
              <Route path="PVVendor-Master" element={<PVVendorMaster />} />
              <Route path="PVDelivery-Inspection" element={<PVDeliveryInspection />} />

              {/* MH */}
              <Route path="milking-hygiene" element={<MilkingHygiene />} />
              <Route path="MHEquipment-Cleaning" element={<MHEquipmentCleaning />} />
              <Route path="MHMilking-Hygiene" element={<MHMilkingHygiene />} />
              <Route path="MHMilker-Hygiene" element={<MHMilkerHygiene />} />
              <Route path="MHMilk-Quality" element={<MHMilkQuality />} />


              {/* MMT */}
              <Route path="milk-yield-tracking" element={<MilkYieldTracking />} />
              <Route path="MMTDaily-Yield-Records" element={<MMTDailyYieldRecords />} />
              <Route path="MMTWeekly-Summary" element={<MMTWeeklySummary />} />
              <Route path="MMT-Weekly-Tracking" element={<MMTWeeklyTracking />} />


              {/* MCQ */}
              <Route path="MQCCollection-Quality" element={<MQCCollectionQuality />} />
              <Route path="MQCDaily-Quality-Test" element={<MQCDailyQualityTest />} />
              <Route path="MQCUtensil-Hygiene" element={<MQCUtensilHygiene />} />
              <Route path="milk-quality-checks" element={<MilkQualityChecks />} />


              {/* helth record data */}
              <Route path="health-record" element={<HealthRecord />} />
              <Route path="daily-health-log" element={<DailyHealthLog />} />
              <Route path="treatment-record" element={<TreatmentRecord />} />
              <Route path="deworming-schedule" element={<DewormingSchedule />} />
              
              {/* FR */}
              <Route path="financial-record" element={<FinancialRecord />} />
              <Route path="FRDaily-FinancialLog" element={<FRDailyFinancialLog />} />
              <Route path="FRInventory-Register" element={<FRInventoryRegister />} />
              <Route path="FRMonthly-Expense" element={<FRMonthlyExpense />} />
              <Route path="FRMonthly-Income" element={<FRMonthlyIncome />} />


              {/* FWA */}
              <Route path="feed-water-observation" element={<FeedWaterObservation />} />
              <Route path="FWADaily-Observation" element={<FWADailyObservation />} />
              <Route path="FWAQuality-Inspection" element={<FWAQualityInspection />} />


              {/* FT */}
              <Route path="feed-tracking" element={<FeedTracking />} />
              <Route path="FTDailyFeed-Register" element={<FTDailyFeedRegister />} />
              <Route path="FTMonthly-Efficiency" element={<FTMonthlyEfficiency />} />
              <Route path="FTWeekly-Summary" element={<FTWeeklySummary />} />


              {/* EM */}
              <Route path="equipment-maintenance" element={<EquipmentMaintenance />} />
              <Route path="EMEquipment-RegisterPage" element={<EMEquipmentRegisterPage />} />
              <Route path="EMService-AMC" element={<EMServiceAMC />} />

              {/* calf records */}
              <Route path="calf-record" element={<CalfRecords />} />
              <Route path="Calf-Identification" element={<CalfIdentification />} />
              <Route path="Calf-Growth" element={<CalfGrowth />} />
              <Route path="Cal-feeding-Log" element={<CalfFeedingLog />} />
              <Route path="Weaned-Calf" element={<WeanedCalf />} />

              <Route path="CFR-Calf-feed-register" element={<CFRCalffeedregister />} />
              <Route path="CRF-Daily-Calf-FeedRegister" element={<CRFDailyCalfFeedRegister />} />
              <Route path="CalfFeed-Inventory" element={<CalfFeedInventory />} />

              <Route path="Calving-Death-Or-SoldLog" element={<CalvingDeathOrSoldLog/>} />


              {/* BreedingRecords */}
              <Route path="breeding-tracking" element={<BreedingTracking />} />
              <Route path="breeding-heart-detection" element={<BreedingHeartDetection />} />
              <Route path="breeding-pregnancy-diagnosis" element={<BreedingPregnancyDiagnosis />} />
              <Route path="Breeding-AI-Records" element={<BreedingAIRecords />} />
              <Route path="Breeding-Calendar" element={<BreedingCalendar />} />
              <Route path="BreedingCalving-Record" element={<BreedingCalvingRecord />} />



              <Route path="Employee-Management" element={<EmployeeManagement />} />
              <Route path="Add-Users" element={<AddUserPage />} />
              <Route path="Notification-Page" element={<NotificationPage />} />

              {/* SE */}
              <Route path="Shed-Environment" element={<ShedEnvironment />} />
              <Route path="SEVentilation-Lighting" element={<SEVentilationLighting />} />
              <Route path="SECleaning" element={<SECleaning />} />
              <Route path="SERepairs-Log" element={<SERepairsLog />} />
              <Route path="SEPest-Control" element={<SEPestControl />} />

              
              {/* User management routes */}
              <Route 
                path="supervisor-dashboard/:userId" 
                element={<Dashboard isSupervisorView={true} />} 
              />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="all-supervisors-data" element={<AllSupervisorsData />} />
              
              {/* Catch-all route */}
             
            </Route>
          </Route>
        </Routes>
  );
}

export default App;