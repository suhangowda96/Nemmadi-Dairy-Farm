import React, { useState, useEffect } from 'react';
import { 
  Calendar, ClipboardList, Search, Filter, 
  ChevronDown, ChevronUp, Download, X,
  Syringe, Package, IndianRupee,  
  FileText, AlertTriangle,
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { useAuth } from '../../../contexts/AuthContext';

// Format date as DD/MM/YYYY
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Format date for API (YYYY-MM-DD)
const formatDateForAPI = (date: Date) => {
  return date.toISOString().split('T')[0];
};

interface VaccineRegisterProps {
  query?: string;
}

const VaccineRegister: React.FC<VaccineRegisterProps> = ({ query = '' }) => {
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

  // Format numbers in Indian style (1,00,000)
  const formatIndianNumber = (value: number | null | undefined, decimalPlaces: number = 0) => {
    if (value === null || value === undefined || isNaN(value)) return 'N/A';
    
    // Format the number with Indian comma separators
    const parts = value.toFixed(decimalPlaces).split('.');
    let integerPart = parts[0];
    const fractionalPart = parts[1] ? `.${parts[1]}` : '';
    
    // Add commas in Indian format
    const lastThree = integerPart.slice(-3);
    const otherNumbers = integerPart.slice(0, -3);
    if (otherNumbers === '') {
      integerPart = lastThree;
    } else {
      integerPart = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree;
    }
    
    return integerPart + fractionalPart;
  };

  // Format currency specifically (₹1,00,000.00)
  const formatIndianCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined || isNaN(value)) return 'N/A';
    return `₹${formatIndianNumber(value, 2)}`;
  };

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
      
      let url = `http://localhost:8000/api/vaccines-register/${query}`;
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
        setError('Failed to fetch vaccine records');
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
      record.vaccine_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.batch_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.po_no?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const recordDate = new Date(record.date);
    const matchesDate = (!startDate || recordDate >= startDate) && 
                        (!endDate || recordDate <= endDate);
    
    return matchesSearch && matchesDate;
  });

  // Calculate totals for summary cards
  const calculateTotals = () => {
    const totals = {
      totalVaccines: 0,
      totalCost: 0,
      totalRecords: 0
    };

    filteredRecords.forEach(record => {
      totals.totalVaccines += parseInt(record.quantity_received) || 0;
      totals.totalCost += parseFloat(record.total) || 0;
      totals.totalRecords += 1;
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
      
      let url = 'http://localhost:8000/api/vaccines-register/export/';
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
        a.download = `vaccine_register_${new Date().toISOString().slice(0, 10)}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);
      } else {
        setError('Failed to export vaccine data');
      }
    } catch (err) {
      setError('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  // Get status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'expiring_soon':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Vaccine Register</h1>
              <p className="text-gray-600 mt-1">Tracking of vaccine inventory and status</p>
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
                  placeholder="Search by vaccine name, batch or PO..."
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
                  placeholderText="DD/MM/YYYY"
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
                  placeholderText="DD/MM/YYYY"
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Vaccines */}
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center space-x-3 border-l-4 border-blue-500">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Syringe className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Vaccines</p>
              <p className="text-lg font-bold">{formatIndianNumber(totals.totalVaccines)} units</p>
            </div>
          </div>

          {/* Total Cost */}
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center space-x-3 border-l-4 border-green-500">
            <div className="bg-green-100 p-2 rounded-lg">
              <IndianRupee className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Cost</p>
              <p className="text-lg font-bold">{formatIndianCurrency(totals.totalCost)}</p>
            </div>
          </div>
          
          {/* Total Records */}
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center space-x-3 border-l-4 border-indigo-500">
            <div className="bg-indigo-100 p-2 rounded-lg">
              <ClipboardList className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Records</p>
              <p className="text-lg font-bold">{totals.totalRecords}</p>
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
              <h2 className="text-xl font-bold text-gray-900">Vaccine Register Records</h2>
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
              <p className="text-gray-600">Loading vaccine records...</p>
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                       <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PO Number</th>
                       <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch No</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vaccine Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost/Unit</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRecords.map((record) => {
                      const today = new Date();
                      const expiryDate = new Date(record.expiry_date);
                      const isExpired = expiryDate < today;
                      const thirtyDaysLater = new Date(today);
                      thirtyDaysLater.setDate(today.getDate() + 30);
                      const isExpiringSoon = expiryDate <= thirtyDaysLater && !isExpired;
                      
                      return (
                        <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 text-blue-600 mr-2" />
                              <span className="text-sm font-medium text-gray-900">
                                {record.date ? formatDate(record.date) : 'N/A'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-700">
                            {record.po_no || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-blue-700">
                            {record.batch_no || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {record.vaccine_name || 'N/A'}
                          </td>
                          
                          <td className="px-4 py-3 text-sm font-medium text-purple-700">
                            {record.quantity_received ? formatIndianNumber(parseInt(record.quantity_received)) : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-700">
                            {record.cost_per_unit ? formatIndianCurrency(parseFloat(record.cost_per_unit)) : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-green-700">
                            {record.total ? formatIndianCurrency(parseFloat(record.total)) : 'N/A'}
                          </td>
                          <td className={`px-4 py-3 whitespace-nowrap ${isExpired ? 'text-red-600' : isExpiringSoon ? 'text-yellow-600' : 'text-green-600'}`}>
                            <div className="flex items-center">
                              <AlertTriangle className={`w-4 h-4 mr-2 ${isExpired ? 'text-red-500' : isExpiringSoon ? 'text-yellow-500' : 'text-green-500'}`} />
                              <span className="text-sm font-medium">
                                {record.expiry_date ? formatDate(record.expiry_date) : 'N/A'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(record.status)}`}>
                              {record.status ? record.status.replace('_', ' ') : 'N/A'}
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
                  const today = new Date();
                  const expiryDate = new Date(record.expiry_date);
                  const isExpired = expiryDate < today;
                  const thirtyDaysLater = new Date(today);
                  thirtyDaysLater.setDate(today.getDate() + 30);
                  const isExpiringSoon = expiryDate <= thirtyDaysLater && !isExpired;
                  
                  return (
                    <div 
                      key={record.id} 
                      className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200"
                    >
                      <div className="p-4 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
                        {/* Date */}
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">
                            {record.date ? formatDate(record.date) : 'N/A'}
                          </span>
                        </div>

                        {/* Status */}
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(record.status)}`}>
                          {record.status ? record.status.replace('_', ' ') : 'N/A'}
                        </span>
                      </div>
                      
                      <div className="p-4 grid grid-cols-1 gap-4">
                        
                        <div className="grid grid-cols-2 gap-4">
                          {/* PO Number */}
                          <div className="col-span-1">
                            <div className="flex items-start">
                              <div className="mt-0.5 flex-shrink-0">
                                <FileText className="w-5 h-5 text-gray-500" />
                              </div>
                              <div className="ml-3">
                                <h3 className="text-xs font-semibold text-gray-500 uppercase">PO Number</h3>
                                <p className="text-sm font-medium">
                                  {record.po_no || 'N/A'}
                                </p>
                              </div>
                            </div>
                          </div>
                          {/* Batch No */}
                          <div className="col-span-1">
                            <div className="flex items-start">
                              <div className="mt-0.5 flex-shrink-0">
                                <FileText className="w-5 h-5 text-gray-500" />
                              </div>
                              <div className="ml-3">
                                <h3 className="text-xs font-semibold text-gray-500 uppercase">Batch No</h3>
                                <p className="text-sm font-medium text-blue-700">
                                  {record.batch_no || 'N/A'}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                        </div>

                        {/* Vaccine Name */}
                        <div className="col-span-1">
                          <div className="flex items-start">
                            <div className="mt-0.5 flex-shrink-0">
                              <Syringe className="w-5 h-5 text-blue-500" />
                            </div>
                            <div className="ml-3">
                              <h3 className="text-xs font-semibold text-gray-500 uppercase">Vaccine Name</h3>
                              <p className="text-sm font-medium">{record.vaccine_name || 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Quantity */}
                        <div className="col-span-1">
                          <div className="flex items-start">
                            <div className="mt-0.5 flex-shrink-0">
                              <Package className="w-5 h-5 text-purple-500" />
                            </div>
                            <div className="ml-3">
                              <h3 className="text-xs font-semibold text-gray-500 uppercase">Quantity</h3>
                              <p className="text-sm font-medium">
                                {record.quantity_received ? `${formatIndianNumber(parseInt(record.quantity_received))} units` : 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Cost Details */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-1">
                            <div className="flex items-start">
                              <div className="mt-0.5 flex-shrink-0">
                                <IndianRupee className="w-5 h-5 text-purple-500" />
                              </div>
                              <div className="ml-3">
                                <h3 className="text-xs font-semibold text-gray-500 uppercase">Cost/Unit</h3>
                                <p className="text-sm font-medium text-purple-700">
                                  {record.cost_per_unit ? formatIndianCurrency(parseFloat(record.cost_per_unit)) : 'N/A'}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-span-1">
                            <div className="flex items-start">
                              <div className="mt-0.5 flex-shrink-0">
                                <IndianRupee className="w-5 h-5 text-green-500" />
                              </div>
                              <div className="ml-3">
                                <h3 className="text-xs font-semibold text-gray-500 uppercase">Total Cost</h3>
                                <p className="text-sm font-medium text-green-700">
                                  {record.total ? formatIndianCurrency(parseFloat(record.total)) : 'N/A'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Expiry Date */}
                        <div className="col-span-1">
                          <div className="flex items-start">
                            <div className="mt-0.5 flex-shrink-0">
                              <AlertTriangle className={`w-5 h-5 ${isExpired ? 'text-red-500' : isExpiringSoon ? 'text-yellow-500' : 'text-green-500'}`} />
                            </div>
                            <div className="ml-3">
                              <h3 className="text-xs font-semibold text-gray-500 uppercase">Expiry Date</h3>
                              <p className={`text-sm font-medium ${isExpired ? 'text-red-600' : isExpiringSoon ? 'text-yellow-600' : 'text-green-600'}`}>
                                {record.expiry_date ? formatDate(record.expiry_date) : 'N/A'}
                              </p>
                            </div>
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
                  <p className="text-gray-500 text-lg mb-2">No vaccine records found</p>
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

export default VaccineRegister;