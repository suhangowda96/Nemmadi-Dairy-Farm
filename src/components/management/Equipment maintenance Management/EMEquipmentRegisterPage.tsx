import React, { useState, useEffect } from 'react';
import { 
  Calendar, Search, X, Filter, 
  ChevronDown, ChevronUp, ClipboardList, Download, Package, Box, Check, Trash2,
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import * as XLSX from 'xlsx';
import "react-datepicker/dist/react-datepicker.css";
import { useAuth } from '../../../contexts/AuthContext';


const formatDisplayDate = (dateString: string) => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Format numbers in Indian currency format (e.g., 1,00,000.00)
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  }).format(amount);
};

const formatIndianNumber = (num: number) => {
  return new Intl.NumberFormat('en-IN').format(num);
};

interface EMEquipmentRegisterProps {
  query?: string;
}

const EMEquipmentRegisterPage : React.FC<EMEquipmentRegisterProps> = ({ query = '' }) => {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [equipmentFilter, setEquipmentFilter] = useState('');
  const [vendorFilter, setVendorFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [summary, setSummary] = useState({
    totalEquipment: 0,
    activeEquipment: 0,
    removedEquipment: 0,
    totalCost: 0,
    averageCost: 0
  });

  const [formData, setFormData] = useState({
    removed_quantity: 0
  });

  const fetchRecords = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      if (!user || !user.token) {
        setError('User not authenticated');
        setIsLoading(false);
        return;
      }
      
      const url = `http://localhost:8000/api/em-equipment-register/${query}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRecords(data);
        
        // Calculate summary with proper number conversion
        const totalEquipment = data.length;
        const activeEquipment = data.filter((r: any) => r.state === 'active').length;
        const removedEquipment = data.filter((r: any) => r.state === 'removed').length;
        
        // Ensure cost values are numbers
        const totalCost = data.reduce((sum: number, r: any) => {
          const cost = parseFloat(r.total_cost) || 0;
          return sum + cost;
        }, 0);
        
        const averageCost = totalEquipment > 0 ? totalCost / totalEquipment : 0;
        
        setSummary({
          totalEquipment,
          activeEquipment,
          removedEquipment,
          totalCost,
          averageCost
        });
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
      record.equipment_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.equipment_for && record.equipment_for.toLowerCase().includes(searchTerm.toLowerCase())) ||
      record.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.po_no.toLowerCase().includes(searchTerm.toLowerCase());
    
    const recordDate = new Date(record.purchase_date);
    const matchesDate = (!startDate || recordDate >= startDate) && 
                        (!endDate || recordDate <= endDate);
    
    const matchesEquipment = equipmentFilter === '' || 
      record.equipment_name === equipmentFilter;
    
    const matchesVendor = vendorFilter === '' || 
      record.vendor === vendorFilter;
    
    return matchesSearch && matchesDate && matchesEquipment && matchesVendor;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      
      if (!user || !editingRecord) {
        setError('User not authenticated or invalid record');
        return;
      }
      
      // Calculate new balance and state
      const newRemovedQuantity = parseInt(formData.removed_quantity.toString(), 10);
      const newBalance = editingRecord.quantity - newRemovedQuantity;
      const newState = newBalance > 0 ? 'active' : 'removed';

      const payload = {
        ...editingRecord,
        removed_quantity: newRemovedQuantity,
        balance: newBalance,
        state: newState,
        user: user.id
      };

      const url = `http://localhost:8000/api/em-equipment-register/${editingRecord.id}/`;
      const method = 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(payload),
      });
      
      if (response.ok) {
        fetchRecords();
        resetForm();
        setShowForm(false);
      } else {
        const errorData = await response.json();
        setError(Object.values(errorData).join(', ') || 'Failed to update record');
      }
    } catch (err) {
      setError('Failed to update record');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = (record: any) => {
    setEditingRecord(record);
    setFormData({
      removed_quantity: record.removed_quantity
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      removed_quantity: 0
    });
    setEditingRecord(null);
    setError('');
  };

  const handlePopupClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseInt(value, 10)
    }));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setEquipmentFilter('');
    setVendorFilter('');
    setStartDate(null);
    setEndDate(null);
  };
  
  const exportToExcel = () => {
    try {
      setIsExporting(true);
      
      // Prepare data for export
      const dataForExport = filteredRecords.map(record => {
        return {
          'Equipment Name': record.equipment_name,
          'Purchase Date': formatDisplayDate(record.purchase_date),
          'Equipment For': record.equipment_for || '',
          'Vendor': record.vendor,
          'Warranty Period': record.warranty_period,
          'PO Number': record.po_no || '',
          'Quantity': record.quantity,
          'Cost per Equipment': record.cost_per_equipment,
          'Total Cost': record.total_cost,
          'Removed Quantity': record.removed_quantity,
          'Balance': record.balance,
          'Status': record.state === 'active' ? 'Active' : 'Removed'
        };
      });

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(dataForExport);
      
      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Equipment Register");
      
      // Generate file and download
      XLSX.writeFile(wb, `Equipment_Register_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      setError('Export failed: ' + (err as Error).message);
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
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Equipment Inventory</h1>
              <p className="text-gray-600 mt-1">Manage farm equipment inventory</p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Total Equipment */}
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center space-x-3 border-l-4 border-blue-500">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Equipment</p>
              <p className="text-lg font-bold">{formatIndianNumber(summary.totalEquipment)}</p>
            </div>
          </div>

          {/* Active Equipment */}
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center space-x-3 border-l-4 border-green-500">
            <div className="bg-green-100 p-2 rounded-lg">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Active Equipment</p>
              <p className="text-lg font-bold">{formatIndianNumber(summary.activeEquipment)}</p>
            </div>
          </div>
          
          {/* Removed Equipment */}
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center space-x-3 border-l-4 border-red-500">
            <div className="bg-red-100 p-2 rounded-lg">
              <X className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Removed Equipment</p>
              <p className="text-lg font-bold">{formatIndianNumber(summary.removedEquipment)}</p>
            </div>
          </div>
          
          {/* Total Cost */}
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center space-x-3 border-l-4 border-purple-500">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Box className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Cost</p>
              <p className="text-lg font-bold">₹{formatCurrency(summary.totalCost)}</p>
            </div>
          </div>
          
          {/* Average Cost */}
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center space-x-3 border-l-4 border-yellow-500">
            <div className="bg-yellow-100 p-2 rounded-lg">
              <Box className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Avg Cost/Equipment</p>
              <p className="text-lg font-bold">₹{formatCurrency(summary.averageCost)}</p>
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
                  placeholder="Search equipment..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              
              {/* Purchase Date Range */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Purchase Date</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <DatePicker
                    selected={startDate}
                    onChange={(date) => setStartDate(date)}
                    dateFormat="dd/MM/yyyy"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholderText="From date"
                  />
                  <DatePicker
                    selected={endDate}
                    onChange={(date) => setEndDate(date)}
                    dateFormat="dd/MM/yyyy"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholderText="To date"
                    minDate={startDate || undefined}
                  />
                </div>
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

        {/* Remove Quantity Popup */}
        {showForm && editingRecord && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowForm(false);
              resetForm();
            }}
          >
            <div 
              className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
              onClick={handlePopupClick}
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 lg:p-6 rounded-t-xl">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">
                    Update Equipment Status
                  </h2>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      resetForm();
                    }}
                    className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              <div className="p-4 lg:p-6">
                {error && (
                  <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-xl border border-red-200">
                    {error}
                  </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Equipment</label>
                      <input
                        type="text"
                        value={editingRecord.equipment_name}
                        readOnly
                        className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-xl cursor-not-allowed"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Total Quantity</label>
                        <input
                          type="text"
                          value={editingRecord.quantity}
                          readOnly
                          className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-xl cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Current Removed</label>
                        <input
                          type="text"
                          value={editingRecord.removed_quantity}
                          readOnly
                          className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-xl cursor-not-allowed"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">New Removed Quantity *</label>
                      <input
                        type="number"
                        name="removed_quantity"
                        value={formData.removed_quantity}
                        onChange={handleChange}
                        required
                        min="0"
                        max={editingRecord.quantity}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Must be between 0 and {editingRecord.quantity}
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">New Balance:</p>
                          <p className="text-lg font-medium">
                            {editingRecord.quantity - formData.removed_quantity}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">New Status:</p>
                          <p className={`text-lg font-medium ${
                            (editingRecord.quantity - formData.removed_quantity) > 0 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {(editingRecord.quantity - formData.removed_quantity) > 0 
                              ? 'Active' 
                              : 'Removed'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl flex-1 flex items-center justify-center ${
                        isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Updating...
                        </>
                      ) : (
                        'Update Equipment'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        resetForm();
                      }}
                      className="border border-gray-300 text-gray-700 px-8 py-3 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium flex-1"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

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
              <h2 className="text-xl font-bold text-gray-900">Equipment Inventory</h2>
              <div className="flex items-center space-x-3">
                <div className="text-sm bg-gray-100 px-3 py-1 rounded-full">
                  <span className="text-gray-600">{filteredRecords.length} of {records.length} records</span>
                </div>
                <button 
                  onClick={exportToExcel}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-xl shadow hover:shadow-md transition-all"
                  title="Download Report"
                  disabled={isExporting}
                >
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
          
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading equipment...</p>
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PO No</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipment</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">For</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warranty</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Cost</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Removed</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRecords.map((record) => {
                      const isActive = record.state === 'active';
                      
                      return (
                      <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900">
                              {formatDisplayDate(record.purchase_date)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-900">
                            {record.po_no || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-gray-900">
                              {record.equipment_name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-900">
                            {record.equipment_for || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-900">
                            {record.vendor}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-900">
                            {record.warranty_period}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-900">
                            ₹{formatCurrency(parseFloat(record.cost_per_equipment) || 0)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-gray-900">
                            ₹{formatCurrency(parseFloat(record.total_cost) || 0)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-900">
                            {record.quantity}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-900">
                            {record.removed_quantity}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-gray-900">
                            {record.balance}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {isActive ? 'Active' : 'Removed'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleRemove(record)}
                              className="text-red-600 hover:text-red-800 transition-colors p-2 hover:bg-red-50 rounded-lg"
                              title="Remove Equipment"
                              disabled={isSubmitting}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-4 p-4">
                {filteredRecords.map((record) => {
                  const isActive = record.state === 'active';
                  
                  return (
                  <div 
                    key={record.id} 
                    className="rounded-xl shadow-sm overflow-hidden border border-gray-200"
                  >
                    <div className="p-4 border-b border-blue-100 bg-blue-50">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <Package className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">
                            {record.equipment_name}
                          </span>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {isActive ? 'Active' : 'Removed'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-4 grid grid-cols-1 gap-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Purchase Date</h3>
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 text-gray-500 mr-1" />
                            <span className="text-sm font-medium">
                              {formatDisplayDate(record.purchase_date)}
                            </span>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Vendor</h3>
                          <p className="text-sm font-medium">
                            {record.vendor}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">For</h3>
                          <p className="text-sm font-medium">
                            {record.equipment_for || '-'}
                          </p>
                        </div>
                        <div>
                          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Warranty</h3>
                          <p className="text-sm font-medium">
                            {record.warranty_period}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">PO Number</h3>
                          <span className="text-sm font-medium">
                            {record.po_no || '-'}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Total Cost</h3>
                          <span className="text-sm font-medium">
                            ₹{formatCurrency(parseFloat(record.total_cost) || 0)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 border-t border-gray-100 pt-4">
                        <div>
                          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Qty</h3>
                          <span className="text-sm font-medium">
                            {record.quantity}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Removed</h3>
                          <span className="text-sm font-medium">
                            {record.removed_quantity}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Balance</h3>
                          <span className="text-sm font-medium">
                            {record.balance}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex justify-end">
                      <button
                        onClick={() => handleRemove(record)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Remove Equipment"
                        disabled={isSubmitting}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )})}
              </div>

              {filteredRecords.length === 0 && (
                <div className="text-center py-12">
                  <ClipboardList className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-2">No equipment found</p>
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

export default EMEquipmentRegisterPage;