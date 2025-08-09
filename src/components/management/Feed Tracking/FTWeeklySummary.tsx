import React, { useState, useEffect } from 'react';
import { 
  Calendar, ClipboardList, Search, Filter, 
  ChevronDown, ChevronUp, Download, X, 
  Leaf, Wheat, Salad, Package, FlaskConical
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { useAuth } from '../../../contexts/AuthContext';

// Format week range display
const formatWeekRange = (dateString: string) => {
  const startDate = new Date(dateString);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  
  return `${startDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short'
  })} - ${endDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })}`;
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

interface FeedSummaryProps {
  query?: string;
}

const FTWeeklySummary: React.FC<FeedSummaryProps> = ({ query = '' }) => {
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
      
      let url = `https://nemmadi-dairy-farm.koyeb.app/api/ft-weekly-summary/${query}`;
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
      record.week_number?.toString().includes(searchTerm);
    
    const recordDate = new Date(record.week_start);
    const matchesDate = (!startDate || recordDate >= startDate) && 
                        (!endDate || recordDate <= endDate);
    
    return matchesSearch && matchesDate;
  });

  // Calculate totals for summary cards
  const calculateTotals = () => {
    const totals = {
      greenFodder: 0,
      dryFodder: 0,
      silage: 0,
      concentrate: 0,
      minerals: 0
    };

    filteredRecords.forEach(record => {
      totals.greenFodder += parseFloat(record.total_green_fodder_kg);
      totals.dryFodder += parseFloat(record.total_dry_fodder_kg);
      totals.silage += parseFloat(record.total_silage_kg);
      totals.concentrate += parseFloat(record.total_concentrate_kg);
      totals.minerals += parseFloat(record.total_minerals_g);
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
      
      let url = 'https://nemmadi-dairy-farm.koyeb.app/api/ft-weekly-summary/export/';
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
        a.download = `feed_tracking_weekly_summary_${new Date().toISOString().slice(0, 10)}.xlsx`;
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
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Feed Tracking Weekly Summary</h1>
              <p className="text-gray-600 mt-1">Weekly feed consumption statistics</p>
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
                  placeholder="Search by week number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              
              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From Week</label>
                <DatePicker
                  selected={startDate}
                  onChange={(date) => setStartDate(date)}
                  dateFormat="dd/MM/yyyy"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholderText="Select start date"
                />
              </div>
              
              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To Week</label>
                <DatePicker
                  selected={endDate}
                  onChange={(date) => setEndDate(date)}
                  dateFormat="dd/MM/yyyy"
                  minDate={startDate || undefined}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholderText="Select end date"
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
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Green Fodder */}
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center space-x-3 border-l-4 border-green-500">
            <div className="bg-green-100 p-2 rounded-lg">
              <Leaf className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Green Fodder</p>
              <p className="text-lg font-bold">{totals.greenFodder.toFixed(2)} kg</p>
            </div>
          </div>

          {/* Dry Fodder */}
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center space-x-3 border-l-4 border-amber-500">
            <div className="bg-amber-100 p-2 rounded-lg">
              <Wheat className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Dry Fodder</p>
              <p className="text-lg font-bold">{totals.dryFodder.toFixed(2)} kg</p>
            </div>
          </div>

          {/* Silage */}
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center space-x-3 border-l-4 border-yellow-500">
            <div className="bg-yellow-100 p-2 rounded-lg">
              <Salad className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Silage</p>
              <p className="text-lg font-bold">{totals.silage.toFixed(2)} kg</p>
            </div>
          </div>

          {/* Concentrate */}
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center space-x-3 border-l-4 border-blue-500">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Concentrate</p>
              <p className="text-lg font-bold">{totals.concentrate.toFixed(2)} kg</p>
            </div>
          </div>

          {/* Minerals */}
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center space-x-3 border-l-4 border-purple-500">
            <div className="bg-purple-100 p-2 rounded-lg">
              <FlaskConical className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Minerals</p>
              <p className="text-lg font-bold">{totals.minerals.toFixed(2)} g</p>
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
              <h2 className="text-xl font-bold text-gray-900">Feed Tracking Records</h2>
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Week</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Week #</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Green Fodder (kg)</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dry Fodder (kg)</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Silage (kg)</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Concentrate (kg)</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Minerals (g)</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 text-blue-600 mr-2" />
                            <span className="text-sm font-medium text-gray-900">
                              {formatWeekRange(record.week_start)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                            Week {record.week_number}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-green-700">{record.total_green_fodder_kg}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-amber-700">{record.total_dry_fodder_kg}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-yellow-700">{record.total_silage_kg}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-blue-700">{record.total_concentrate_kg}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-purple-700">{record.total_minerals_g}</span>
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
                          {formatWeekRange(record.week_start)}
                        </span>
                      </div>
                      <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        Week {record.week_number}
                      </div>
                    </div>
                    
                    <div className="p-4 grid grid-cols-2 gap-3">
                      {/* Green Fodder */}
                      <div className="bg-green-50 rounded-lg p-3 flex items-center space-x-2">
                        <Leaf className="w-4 h-4 text-green-600" />
                        <div>
                          <p className="text-xs text-gray-500">Green Fodder</p>
                          <p className="text-sm font-medium text-green-700">{record.total_green_fodder_kg} kg</p>
                        </div>
                      </div>
                      
                      {/* Dry Fodder */}
                      <div className="bg-amber-50 rounded-lg p-3 flex items-center space-x-2">
                        <Wheat className="w-4 h-4 text-amber-600" />
                        <div>
                          <p className="text-xs text-gray-500">Dry Fodder</p>
                          <p className="text-sm font-medium text-amber-700">{record.total_dry_fodder_kg} kg</p>
                        </div>
                      </div>
                      
                      {/* Silage */}
                      <div className="bg-yellow-50 rounded-lg p-3 flex items-center space-x-2">
                        <Salad className="w-4 h-4 text-yellow-600" />
                        <div>
                          <p className="text-xs text-gray-500">Silage</p>
                          <p className="text-sm font-medium text-yellow-700">{record.total_silage_kg} kg</p>
                        </div>
                      </div>
                      
                      {/* Concentrate */}
                      <div className="bg-blue-50 rounded-lg p-3 flex items-center space-x-2">
                        <Package className="w-4 h-4 text-blue-600" />
                        <div>
                          <p className="text-xs text-gray-500">Concentrate</p>
                          <p className="text-sm font-medium text-blue-700">{record.total_concentrate_kg} kg</p>
                        </div>
                      </div>
                      
                      {/* Minerals */}
                      <div className="bg-purple-50 rounded-lg p-3 flex items-center space-x-2 col-span-2">
                        <FlaskConical className="w-4 h-4 text-purple-600" />
                        <div>
                          <p className="text-xs text-gray-500">Minerals</p>
                          <p className="text-sm font-medium text-purple-700">{record.total_minerals_g} g</p>
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
                  <p className="text-gray-500 text-lg mb-2">No feed tracking records found</p>
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

export default FTWeeklySummary;