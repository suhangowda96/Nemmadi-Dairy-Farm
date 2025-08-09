import React, { useState, useEffect } from 'react';
import { 
  Calendar, ClipboardList, Filter, 
  ChevronDown, ChevronUp, Download, X, 
  BarChart2,
  Wallet, CreditCard, CheckCircle, XCircle
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

// Format currency in Indian format (10,00,000)
const formatIndianCurrency = (value: number | string) => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(num);
};

interface FinancialRecordProps {
  query?: string;
}

const FinancialRecord: React.FC<FinancialRecordProps> = ({ query = '' }) => {
  const { user } = useAuth();
  const [showFilters, setShowFilters] = useState(false);
  const [records, setRecords] = useState<any[]>([]);
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
      
      let url = `https://nemmadi-dairy-farm.koyeb.app/api/financial-records/${query}`;
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
  }, [user, startDate, endDate]);

  const filteredRecords = records.filter(record => {
    const recordDate = new Date(record.month);
    return (!startDate || recordDate >= startDate) && 
           (!endDate || recordDate <= endDate);
  });

  // Calculate totals for summary cards
  const calculateTotals = () => {
    const totals = {
      totalIncome: 0,
      totalExpenses: 0,
      netProfit: 0,
      profitCount: 0,
      lossCount: 0
    };

    filteredRecords.forEach(record => {
      totals.totalIncome += parseFloat(record.total_income);
      totals.totalExpenses += parseFloat(record.total_expenses);
      totals.netProfit += parseFloat(record.net_profit);
      
      if (record.status === 'Profit') {
        totals.profitCount++;
      } else if (record.status === 'Loss') {
        totals.lossCount++;
      }
    });

    return totals;
  };

  const totals = calculateTotals();

  const clearFilters = () => {
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
      
      let url = 'https://nemmadi-dairy-farm.koyeb.app/api/financial-records/export/';
      const params = new URLSearchParams();
      
      if (isAdmin) {
        params.append('all_supervisors', 'true');
      } else {
        params.append('supervisorId', user.id.toString());
      }
      
      // Add filter parameters
      if (startDate) params.append('start_date', formatDateForAPI(startDate));
      if (endDate) params.append('end_date', formatDateForAPI(endDate));
      
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
        a.download = `financial_records_${new Date().toISOString().slice(0, 10)}.xlsx`;
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
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Financial Records</h1>
              <p className="text-gray-600 mt-1">Monthly financial performance overview</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          {/* Total Income */}
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center space-x-3 border-l-4 border-blue-500">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Wallet className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Income</p>
              <p className="text-lg font-bold">₹{formatIndianCurrency(totals.totalIncome)}</p>
            </div>
          </div>

          {/* Total Expenses */}
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center space-x-3 border-l-4 border-orange-500">
            <div className="bg-orange-100 p-2 rounded-lg">
              <CreditCard className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Expenses</p>
              <p className="text-lg font-bold">₹{formatIndianCurrency(totals.totalExpenses)}</p>
            </div>
          </div>

          {/* Net Profit */}
          <div className={`bg-white rounded-xl shadow-sm p-4 flex items-center space-x-3 border-l-4 ${
            totals.netProfit >= 0 ? 'border-green-500' : 'border-red-500'
          }`}>
            <div className={`p-2 rounded-lg ${
              totals.netProfit >= 0 ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <BarChart2 className={`w-5 h-5 ${
                totals.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
              }`} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Net Profit</p>
              <p className={`text-lg font-bold ${
                totals.netProfit >= 0 ? 'text-green-700' : 'text-red-700'
              }`}>
                ₹{formatIndianCurrency(totals.netProfit)}
              </p>
            </div>
          </div>
          
          {/* Status */}
          <div className={`bg-white rounded-xl shadow-sm p-4 flex items-center space-x-3 border-l-4 ${
            totals.netProfit >= 0 ? 'border-green-500' : 'border-red-500'
          }`}>
            <div className={`p-2 rounded-lg ${
              totals.netProfit >= 0 ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {totals.netProfit >= 0 ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
            </div>
            <div>
              <p className="text-xs text-gray-500">Overall Status</p>
              <p className={`text-lg font-bold ${
                totals.netProfit >= 0 ? 'text-green-700' : 'text-red-700'
              }`}>
                {totals.netProfit >= 0 ? 'Profit' : 'Loss'}
              </p>
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
              <h2 className="text-xl font-bold text-gray-900">Financial Records</h2>
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Income</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Expenses</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Profit</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRecords.map((record) => {
                      const isProfit = record.status === 'Profit';
                      return (
                        <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 text-blue-600 mr-2" />
                              <span className="text-sm font-medium text-gray-900">
                                {formatDisplayMonth(record.month)}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-blue-700">
                            ₹{formatIndianCurrency(record.total_income)}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-orange-700">
                            ₹{formatIndianCurrency(record.total_expenses)}
                          </td>
                          <td className={`px-4 py-3 text-sm font-medium ${
                            isProfit ? 'text-green-700' : 'text-red-700'
                          }`}>
                            ₹{formatIndianCurrency(record.net_profit)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              isProfit 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {record.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-4 p-4">
                {filteredRecords.map((record) => {
                  const isProfit = record.status === 'Profit';
                  return (
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
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          isProfit 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {record.status}
                        </span>
                      </div>
                      
                      <div className="p-4 grid grid-cols-2 gap-4">
                        <div className="col-span-1">
                          <div className="flex items-start">
                            <div className="mt-0.5 flex-shrink-0">
                              <Wallet className="w-5 h-5 text-blue-500" />
                            </div>
                            <div className="ml-3">
                              <h3 className="text-xs font-semibold text-gray-500 uppercase">Total Income</h3>
                              <p className="text-sm font-medium text-blue-700">
                                ₹{formatIndianCurrency(record.total_income)}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="col-span-1">
                          <div className="flex items-start">
                            <div className="mt-0.5 flex-shrink-0">
                              <CreditCard className="w-5 h-5 text-orange-500" />
                            </div>
                            <div className="ml-3">
                              <h3 className="text-xs font-semibold text-gray-500 uppercase">Total Expenses</h3>
                              <p className="text-sm font-medium text-orange-700">
                                ₹{formatIndianCurrency(record.total_expenses)}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="col-span-2">
                          <div className={`flex items-center justify-between p-3 rounded-lg ${
                            isProfit ? 'bg-green-50' : 'bg-red-50'
                          }`}>
                            <div className="flex items-center">
                              <BarChart2 className={`w-5 h-5 ${isProfit ? 'text-green-600' : 'text-red-600'}`} />
                              <h3 className="ml-2 text-sm font-semibold text-gray-700">Net Profit</h3>
                            </div>
                            <p className={`text-base font-bold ${isProfit ? 'text-green-700' : 'text-red-700'}`}>
                              ₹{formatIndianCurrency(record.net_profit)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredRecords.length === 0 && (
                <div className="text-center py-12">
                  <ClipboardList className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-2">No financial records found</p>
                  <p className="text-gray-400 text-sm mb-4">Try adjusting your date filters</p>
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

export default FinancialRecord;