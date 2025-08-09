import React, { useState, useEffect } from 'react';
import { 
  Plus, Calendar, Search, Edit, X, Trash2, ClipboardList, Download
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import * as XLSX from 'xlsx';
import "react-datepicker/dist/react-datepicker.css";
import { useAuth } from '../../../contexts/AuthContext';

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

interface PVPurchaseApprovalProps {
  query?: string;
}

// Fixed feed and calf feed options from Django model
const FEED_OPTIONS = [
  'Green Fodder',
  'Dry Fodder',
  'Silage',
  'Concentrate',
  'Minerals'
];

const CALF_FEED_OPTIONS = [
  'Milk Replacer',
  'Calf Starter',
  'Grower Ration',
  'Heifer'
];

const PVPurchaseApprovals: React.FC<PVPurchaseApprovalProps> = ({ query = '' }) => {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [showFilters, ] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [itemTypeFilter, setItemTypeFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const showAddButton = user?.role === 'supervisor' && !query;

  const [formData, setFormData] = useState({
    date: formatDate(new Date()),
    item_type: '',
    item_requested: '',
    quantity: '',
    requester_remarks: ''
  });

  // Item type options
  const itemTypeOptions = [
    { value: 'FEED', label: 'Feed' },
    { value: 'CALF_FEED', label: 'Calf Feed' },
    { value: 'VACCINATION', label: 'Vaccination' },
    { value: 'MEDICINE', label: 'Medicine' },
    { value: 'SPAREPARTS', label: 'Spareparts' },
    { value: 'EQUIPMENT', label: 'Equipment' }
  ];

  // Fetch records
  const fetchRecords = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      if (!user || !user.token) {
        setError('User not authenticated');
        setIsLoading(false);
        return;
      }
      
      const url = `https://nemmadi-dairy-farm.koyeb.app/api/PVpurchase-approvals/${query}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRecords(data);
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
      record.item_requested.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.requested_by.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.requester_remarks?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.approver_remarks?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const recordDate = new Date(record.date);
    const matchesDate = (!startDate || recordDate >= startDate) && 
                        (!endDate || recordDate <= endDate);
    
    const matchesStatus = statusFilter === '' || 
      record.approval_status === statusFilter;
    
    const matchesItemType = itemTypeFilter === '' || 
      record.item_type === itemTypeFilter;
    
    return matchesSearch && matchesDate && matchesStatus && matchesItemType;
  });

  const handleItemTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      item_type: value,
      item_requested: '' // Reset item requested when type changes
    }));
  };

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
        user: user.id,
        requested_by: user.username
      };

      const url = editingRecord 
        ? `https://nemmadi-dairy-farm.koyeb.app/api/PVpurchase-approvals/${editingRecord.id}/`
        : 'https://nemmadi-dairy-farm.koyeb.app/api/PVpurchase-approvals/';
      
      const method = editingRecord ? 'PUT' : 'POST';
      
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
      date: record.date,
      item_type: record.item_type,
      item_requested: record.item_requested,
      quantity: record.quantity.toString(),
      requester_remarks: record.requester_remarks || ''
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      date: formatDate(new Date()),
      item_type: '',
      item_requested: '',
      quantity: '',
      requester_remarks: ''
    });
    setEditingRecord(null);
    setError('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setItemTypeFilter('');
    setStartDate(null);
    setEndDate(null);
  };
  
  const exportToExcel = () => {
    try {
      setIsExporting(true);
      
      const dataForExport = filteredRecords.map(record => {
        return {
          'Date': formatDisplayDate(record.date),
          'Item Type': record.item_type,
          'Item Requested': record.item_requested,
          'Quantity': record.quantity,
          'Requested By': record.requested_by,
          'Approved By': record.approved_by || '',
          'Status': record.approval_status === 'P' ? 'Pending' : 
                   record.approval_status === 'A' ? 'Approved' : 'Rejected',
          'Requester Remarks': record.requester_remarks || '',
          'Approver Remarks': record.approver_remarks || ''
        };
      });

      const ws = XLSX.utils.json_to_sheet(dataForExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "PV Purchase Approvals");
      XLSX.writeFile(wb, `PV_Purchase_Approvals_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      setError('Export failed: ' + (err as Error).message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this request?')) {
      try {
        setDeletingId(id);
        
        const response = await fetch(`https://nemmadi-dairy-farm.koyeb.app/api/PVpurchase-approvals/${id}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${user?.token}`
          }
        });
        
        if (response.ok) {
          setRecords(prev => prev.filter(record => record.id !== id));
        } else {
          setError('Failed to delete record');
        }
      } catch (err) {
        setError('Network error while deleting');
      } finally {
        setDeletingId(null);
      }
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'P': return { text: 'Pending', className: 'bg-yellow-100 text-yellow-800' };
      case 'A': return { text: 'Approved', className: 'bg-green-100 text-green-800' };
      case 'R': return { text: 'Rejected', className: 'bg-red-100 text-red-800' };
      default: return { text: status, className: 'bg-gray-100 text-gray-800' };
    }
  };

  const renderItemRequestedField = () => {
    if (formData.item_type === 'FEED') {
      return (
        <select
          name="item_requested"
          value={formData.item_requested}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        >
          <option value="">Select feed type</option>
          {FEED_OPTIONS.map((option, index) => (
            <option key={index} value={option}>{option}</option>
          ))}
        </select>
      );
    } else if (formData.item_type === 'CALF_FEED') {
      return (
        <select
          name="item_requested"
          value={formData.item_requested}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        >
          <option value="">Select calf feed type</option>
          {CALF_FEED_OPTIONS.map((option, index) => (
            <option key={index} value={option}>{option}</option>
          ))}
        </select>
      );
    } else {
      return (
        <input
          type="text"
          name="item_requested"
          value={formData.item_requested}
          onChange={handleChange}
          required
          placeholder="Enter item name"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Purchase Requests</h1>
              <p className="text-gray-600 mt-1">Manage your purchase requests</p>
            </div>
            {showAddButton && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl flex items-center justify-center space-x-2 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Plus className="w-5 h-5" />
                <span className="font-medium">New Request</span>
              </button>
            )}
          </div>
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
                  placeholder="Search requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                  <option value="">All Status</option>
                  <option value="P">Pending</option>
                  <option value="A">Approved</option>
                  <option value="R">Rejected</option>
                </select>
              </div>
              
              {/* Item Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Item Type</label>
                <select
                  value={itemTypeFilter}
                  onChange={(e) => setItemTypeFilter(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">All Types</option>
                  {itemTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
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
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 lg:p-6 rounded-t-xl">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">
                    {editingRecord ? 'Edit Request' : 'New Purchase Request'}
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
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Item Type *</label>
                      <select
                        name="item_type"
                        value={formData.item_type}
                        onChange={handleItemTypeChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="">Select item type</option>
                        {itemTypeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Item Requested *</label>
                    {renderItemRequestedField()}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
                      <input
                        type="number"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleChange}
                        required
                        min="1"
                        placeholder="Number of items"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Requested By *
                      </label>
                      <input
                        type="text"
                        name="requested_by"
                        value={user?.username || ''}
                        disabled
                        className="w-full px-4 py-3 bg-gray-100 rounded-xl text-gray-700"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Requester Remarks</label>
                    <textarea
                      name="requester_remarks"
                      value={formData.requester_remarks}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Additional notes"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    />
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
                          {editingRecord ? 'Updating...' : 'Submitting...'}
                        </>
                      ) : editingRecord ? (
                        'Update Request'
                      ) : (
                        'Submit Request'
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

        {/* Records Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 lg:p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <h2 className="text-xl font-bold text-gray-900">My Purchase Requests</h2>
              <div className="flex items-center space-x-3">
                <p className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                  {filteredRecords.length} of {records.length} requests
                </p>
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
              <p className="text-gray-600">Loading requests...</p>
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approved By</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requester Remarks</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approver Remarks</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRecords.map((record) => {
                      const statusInfo = getStatusInfo(record.approval_status);
                      return (
                        <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                              <span className="text-sm text-gray-900">
                                {formatDisplayDate(record.date)}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-900">{record.item_type}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-900">{record.item_requested}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-900">{record.quantity}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-3 py-1 rounded-full text-xs ${statusInfo.className}`}>
                              {statusInfo.text}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-900">{record.approved_by || '-'}</span>
                          </td>
                          <td className="px-4 py-3 max-w-xs">
                            {record.requester_remarks ? (
                              <p className="text-sm text-gray-900 break-words">
                                {record.requester_remarks}
                              </p>
                            ) : (
                              <span className="text-gray-400 italic">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 max-w-xs">
                            {record.approver_remarks ? (
                              <p className="text-sm text-gray-900 break-words">
                                {record.approver_remarks}
                              </p>
                            ) : (
                              <span className="text-gray-400 italic">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {showAddButton && record.approval_status === 'P' && (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEdit(record)}
                                  className="text-blue-600 hover:text-blue-800 transition-colors p-2 hover:bg-blue-50 rounded-lg"
                                  title="Edit"
                                  disabled={isSubmitting || deletingId === record.id}
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(record.id)}
                                  className="text-red-600 hover:text-red-800 transition-colors p-2 hover:bg-red-50 rounded-lg"
                                  title="Delete"
                                  disabled={deletingId === record.id}
                                >
                                  {deletingId === record.id ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            )}
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
                  const statusInfo = getStatusInfo(record.approval_status);
                  return (
                    <div 
                      key={record.id} 
                      className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200"
                    >
                      <div className="p-4 border-b border-gray-200">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-medium text-gray-900">{record.item_requested}</h3>
                            <p className="text-sm text-gray-500">{record.item_type}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs ${statusInfo.className}`}>
                            {statusInfo.text}
                          </span>
                        </div>
                      </div>
                      
                      <div className="p-4 grid gap-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-500">Date</p>
                            <p className="text-sm font-medium">{formatDisplayDate(record.date)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Quantity</p>
                            <p className="text-sm font-medium">{record.quantity}</p>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-xs text-gray-500">Approved By</p>
                          <p className="text-sm font-medium">{record.approved_by || '-'}</p>
                        </div>
                        
                        {record.requester_remarks && (
                          <div>
                            <p className="text-xs text-gray-500">Requester Remarks</p>
                            <p className="text-sm">{record.requester_remarks}</p>
                          </div>
                        )}
                        
                        {record.approver_remarks && (
                          <div>
                            <p className="text-xs text-gray-500">Approver Remarks</p>
                            <p className="text-sm">{record.approver_remarks}</p>
                          </div>
                        )}
                      </div>
                      
                      {record.approval_status === 'P' && showAddButton && (
                        <div className="p-4 border-t border-gray-200 flex space-x-2">
                          <button
                            onClick={() => handleEdit(record)}
                            disabled={isSubmitting || deletingId === record.id}
                            className="flex-1 border border-blue-500 text-blue-600 py-2 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(record.id)}
                            disabled={deletingId === record.id}
                            className="flex-1 border border-red-500 text-red-600 py-2 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center"
                          >
                            {deletingId === record.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-1"></div>
                            ) : (
                              <Trash2 className="w-4 h-4 mr-1" />
                            )}
                            Delete
                          </button>
                        </div>
                      )}
                      
                      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
                        Created: {formatCreatedAt(record.created_at)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredRecords.length === 0 && (
                <div className="text-center py-12">
                  <ClipboardList className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-2">No purchase requests found</p>
                  <p className="text-gray-400 text-sm mb-4">Try adjusting your filters or create a new request</p>
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

export default PVPurchaseApprovals;