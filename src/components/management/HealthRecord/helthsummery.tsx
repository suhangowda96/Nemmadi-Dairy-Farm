import React, { useState, useEffect } from 'react';
import { 
  Calendar, ClipboardList,
  Search, Filter, ChevronDown, ChevronUp, Download, 
  X, HeartPulse, Stethoscope, Flag,
  CheckCircle, Clock, AlertCircle
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { useAuth } from '../../../contexts/AuthContext';

// Format date as Month YYYY
const formatDisplayMonth = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
};

// Format date for API (YYYY-MM-DD)
const formatDateForAPI = (date: Date) => {
  return date.toISOString().split('T')[0];
};

// Format time for display
const formatTime = (timeString: string) => {
  const date = new Date(timeString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

// Format created_at for display
const formatCreatedAt = (dateString: string) => {
  const date = new Date(dateString);
  const formattedDate = date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const formattedTime = formatTime(dateString);
  return `${formattedDate} at ${formattedTime}`;
};

interface HealthSummaryProps {
  query?: string;
}

const HealthSummary: React.FC<HealthSummaryProps> = ({ query = '' }) => {
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
      
      let url = `http://localhost:8000/api/health-summary/${query}`;
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
      record.animal_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const recordDate = new Date(record.month);
    const matchesDate = (!startDate || recordDate >= startDate) && 
                        (!endDate || recordDate <= endDate);
    
    return matchesSearch && matchesDate;
  });

  // Calculate totals for summary cards
  const calculateTotals = () => {
    const totals = {
      dailyLogs: 0,
      redFlags: 0,
      treatments: 0,
      vetVisits: 0,
      deworming: 0,
      recovered: 0,
      underTreatment: 0,
      notRecovered: 0
    };

    filteredRecords.forEach(record => {
      totals.dailyLogs += record.total_daily_logs;
      totals.redFlags += record.total_red_flags;
      totals.treatments += record.total_treatments;
      totals.vetVisits += record.vet_visit_count;
      totals.deworming += record.total_deworming;
      
      // Count recovery statuses
      switch(record.latest_recovery_status) {
        case 'Recovered':
          totals.recovered++;
          break;
        case 'Under Treatment':
          totals.underTreatment++;
          break;
        case 'Not Recovered':
          totals.notRecovered++;
          break;
      }
    });

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
      
      let url = 'http://localhost:8000/api/health-summary/export/';
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
        a.download = `health_summary_${new Date().toISOString().slice(0, 10)}.xlsx`;
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
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Health Summary</h1>
              <p className="text-gray-600 mt-1">Monthly aggregated health statistics</p>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search Field */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by animal ID..."
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
        {/* Summary Cards - 2 columns on mobile */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          

          {/* Red Flags */}
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center space-x-3 border-l-4 border-red-500">
            <div className="bg-red-100 p-2 rounded-lg">
              <Flag className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Red Flags</p>
              <p className="text-lg font-bold">{totals.redFlags}</p>
            </div>
          </div>

          {/* Vet Visits */}
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center space-x-3 border-l-4 border-purple-500">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Stethoscope className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Vet Visits</p>
              <p className="text-lg font-bold">{totals.vetVisits}</p>
            </div>
          </div>

          {/* Deworming */}
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center space-x-3 border-l-4 border-amber-500">
            <div className="bg-amber-100 p-2 rounded-lg">
              <HeartPulse className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Deworming</p>
              <p className="text-lg font-bold">{totals.deworming}</p>
            </div>
          </div>

          {/* Recovered Animals */}
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center space-x-3 border-l-4 border-emerald-500">
            <div className="bg-emerald-100 p-2 rounded-lg">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Recovered</p>
              <p className="text-lg font-bold text-emerald-600">{totals.recovered}</p>
            </div>
          </div>

          {/* Under Treatment */}
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center space-x-3 border-l-4 border-cyan-500">
            <div className="bg-cyan-100 p-2 rounded-lg">
              <Clock className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Under Treatment</p>
              <p className="text-lg font-bold text-cyan-600">{totals.underTreatment}</p>
            </div>
          </div>

          {/* Not Recovered */}
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center space-x-3 border-l-4 border-rose-500">
            <div className="bg-rose-100 p-2 rounded-lg">
              <AlertCircle className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Not Recovered</p>
              <p className="text-lg font-bold text-rose-600">{totals.notRecovered}</p>
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
              <h2 className="text-xl font-bold text-gray-900">Summary Records</h2>
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Animal ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Red Flags</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vet Visits</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deworming</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dewormers Used</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recovery Status</th>
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
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <ClipboardList className="w-4 h-4 text-blue-500 mr-2" />
                            <span className="text-sm font-medium text-gray-900">
                              {record.animal_id}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <Flag className="w-4 h-4 text-red-400 mr-2" />
                            <span className="text-sm font-medium text-red-600">
                              {record.total_red_flags}
                            </span>
                          </div>
                        </td>
                        
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <Stethoscope className="w-4 h-4 text-purple-400 mr-2" />
                            <span className="text-sm font-medium text-purple-600">
                              {record.vet_visit_count}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <HeartPulse className="w-4 h-4 text-amber-400 mr-2" />
                            <span className="text-sm font-medium text-amber-600">
                              {record.total_deworming}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          {record.dewormer_used ? (
                            <div className="flex flex-wrap gap-1">
                              {record.dewormer_used.split(', ').map((dewormer: string, index: number) => (
                                <span 
                                  key={index} 
                                  className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full"
                                >
                                  {dewormer}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">None</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            {record.latest_recovery_status === 'Recovered' && (
                              <div className="flex items-center bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">
                                <CheckCircle className="w-4 h-4 mr-1" />
                                <span className="text-xs font-medium">Recovered</span>
                              </div>
                            )}
                            {record.latest_recovery_status === 'Under Treatment' && (
                              <div className="flex items-center bg-cyan-100 text-cyan-700 px-3 py-1 rounded-full">
                                <Clock className="w-4 h-4 mr-1" />
                                <span className="text-xs font-medium">Under Treatment</span>
                              </div>
                            )}
                            {record.latest_recovery_status === 'Not Recovered' && (
                              <div className="flex items-center bg-rose-100 text-rose-700 px-3 py-1 rounded-full">
                                <AlertCircle className="w-4 h-4 mr-1" />
                                <span className="text-xs font-medium">Not Recovered</span>
                              </div>
                            )}
                            {!record.latest_recovery_status && (
                              <span className="text-xs text-gray-500">No Status</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards - Recent First */}
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
                      <div className="flex items-center space-x-2">
                        <ClipboardList className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium text-blue-700">
                          {record.animal_id}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-4 grid grid-cols-2 gap-4">
                      <div className="flex items-start">
                        <Flag className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                        <div className="ml-3">
                          <h3 className="text-xs font-semibold text-gray-500 uppercase">Red Flags</h3>
                          <p className="text-sm font-medium text-red-600">
                            {record.total_red_flags}
                          </p>
                        </div>
                      </div>
                          
                      <div className="flex items-start">
                        <Stethoscope className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                        <div className="ml-3">
                          <h3 className="text-xs font-semibold text-gray-500 uppercase">Vet Visits</h3>
                          <p className="text-sm font-medium text-purple-600">
                            {record.vet_visit_count}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <HeartPulse className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                        <div className="ml-3">
                          <h3 className="text-xs font-semibold text-gray-500 uppercase">Deworming</h3>
                          <p className="text-sm font-medium text-amber-600">
                            {record.total_deworming}
                          </p>
                        </div>
                      </div>
                       <div className="col-span-2">
                          <div className="flex items-start">
                            <div className="mt-0.5 flex-shrink-0">
                              <HeartPulse className="w-5 h-5 text-amber-500" />
                            </div>
                            <div className="ml-3">
                              <h3 className="text-xs font-semibold text-gray-500 uppercase">Dewormers Used</h3>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {record.dewormer_used ? (
                                  record.dewormer_used.split(', ').map((dewormer: string, index: number) => (
                                    <span 
                                      key={index} 
                                      className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full"
                                    >
                                      {dewormer}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-gray-400 text-sm">None recorded</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                      
                      <div className="col-span-2 flex items-start">
                        <div className="mt-0.5 flex-shrink-0">
                          {record.latest_recovery_status === 'Recovered' && (
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                          )}
                          {record.latest_recovery_status === 'Under Treatment' && (
                            <Clock className="w-5 h-5 text-cyan-600" />
                          )}
                          {record.latest_recovery_status === 'Not Recovered' && (
                            <AlertCircle className="w-5 h-5 text-rose-600" />
                          )}
                        </div>
                        <div className="ml-3">
                          <h3 className="text-xs font-semibold text-gray-500 uppercase">Recovery Status</h3>
                          <p className={`text-sm font-medium ${
                            record.latest_recovery_status === 'Recovered' ? 'text-emerald-600' : 
                            record.latest_recovery_status === 'Under Treatment' ? 'text-cyan-600' : 
                            record.latest_recovery_status === 'Not Recovered' ? 'text-rose-600' : 
                            'text-gray-600'
                          }`}>
                            {record.latest_recovery_status || 'No Status'}
                          </p>
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
                  <ClipboardList className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-2">No health summary records found</p>
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

export default HealthSummary;