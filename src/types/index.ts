export interface WeeklyInspection {
  id: string;
  date: string;
  area: string;
  problemIdentified: string;
  actionTaken: string;
  responsiblePerson: string;
  status: 'Done' | 'Pending';
  remarks: string;
}

export interface VaccinationChart {
  id: string;
  date: string;
  animalId: string;
  species: string;
  vaccineName: string;
  ageAtVaccination: string;
  administeredBy: string;
  nextDueDate: string;
  remarks: string;
}

export interface MilkYieldManagement {
  id: string;
  checkpoint: string;
  frequency: string;
  action: string;
}

export interface StaffAttendance {
  id: string;
  staffName: string;
  leaveDate: string;
  typeOfLeave: 'Sick' | 'Casual';
  approvedBy: string;
  remarks: string;
}

export interface RedFlag {
  id: string;
  animalId: string;
  redFlagDetectedOn: string;
  recoveryStarted: string;
  vetName: string;
  fullyRecoveredOn: string;
  stillUnderTreatment: 'Y' | 'N';
  remarks: string;
}

export interface RecordMaintenance {
  id: string;
  date: string;
  recordType: string;
  backupFormat: 'Cloud' | 'Drive' | 'Hardcopy';
  doneBy: string;
  verified: 'Y' | 'N';
  remarks: string;
}

export interface ProcurementVendor {
  id: string;
  vendor: string;
  lastSupplyDate: string;
  deliveryTimeliness: number;
  productQuality: number;
  priceCompetitiveness: number;
  averageScore: number;
  continueAssociation: 'Y' | 'N';
  remarks: string;
}

export interface MilkingHygiene {
  id: string;
  date: string;
  animalId: string;
  foremilkTested: 'Y' | 'N';
  anyClotsBl
}