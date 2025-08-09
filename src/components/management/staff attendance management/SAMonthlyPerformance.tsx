import React, { useState, useEffect } from 'react';
import { 
  Calendar, Search, Filter, ChevronDown, 
  ChevronUp, Download, X, User, Award,
   XCircle, Percent, BadgeCheck, Clock, CreditCard
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { useAuth } from '../../../contexts/AuthContext';

// Format date as Month YYYY
const formatDisplayMonth = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
};

// Format number in Indian style (comma separated)
const formatIndianNumber = (num: number | string) => {
  const number = typeof num === 'string' ? parseFloat(num) : num;
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(number);
};

// Format date for API (YYYY-MM-DD)
const formatDateForAPI = (date: Date) => {
  return date.toISOString().split('T')[0];
};

// Format created_at for display
const formatCreatedAt = (dateString: string) => {
  const date = new Date(dateString);
  const formattedDate = date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  return formattedDate;
};

// Format hours to hh:mm
const formatWorkHours = (hours: number | null) => {
  if (hours === null) return 'N/A';
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m}m`;
};

interface StaffPerformanceProps {
  query?: string;
}

const SAMonthlyPerformance: React.FC<StaffPerformanceProps> = ({ query = '' }) => {
  const { user } = useAuth();
  const [showFilters, setShowFilters] = useState(false);
  const [records, setRecords] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const isAdmin = user?.role === 'admin';

  const fetchRecords = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      if (!user || !user.token) {
        setError('User not authenticated');
        setIsLoading(false);
        return;
      }
      
      // Build query parameters
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', formatDateForAPI(startDate));
      if (endDate) params.append('end_date', formatDateForAPI(endDate));
      if (searchTerm) params.append('search', searchTerm);
      
      let url = `https://nemmadi-dairy-farm.koyeb.app/api/sa-monthly-performance/${query}`;
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
        
      if (response.ok) {
        const data = await response.json();
        setRecords(data);
      } else if (response.status === 401) {
        setError('Authentication failed. Please login again.');
      } else {
        setError('Failed to fetch records');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (user) {
      fetchRecords();
    }
  }, [user]);

  const filteredRecords = records.filter(record => {
    const matchesSearch = searchTerm === '' || 
      record.staff_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.employee_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const recordDate = new Date(record.month);
    const matchesDate = (!startDate || recordDate >= startDate) && 
                        (!endDate || recordDate <= endDate);
    
    return matchesSearch && matchesDate;
  });

  // Calculate totals for summary cards
  const calculateTotals = () => {
    const totals = {
      totalWorkingDays: 0,
      totalLeaves: 0,
      totalTasksAssigned: 0,
      totalTasksCompleted: 0,
      totalPayment: 0,
      avgWorkHours: 0,
      bonusEligibleCount: 0
    };

    if (filteredRecords.length === 0) return totals;

    filteredRecords.forEach(record => {
      totals.totalWorkingDays += record.total_working_days || 0;
      totals.totalLeaves += record.total_leaves || 0;
      totals.totalTasksAssigned += record.total_tasks_assigned || 0;
      totals.totalTasksCompleted += record.total_tasks_completed || 0;
      totals.totalPayment += record.total_payment || 0;
      
      if (record.bonus_eligibility === 'Eligible') {
        totals.bonusEligibleCount++;
      }
    });

    // Calculate average work hours
    const validWorkHours = filteredRecords
      .filter(record => record.avg_work_hours !== null)
      .map(record => record.avg_work_hours);
    
    totals.avgWorkHours = validWorkHours.length > 0 
      ? validWorkHours.reduce((sum, hours) => sum + hours, 0) / validWorkHours.length
      : 0;

    return totals;
  };

  const totals = calculateTotals();

  const clearFilters = () => {
    setSearchTerm('');
    setStartDate(null);
    setEndDate(null);
  };

  const exportToExcel = async () => {
    try {
      setIsExporting(true);
      setError('');
      
      if (!user || !user.token) {
        setError('User not authenticated');
        setIsExporting(false);
        return;
      }
      
      let url = 'https://nemmadi-dairy-farm.koyeb.app/api/sa-monthly-performance/export/';
      const params = new URLSearchParams();
      
      if (isAdmin) {
        params.append('all_supervisors', 'true');
      } else {
        params.append('supervisorId', user.id.toString());
      }
      
      // Add filter parameters
      if (startDate) params.append('start_date', formatDateForAPI(startDate));
      if (endDate) params.append('end_date', formatDateForAPI(endDate));
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
        a.download = `staff_performance_summary_${new Date().toISOString().slice(0, 10)}.xlsx`;
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

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Staff Monthly Performance</h1>
              <p className="text-gray-600 mt-1">Attendance and task completion metrics</p>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={exportToExcel}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl flex items-center space-x-2 transition-all duration-200 shadow-lg hover:shadow-xl"
                disabled={isExporting}
              >
                <Download className="w-5 h-5" />
                <span className="font-medium">Export</span>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search Field */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              
              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From Month</label>
                <DatePicker
                  selected={startDate}
                  onChange={(date) => setStartDate(date)}
                  dateFormat="MM/yyyy"
                  showMonthYearPicker
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholderText="MM/yyyy"
                />
              </div>
              
              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To Month</label>
                <DatePicker
                  selected={endDate}
                  onChange={(date) => setEndDate(date)}
                  dateFormat="MM/yyyy"
                  showMonthYearPicker
                  minDate={startDate || undefined}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholderText="MM/yyyy"
                />
              </div>
              
              {/* Empty div for layout */}
              <div></div>
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
        
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Total Working Days */}
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center space-x-3 border-l-4 border-blue-500">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Working Days</p>
              <p className="text-lg font-bold">{formatIndianNumber(totals.totalWorkingDays)}</p>
            </div>
          </div>

          {/* Total Leaves */}
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center space-x-3 border-l-4 border-red-500">
            <div className="bg-red-100 p-2 rounded-lg">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Leaves</p>
              <p className="text-lg font-bold">{formatIndianNumber(totals.totalLeaves)}</p>
            </div>
          </div>

          {/* Avg Work Hours */}
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center space-x-3 border-l-4 border-purple-500">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Avg Work Hours</p>
              <p className="text-lg font-bold">{formatWorkHours(totals.avgWorkHours)}</p>
            </div>
          </div>
          
          {/* Task Completion Rate */}
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center space-x-3 border-l-4 border-orange-500">
            <div className="bg-orange-100 p-2 rounded-lg">
              <Percent className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Task Completion</p>
              <p className="text-lg font-bold">
                {totals.totalTasksAssigned > 0 
                  ? `${Math.round((totals.totalTasksCompleted / totals.totalTasksAssigned) * 100)}%`
                  : 'N/A'}
              </p>
            </div>
          </div>

          {/* Total Payment */}
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center space-x-3 border-l-4 border-green-500">
            <div className="bg-green-100 p-2 rounded-lg">
              <CreditCard className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Payment</p>
              <p className="text-lg font-bold">₹{formatIndianNumber(totals.totalPayment)}</p>
            </div>
          </div>

          {/* Bonus Eligible */}
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center space-x-3 border-l-4 border-yellow-500">
            <div className="bg-yellow-100 p-2 rounded-lg">
              <Award className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Bonus Eligible</p>
              <p className="text-lg font-bold">{formatIndianNumber(totals.bonusEligibleCount)}</p>
            </div>
          </div>
        </div>

        {/* Loading indicator for export */}
        {isExporting && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-700">Preparing your download...</p>
            </div>
          </div>
        )}

        {/* Records Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 lg:p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <h2 className="text-xl font-bold text-gray-900">Staff Monthly Performance</h2>
              <div className="flex items-center space-x-3">
                <p className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                  {filteredRecords.length} of {records.length} records
                </p>
              </div>
            </div>
          </div>
          
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading records...</p>
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
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Working Days</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leaves</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tasks Completed</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Work Hours</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Payment</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bonus Eligible</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 text-blue-600 mr-2" />
                            <span className="text-sm font-medium text-gray-900">
                              {formatDisplayMonth(record.month)}
                            </span>
                          </div>
                        </td>
                        
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          <div className="flex items-center">
                            <User className="w-4 h-4 text-blue-500 mr-2" />
                            {record.staff_name}
                          </div>
                        </td>
                        
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          <div className="flex items-center">
                            <BadgeCheck className="w-4 h-4 text-orange-500 mr-2" />
                            {record.employee_id}
                          </div>
                        </td>
                        
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          <div className="flex items-center">
                            {formatIndianNumber(record.total_working_days)}
                          </div>
                        </td>
                        
                        <td className="px-4 py-3 text-sm font-medium text-red-700">
                          <div className="flex items-center">
                            <XCircle className="w-4 h-4 text-red-500 mr-2" />
                            {formatIndianNumber(record.total_leaves)}
                          </div>
                        </td>
                        
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          <div className="flex items-center">
                            <Percent className="w-4 h-4 text-green-500 mr-2" />
                            {record.total_tasks_assigned > 0 
                              ? `${Math.round((record.total_tasks_completed / record.total_tasks_assigned) * 100)}%` 
                              : 'N/A'}
                          </div>
                        </td>
                        
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 text-purple-500 mr-2" />
                            {formatWorkHours(record.avg_work_hours)}
                          </div>
                        </td>
                        
                        <td className="px-4 py-3 text-sm font-medium text-green-700">
                          <div className="flex items-center">
                            <CreditCard className="w-4 h-4 text-green-500 mr-2" />
                            ₹{formatIndianNumber(record.total_payment)}
                          </div>
                        </td>
                        
                        <td className="px-4 py-3 text-sm font-medium">
                          <div className="flex items-center justify-center">
                            {record.bonus_eligibility === 'Eligible' ? (
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                Eligible
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                                Not Eligible
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-4 p-4">
                {filteredRecords.map((record) => (
                  <div 
                    key={record.id} 
                    className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200"
                  >
                    <div className="p-4 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">
                          {formatDisplayMonth(record.month)}
                        </span>
                      </div>
                      <div>
                        {record.bonus_eligibility === 'Eligible' ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                            Bonus Eligible
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                            Not Eligible
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-4 grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <div className="flex items-start">
                          <div className="mt-0.5 flex-shrink-0">
                            <User className="w-5 h-5 text-blue-500" />
                          </div>
                          <div className="ml-3">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase">Staff Name</h3>
                            <p className="text-sm font-medium">
                              {record.staff_name}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-span-2">
                        <div className="flex items-start">
                          <div className="mt-0.5 flex-shrink-0">
                            <BadgeCheck className="w-5 h-5 text-orange-500" />
                          </div>
                          <div className="ml-3">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase">Employee ID</h3>
                            <p className="text-sm font-medium">
                              {record.employee_id}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-span-1">
                        <div className="flex items-start">
                          <div className="mt-0.5 flex-shrink-0">
                            <Calendar className="w-5 h-5 text-blue-500" />
                          </div>
                          <div className="ml-3">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase">Working Days</h3>
                            <p className="text-sm font-medium">
                              {formatIndianNumber(record.total_working_days)}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-span-1">
                        <div className="flex items-start">
                          <div className="mt-0.5 flex-shrink-0">
                            <XCircle className="w-5 h-5 text-red-500" />
                          </div>
                          <div className="ml-3">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase">Leaves</h3>
                            <p className="text-sm font-medium text-red-700">
                              {formatIndianNumber(record.total_leaves)}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-span-1">
                        <div className="flex items-start">
                          <div className="mt-0.5 flex-shrink-0">
                            <Clock className="w-5 h-5 text-purple-500" />
                          </div>
                          <div className="ml-3">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase">Avg Work Hours</h3>
                            <p className="text-sm font-medium">
                              {formatWorkHours(record.avg_work_hours)}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-span-1">
                        <div className="flex items-start">
                          <div className="mt-0.5 flex-shrink-0">
                            <Percent className="w-5 h-5 text-green-500" />
                          </div>
                          <div className="ml-3">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase">Task Completion</h3>
                            <p className="text-sm font-medium">
                              {record.total_tasks_assigned > 0 
                                ? `${Math.round((record.total_tasks_completed / record.total_tasks_assigned) * 100)}%` 
                                : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-span-2">
                        <div className="flex items-start">
                          <div className="mt-0.5 flex-shrink-0">
                            <CreditCard className="w-5 h-5 text-green-500" />
                          </div>
                          <div className="ml-3">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase">Total Payment</h3>
                            <p className="text-sm font-medium text-green-700">
                              ₹{formatIndianNumber(record.total_payment)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
                      Created: {formatCreatedAt(record.created_at)}
                    </div>
                  </div>
                ))}
              </div>

              {filteredRecords.length === 0 && (
                <div className="text-center py-12">
                  <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-2">No performance records found</p>
                  <p className="text-gray-400 text-sm mb-4">Try adjusting your filters</p>
                  <button
                    onClick={clearFilters}
                    className="text-blue-600 hover:text-blue-800 transition-colors font-medium"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SAMonthlyPerformance;