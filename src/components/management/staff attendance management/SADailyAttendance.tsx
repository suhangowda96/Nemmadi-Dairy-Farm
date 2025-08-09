import React, { useState, useEffect, useRef } from 'react';
import Webcam from 'react-webcam';
import { 
  Camera, CheckCircle, X, Loader2, RefreshCw, ShieldAlert, 
  Calendar, Search, Filter, ChevronDown, ChevronUp, Plus,
  ClipboardList, Download, User, Briefcase, Clock, XCircle 
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'react-toastify';

interface Employee {
  id: string;
  staff_name: string;
  designation: string;
  payment_per_day: number;
}

interface AttendanceRecord {
  id: number;
  date: string;
  staff_name: string;
  employee_id: string;
  designation: string;
  in_time: string;
  out_time: string | null;
  worked_hours_str: string | null;
  payment: number;
  remarks: string | null;
}

interface SADailyAttendanceProps {
  query?: string;
}

const SADailyAttendance: React.FC<SADailyAttendanceProps> = ({ query = '' }) => {
  const { user } = useAuth();
  const webcamRef = useRef<Webcam>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  type CameraMode = 'none' | 'in' | 'out';
  const [cameraMode, setCameraMode] = useState<CameraMode>('none');
  const [recognized, setRecognized] = useState<Employee | null>(null);
  const [currentAttendanceId, setCurrentAttendanceId] = useState<number | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [antiSpoofing, setAntiSpoofing] = useState(false);
  const [challenge, setChallenge] = useState<string>('');
  const [matchedEmployees, setMatchedEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [verificationData, setVerificationData] = useState<{
    type: 'in' | 'out';
    record: AttendanceRecord;
    employee?: Employee;
    matchedEmployees?: Employee[];
    image: string;
  } | null>(null);

  const generateChallenge = () => {
      const actions = ['Turn Left', 'Turn Right', 'Blink', 'Smile', 'Nod'];
      const randomAction = actions[Math.floor(Math.random() * actions.length)];
      setChallenge(randomAction);
      return randomAction;
  };

  useEffect(() => {
    const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    setIsMobile(isMobileDevice);
    if (isMobileDevice) {
      setFacingMode('environment');
    }
  }, []);

  const fetchRecords = async () => {
    if (!user?.token) return;
    setLoading(true);
    setError('');
    
    try {
      const url = query 
        ? `http://localhost:8000/api/sa-daily-attendance/${query}`
        : 'http://localhost:8000/api/sa-daily-attendance/';
      
      const res = await fetch(url, {
        headers: { 
          Authorization: `Bearer ${user.token}`
        },
      });
      
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      
      const data: AttendanceRecord[] = await res.json();
      setRecords(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch records');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [user, query]);

  const recognizeFace = async (imageSrc: string) => {
    if (!user?.token) return null;
    
    try {
      const res = await fetch('http://localhost:8000/api/sa-daily-attendance/recognize/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify({ image: imageSrc }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        
        if (res.status === 404) {
          throw new Error('No face detected. Please center your face in the frame');
        } else if (res.status === 400) {
          throw new Error('Image quality too low. Please try in better lighting');
        } else if (res.status === 403) {
          throw new Error('Face not recognized. Please try again or contact admin');
        } else {
          throw new Error(errorData.detail || 'Face recognition failed');
        }
      }

      return await res.json();
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  const captureAndVerify = async () => {
    setCapturing(true);
    setError('');
    setAntiSpoofing(true);  // Activate anti-spoofing measures
    setChallenge(generateChallenge());
    
    // Wait 2 seconds to ensure user sees challenge
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc || !user?.token) {
        setCapturing(false);
        setAntiSpoofing(false);
        return;
    }

    try {
      const employees = await recognizeFace(imageSrc);
      if (!employees || employees.length === 0) return;
      
      // Handle multiple matches (like twins)
      if (employees.length > 1) {
        setMatchedEmployees(employees);
        setSelectedEmployee(employees[0]); // Default to first match
        return;
      }
      
      const employee = employees[0];
      setRecognized(employee);

      // Check for existing attendance for today
      const today = new Date().toISOString().split('T')[0];
      const exists = records.some(r => 
        r.employee_id === employee.id && r.date === today
      );
      
      if (cameraMode === 'in' && exists) {
        setError('Attendance already recorded for this employee today');
        setCapturing(false);
        return;
      }

      if (cameraMode === 'in') {
        const now = new Date();
        const date = now.toISOString().split('T')[0];
        const in_time = now.toLocaleTimeString('en-GB', { hour12: false });
        
        const tempRecord: AttendanceRecord = {
          id: Date.now(),
          date,
          staff_name: employee.staff_name,
          employee_id: employee.id,
          designation: employee.designation,
          in_time,
          out_time: null,
          worked_hours_str: null,
          payment: employee.payment_per_day,
          remarks: 'Auto-marked via face recognition',
        };
        
        setVerificationData({
          type: 'in',
          record: tempRecord,
          employee,
          image: imageSrc
        });
      } else if (cameraMode === 'out' && currentAttendanceId) {
        const existingRecord = records.find(r => r.id === currentAttendanceId);
        if (!existingRecord) {
          throw new Error('Attendance record not found');
        }
        
        // Verify employee matches attendance record
        if (existingRecord.employee_id !== employee.id) {
          setError('Employee does not match attendance record');
          setCapturing(false);
          return;
        }
        
        setVerificationData({
          type: 'out',
          record: existingRecord,
          employee,
          image: imageSrc
        });
      }
    } catch (err: any) {
        setError(err.message);
    } finally {
        setCapturing(false);
        setAntiSpoofing(false);
    }
  };

  const handleEmployeeSelection = () => {
    if (!selectedEmployee) return;
    
    setRecognized(selectedEmployee);
    setMatchedEmployees([]);
    
    // Check for existing attendance for today
    const today = new Date().toISOString().split('T')[0];
    const exists = records.some(r => 
      r.employee_id === selectedEmployee.id && r.date === today
    );
    
    if (cameraMode === 'in' && exists) {
      setError('Attendance already recorded for this employee today');
      setCameraMode('none');
      return;
    }

    if (cameraMode === 'in') {
      const now = new Date();
      const date = now.toISOString().split('T')[0];
      const in_time = now.toLocaleTimeString('en-GB', { hour12: false });
      
      const tempRecord: AttendanceRecord = {
        id: Date.now(),
        date,
        staff_name: selectedEmployee.staff_name,
        employee_id: selectedEmployee.id,
        designation: selectedEmployee.designation,
        in_time,
        out_time: null,
        worked_hours_str: null,
        payment: selectedEmployee.payment_per_day,
        remarks: 'Auto-marked via face recognition',
      };
      
      setVerificationData({
        type: 'in',
        record: tempRecord,
        employee: selectedEmployee,
        matchedEmployees: matchedEmployees,
        image: webcamRef.current?.getScreenshot() || ''
      });
    } else if (cameraMode === 'out' && currentAttendanceId) {
      const existingRecord = records.find(r => r.id === currentAttendanceId);
      if (!existingRecord) {
        setError('Attendance record not found');
        setCameraMode('none');
        return;
      }
      
      // Verify employee matches attendance record
      if (existingRecord.employee_id !== selectedEmployee.id) {
        setError('Employee does not match attendance record');
        setCameraMode('none');
        return;
      }
      
      setVerificationData({
        type: 'out',
        record: existingRecord,
        employee: selectedEmployee,
        matchedEmployees: matchedEmployees,
        image: webcamRef.current?.getScreenshot() || ''
      });
    }
  };

  const confirmAttendance = async () => {
    if (!verificationData || !user?.token) return;
    
    setCapturing(true);
    try {
      if (verificationData.type === 'in') {
        const res = await fetch('http://localhost:8000/api/sa-daily-attendance/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.token}`
          },
          body: JSON.stringify({
            date: verificationData.record.date,
            staff_name: verificationData.record.staff_name,
            employee_id: verificationData.record.employee_id,
            designation: verificationData.record.designation,
            in_time: verificationData.record.in_time,
            payment: verificationData.record.payment,
            remarks: verificationData.record.remarks,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.detail || 'Failed to create attendance record');
        }

        const newRecord: AttendanceRecord = await res.json();
        setRecords(prev => [newRecord, ...prev]);
        toast.success(`Attendance marked IN for ${newRecord.staff_name}`);
      } else if (verificationData.type === 'out') {
        const res = await fetch(
          `http://localhost:8000/api/sa-daily-attendance/${verificationData.record.id}/mark-out/`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${user.token}`
            },
            body: JSON.stringify({ image: verificationData.image }),
          }
        );

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.detail || 'Mark out failed');
        }

        const updatedRecord: AttendanceRecord = await res.json();
        setRecords(prev => 
          prev.map(r => r.id === updatedRecord.id ? updatedRecord : r)
        );
        toast.success(`Attendance marked OUT for ${updatedRecord.staff_name}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to confirm attendance');
    } finally {
      setCapturing(false);
      setVerificationData(null);
      setCurrentAttendanceId(null);
      setCameraMode('none');
    }
  };

  const cancelVerification = () => {
    setVerificationData(null);
    if (cameraMode === 'out') {
      setCurrentAttendanceId(null);
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setStartDate(null);
    setEndDate(null);
  };

  // Export to Excel
  const exportToExcel = async () => {
    try {
      setIsExporting(true);
      setError('');
      
      if (!user || !user.token) {
        setError('User not authenticated');
        setIsExporting(false);
        return;
      }
      
      let url = 'http://localhost:8000/api/sa-daily-attendance/export/';
      const params = new URLSearchParams();
      
      if (user.role === 'admin') {
        params.append('all_supervisors', 'true');
      } else {
        params.append('supervisorId', user.id.toString());
      }
      
      if (startDate) params.append('start_date', startDate.toISOString().split('T')[0]);
      if (endDate) params.append('end_date', endDate.toISOString().split('T')[0]);
      if (searchTerm) params.append('search', searchTerm);
      
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `attendance_${new Date().toISOString().slice(0, 10)}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);
      } else {
        setError('Failed to export data');
      }
    } catch (err) {
      setError('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  // Filter records based on search and date range
  const filteredRecords = records.filter(record => {
    const matchesSearch = searchTerm === '' || 
      (record.employee_id?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (record.staff_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (record.designation?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const recordDate = new Date(record.date);
    const matchesDate = (!startDate || recordDate >= startDate) && 
                        (!endDate || recordDate <= endDate);
    
    return matchesSearch && matchesDate;
  });

  // Count pending OUT records
  const pendingOutCount = records.filter(record => !record.out_time).length;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Daily Attendance</h1>
              <p className="text-gray-600 mt-1">Track staff attendance records</p>
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={() => {
                  setError('');
                  setCameraMode('in');
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center space-x-2 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Camera className="w-5 h-5" />
                <span className="font-medium">Take Attendance</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Filter Toggle */}
        <div className="lg:hidden">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full bg-white rounded-xl shadow-sm p-4 flex items-center justify-between text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5" />
              <span className="font-medium">Filters</span>
            </div>
            {showFilters ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Filters */}
        <div className={`bg-white rounded-xl shadow-sm transition-all duration-300 ${
          showFilters || window.innerWidth >= 1024 ? 'block' : 'hidden lg:block'
        }`}>
          <div className="p-4 lg:p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search Field */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, ID, or designation..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              
              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                <DatePicker
                  selected={startDate}
                  onChange={(date) => setStartDate(date)}
                  dateFormat="dd/MM/yyyy"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholderText="dd/mm/yyyy"
                />
              </div>
              
              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                <DatePicker
                  selected={endDate}
                  onChange={(date) => setEndDate(date)}
                  dateFormat="dd/MM/yyyy"
                  minDate={startDate || undefined}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholderText="dd/mm/yyyy"
                />
              </div>
            </div>
            
            <div className="flex justify-center sm:justify-end mt-6">
              <button
                onClick={clearFilters}
                className="border border-gray-300 text-gray-700 px-6 py-2 rounded-xl hover:bg-gray-50 transition-colors flex items-center space-x-2"
              >
                <X className="w-4 h-4" />
                <span>Clear Filters</span>
              </button>
            </div>
          </div>
        </div>

        {/* Recognition Status */}
        {recognized && (
          <div className="bg-green-100 border border-green-300 rounded-xl p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="text-green-600" />
              <span className="font-semibold">
                Recognized: {recognized.staff_name} ({recognized.id})
              </span>
            </div>
          </div>
        )}

        {/* Camera Modal */}
        {cameraMode !== 'none' && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
              <div className={`bg-white rounded-xl p-4 w-full max-w-md relative ${isMobile ? 'w-[90vw]' : ''}`}>
              <button
                onClick={() => setCameraMode('none')}
                className="absolute top-2 right-2 text-gray-500 hover:text-black"
              >
                <X size={24} />
              </button>
              
              <div className="mb-3 text-center">
                <p className="font-medium">
                  {cameraMode === 'in' ? 'Mark Attendance IN' : 'Mark Attendance OUT'}
                </p>
              </div>

              <div className="relative">
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  className="rounded mb-3 w-full"
                  videoConstraints={{
                    facingMode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                  }}
                  onUserMediaError={() => setError('Camera access denied. Please enable camera permissions')}
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="border-2 border-dashed border-blue-400 rounded-full w-48 h-60" />
                </div>
                {/* Only show flip button on mobile devices */}
                {isMobile && (
                  <button
                    onClick={toggleCamera}
                    className="absolute bottom-4 right-4 bg-white/70 hover:bg-white p-2 rounded-full"
                  >
                    <RefreshCw size={20} />
                  </button>
                )}
              </div>

              {antiSpoofing && (
                <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center">
                    <ShieldAlert className="text-yellow-400 mb-4" size={48} />
                    <div className="text-white text-center px-4">
                        <p className="font-bold text-lg mb-2">Liveness Check</p>
                        <p className="text-xl animate-pulse mb-4">Please {challenge}</p>
                        <p className="text-sm">This prevents photo/video spoofing</p>
                    </div>
                </div>
            )}

              {/* Error display */}
              {error ? (
                <div className="mb-4 p-3 bg-red-100 rounded-lg">
                  <div className="flex items-center text-red-700">
                    <X className="mr-2 flex-shrink-0" size={20} />
                    <span>{error}</span>
                  </div>
                  <button
                    onClick={() => setError('')}
                    className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center mb-4">
                  Position your face within the circle
                </p>
              )}

              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setCameraMode('none')}
                  className="px-4 py-2 rounded bg-gray-200"
                  disabled={capturing}
                >
                  Cancel
                </button>
                <button
                  onClick={captureAndVerify}
                  className="px-4 py-2 rounded bg-blue-600 text-white flex items-center justify-center min-w-[100px]"
                  disabled={capturing}
                >
                  {capturing ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : cameraMode === 'in' ? (
                    'Mark IN'
                  ) : (
                    'Mark OUT'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Employee Selection for Multiple Matches */}
        {matchedEmployees.length > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold">Multiple Matches Found</h2>
                <button onClick={() => setMatchedEmployees([])}>
                  <X size={24} />
                </button>
              </div>
              
              <p className="text-gray-600 mb-4">
                Please select the correct employee:
              </p>
              
              <div className="space-y-3 mb-6">
                {matchedEmployees.map(employee => (
                  <div 
                    key={employee.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedEmployee?.id === employee.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedEmployee(employee)}
                  >
                    <div className="flex items-center">
                      <User className="w-5 h-5 text-blue-500 mr-3" />
                      <div>
                        <p className="font-medium">{employee.staff_name}</p>
                        <p className="text-sm text-gray-600">
                          {employee.designation} • ID: {employee.id}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setMatchedEmployees([])}
                  className="px-4 py-2 rounded bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEmployeeSelection}
                  className="px-4 py-2 rounded bg-blue-600 text-white"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Verification Popup */}
        {verificationData && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className={`bg-white rounded-xl p-6 w-full max-w-md ${isMobile ? 'w-[90vw]' : ''}`}>
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold">
                  Verify Attendance {verificationData.type.toUpperCase()}
                </h2>
                <button onClick={cancelVerification}>
                  <X size={24} />
                </button>
              </div>
              
              {/* Show multiple matches if present */}
              {verificationData.matchedEmployees && verificationData.matchedEmployees.length > 1 && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-center mb-2">
                    <ShieldAlert className="text-blue-500 mr-2" size={20} />
                    <span className="font-medium text-blue-700">Multiple matches detected</span>
                  </div>
                  <div className="text-sm text-blue-800">
                    <p className="mb-1">Facial recognition matched these employees:</p>
                    <ul className="list-disc pl-5">
                      {verificationData.matchedEmployees.map(emp => (
                        <li key={emp.id}>
                          {emp.staff_name} (ID: {emp.id})
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row">
                  <span className="w-32 font-medium">Employee ID:</span>
                  <span>{verificationData.record.employee_id}</span>
                </div>
                <div className="flex flex-col sm:flex-row">
                  <span className="w-32 font-medium">Name:</span>
                  <span>{verificationData.record.staff_name}</span>
                </div>
                <div className="flex flex-col sm:flex-row">
                  <span className="w-32 font-medium">Designation:</span>
                  <span>{verificationData.record.designation}</span>
                </div>
                <div className="flex flex-col sm:flex-row">
                  <span className="w-32 font-medium">Time:</span>
                  <span>
                    {verificationData.type === 'in'
                      ? verificationData.record.in_time
                      : new Date().toLocaleTimeString('en-GB', { hour12: false })}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row">
                  <span className="w-32 font-medium">Remarks:</span>
                  <span>{verificationData.record.remarks || '-'}</span>
                </div>
              </div>
              
              <div className="mt-6 flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                <button
                  onClick={cancelVerification}
                  className="px-4 py-2 rounded bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAttendance}
                  className="px-4 py-2 rounded bg-blue-600 text-white flex items-center justify-center min-w-[100px]"
                  disabled={capturing}
                >
                  {capturing ? (
                    <Loader2 className="animate-spin mr-2" size={20} />
                  ) : null}
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Records Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 lg:p-6 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Attendance Records</h2>
              <p className="text-sm text-gray-600 mt-1">
                {filteredRecords.length} records, <span className="text-red-600 font-medium">{pendingOutCount} pending OUT</span>
              </p>
            </div>
            <button
                onClick={exportToExcel}
                disabled={isExporting}
                className="ml-3 bg-blue-600 text-white px-6 py-2 rounded-xl flex items-center space-x-2 disabled:opacity-75 shadow hover:shadow-md"
              >
                {isExporting ? (
                  <Loader2 className="animate-spin w-5 h-5" />
                ) : (
                  <Download className="w-5 h-5" />
                )}
              </button>
          </div>
          
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading attendance records...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">
              <p className="mb-4">{error}</p>
              <button 
                onClick={fetchRecords}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Retry
              </button>
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">No attendance records found</p>
              <p className="text-gray-400 text-sm mb-4">Try adjusting your filters or mark attendance</p>
              <button
                onClick={clearFilters}
                className="text-blue-600 hover:text-blue-800 transition-colors font-medium"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Desktop Table */}
              <table className="w-full hidden lg:table">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IN</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">OUT</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Worked</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salary</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRecords.map(record => (
                    <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">
                            {new Date(record.date).toLocaleDateString('en-GB')}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-blue-500 mr-2" />
                          <span className="text-sm font-medium text-gray-900">{record.staff_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900">{record.employee_id}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <Briefcase className="w-4 h-4 text-green-500 mr-2" />
                          <span className="text-sm text-gray-900">{record.designation}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 text-gray-500 mr-2" />
                          <span className="text-sm text-gray-900">{record.in_time}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {record.out_time ? (
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 text-gray-500 mr-2" />
                            <span className="text-sm text-gray-900">{record.out_time}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {record.worked_hours_str ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {record.worked_hours_str}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-gray-900">₹{record.payment.toFixed(2)}</span>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        {record.remarks ? (
                          <div className="bg-gray-50 rounded p-2">
                            <p className="text-sm text-gray-900 break-words">
                              {record.remarks}
                            </p>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {!record.out_time && user?.role === 'supervisor' && (
                          <button
                            onClick={() => {
                              setCurrentAttendanceId(record.id);
                              setCameraMode('out');
                              setError('');
                            }}
                            className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm flex items-center"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            <span>Add OUT</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-4 p-4">
                {filteredRecords.map(record => (
                  <div 
                    key={record.id} 
                    className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200"
                  >
                    <div className="p-4 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">
                          {new Date(record.date).toLocaleDateString('en-GB')}
                        </span>
                      </div>
                      {record.out_time ? (
                        <div className="flex items-center">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                          <span className="text-xs text-green-700">Completed</span>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <XCircle className="w-4 h-4 text-red-500 mr-1" />
                          <span className="text-xs text-red-700">Pending OUT</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center mb-1">
                            <User className="w-5 h-5 text-blue-500 mr-2" />
                            <h2 className="text-lg font-bold text-gray-900">{record.staff_name}</h2>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <span className="text-sm">{record.employee_id}</span>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Briefcase className="w-5 h-5 text-green-500 mr-2" />
                          <span className="text-sm text-gray-900">{record.designation}</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-start">
                          <Clock className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                          <div className="ml-3">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase">IN Time</h3>
                            <p className="text-sm font-medium text-gray-900">
                              {record.in_time}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start">
                          <Clock className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                          <div className="ml-3">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase">OUT Time</h3>
                            <p className="text-sm font-medium text-gray-900">
                              {record.out_time || '-'}
                            </p>
                          </div>
                        </div>
                        
                        {record.worked_hours_str && (
                          <div className="flex items-start">
                            <div className="ml-3">
                              <h3 className="text-xs font-semibold text-gray-500 uppercase">Worked</h3>
                              <p className="text-sm font-medium text-gray-900">
                                {record.worked_hours_str}
                              </p>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-start">
                          <div className="ml-3">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase">Salary</h3>
                            <p className="text-sm font-medium text-gray-900">
                              ₹{record.payment.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {record.remarks && (
                      <div className="p-4 border-t border-gray-100">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Remarks</h3>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-sm text-gray-900 break-words">
                            {record.remarks}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {!record.out_time && user?.role === 'supervisor' && (
                      <div className="p-4 border-t border-gray-100 flex justify-end">
                        <button
                          onClick={() => {
                            setCurrentAttendanceId(record.id);
                            setCameraMode('out');
                            setError('');
                          }}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Mark OUT</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SADailyAttendance;