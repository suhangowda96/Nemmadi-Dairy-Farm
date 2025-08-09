import React, { useState, useEffect } from 'react';
import { 
  Plus, Calendar, Search, Edit, X, Filter, 
  ChevronDown, ChevronUp, ClipboardList, Download, 
  Trash2, Check, XCircle, Package, Scale,
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { useAuth } from '../../../contexts/AuthContext';

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

interface FWAQualityInspectionProps {
  query?: string;
}

const FWAQualityInspection: React.FC<FWAQualityInspectionProps> = ({ query = '' }) => {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editingInspection, setEditingInspection] = useState<any>(null);
  const [inspections, setInspections] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const isSupervisor = user?.role === 'supervisor';
  const isAdmin = user?.role === 'admin';
  const showAddButton = user?.role === 'supervisor' && !query;

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    feed_type: '',
    appearance: '',
    smell: '',
    moisture_level: '',
    contamination: '',
    fit_for_use: 'Y',
    unfit_quantity_kg: '',
    action_taken: ''
  });

  const fetchInspections = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      if (!user || !user.token) {
        setError('User not authenticated');
        setIsLoading(false);
        return;
      }
      
      const url = `https://nemmadi-dairy-farm.koyeb.app/api/fwa-quality-inspections/${query}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setInspections(data);
      } else if (response.status === 401) {
        setError('Authentication failed. Please login again.');
      } else {
        setError('Failed to fetch inspections');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchInspections();
    }
  }, [user]);

  const filteredInspections = inspections.filter(inspection => {
    const matchesSearch = searchTerm === '' || 
      inspection.feed_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inspection.appearance?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inspection.smell?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inspection.contamination?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inspection.action_taken?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const inspectionDate = new Date(inspection.date);
    const matchesDate = (!startDate || inspectionDate >= startDate) && 
                        (!endDate || inspectionDate <= endDate);
    
    return matchesSearch && matchesDate;
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
        unfit_quantity_kg: formData.fit_for_use === 'N' && formData.unfit_quantity_kg 
          ? parseFloat(formData.unfit_quantity_kg) 
          : null,
        user: user.id
      };

      const url = editingInspection 
        ? `https://nemmadi-dairy-farm.koyeb.app/api/fwa-quality-inspections/${editingInspection.id}/`
        : 'https://nemmadi-dairy-farm.koyeb.app/api/fwa-quality-inspections/';
      
      const method = editingInspection ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(payload),
      });
      
      if (response.ok) {
        fetchInspections();
        resetForm();
        setShowForm(false);
      } else {
        const errorData = await response.json();
        setError(Object.values(errorData).join(', ') || 'Failed to save inspection');
      }
    } catch (err) {
      setError('Failed to save inspection');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (inspection: any) => {
    setEditingInspection(inspection);
    setFormData({
      date: inspection.date,
      feed_type: inspection.feed_type,
      appearance: inspection.appearance,
      smell: inspection.smell,
      moisture_level: inspection.moisture_level,
      contamination: inspection.contamination || '',
      fit_for_use: inspection.fit_for_use,
      unfit_quantity_kg: inspection.unfit_quantity_kg || '',
      action_taken: inspection.action_taken
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      feed_type: '',
      appearance: '',
      smell: '',
      moisture_level: '',
      contamination: '',
      fit_for_use: 'Y',
      unfit_quantity_kg: '',
      action_taken: ''
    });
    setEditingInspection(null);
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
        
      let url = 'https://nemmadi-dairy-farm.koyeb.app/api/fwa-quality-inspections/export/';
      const params = new URLSearchParams();
      
      if (isAdmin) {
        params.append('all_supervisors', 'true');
      } else {
        params.append('supervisorId', user.id.toString());
      }
      
      if (startDate) params.append('start_date', startDate.toISOString().split('T')[0]);
      if (endDate) params.append('end_date', endDate.toISOString().split('T')[0]);
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
        a.download = `fwa_Quality_inspections_${new Date().toISOString().slice(0, 10)}.xlsx`;
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

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this inspection record? This action cannot be undone.')) {
      try {
        setDeletingId(id);
        
        if (!user || !user.token) {
          setError('User not authenticated');
          setDeletingId(null);
          return;
        }
        
        const response = await fetch(`https://nemmadi-dairy-farm.koyeb.app/api/fwa-quality-inspections/${id}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });
        
        if (response.ok) {
          setInspections(prev => prev.filter(item => item.id !== id));
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
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Quality Inspections</h1>
            </div>
            {showAddButton && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl flex items-center justify-center space-x-2 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">Add Inspection</span>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search Field */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search inspections..."
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
                    {editingInspection ? 'Edit Inspection' : 'Add Inspection'}
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
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Feed Type *</label>
                        <select
                          name="feed_type"
                          value={formData.feed_type}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                        >
                          <option value="" disabled>Select feed type</option>
                          <option value="Green Fodder">Green Fodder</option>
                          <option value="Dry Fodder">Dry Fodder</option>
                          <option value="Silage">Silage</option>
                          <option value="Concentrate">Concentrate</option>
                          <option value="Minerals">Minerals</option>
                        </select>
                      </div>
                    </div>

                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Appearance *</label>
                      <textarea
                        name="appearance"
                        value={formData.appearance}
                        onChange={handleChange}
                        required
                        rows={3}
                        placeholder="Describe visual appearance"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Smell *</label>
                      <textarea
                        name="smell"
                        value={formData.smell}
                        onChange={handleChange}
                        required
                        rows={3}
                        placeholder="Describe odor characteristics"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Moisture Level *</label>
                      <input
                        type="text"
                        name="moisture_level"
                        value={formData.moisture_level}
                        onChange={handleChange}
                        required
                        placeholder="e.g., Moderate, High"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Contamination</label>
                      <textarea
                        name="contamination"
                        value={formData.contamination}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Any foreign materials observed"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Fit for Use *</label>
                      <div className="flex space-x-6 mt-2">
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="fit_for_use"
                            value="Y"
                            checked={formData.fit_for_use === 'Y'}
                            onChange={handleChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <span className="ml-2 text-gray-700 flex items-center">
                            <Check className="w-4 h-4 text-blue-600 mr-1" /> Yes
                          </span>
                        </label>
                        
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="fit_for_use"
                            value="N"
                            checked={formData.fit_for_use === 'N'}
                            onChange={handleChange}
                            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                          />
                          <span className="ml-2 text-gray-700 flex items-center">
                            <XCircle className="w-4 h-4 text-red-600 mr-1" /> No
                          </span>
                        </label>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Action Taken *</label>
                      <textarea
                        name="action_taken"
                        value={formData.action_taken}
                        onChange={handleChange}
                        required
                        rows={3}
                        placeholder="Actions taken based on findings"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                      />
                    </div>
                  </div>
                  
                  {/* Unfit Quantity Field - Conditionally Rendered */}
                  {formData.fit_for_use === 'N' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Unfit Quantity (kg) *
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            name="unfit_quantity_kg"
                            value={formData.unfit_quantity_kg}
                            onChange={handleChange}
                            required
                            min="0"
                            step="0.01"
                            placeholder="Enter quantity in kg"
                            className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          />
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Scale className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>
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
                          {editingInspection ? 'Updating...' : 'Adding...'}
                        </>
                      ) : editingInspection ? (
                        'Update Inspection'
                      ) : (
                        'Add Inspection'
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

        {/* Inspections Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 lg:p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <h2 className="text-xl font-bold text-gray-900">Quality Inspections</h2>
              <div className="flex items-center space-x-3">
                <p className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                  {filteredInspections.length} of {inspections.length} records
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
              <p className="text-gray-600">Loading inspections...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">
              <p className="mb-4">{error}</p>
              <button 
                onClick={fetchInspections}
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feed Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Appearance</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Smell</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Moisture</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contamination</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fit for Use</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unfit Qty (kg)</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action Taken</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredInspections.map((inspection) => (
                      <tr key={inspection.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-900">
                              {formatDate(inspection.date)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <Package className="w-4 h-4 text-amber-500 mr-2" />
                            <span className="text-sm text-gray-900">{inspection.feed_type}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          <p className="text-sm text-gray-900 truncate max-w-xs">
                            {inspection.appearance}
                          </p>
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          <p className="text-sm text-gray-900 truncate max-w-xs">
                            {inspection.smell}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-900">{inspection.moisture_level}</span>
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          {inspection.contamination ? (
                            <p className="text-sm text-gray-900 truncate max-w-xs">
                              {inspection.contamination}
                            </p>
                          ) : (
                            <span className="text-gray-400 italic">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            inspection.fit_for_use === 'Y' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {inspection.fit_for_use === 'Y' ? (
                              <>
                                <Check className="w-4 h-4 mr-1" /> Yes
                              </>
                            ) : (
                              <>
                                <XCircle className="w-4 h-4 mr-1" /> No
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {inspection.fit_for_use === 'N' && inspection.unfit_quantity_kg ? (
                            <div className="flex items-center">
                              <Scale className="w-4 h-4 text-gray-400 mr-2" />
                              <span className="text-sm text-gray-900">
                                {parseFloat(inspection.unfit_quantity_kg).toFixed(2)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          <p className="text-sm text-gray-900 truncate max-w-xs">
                            {inspection.action_taken}
                          </p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {isSupervisor && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(inspection)}
                              className="text-blue-600 hover:text-blue-800 transition-colors p-2 hover:bg-blue-50 rounded-lg"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(inspection.id)}
                              className="text-red-600 hover:text-red-800 transition-colors p-2 hover:bg-red-50 rounded-lg relative"
                              title="Delete"
                              disabled={deletingId === inspection.id}
                            >
                              {deletingId === inspection.id ? (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                </div>
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

              {/* Mobile Cards - Recent First */}
              <div className="lg:hidden space-y-4 p-4">
                {filteredInspections.map((inspection) => (
                  <div 
                    key={inspection.id} 
                    className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200"
                  >
                    <div className="p-4 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">
                          {formatDate(inspection.date)}
                        </span>
                      </div>
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        inspection.fit_for_use === 'Y' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {inspection.fit_for_use === 'Y' ? 'Fit' : 'Not Fit'}
                      </div>
                    </div>
                    
                    <div className="p-4 border-b border-gray-100">
                      <div className="flex items-center mb-3">
                        <Package className="w-5 h-5 text-amber-500 mr-2" />
                        <h3 className="text-sm font-semibold text-gray-900">
                          {inspection.feed_type}
                        </h3>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Moisture</h4>
                          <p className="text-sm text-gray-900">{inspection.moisture_level}</p>
                        </div>
                        
                        <div>
                          <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Contamination</h4>
                          <p className="text-sm text-gray-900">
                            {inspection.contamination || 'None'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Unfit Quantity Display - Mobile */}
                    {inspection.fit_for_use === 'N' && inspection.unfit_quantity_kg && (
                      <div className="p-4 border-b border-gray-100">
                        <div className="flex items-center">
                          <Scale className="w-5 h-5 text-gray-500 mr-2" />
                          <div>
                            <h4 className="text-xs font-medium text-gray-500 uppercase">Unfit Quantity</h4>
                            <p className="text-sm text-gray-900">
                              {parseFloat(inspection.unfit_quantity_kg).toFixed(2)} kg
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="p-4 border-b border-gray-100">
                      <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Appearance</h4>
                      <p className="text-sm text-gray-900">
                        {inspection.appearance}
                      </p>
                    </div>
                    
                    <div className="p-4 border-b border-gray-100">
                      <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Smell</h4>
                      <p className="text-sm text-gray-900">
                        {inspection.smell}
                      </p>
                    </div>
                    
                    <div className="p-4">
                      <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Action Taken</h4>
                      <p className="text-sm text-gray-900">
                        {inspection.action_taken}
                      </p>
                    </div>
                    
                    {isSupervisor && (
                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex justify-end space-x-3">
                      <button
                        onClick={() => handleEdit(inspection)}
                        className="text-blue-600 hover:text-blue-800 transition-colors p-1"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(inspection.id)}
                        className="text-red-600 hover:text-red-800 transition-colors p-1"
                        disabled={deletingId === inspection.id}
                      >
                        {deletingId === inspection.id ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                        ) : (
                          <Trash2 className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    )}
                  </div>
                ))}
              </div>

              {filteredInspections.length === 0 && (
                <div className="text-center py-12">
                  <ClipboardList className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-2">No inspections found</p>
                  <p className="text-gray-400 text-sm mb-4">Try adjusting your filters or add a new inspection</p>
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

export default FWAQualityInspection;