import React, { useState, useEffect } from 'react';
import { 
  Plus, Calendar, Search, Edit, X, Filter, Trash2,
  ChevronDown, ChevronUp, ClipboardList, Star,
  User, Phone, Mail, CreditCard, Download
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

// Render star rating
const renderRating = (rating: number) => {
  return (
    <div className="flex items-center">
      {[...Array(5)].map((_, i) => (
        <Star 
          key={i} 
          className={`w-4 h-4 ${i < rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} 
        />
      ))}
    </div>
  );
};

interface PVVendorMasterProps {
  query?: string;
}

const PVVendorMaster: React.FC<PVVendorMasterProps> = ({ query = '' }) => {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [vendorFilter, setVendorFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const isAdmin = user?.role === 'admin';
  const showAddButton = user?.role === 'supervisor' && !query;

  const [formData, setFormData] = useState({
    date: formatDate(new Date()),
    vendor_name: '',
    product_supplied: '',
    contact_person: '',
    phone: '',
    email: '',
    credit_terms: '',
    rating: '3',
    remarks: ''
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
      
      const url = `https://nemmadi-dairy-farm.koyeb.app/api/PVvendor-masters/${query}`;
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
      record.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.product_supplied.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.remarks?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const recordDate = new Date(record.date);
    const matchesDate = (!startDate || recordDate >= startDate) && 
                        (!endDate || recordDate <= endDate);
    
    const matchesVendor = vendorFilter === '' || 
      record.vendor_name === vendorFilter;
    
    const matchesProduct = productFilter === '' || 
      record.product_supplied === productFilter;
    
    const matchesRating = ratingFilter === '' || 
      record.rating.toString() === ratingFilter;
    
    return matchesSearch && matchesDate && matchesVendor && matchesProduct && matchesRating;
  });

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

      const url = editingRecord 
        ? `https://nemmadi-dairy-farm.koyeb.app/api/PVvendor-masters/${editingRecord.id}/`
        : 'https://nemmadi-dairy-farm.koyeb.app/api/PVvendor-masters/';
      
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
      vendor_name: record.vendor_name,
      product_supplied: record.product_supplied,
      contact_person: record.contact_person,
      phone: record.phone,
      email: record.email,
      credit_terms: record.credit_terms,
      rating: record.rating.toString(),
      remarks: record.remarks || ''
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      date: formatDate(new Date()),
      vendor_name: '',
      product_supplied: '',
      contact_person: '',
      phone: '',
      email: '',
      credit_terms: '',
      rating: '3',
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
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setVendorFilter('');
    setProductFilter('');
    setRatingFilter('');
    setStartDate(null);
    setEndDate(null);
  };
  
  const exportToExcel = () => {
    try {
      setIsExporting(true);
      
      // Prepare data for export
      const dataForExport = filteredRecords.map(record => ({
        'Date': formatDisplayDate(record.date),
        'Vendor Name': record.vendor_name,
        'Product Supplied': record.product_supplied,
        'Contact Person': record.contact_person,
        'Phone': record.phone,
        'Email': record.email,
        'Credit Terms': record.credit_terms,
        'Rating': record.rating,
        'Remarks': record.remarks || ''
      }));

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(dataForExport);
      
      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Vendors");
      
      // Generate file and download
      XLSX.writeFile(wb, `Vendor_Master_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      setError('Export failed: ' + (err as Error).message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this vendor record? This action cannot be undone.')) {
      try {
        setDeletingId(id);
        
        if (!user || !user.token) {
          setError('User not authenticated');
          setDeletingId(null);
          return;
        }
        
        const response = await fetch(`https://nemmadi-dairy-farm.koyeb.app/api/PVvendor-masters/${id}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });
        
        if (response.ok) {
          setRecords(prevRecords => prevRecords.filter(record => record.id !== id));
        } else if (response.status === 404) {
          setError('Record not found');
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

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">PV Vendor Master</h1>
              <p className="text-gray-600 mt-1">Manage photovoltaic equipment vendors</p>
            </div>
            {showAddButton && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl flex items-center justify-center space-x-2 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Plus className="w-5 h-5" />
                <span className="font-medium">Add Vendor</span>
              </button>
            )}
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
                  placeholder="Search vendors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              
              {/* Rating Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                <select
                  value={ratingFilter}
                  onChange={(e) => setRatingFilter(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">All Ratings</option>
                  <option value="1">1 Star</option>
                  <option value="2">2 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="5">5 Stars</option>
                </select>
              </div>
              
              {/* Date Range */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Record Date</label>
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
                    {editingRecord ? 'Edit Vendor Record' : 'Add New Vendor'}
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">Vendor Name *</label>
                      <input
                        type="text"
                        name="vendor_name"
                        value={formData.vendor_name}
                        onChange={handleChange}
                        required
                        placeholder="e.g., SolarTech Inc."
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Product Supplied *</label>
                      <input
                        type="text"
                        name="product_supplied"
                        value={formData.product_supplied}
                        onChange={handleChange}
                        required
                        placeholder="e.g., Solar Panels, Inverters"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Contact Person *</label>
                      <input
                        type="text"
                        name="contact_person"
                        value={formData.contact_person}
                        onChange={handleChange}
                        required
                        placeholder="Full name"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        placeholder="Phone number"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="contact@example.com"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Credit Terms *</label>
                      <input
                        type="text"
                        name="credit_terms"
                        value={formData.credit_terms}
                        onChange={handleChange}
                        required
                        placeholder="e.g., Net 30, COD"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Record Date *</label>
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">Rating *</label>
                      <div className="flex items-center space-x-2">
                        <select
                          name="rating"
                          value={formData.rating}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                          <option value="1">1 Star</option>
                          <option value="2">2 Stars</option>
                          <option value="3">3 Stars</option>
                          <option value="4">4 Stars</option>
                          <option value="5">5 Stars</option>
                        </select>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-5 h-5 ${i < parseInt(formData.rating) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} 
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
                    <textarea
                      name="remarks"
                      value={formData.remarks}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Additional notes about the vendor"
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
                          {editingRecord ? 'Updating...' : 'Adding...'}
                        </>
                      ) : editingRecord ? (
                        'Update Vendor'
                      ) : (
                        'Add Vendor'
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
              <h2 className="text-xl font-bold text-gray-900">Vendor Records</h2>
              <div className="flex items-center space-x-3">
                <p className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                  {filteredRecords.length} of {records.length} records
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
              <p className="text-gray-600">Loading vendors...</p>
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credit Terms</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <User className="w-4 h-4 text-blue-500 mr-2" />
                            <span className="text-sm text-gray-900">{record.vendor_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-900">{record.product_supplied}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-900">{record.contact_person}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <Phone className="w-4 h-4 text-gray-500 mr-2" />
                            <span className="text-sm text-gray-900">{record.phone}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <Mail className="w-4 h-4 text-gray-500 mr-2" />
                            <span className="text-sm text-gray-900">{record.email}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <CreditCard className="w-4 h-4 text-gray-500 mr-2" />
                            <span className="text-sm text-gray-900">{record.credit_terms}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {renderRating(parseInt(record.rating))}
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          {record.remarks ? (
                            <div className="bg-gray-50 rounded p-2">
                              <p className="text-sm text-gray-900 break-words">
                                {record.remarks}
                              </p>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {!isAdmin && (
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
                    <div className="p-4 bg-blue-50 border-b border-blue-100">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">
                            {record.vendor_name}
                          </span>
                        </div>
                        {!isAdmin && (
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
                      </div>
                    </div>
                    
                    <div className="p-4 grid grid-cols-1 gap-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Product</h3>
                          <p className="text-sm font-medium">{record.product_supplied}</p>
                        </div>
                        <div>
                          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Date</h3>
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 text-gray-500 mr-1" />
                            <span className="text-sm font-medium">
                              {formatDisplayDate(record.date)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Contact</h3>
                          <p className="text-sm font-medium">{record.contact_person}</p>
                        </div>
                        <div>
                          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Phone</h3>
                          <div className="flex items-center">
                            <Phone className="w-4 h-4 text-gray-500 mr-1" />
                            <span className="text-sm font-medium">{record.phone}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Email</h3>
                        <div className="flex items-center">
                          <Mail className="w-4 h-4 text-gray-500 mr-1" />
                          <span className="text-sm font-medium">{record.email}</span>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Credit Terms</h3>
                        <div className="flex items-center">
                          <CreditCard className="w-4 h-4 text-gray-500 mr-1" />
                          <span className="text-sm font-medium">{record.credit_terms}</span>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Rating</h3>
                        <div className="flex items-center">
                          {renderRating(parseInt(record.rating))}
                        </div>
                      </div>
                      
                      {record.remarks && (
                        <div className="border-t border-gray-100 pt-4">
                          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Remarks</h3>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-sm text-gray-900 break-words">
                              {record.remarks}
                            </p>
                          </div>
                        </div>
                      )}
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
                  <p className="text-gray-500 text-lg mb-2">No vendor records found</p>
                  <p className="text-gray-400 text-sm mb-4">Try adjusting your filters or add a new vendor</p>
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

export default PVVendorMaster;