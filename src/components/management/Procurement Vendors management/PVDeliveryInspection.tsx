import React, { useState, useEffect } from 'react';
import { 
  Calendar, Search, X, Filter, Package, Check, XCircle, ClipboardList,
  ChevronDown, ChevronUp, Download, Info, Edit, ChevronRight
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import * as XLSX from 'xlsx';
import "react-datepicker/dist/react-datepicker.css";
import { useAuth } from '../../../contexts/AuthContext';

interface DeliveryInspectionRecord {
  id: number;
  po_no: string;
  date: string;
  vendor: string;
  item_type: string;
  item_delivered: string;
  quantity: number;
  unit_rate: number;
  total_cost: number;
  equipment_for: string | null;
  warranty: string | null;
  expiry_date: string | null;
  quality_remarks: string | null;
  next_order_date: string | null;
  inspected_by: string;
  accepted: 'Pending' | 'Accepted' | 'Rejected';
  quality_issues: string | null;
  action_taken: string | null;
  created_at: string;
}

interface PVDeliveryInspectionProps {
  query?: string;
}

const PVDeliveryInspection: React.FC<PVDeliveryInspectionProps> = ({ query = '' }) => {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DeliveryInspectionRecord | null>(null);
  const [records, setRecords] = useState<DeliveryInspectionRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [expandedRecordId, setExpandedRecordId] = useState<number | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    po_no: '',
    date: new Date().toISOString().split('T')[0],
    vendor: '',
    item_type: '',
    item_delivered: '',
    quantity: 0,
    unit_rate: 0,
    total_cost: 0,
    equipment_for: '',
    warranty: '',
    expiry_date: '',
    quality_remarks: '',
    next_order_date: '',
    inspected_by: user?.username || '',
    accepted: 'Pending' as 'Pending' | 'Accepted' | 'Rejected',
    quality_issues: '',
    action_taken: ''
  });

  // Format Indian currency (e.g., 1,00,000)
  const formatIndianCurrency = (num: number | null | undefined): string => {
    if (num === null || num === undefined) return '₹0.00';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  // Format date for display
  const formatDisplayDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Format date for display with time
  const formatCreatedAt = (dateString: string): string => {
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

  // Fetch records from API
  const fetchRecords = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      if (!user || !user.token) {
        setError('User not authenticated');
        setIsLoading(false);
        return;
      }
      
      const url = `http://localhost:8000/api/PVdelivery-inspections/${query}`;
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

  // Filter records based on search, date, and status filters
  const filteredRecords = records.filter(record => {
    const matchesSearch = searchTerm === '' || 
      record.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.item_delivered.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.po_no.toLowerCase().includes(searchTerm.toLowerCase());
    
    const recordDate = new Date(record.date);
    const matchesDate = (!startDate || recordDate >= startDate) && 
                        (!endDate || recordDate <= endDate);
    
    const matchesStatus = statusFilter === 'All' || 
                         record.accepted === statusFilter;
    
    return matchesSearch && matchesDate && matchesStatus;
  });

  // Calculate pending count
  const pendingCount = records.filter(record => record.accepted === 'Pending').length;

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      
      if (!user) {
        setError('User not authenticated');
        return;
      }
      
      // Prepare payload
      const payload = {
        ...formData,
        quantity: Number(formData.quantity),
        unit_rate: Number(formData.unit_rate),
        total_cost: Number(formData.total_cost),
        equipment_for: formData.equipment_for || null,
        warranty: formData.warranty || null,
        expiry_date: formData.expiry_date || null,
        quality_remarks: formData.quality_remarks || null,
        next_order_date: formData.next_order_date || null,
        quality_issues: formData.quality_issues || null,
        action_taken: formData.action_taken || null
      };

      const url = `http://localhost:8000/api/PVdelivery-inspections/${editingRecord?.id}/`;
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

  // Set form data when editing a record
  const handleEdit = (record: DeliveryInspectionRecord) => {
    setEditingRecord(record);
    setFormData({
      po_no: record.po_no || '',
      date: record.date || '',
      vendor: record.vendor || '',
      item_type: record.item_type || '',
      item_delivered: record.item_delivered || '',
      quantity: record.quantity || 0,
      unit_rate: record.unit_rate || 0,
      total_cost: record.total_cost || 0,
      equipment_for: record.equipment_for || '',
      warranty: record.warranty || '',
      expiry_date: record.expiry_date || '',
      quality_remarks: record.quality_remarks || '',
      next_order_date: record.next_order_date || '',
      inspected_by: record.inspected_by || user?.username || '',
      accepted: record.accepted || 'Pending',
      quality_issues: record.quality_issues || '',
      action_taken: record.action_taken || ''
    });
    setShowForm(true);
  };

  // Reset form to initial state
  const resetForm = () => {
    setFormData({
      po_no: '',
      date: new Date().toISOString().split('T')[0],
      vendor: '',
      item_type: '',
      item_delivered: '',
      quantity: 0,
      unit_rate: 0,
      total_cost: 0,
      equipment_for: '',
      warranty: '',
      expiry_date: '',
      quality_remarks: '',
      next_order_date: '',
      inspected_by: user?.username || '',
      accepted: 'Pending',
      quality_issues: '',
      action_taken: ''
    });
    setEditingRecord(null);
    setError('');
  };

  // Prevent form popup from closing when clicking inside
  const handlePopupClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setStartDate(null);
    setEndDate(null);
    setStatusFilter('All');
  };

  // Export records to Excel
  const exportToExcel = () => {
    try {
      setIsExporting(true);
      
      // Prepare data for export
      const dataForExport = filteredRecords.map(record => ({
        'PO Number': record.po_no || '',
        'PO Date': formatDisplayDate(record.date),
        'Vendor': record.vendor,
        'Item Type': record.item_type,
        'Item Delivered': record.item_delivered,
        'Quantity': record.quantity,
        'Unit Rate': formatIndianCurrency(record.unit_rate).replace('₹', ''),
        'Total Cost': formatIndianCurrency(record.total_cost).replace('₹', ''),
        'Inspected By': record.inspected_by,
        'Status': record.accepted,
        'Quality Issues': record.quality_issues || '',
        'Action Taken': record.action_taken || '',
        // Type-specific fields
        'Equipment For': record.equipment_for || '',
        'Warranty': record.warranty || '',
        'Expiry Date': record.expiry_date ? formatDisplayDate(record.expiry_date) : '',
        'Quality Remarks': record.quality_remarks || '',
        'Next Order Date': record.next_order_date ? formatDisplayDate(record.next_order_date) : ''
      }));

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(dataForExport);
      
      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Delivery Inspections");
      
      // Generate file and download
      XLSX.writeFile(wb, `Delivery_Inspections_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      setError('Export failed: ' + (err as Error).message);
    } finally {
      setIsExporting(false);
    }
  };

  // Toggle expanded view for a record
  const toggleExpandRecord = (id: number) => {
    setExpandedRecordId(expandedRecordId === id ? null : id);
  };

  // Render type-specific details
  const renderTypeSpecificDetails = (record: DeliveryInspectionRecord) => {
    if (record.accepted === 'Rejected') {
      return (
        <div className="p-4 border-t border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Rejection Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-1">Quality Issues</h4>
              <p className="text-gray-900">{record.quality_issues || 'N/A'}</p>
            </div>
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-1">Action Taken</h4>
              <p className="text-gray-900">{record.action_taken || 'N/A'}</p>
            </div>
          </div>
        </div>
      );
    }

    switch (record.item_type) {
      case 'EQUIPMENT':
      case 'SPAREPARTS':
        return (
          <div className="p-4 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Equipment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-1">Equipment For</h4>
                <p className="text-gray-900">{record.equipment_for || 'N/A'}</p>
              </div>
              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-1">Warranty</h4>
                <p className="text-gray-900">{record.warranty || 'N/A'}</p>
              </div>
            </div>
          </div>
        );
      case 'VACCINATION':
      case 'MEDICINE':
        return (
          <div className="p-4 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Medicine Details</h3>
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-1">Expiry Date</h4>
              <p className="text-gray-900">
                {record.expiry_date ? formatDisplayDate(record.expiry_date) : 'N/A'}
              </p>
            </div>
          </div>
        );
      case 'FEED':
      case 'CALF_FEED':
        return (
          <div className="p-4 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Feed Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-1">Quality Remarks</h4>
                <p className="text-gray-900">{record.quality_remarks || 'N/A'}</p>
              </div>
              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-1">Next Order Date</h4>
                <p className="text-gray-900">
                  {record.next_order_date ? formatDisplayDate(record.next_order_date) : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Delivery Inspections</h1>
              <p className="text-gray-600 mt-1">Manage photovoltaic delivery inspections</p>
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
                  placeholder="Search by PO, vendor, or item..."
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
              
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Accepted">Accepted</option>
                  <option value="Rejected">Rejected</option>
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
                    Edit PV Inspection Record
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
                        onChange={handleChange}
                        required
                        readOnly
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">Vendor *</label>
                      <input
                        type="text"
                        name="vendor"
                        value={formData.vendor}
                        readOnly
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Item Type *</label>
                      <input
                        type="text"
                        name="item_type"
                        value={formData.item_type}
                        readOnly
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Item Delivered *</label>
                      <input
                        type="text"
                        name="item_delivered"
                        value={formData.item_delivered}
                        readOnly
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
                      <input
                        type="number"
                        name="quantity"
                        value={formData.quantity}
                        readOnly
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Unit Rate</label>
                      <input
                        type="text"
                        name="unit_rate"
                        value={formatIndianCurrency(formData.unit_rate)}
                        readOnly
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Total Cost</label>
                      <input
                        type="text"
                        name="total_cost"
                        value={formatIndianCurrency(formData.total_cost)}
                        readOnly
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Inspected By *</label>
                      <input
                        type="text"
                        name="inspected_by"
                        value={formData.inspected_by}
                        onChange={handleChange}
                        required
                        placeholder="Inspector name"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                      <div className="grid grid-cols-3 gap-4 mt-2">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="accepted"
                            value="Pending"
                            checked={formData.accepted === 'Pending'}
                            onChange={handleChange}
                            className="h-4 w-4 text-yellow-500 focus:ring-yellow-500"
                          />
                          <span className="ml-2 text-gray-700">Pending</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="accepted"
                            value="Accepted"
                            checked={formData.accepted === 'Accepted'}
                            onChange={handleChange}
                            className="h-4 w-4 text-green-600 focus:ring-green-500"
                          />
                          <span className="ml-2 text-gray-700">Accepted</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="accepted"
                            value="Rejected"
                            checked={formData.accepted === 'Rejected'}
                            onChange={handleChange}
                            className="h-4 w-4 text-red-600 focus:ring-red-500"
                          />
                          <span className="ml-2 text-gray-700">Rejected</span>
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  {/* Conditional Fields */}
                  {formData.accepted === 'Accepted' && (
                    <>
                      {/* Equipment/Spareparts Fields */}
                      {(formData.item_type === 'EQUIPMENT' || formData.item_type === 'SPAREPARTS') && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Equipment For *</label>
                            <input
                              type="text"
                              name="equipment_for"
                              value={formData.equipment_for}
                              onChange={handleChange}
                              required
                              placeholder="Who/what is this equipment for?"
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Warranty *</label>
                            <input
                              type="text"
                              name="warranty"
                              value={formData.warranty}
                              onChange={handleChange}
                              required
                              placeholder="Warranty period"
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                          </div>
                        </div>
                      )}
                      
                      {/* Vaccination/Medicine Fields */}
                      {(formData.item_type === 'VACCINATION' || formData.item_type === 'MEDICINE') && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date *</label>
                          <input
                            type="date"
                            name="expiry_date"
                            value={formData.expiry_date}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          />
                        </div>
                      )}
                      
                      {/* Feed Fields */}
                      {(formData.item_type === 'FEED' || formData.item_type === 'CALF_FEED') && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Quality Remarks *</label>
                            <textarea
                              name="quality_remarks"
                              value={formData.quality_remarks}
                              onChange={handleChange}
                              required
                              rows={3}
                              placeholder="Quality observations about the feed"
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Next Order Date *</label>
                            <input
                              type="date"
                              name="next_order_date"
                              value={formData.next_order_date}
                              onChange={handleChange}
                              required
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  
                  {formData.accepted === 'Rejected' && (
                    <div className="grid grid-cols-1 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Quality Issues *</label>
                        <textarea
                          name="quality_issues"
                          value={formData.quality_issues}
                          onChange={handleChange}
                          required
                          rows={3}
                          placeholder="Describe quality issues found"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Action Taken *</label>
                        <textarea
                          name="action_taken"
                          value={formData.action_taken}
                          onChange={handleChange}
                          required
                          rows={3}
                          placeholder="Describe actions taken regarding quality issues"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                        />
                      </div>
                    </div>
                  )}
                  
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
              <h2 className="text-xl font-bold text-gray-900">PV Delivery Inspections</h2>
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
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PO No.</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inspected By</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRecords.map((record) => (
                      <React.Fragment key={record.id}>
                        <tr className={`hover:bg-gray-50 transition-colors ${
                          record.accepted === 'Pending' ? 'bg-red-50' : ''
                        }`}>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            <button
                              onClick={() => toggleExpandRecord(record.id)}
                              className="text-blue-600 hover:text-blue-800 p-1 rounded-lg transition-colors"
                              title={expandedRecordId === record.id ? "Hide details" : "Show details"}
                            >
                              {expandedRecordId === record.id ? (
                                <ChevronUp className="w-5 h-5" />
                              ) : (
                                <ChevronRight className="w-5 h-5" />
                              )}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-sm font-medium ${record.accepted === 'Pending' ? 'text-red-600' : 'text-gray-900'}`}>
                              {record.po_no || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 text-gray-500 mr-2" />
                              <span className={`text-sm ${record.accepted === 'Pending' ? 'text-red-600' : 'text-gray-900'}`}>
                                {formatDisplayDate(record.date)}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-sm ${record.accepted === 'Pending' ? 'text-red-600' : 'text-gray-900'}`}>
                              {record.vendor}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-sm capitalize ${record.accepted === 'Pending' ? 'text-red-600' : 'text-gray-900'}`}>
                              {record.item_type.toLowerCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              <Package className={`w-4 h-4 mr-2 ${record.accepted === 'Pending' ? 'text-red-500' : 'text-blue-500'}`} />
                              <span className={`text-sm ${record.accepted === 'Pending' ? 'text-red-600' : 'text-gray-900'}`}>
                                {record.item_delivered}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-sm ${record.accepted === 'Pending' ? 'text-red-600' : 'text-gray-900'}`}>
                              {record.quantity}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-sm font-medium ${record.accepted === 'Pending' ? 'text-red-600' : 'text-gray-900'}`}>
                              {formatIndianCurrency(record.total_cost)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-sm ${record.accepted === 'Pending' ? 'text-red-600' : 'text-gray-900'}`}>
                              {record.inspected_by}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center w-fit ${
                              record.accepted === 'Pending' 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : record.accepted === 'Accepted'
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                            }`}>
                              {record.accepted === 'Pending' ? (
                                <>
                                  <Info className="w-4 h-4 mr-1" />
                                  Pending
                                </>
                              ) : record.accepted === 'Accepted' ? (
                                <>
                                  <Check className="w-4 h-4 mr-1" />
                                  Accepted
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Rejected
                                </>
                              )}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex space-x-2">
                              {/* EDIT BUTTON ONLY SHOWN FOR PENDING RECORDS */}
                              {record.accepted === 'Pending' && (
                                <button
                                  onClick={() => handleEdit(record)}
                                  className="text-blue-600 hover:text-blue-800 transition-colors p-2 hover:bg-blue-50 rounded-lg"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        
                        {/* Detail Row */}
                        {expandedRecordId === record.id && (
                          <tr className="bg-gray-50">
                            <td colSpan={11} className="px-4 py-3">
                              {renderTypeSpecificDetails(record)}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-4 p-4">
                {filteredRecords.map((record) => (
                  <div 
                    key={record.id} 
                    className={`bg-white rounded-xl shadow-sm overflow-hidden border ${
                      record.accepted === 'Pending' 
                        ? 'border-red-200 bg-red-50' 
                        : record.accepted === 'Accepted'
                          ? 'border-green-200 bg-green-50'
                          : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className={`p-4 border-b ${
                      record.accepted === 'Pending' 
                        ? 'border-red-100 bg-red-100' 
                        : record.accepted === 'Accepted'
                          ? 'border-green-100 bg-green-100'
                          : 'border-red-100 bg-red-100'
                    } flex justify-between items-center`}>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">
                          {formatDisplayDate(record.date)}
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        {/* EDIT BUTTON ONLY SHOWN FOR PENDING RECORDS */}
                        {record.accepted === 'Pending' && (
                          <button
                            onClick={() => handleEdit(record)}
                            className="text-blue-600 hover:text-blue-800 transition-colors p-1"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-4 grid grid-cols-1 gap-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">PO Number</h3>
                          <p className={`text-sm font-medium ${record.accepted === 'Pending' ? 'text-red-600' : ''}`}>
                            {record.po_no || '-'}
                          </p>
                        </div>
                        <div>
                          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Vendor</h3>
                          <p className={`text-sm font-medium ${record.accepted === 'Pending' ? 'text-red-600' : ''}`}>
                            {record.vendor}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Item</h3>
                          <div className="flex items-center">
                            <Package className={`w-4 h-4 mr-1 ${record.accepted === 'Pending' ? 'text-red-500' : 'text-blue-500'}`} />
                            <span className={`text-sm font-medium ${record.accepted === 'Pending' ? 'text-red-600' : ''}`}>
                              {record.item_delivered}
                            </span>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Type</h3>
                          <p className={`text-sm font-medium capitalize ${record.accepted === 'Pending' ? 'text-red-600' : ''}`}>
                            {record.item_type.toLowerCase()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Quantity</h3>
                          <span className={`text-sm font-medium ${record.accepted === 'Pending' ? 'text-red-600' : ''}`}>
                            {record.quantity}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Unit Rate</h3>
                          <span className={`text-sm font-medium ${record.accepted === 'Pending' ? 'text-red-600' : ''}`}>
                            {formatIndianCurrency(record.unit_rate)}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Total Cost</h3>
                          <span className={`text-sm font-medium ${record.accepted === 'Pending' ? 'text-red-600' : ''}`}>
                            {formatIndianCurrency(record.total_cost)}
                          </span>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Inspected By</h3>
                        <span className={`text-sm font-medium ${record.accepted === 'Pending' ? 'text-red-600' : ''}`}>
                          {record.inspected_by}
                        </span>
                      </div>
                      
                      <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Status</h3>
                        <div className="flex items-center">
                          <span className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center ${
                            record.accepted === 'Pending' 
                              ? 'bg-yellow-100 text-yellow-700' 
                              : record.accepted === 'Accepted'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                          }`}>
                            {record.accepted === 'Pending' ? (
                              <>
                                <Info className="w-4 h-4 mr-1" />
                                Pending
                              </>
                            ) : record.accepted === 'Accepted' ? (
                              <>
                                <Check className="w-4 h-4 mr-1" />
                                Accepted
                              </>
                            ) : (
                              <>
                                <XCircle className="w-4 h-4 mr-1" />
                                Rejected
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                      
                      {/* Expand Button */}
                      <button
                        onClick={() => toggleExpandRecord(record.id)}
                        className="w-full flex justify-between items-center text-blue-600 font-medium py-3"
                      >
                        <span>{expandedRecordId === record.id ? "Hide Details" : "Show Details"}</span>
                        {expandedRecordId === record.id ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                      
                      {/* Expanded Details */}
                      {expandedRecordId === record.id && renderTypeSpecificDetails(record)}
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
                  <p className="text-gray-500 text-lg mb-2">No inspection records found</p>
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

export default PVDeliveryInspection;