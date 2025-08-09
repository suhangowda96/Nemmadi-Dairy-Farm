import React, { useState, useEffect } from 'react';
import { 
  Calendar, Filter, 
  ChevronDown, ChevronUp, Download, X, 
  CreditCard, IndianRupeeIcon, ShoppingBag, Activity,Box,
  HeartPulse, Wrench, PlugZap, Boxes, Baby, Syringe, 
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { useAuth } from '../../../contexts/AuthContext';

// Format number as Indian currency (e.g. 10,00,000.00)
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  }).format(value);
};

// Format date as Month YYYY
const formatDisplayMonth = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
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

interface FinancialExpenseProps {
  query?: string;
}

const FRMonthlyExpense: React.FC<FinancialExpenseProps> = ({ query = '' }) => {
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
      
      let url = `https://nemmadi-dairy-farm.koyeb.app/api/fr-monthly-expense/${query}`;
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
      record.month?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const recordDate = new Date(record.month);
    const matchesDate = (!startDate || recordDate >= startDate) && 
                        (!endDate || recordDate <= endDate);
    
    return matchesSearch && matchesDate;
  });

  // Calculate totals for summary cards
  const calculateTotals = () => {
    const totals = {
      feedCost: 0,
      calfFeed: 0,
      labour: 0,
      vaccination: 0,
      medicine: 0,
      spareparts: 0,
      maintenance: 0,
      equipments: 0,
      electricityWater: 0,
      miscellaneous: 0,
      totalExpenses: 0
    };

    filteredRecords.forEach(record => {
      totals.feedCost += parseFloat(record.feed_cost);
      totals.calfFeed += parseFloat(record.calf_feed);
      totals.labour += parseFloat(record.labour);
      totals.vaccination += parseFloat(record.vaccination);
      totals.medicine += parseFloat(record.medicine);
      totals.spareparts += parseFloat(record.spareparts);
      totals.maintenance += parseFloat(record.maintenance);
      totals.equipments += parseFloat(record.equipments);
      totals.electricityWater += parseFloat(record.electricity_water);
      totals.miscellaneous += parseFloat(record.miscellaneous);
      totals.totalExpenses += parseFloat(record.total);
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
      
      let url = 'https://nemmadi-dairy-farm.koyeb.app/api/fr-monthly-expense/export/';
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
        a.download = `financial_expenses_${new Date().toISOString().slice(0, 10)}.xlsx`;
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
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Monthly Expense Summary</h1>
              <p className="text-gray-600 mt-1">Monthly aggregated farm expenses</p>
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
        
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

          {/* Feed Cost */}
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center space-x-3 border-l-4 border-orange-500">
            <div className="bg-orange-100 p-2 rounded-lg">
              <ShoppingBag className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Feed Cost</p>
              <p className="text-lg font-bold">₹{formatCurrency(totals.feedCost)}</p>
            </div>
          </div>

          {/* Calf Feed */}
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center space-x-3 border-l-4 border-amber-500">
            <div className="bg-amber-100 p-2 rounded-lg">
              <Baby className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Calf Feed</p>
              <p className="text-lg font-bold">₹{formatCurrency(totals.calfFeed)}</p>
            </div>
          </div>

          {/* Labour */}
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center space-x-3 border-l-4 border-blue-500">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Labour</p>
              <p className="text-lg font-bold">₹{formatCurrency(totals.labour)}</p>
            </div>
          </div>
          
          {/* Vaccination */}
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center space-x-3 border-l-4 border-purple-500">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Syringe className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Vaccination</p>
              <p className="text-lg font-bold">₹{formatCurrency(totals.vaccination)}</p>
            </div>
          </div>

          {/* Medicine */}
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center space-x-3 border-l-4 border-fuchsia-500">
            <div className="bg-fuchsia-100 p-2 rounded-lg">
              <HeartPulse className="w-5 h-5 text-fuchsia-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Medicine</p>
              <p className="text-lg font-bold">₹{formatCurrency(totals.medicine)}</p>
            </div>
          </div>

          {/* Spareparts */}
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center space-x-3 border-l-4 border-gray-500">
            <div className="bg-gray-100 p-2 rounded-lg">
              <Box className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Spareparts</p>
              <p className="text-lg font-bold">₹{formatCurrency(totals.spareparts)}</p>
            </div>
          </div>
          
          {/* Maintenance */}
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center space-x-3 border-l-4 border-yellow-500">
            <div className="bg-yellow-100 p-2 rounded-lg">
              <Wrench className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Maintenance</p>
              <p className="text-lg font-bold">₹{formatCurrency(totals.maintenance)}</p>
            </div>
          </div>
          
          {/* Equipment Cost */}
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center space-x-3 border-l-4 border-gray-500">
            <div className="bg-gray-100 p-2 rounded-lg">
              <Boxes className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Equipment Cost</p>
              <p className="text-lg font-bold">₹{formatCurrency(totals.equipments)}</p>
            </div>
          </div>
          
          {/* Electricity & Water */}
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center space-x-3 border-l-4 border-cyan-500">
            <div className="bg-cyan-100 p-2 rounded-lg">
              <PlugZap className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Electricity & Water</p>
              <p className="text-lg font-bold">₹{formatCurrency(totals.electricityWater)}</p>
            </div>
          </div>
          
          {/* Miscellaneous */}
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center space-x-3 border-l-4 border-green-500">
            <div className="bg-green-100 p-2 rounded-lg">
              <IndianRupeeIcon className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Miscellaneous</p>
              <p className="text-lg font-bold">₹{formatCurrency(totals.miscellaneous)}</p>
            </div>
          </div>

          {/* Total Expenses */}
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center space-x-3 border-l-4 border-red-500">
            <div className="bg-red-100 p-2 rounded-lg">
              <CreditCard className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Expenses</p>
              <p className="text-lg font-bold">₹{formatCurrency(totals.totalExpenses)}</p>
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
              <h2 className="text-xl font-bold text-gray-900">Monthly Expense Records</h2>
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feed Cost</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Calf Feed</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vaccination</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medicine</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Spareparts</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Labour</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Maintenance</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipment Cost</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Electricity & Water</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Miscellaneous</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
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
                          ₹{formatCurrency(parseFloat(record.feed_cost))}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          ₹{formatCurrency(parseFloat(record.calf_feed))}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          ₹{formatCurrency(parseFloat(record.vaccination))}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          ₹{formatCurrency(parseFloat(record.medicine))}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          ₹{formatCurrency(parseFloat(record.spareparts))}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          ₹{formatCurrency(parseFloat(record.labour))}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          ₹{formatCurrency(parseFloat(record.maintenance))}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          ₹{formatCurrency(parseFloat(record.equipments))}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          ₹{formatCurrency(parseFloat(record.electricity_water))}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          ₹{formatCurrency(parseFloat(record.miscellaneous))}
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-red-700">
                          ₹{formatCurrency(parseFloat(record.total))}
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
                      <div className="text-sm font-bold text-red-700">
                        ₹{formatCurrency(parseFloat(record.total))}
                      </div>
                    </div>
                    
                    <div className="p-4 grid grid-cols-2 gap-4">
                      <div className="col-span-1">
                        <div className="flex items-start">
                          <div className="mt-0.5 flex-shrink-0">
                            <ShoppingBag className="w-5 h-5 text-orange-500" />
                          </div>
                          <div className="ml-3">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase">Feed Cost</h3>
                            <p className="text-sm font-medium">₹{formatCurrency(parseFloat(record.feed_cost))}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-span-1">
                        <div className="flex items-start">
                          <div className="mt-0.5 flex-shrink-0">
                            <Baby className="w-5 h-5 text-amber-500" />
                          </div>
                          <div className="ml-3">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase">Calf Feed</h3>
                            <p className="text-sm font-medium">₹{formatCurrency(parseFloat(record.calf_feed))}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-span-1">
                        <div className="flex items-start">
                          <div className="mt-0.5 flex-shrink-0">
                            <Syringe className="w-5 h-5 text-purple-500" />
                          </div>
                          <div className="ml-3">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase">Vaccination</h3>
                            <p className="text-sm font-medium">₹{formatCurrency(parseFloat(record.vaccination))}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-span-1">
                        <div className="flex items-start">
                          <div className="mt-0.5 flex-shrink-0">
                            <HeartPulse className="w-5 h-5 text-fuchsia-500" />
                          </div>
                          <div className="ml-3">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase">Medicine</h3>
                            <p className="text-sm font-medium">₹{formatCurrency(parseFloat(record.medicine))}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-span-1">
                        <div className="flex items-start">
                          <div className="mt-0.5 flex-shrink-0">
                            <Box className="w-5 h-5 text-gray-500" />
                          </div>
                          <div className="ml-3">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase">Spareparts</h3>
                            <p className="text-sm font-medium">₹{formatCurrency(parseFloat(record.spareparts))}</p>
                          </div>
                        </div>
                      </div>

                      <div className="col-span-1">
                        <div className="flex items-start">
                          <div className="mt-0.5 flex-shrink-0">
                            <Activity className="w-5 h-5 text-blue-500" />
                          </div>
                          <div className="ml-3">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase">Labour</h3>
                            <p className="text-sm font-medium">₹{formatCurrency(parseFloat(record.labour))}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-span-1">
                        <div className="flex items-start">
                          <div className="mt-0.5 flex-shrink-0">
                            <Wrench className="w-5 h-5 text-yellow-500" />
                          </div>
                          <div className="ml-3">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase">Maintenance</h3>
                            <p className="text-sm font-medium">₹{formatCurrency(parseFloat(record.maintenance))}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-span-1">
                        <div className="flex items-start">
                          <div className="mt-0.5 flex-shrink-0">
                            <Boxes className="w-5 h-5 text-gray-500" />
                          </div>
                          <div className="ml-3">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase">Equipment</h3>
                            <p className="text-sm font-medium">₹{formatCurrency(parseFloat(record.equipments))}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-span-1">
                        <div className="flex items-start">
                          <div className="mt-0.5 flex-shrink-0">
                            <PlugZap className="w-5 h-5 text-cyan-500" />
                          </div>
                          <div className="ml-3">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase">Electricity & Water</h3>
                            <p className="text-sm font-medium">₹{formatCurrency(parseFloat(record.electricity_water))}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-span-1">
                        <div className="flex items-start">
                          <div className="mt-0.5 flex-shrink-0">
                            <IndianRupeeIcon className="w-5 h-5 text-green-500" />
                          </div>
                          <div className="ml-3">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase">Miscellaneous</h3>
                            <p className="text-sm font-medium">₹{formatCurrency(parseFloat(record.miscellaneous))}</p>
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
                  <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-2">No expense records found</p>
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

export default FRMonthlyExpense;