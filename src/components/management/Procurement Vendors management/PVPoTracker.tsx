import React, { useState, useEffect } from 'react';
import { 
  Calendar, Search, Edit, X, Filter, 
  ChevronDown, ChevronUp, ClipboardList, Download, FileText, Truck,
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import * as XLSX from 'xlsx';
import "react-datepicker/dist/react-datepicker.css";
import { useAuth } from '../../../contexts/AuthContext';

// Helper function to format date as YYYY-MM-DD
const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDisplayDate = (dateString: string) => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Format date for display (DD/MM/YYYY at hh:mm AM/PM)
const formatCreatedAt = (dateString: string) => {
  const date = new Date(dateString);
  const formattedDate = date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const formattedTime = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  return `${formattedDate} at ${formattedTime}`;
};

// Format numbers in Indian currency format (e.g., 1,00,000.00)
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  }).format(amount);
};

interface PVPoTrackerProps {
  query?: string;
}

const PVPoTracker: React.FC<PVPoTrackerProps> = ({ query = '' }) => {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [poNoFilter, setPoNoFilter] = useState('');
  const [vendorFilter, setVendorFilter] = useState('');
  const [itemFilter, setItemFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Item type options
  const itemTypeOptions = [
    { value: 'FEED', label: 'Feed' },
    { value: 'CALF_FEED', label: 'Calf Feed' },
    { value: 'VACCINATION', label: 'Vaccination' },
    { value: 'MEDICINE', label: 'Medicine' },
    { value: 'SPAREPARTS', label: 'Spareparts' },
    { value: 'EQUIPMENT', label: 'Equipment' },
  ];


  const [formData, setFormData] = useState({
    po_no: '',
    date: formatDate(new Date()),
    vendor_name: '',
    item_type: 'FEED',
    item: '',
    quantity: '',
    unit_rate: '',
    expected_delivery_date: formatDate(new Date()),
    remarks: ''
  });

  // Calculate total cost
  const calculateTotalCost = () => {
    const quantity = parseFloat(formData.quantity) || 0;
    const unitRate = parseFloat(formData.unit_rate) || 0;
    return quantity * unitRate;
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
      
      const url = `https://nemmadi-dairy-farm.koyeb.app/api/PVpo-trackers/${query}`;
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

  // Sort records: pending (without vendor) first and in red
  const sortedRecords = [...records].sort((a, b) => {
    // Pending records (without vendor) come first
    if (!a.vendor_name && b.vendor_name) return -1;
    if (a.vendor_name && !b.vendor_name) return 1;
    return 0;
  });

  const filteredRecords = sortedRecords.filter(record => {
    
    const matchesSearch = searchTerm === '' || 
      record.po_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.vendor_name && record.vendor_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      record.item?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.remarks && record.remarks.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const recordDate = new Date(record.date);
    const matchesDate = (!startDate || recordDate >= startDate) && 
                        (!endDate || recordDate <= endDate);
    
    const matchesPoNo = poNoFilter === '' || 
      record.po_no === poNoFilter;
    
    const matchesVendor = vendorFilter === '' || 
      (record.vendor_name && record.vendor_name === vendorFilter);
    
    const matchesItem = itemFilter === '' || 
      record.item === itemFilter;
    
    return matchesSearch && matchesDate && matchesPoNo && matchesVendor && matchesItem;
  });

  // Calculate pending count (records without vendor)
  const pendingCount = filteredRecords.filter(record => !record.vendor_name).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      
      if (!user) {
        setError('User not authenticated');
        return;
      }
      
      const payload = {
        ...formData,
        user: user.id
      };

      const url = `https://nemmadi-dairy-farm.koyeb.app/api/PVpo-trackers/${editingRecord.id}/`;
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
        setError(Object.values(errorData).join(', ') || 'Failed to save record');
      }
    } catch (err) {
      setError('Failed to save record');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (record: any) => {
    setEditingRecord(record);
    setFormData({
      po_no: record.po_no,
      date: record.date,
      vendor_name: record.vendor_name || '',
      item_type: record.item_type || 'FEED',
      item: record.item,
      quantity: record.quantity.toString(),
      unit_rate: record.unit_rate.toString(),
      expected_delivery_date: record.expected_delivery_date,
      remarks: record.remarks || ''
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      po_no: '',
      date: formatDate(new Date()),
      vendor_name: '',
      item_type: 'FEED',
      item: '',
      quantity: '',
      unit_rate: '',
      expected_delivery_date: formatDate(new Date()),
      remarks: ''
    });
    setEditingRecord(null);
    setError('');
  };

  const handlePopupClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Reset item when item type changes
    if (name === 'item_type') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        item: ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setPoNoFilter('');
    setVendorFilter('');
    setItemFilter('');
    setStartDate(null);
    setEndDate(null);
  };
  
  const exportToExcel = () => {
    try {
      setIsExporting(true);
      
      // Prepare data for export
      const dataForExport = filteredRecords.map(record => {
        return {
          'PO Number': record.po_no,
          'Date': formatDisplayDate(record.date),
          'Vendor Name': record.vendor_name || '',
          'Item Type': record.item_type,
          'Item': record.item,
          'Quantity': record.quantity,
          'Unit Rate': record.unit_rate,
          'Total Cost': (record.quantity * record.unit_rate),
          'Expected Delivery': formatDisplayDate(record.expected_delivery_date),
          'Remarks': record.remarks || ''
        };
      });

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(dataForExport);
      
      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "PO Tracker");
      
      // Generate file and download
      XLSX.writeFile(wb, `PO_Tracker_${new Date().toISOString().slice(0, 10)}.xlsx`);
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
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Purchase Order Tracker</h1>
              <p className="text-gray-600 mt-1">Manage purchase orders and track deliveries</p>
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
                  placeholder="Search records..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              
              {/* PO Date Range */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">PO Date</label>
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

        {/* Form Popup */}
        {showForm && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowForm(false);
              resetForm();
            }}
          >
            <div 
              className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
              onClick={handlePopupClick}
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 lg:p-6 rounded-t-xl">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">
                    Edit PO Record
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">PO Number *</label>
                      <input
                        type="text"
                        name="po_no"
                        value={formData.po_no}
                        readOnly
                        className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-xl cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">PO Date *</label>
                      <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Vendor Name *</label>
                      <input
                        type="text"
                        name="vendor_name"
                        value={formData.vendor_name}
                        onChange={handleChange}
                        required
                        placeholder="Vendor/Supplier name"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Item Type *</label>
                      <input
                        type="text"
                        name="item_type"
                        value={formData.item_type}
                        readOnly
                        className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-xl cursor-not-allowed"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Item *</label>
                      <input
                        type="text"
                        name="item"
                        value={formData.item}
                        readOnly
                        className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-xl cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
                      <input
                        type="text"
                        name="quantity"
                        value={formData.quantity}
                        readOnly
                        className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-xl cursor-not-allowed"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Unit Rate *</label>
                      <input
                        type="number"
                        name="unit_rate"
                        value={formData.unit_rate}
                        onChange={handleChange}
                        required
                        min="0.01"
                        step="0.01"
                        placeholder="Cost per unit"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Total Cost</label>
                      <div className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl flex items-center">
                        <span className="font-medium text-gray-900">
                          ₹{formatCurrency(calculateTotalCost())}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Expected Delivery Date *</label>
                      <input
                        type="date"
                        name="expected_delivery_date"
                        value={formData.expected_delivery_date}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
                      <textarea
                        name="remarks"
                        value={formData.remarks}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Additional notes"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                      />
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
                        'Update Record'
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
              <h2 className="text-xl font-bold text-gray-900">Purchase Orders</h2>
              <div className="flex items-center space-x-3">
                <div className="text-sm bg-gray-100 px-3 py-1 rounded-full">
                  <span className="text-gray-600">{filteredRecords.length} of {records.length} records</span>
                  <span className="text-red-600 ml-2">• Pending: {pendingCount}</span>
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PO Number</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Rate</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expected Delivery</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRecords.map((record) => {
                      const totalCost = record.quantity * record.unit_rate;
                      const itemTypeLabel = itemTypeOptions.find(opt => opt.value === record.item_type)?.label || record.item_type;
                      const isPending = !record.vendor_name;
                      
                      return (
                      <tr key={record.id} className={`hover:bg-gray-50 transition-colors ${isPending ? 'bg-red-50' : ''}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <FileText className="w-4 h-4 text-blue-500 mr-2" />
                            <span className={`text-sm font-medium ${isPending ? 'text-red-600' : 'text-gray-900'}`}>
                              {record.po_no}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                            <span className={`text-sm ${isPending ? 'text-red-600' : 'text-gray-900'}`}>
                              {formatDisplayDate(record.date)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-sm ${isPending ? 'text-red-600' : 'text-gray-900'}`}>
                            {record.vendor_name || 'Pending'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-sm ${isPending ? 'text-red-600' : 'text-gray-900'}`}>
                            {itemTypeLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-sm ${isPending ? 'text-red-600' : 'text-gray-900'}`}>
                            {record.item}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-sm ${isPending ? 'text-red-600' : 'text-gray-900'}`}>
                            {record.quantity}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-sm ${isPending ? 'text-red-600' : 'text-gray-900'}`}>
                            ₹{formatCurrency(record.unit_rate)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-sm font-medium ${isPending ? 'text-red-600' : 'text-gray-900'}`}>
                            ₹{formatCurrency(totalCost)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <Truck className="w-4 h-4 text-gray-400 mr-2" />
                            <span className={`text-sm ${isPending ? 'text-red-600' : 'text-gray-900'}`}>
                              {formatDisplayDate(record.expected_delivery_date)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          {record.remarks ? (
                            <div className={`rounded p-2 ${isPending ? 'bg-red-100' : 'bg-gray-50'}`}>
                              <p className={`text-sm break-words ${isPending ? 'text-red-700' : 'text-gray-900'}`}>
                                {record.remarks}
                              </p>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(record)}
                              className="text-blue-600 hover:text-blue-800 transition-colors p-2 hover:bg-blue-50 rounded-lg"
                              title="Edit"
                              disabled={isSubmitting}
                            >
                              <Edit className="w-4 h-4" />
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
                  const totalCost = record.quantity * record.unit_rate;
                  const itemTypeLabel = itemTypeOptions.find(opt => opt.value === record.item_type)?.label || record.item_type;
                  const isPending = !record.vendor_name;
                  
                  return (
                  <div 
                    key={record.id} 
                    className={`rounded-xl shadow-sm overflow-hidden border ${
                      isPending ? 'border-red-200 bg-red-50' : 'border-gray-200'
                    }`}
                  >
                    <div className={`p-4 border-b ${
                      isPending ? 'border-red-100 bg-red-100' : 'border-blue-100 bg-blue-50'
                    }`}>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <FileText className={`w-4 h-4 ${isPending ? 'text-red-600' : 'text-blue-600'}`} />
                          <span className={`text-sm font-medium ${isPending ? 'text-red-800' : 'text-blue-800'}`}>
                            {record.po_no}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 grid grid-cols-1 gap-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Date</h3>
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 text-gray-500 mr-1" />
                            <span className={`text-sm font-medium ${isPending ? 'text-red-600' : ''}`}>
                              {formatDisplayDate(record.date)}
                            </span>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Vendor</h3>
                          <p className={`text-sm font-medium ${isPending ? 'text-red-600' : ''}`}>
                            {record.vendor_name || 'Pending'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Item Type</h3>
                          <p className={`text-sm font-medium ${isPending ? 'text-red-600' : ''}`}>
                            {itemTypeLabel}
                          </p>
                        </div>
                        <div>
                          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Item</h3>
                          <p className={`text-sm font-medium ${isPending ? 'text-red-600' : ''}`}>
                            {record.item}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Quantity</h3>
                          <span className={`text-sm font-medium ${isPending ? 'text-red-600' : ''}`}>
                            {record.quantity}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Unit Rate</h3>
                          <span className={`text-sm font-medium ${isPending ? 'text-red-600' : ''}`}>
                            ₹{formatCurrency(record.unit_rate)}
                          </span>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Total Cost</h3>
                        <span className={`text-sm font-medium ${isPending ? 'text-red-600' : ''}`}>
                          ₹{formatCurrency(totalCost)}
                        </span>
                      </div>
                      
                      <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Expected Delivery</h3>
                        <div className="flex items-center">
                          <Truck className="w-4 h-4 text-gray-500 mr-1" />
                          <span className={`text-sm font-medium ${isPending ? 'text-red-600' : ''}`}>
                            {formatDisplayDate(record.expected_delivery_date)}
                          </span>
                        </div>
                      </div>
                      
                      {record.remarks && (
                        <div className="border-t border-gray-100 pt-4">
                          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Remarks</h3>
                          <div className={`rounded-lg p-3 ${isPending ? 'bg-red-100' : 'bg-gray-50'}`}>
                            <p className={`text-sm break-words ${isPending ? 'text-red-700' : 'text-gray-900'}`}>
                              {record.remarks}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className={`px-4 py-3 border-t ${
                      isPending ? 'border-red-100 bg-red-50' : 'border-gray-100 bg-gray-50'
                    } flex justify-between items-center`}>
                      <div className={`text-xs ${isPending ? 'text-red-600' : 'text-gray-500'}`}>
                        Created: {formatCreatedAt(record.created_at)}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(record)}
                          className={`p-1 ${isPending ? 'text-red-600 hover:text-red-800' : 'text-blue-600 hover:text-blue-800'}`}
                          title="Edit"
                          disabled={isSubmitting}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )})}
              </div>

              {filteredRecords.length === 0 && (
                <div className="text-center py-12">
                  <ClipboardList className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-2">No purchase orders found</p>
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

export default PVPoTracker;