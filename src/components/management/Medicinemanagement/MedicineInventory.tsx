import React, { useState, useEffect } from 'react';
import { 
  Calendar, Search, Filter, 
  ChevronDown, ChevronUp, Download, X, 
  Package, Pill, Activity, AlertTriangle, Box
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { useAuth } from '../../../contexts/AuthContext';
import axios from 'axios';

interface MedicineInventoryProps {
  query?: string;
}

// Format date for display
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

// Format numbers in Indian style
const formatIndianNumber = (num: number | string | null, decimals: number = 0): string => {
  if (num === null || num === undefined) return '0';
  
  const number = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(number)) return '0';
  
  return number.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

const MedicineInventory: React.FC<MedicineInventoryProps> = ({ query = '' }) => {
  const { user } = useAuth();
  const [showFilters, setShowFilters] = useState(false);
  const [records, setRecords] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [batchFilter, setBatchFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All Statuses');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isExporting, setIsExporting] = useState(false);

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
      const params: Record<string, string> = {};
      if (startDate) params['start_date'] = startDate.toISOString().split('T')[0];
      if (endDate) params['end_date'] = endDate.toISOString().split('T')[0];
      if (searchTerm) params['search'] = searchTerm;
      if (batchFilter) params['batch_no'] = batchFilter;
      if (statusFilter !== 'All Statuses') params['status'] = statusFilter;
      
      // Handle supervisor query from AllSupervisorsData
      if (query) {
        const queryParams = new URLSearchParams(query);
        queryParams.forEach((value, key) => {
          params[key] = value;
        });
      }
      
      const response = await axios.get('http://localhost:8000/api/medicine-inventory/', {
        params,
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
        
      if (response.status === 200) {
        setRecords(response.data);
      } else {
        setError('Failed to fetch records');
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Authentication failed. Please login again.');
      } else if (err.response?.status === 404) {
        setError('API endpoint not found. Please check the URL.');
      } else {
        setError('Network error');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (user) {
      fetchRecords();
    }
  }, [user, query, startDate, endDate, batchFilter, statusFilter]);

  const filteredRecords = records.filter(record => {
    const matchesSearch = searchTerm === '' || 
      (record.medicine_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.batch_no?.toLowerCase().includes(searchTerm.toLowerCase())));
    
    const recordDate = record.received_date ? new Date(record.received_date) : null;
    const matchesDate = !recordDate || (
      (!startDate || recordDate >= startDate) && 
      (!endDate || recordDate <= endDate)
    );
    
    const matchesBatch = !batchFilter || record.batch_no === batchFilter;
    
    const matchesStatus = statusFilter === 'All Statuses' || 
                         record.status?.toLowerCase() === statusFilter.replace(' ', '_').toLowerCase();
    
    return matchesSearch && matchesDate && matchesBatch && matchesStatus;
  });

  // Calculate totals for summary cards
  const calculateTotals = () => {
    const totals = {
      totalReceived: 0,
      totalUsed: 0,
      totalExpired: 0,
      totalCost: 0,
      totalBalance: 0
    };

    filteredRecords.forEach(record => {
      totals.totalReceived += parseFloat(record.quantity_received || 0);
      totals.totalUsed += parseFloat(record.quantity_used || 0);
      totals.totalExpired += parseFloat(record.expired_quantity || 0);
      totals.totalCost += parseFloat(record.total_cost || 0);
      totals.totalBalance += parseFloat(record.balance || 0);
    });

    return totals;
  };

  const totals = calculateTotals();

  const clearFilters = () => {
    setSearchTerm('');
    setStartDate(null);
    setEndDate(null);
    setBatchFilter('');
    setStatusFilter('All Statuses');
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
      
      const params: Record<string, string> = {};
      if (startDate) params['start_date'] = startDate.toISOString().split('T')[0];
      if (endDate) params['end_date'] = endDate.toISOString().split('T')[0];
      if (searchTerm) params['search'] = searchTerm;
      if (batchFilter) params['batch_no'] = batchFilter;
      if (statusFilter !== 'All Statuses') params['status'] = statusFilter;
      
      // Handle supervisor query from AllSupervisorsData
      if (query) {
        const queryParams = new URLSearchParams(query);
        queryParams.forEach((value, key) => {
          params[key] = value;
        });
      }
      
      const response = await axios.get('http://localhost:8000/api/medicine-inventory/export/', {
        params,
        headers: {
          'Authorization': `Bearer ${user.token}`
        },
        responseType: 'blob'
      });
      
      if (response.status === 200) {
        const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `medicine_inventory_${new Date().toISOString().slice(0, 10)}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);
      } else {
        setError('Failed to export data');
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('Export endpoint not found. Please check the URL.');
      } else {
        setError('Export failed');
      }
    } finally {
      setIsExporting(false);
    }
  };

  // Status badge styling
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { text: string, color: string, bg: string }> = {
      active: { text: 'Active', color: 'text-green-800', bg: 'bg-green-100' },
      expiring_soon: { text: 'Expiring Soon', color: 'text-yellow-800', bg: 'bg-yellow-100' },
      expired: { text: 'Expired', color: 'text-red-800', bg: 'bg-red-100' },
      used: { text: 'Used', color: 'text-blue-800', bg: 'bg-blue-100' }
    };
    
    const statusInfo = statusMap[status] || { text: status, color: 'text-gray-800', bg: 'bg-gray-100' };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}>
        {statusInfo.text}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Medicine Inventory</h1>
              <p className="text-gray-600 mt-1">Track medicine stock by batch and expiration</p>
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
                  placeholder="Search by medicine or batch..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              
              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Received From</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Received To</label>
                <DatePicker
                  selected={endDate}
                  onChange={(date) => setEndDate(date)}
                  dateFormat="dd/MM/yyyy"
                  minDate={startDate || undefined}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholderText="dd/mm/yyyy"
                />
              </div>
              
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="All Statuses">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="expiring_soon">Expiring Soon</option>
                  <option value="expired">Expired</option>
                  <option value="used">Used</option>
                </select>
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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {/* Total Received */}
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center space-x-3 border-l-4 border-blue-500">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Received</p>
              <p className="text-lg font-bold">{formatIndianNumber(totals.totalReceived)}</p>
            </div>
          </div>

          {/* Total Used */}
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center space-x-3 border-l-4 border-green-500">
            <div className="bg-green-100 p-2 rounded-lg">
              <Pill className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Used</p>
              <p className="text-lg font-bold">{formatIndianNumber(totals.totalUsed)}</p>
            </div>
          </div>

          {/* Total Expired */}
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center space-x-3 border-l-4 border-red-500">
            <div className="bg-red-100 p-2 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Expired</p>
              <p className="text-lg font-bold">{formatIndianNumber(totals.totalExpired)}</p>
            </div>
          </div>
          
          {/* Total Balance */}
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center space-x-3 border-l-4 border-yellow-500">
            <div className="bg-yellow-100 p-2 rounded-lg">
              <Box className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Balance</p>
              <p className="text-lg font-bold text-gray-900">
                {formatIndianNumber(totals.totalBalance)}
              </p>
            </div>
          </div>
          
          {/* Total Cost */}
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center space-x-3 border-l-4 border-purple-500">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Activity className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Cost</p>
              <p className="text-lg font-bold">₹{formatIndianNumber(totals.totalCost, 2)}</p>
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
              <h2 className="text-xl font-bold text-gray-900">Medicine Inventory Records</h2>
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch No</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medicine</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Received Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Received</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Used</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expired</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                            {record.batch_no || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">
                            {record.medicine_name || 'N/A'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 text-blue-600 mr-2" />
                            <span className="text-sm font-medium text-gray-900">
                              {record.received_date ? formatDate(record.received_date) : 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-green-600 font-medium">
                          +{formatIndianNumber(record.quantity_received)}
                        </td>
                        <td className="px-4 py-3 text-sm text-red-600 font-medium">
                          -{formatIndianNumber(record.quantity_used)}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-red-600">
                          -{formatIndianNumber(record.expired_quantity)}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">
                          <span className={`px-2 py-1 rounded-full ${(record.balance || 0) < 10 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                            {formatIndianNumber(record.balance)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-purple-700">
                          ₹{formatIndianNumber(record.total_cost, 2)}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">
                          {record.expiry_date ? formatDate(record.expiry_date) : 'N/A'}
                        </td>
                        <td className="px-4 py-3">
                          {getStatusBadge(record.status)}
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
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                          {record.batch_no || 'N/A'}
                        </span>
                        {getStatusBadge(record.status)}
                      </div>
                    </div>
                    
                    <div className="p-4 grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-bold text-gray-900">{record.medicine_name || 'N/A'}</h3>
                        </div>
                      </div>
                      
                      <div className="col-span-2 flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 text-blue-600 mr-2" />
                        <span>Received: {record.received_date ? formatDate(record.received_date) : 'N/A'}</span>
                      </div>
                      
                      <div className="col-span-2 flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 text-red-600 mr-2" />
                        <span>Expiry: {record.expiry_date ? formatDate(record.expiry_date) : 'N/A'}</span>
                      </div>
                      
                      <div className="col-span-1">
                        <div className="flex items-start">
                          <div className="mt-0.5 flex-shrink-0">
                            <Package className="w-5 h-5 text-green-500" />
                          </div>
                          <div className="ml-3">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase">Received</h3>
                            <p className="text-sm font-medium text-green-600">
                              +{formatIndianNumber(record.quantity_received)}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-span-1">
                        <div className="flex items-start">
                          <div className="mt-0.5 flex-shrink-0">
                            <Pill className="w-5 h-5 text-red-500" />
                          </div>
                          <div className="ml-3">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase">Used</h3>
                            <p className="text-sm font-medium text-red-600">
                              -{formatIndianNumber(record.quantity_used)}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-span-1">
                        <div className="flex items-start">
                          <div className="mt-0.5 flex-shrink-0">
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                          </div>
                          <div className="ml-3">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase">Expired</h3>
                            <p className="text-sm font-medium text-red-600">
                              -{formatIndianNumber(record.expired_quantity)}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-span-1">
                        <div className="flex items-start">
                          <div className="mt-0.5 flex-shrink-0">
                            <Box className="w-5 h-5 text-gray-500" />
                          </div>
                          <div className="ml-3">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase">Balance</h3>
                            <p className={`text-sm font-medium ${(record.balance || 0) < 10 ? 'text-red-600' : 'text-gray-900'}`}>
                              {formatIndianNumber(record.balance)}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-span-2 border-t border-gray-100 pt-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase">Total Cost</h3>
                            <p className="text-sm font-medium text-purple-700">
                              ₹{formatIndianNumber(record.total_cost, 2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredRecords.length === 0 && !isLoading && (
                <div className="text-center py-12">
                  <Pill className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-2">No medicine inventory records found</p>
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

export default MedicineInventory;