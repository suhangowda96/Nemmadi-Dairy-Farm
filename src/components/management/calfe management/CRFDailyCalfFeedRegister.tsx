import React, { useState, useEffect,useRef } from 'react';
import { 
  Plus, Calendar, Search, Edit, X, Filter, 
  ChevronDown, ChevronUp, ClipboardList, Download, 
  Trash2, Clock, User, List, Activity, ClipboardCheck
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

interface DailyCalfFeedProps {
  query?: string;
}

interface DailyCalfFeed {
  id: number;
  date: string;
  calf_id: string;
  activity: string;
  description: string | null;
  feed_type: string;
  quantity_grams: number;
  frequency: string;
  time_of_day: string;
  responsible_person: string;
  record_log: string | null;
  created_at: string;
  updated_at: string;
}

const CRFDailyCalfFeedRegister: React.FC<DailyCalfFeedProps> = ({ query = '' }) => {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DailyCalfFeed | null>(null);
  const [records, setRecords] = useState<DailyCalfFeed[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [feedTypeFilter, setFeedTypeFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const isSupervisor = user?.role === 'supervisor';
  const isAdmin = user?.role === 'admin';
  const showAddButton = user?.role === 'supervisor' && !query;
  const [calfOptions, setCalfOptions] = useState<string[]>([]);
  const [showCalfDropdown, setShowCalfDropdown] = useState(false);
  const [calfSearchTerm, setCalfSearchTerm] = useState('');
  const calfDropdownRef = useRef<HTMLDivElement>(null);
  
    // Inside the useEffect that fetches calves
  useEffect(() => {
    const fetchCalves = async () => {
      if (!user || !user.token) return;
      
      try {
        // Changed from ?active=true to ?is_active=true
        const response = await fetch(
          'http://localhost:8000/api/breeding-calving-records/?is_active=true', 
          {
            headers: { 'Authorization': `Bearer ${user.token}` }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          const activeCalves = data.map((record: any) => record.calf_id);
          setCalfOptions(activeCalves);
        }
      } catch (err) {
        console.error('Failed to fetch calves', err);
      }
    };
    
    fetchCalves();
  }, [user]);
  
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (calfDropdownRef.current && 
            !calfDropdownRef.current.contains(event.target as Node)) {
          setShowCalfDropdown(false);
        }
      };
  
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
  
    // Filter calf options
    const filteredCalfOptions = calfOptions.filter(id => 
      id.toLowerCase().includes(calfSearchTerm.toLowerCase())
    );

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    calf_id: '',
    activity: '',
    description: '',
    feed_type: '',
    quantity_grams: '',
    frequency: '',
    time_of_day: '08:00',
    responsible_person: '',
    record_log: ''
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
      
      const url = `http://localhost:8000/api/calf-feed-register/${query}`;
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
      record.calf_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.activity?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.responsible_person?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const recordDate = new Date(record.date);
    const matchesDate = (!startDate || recordDate >= startDate) && 
                        (!endDate || recordDate <= endDate);
    
    const matchesFeedType = !feedTypeFilter || record.feed_type === feedTypeFilter;
    
    return matchesSearch && matchesDate && matchesFeedType;
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
        quantity_grams: parseInt(formData.quantity_grams),
        user: user.id
      };

      const url = editingRecord 
        ? `http://localhost:8000/api/calf-feed-register/${editingRecord.id}/`
        : 'http://localhost:8000/api/calf-feed-register/';
      
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

  const handleEdit = (record: DailyCalfFeed) => {
    setEditingRecord(record);
    setFormData({
      date: record.date,
      calf_id: record.calf_id,
      activity: record.activity,
      description: record.description || '',
      feed_type: record.feed_type,
      quantity_grams: record.quantity_grams.toString(),
      frequency: record.frequency,
      time_of_day: record.time_of_day,
      responsible_person: record.responsible_person,
      record_log: record.record_log || ''
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      calf_id: '',
      activity: '',
      description: '',
      feed_type: '',
      quantity_grams: '',
      frequency: '',
      time_of_day: '08:00',
      responsible_person: '',
      record_log: ''
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
    setStartDate(null);
    setEndDate(null);
    setFeedTypeFilter('');
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
        
        // Helper function to format dates as YYYY-MM-DD
        const formatDateForAPI = (date: Date) => {
        return date.toISOString().split('T')[0];
        };
        
        let url = 'http://localhost:8000/api/calf-feed-register/export/';
        const params = new URLSearchParams();
        
        // Add supervisor parameters
        if (isAdmin) {
        params.append('all_supervisors', 'true');
        } else {
        params.append('supervisorId', user.id.toString());
        }
        
        // ADD DATE FILTERS TO EXPORT REQUEST
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
        // Include dates in filename
        const fileName = `Calf_Feed_Register_${
            startDate ? formatDateForAPI(startDate) : 'all-start'
        }_to_${
            endDate ? formatDateForAPI(endDate) : 'all-end'
        }.xlsx`;
        a.download = fileName;
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
    if (window.confirm('Are you sure you want to delete this record? This action cannot be undone.')) {
      try {
        setDeletingId(id);
        
        if (!user || !user.token) {
          setError('User not authenticated');
          setDeletingId(null);
          return;
        }
        
        const response = await fetch(`http://localhost:8000/api/calf-feed-register/${id}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });
        
        if (response.ok) {
          setRecords(prev => prev.filter(item => item.id !== id));
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
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Daily Calf Feed Register</h1>
            </div>
            {showAddButton && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl flex items-center justify-center space-x-2 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">Add Record</span>
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
                  placeholder="Search records..."
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
              
              {/* Feed Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Feed Type</label>
                <select
                  value={feedTypeFilter}
                  onChange={(e) => setFeedTypeFilter(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                >
                  <option value="">All Feed Types</option>
                  <option value="Milk Replacer">Milk Replacer</option>
                  <option value="Calf Starter">Calf Starter</option>
                  <option value="Grower Ration">Grower Ration</option>
                  <option value="Heifer">Heifer</option>
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
                    {editingRecord ? 'Edit Record' : 'Add Record'}
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
                    
                    {/* Inside the form */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Calf ID *
                        </label>
                        <div className="relative" ref={calfDropdownRef}>
                          <div 
                            className="flex items-center border border-gray-300 rounded-xl cursor-pointer"
                            onClick={() => setShowCalfDropdown(!showCalfDropdown)}
                          >
                            <input
                              type="text"
                              readOnly
                              value={formData.calf_id}
                              placeholder="Select a calf..."
                              className="w-full px-4 py-3 bg-transparent cursor-pointer focus:outline-none"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                              {showCalfDropdown ? (
                                <ChevronUp className="w-5 h-5 text-gray-400" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                          </div>
                          
                          {showCalfDropdown && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                              <div className="sticky top-0 bg-white p-2 border-b border-gray-200">
                                <div className="relative">
                                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                  <input
                                    type="text"
                                    placeholder="Search calf..."
                                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={calfSearchTerm}
                                    onChange={(e) => setCalfSearchTerm(e.target.value)}
                                    autoFocus
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                              </div>
                              
                              <div className="py-1">
                                {filteredCalfOptions.length > 0 ? (
                                  filteredCalfOptions.map((calfId) => (
                                    <div
                                      key={calfId}
                                      className="px-4 py-2 hover:bg-blue-50 cursor-pointer flex items-center"
                                      onClick={() => {
                                        setFormData(prev => ({ ...prev, calf_id: calfId }));
                                        setShowCalfDropdown(false);
                                        setCalfSearchTerm('');
                                      }}
                                    >
                                      <span className="truncate">{calfId}</span>
                                    </div>
                                  ))
                                ) : (
                                  <div className="px-4 py-2 text-gray-500 text-center">
                                    No active calves found
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
  
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Activity *</label>
                      <input
                        type="text"
                        name="activity"
                        value={formData.activity}
                        onChange={handleChange}
                        required
                        placeholder="Enter activity"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    
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
                        <option value="Milk Replacer">Milk Replacer</option>
                        <option value="Calf Starter">Calf Starter</option>
                        <option value="Grower Ration">Grower Ration</option>
                        <option value="Heifer">Heifer</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Quantity (g) *</label>
                      <div className="relative">
                        <input
                          type="number"
                          name="quantity_grams"
                          value={formData.quantity_grams}
                          onChange={handleChange}
                          min="1"
                          required
                          placeholder="Enter quantity in grams"
                          className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <ClipboardCheck className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Frequency *</label>
                      <select
                        name="frequency"
                        value={formData.frequency}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                      >
                        <option value="" disabled>Select frequency</option>
                        <option value="Twice daily">Twice daily</option>
                        <option value="Daily">Daily</option>
                        <option value="One‐time assessment">One‐time assessment</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Time of Day *</label>
                      <input
                        type="time"
                        name="time_of_day"
                        value={formData.time_of_day}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Responsible Person *</label>
                      <input
                        type="text"
                        name="responsible_person"
                        value={formData.responsible_person}
                        onChange={handleChange}
                        required
                        placeholder="Enter name"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={2}
                      placeholder="Activity description"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Record/Log</label>
                    <textarea
                      name="record_log"
                      value={formData.record_log}
                      onChange={handleChange}
                      rows={2}
                      placeholder="Record notes"
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
                        'Update Record'
                      ) : (
                        'Add Record'
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
              <h2 className="text-xl font-bold text-gray-900">Daily Calf Feed Records</h2>
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Calf ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feed Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity (g)</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Responsible</th>
                      {/* Added Description and Record Log columns */}
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Record/Log</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-900">
                              {formatDate(record.date)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-900 font-medium">{record.calf_id}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <Activity className="w-4 h-4 text-blue-500 mr-2" />
                            <span className="text-sm text-gray-900">{record.activity}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <List className="w-4 h-4 text-green-500 mr-2" />
                            <span className="text-sm text-gray-900">{record.feed_type}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-gray-900">
                            {record.quantity_grams.toLocaleString('en-IN')} g
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-900">{record.frequency}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900">
                              {record.time_of_day.slice(0, 5)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <User className="w-4 h-4 text-purple-500 mr-2" />
                            <span className="text-sm text-gray-900">{record.responsible_person}</span>
                          </div>
                        </td>
                        {/* Added Description and Record Log cells */}
                        <td className="px-4 py-3 max-w-xs">
                          <div className="text-sm text-gray-900 truncate" title={record.description || ''}>
                            {record.description}
                          </div>
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          <div className="text-sm text-gray-900 truncate" title={record.record_log || ''}>
                            {record.record_log}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {isSupervisor && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(record)}
                              className="text-blue-600 hover:text-blue-800 transition-colors p-2 hover:bg-blue-50 rounded-lg"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(record.id)}
                              className="text-red-600 hover:text-red-800 transition-colors p-2 hover:bg-red-50 rounded-lg relative"
                              title="Delete"
                              disabled={deletingId === record.id}
                            >
                              {deletingId === record.id ? (
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
                {filteredRecords.map((record) => (
                  <div 
                    key={record.id} 
                    className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200"
                  >
                    <div className="p-4 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">
                          {formatDate(record.date)}
                        </span>
                      </div>
                      <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                        {record.feed_type}
                      </div>
                    </div>
                    
                    <div className="p-4 border-b border-gray-100 grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Calf ID</h4>
                        <p className="text-sm font-medium text-gray-900">{record.calf_id}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Quantity</h4>
                        <p className="text-sm text-gray-900">
                          {record.quantity_grams.toLocaleString('en-IN')} g
                        </p>
                      </div>
                    </div>
                    
                    <div className="p-4 border-b border-gray-100">
                      <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Activity</h4>
                      <p className="text-sm text-gray-900">{record.activity}</p>
                    </div>
                    
                    <div className="p-4 border-b border-gray-100 grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Frequency</h4>
                        <p className="text-sm text-gray-900">{record.frequency}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Time</h4>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 text-gray-500 mr-2" />
                          <p className="text-sm text-gray-900">
                            {record.time_of_day.slice(0, 5)}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 border-b border-gray-100">
                      <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Responsible Person</h4>
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-500 mr-2" />
                        <p className="text-sm text-gray-900">
                          {record.responsible_person}
                        </p>
                      </div>
                    </div>
                    
                    {record.description && (
                      <div className="p-4 border-b border-gray-100">
                        <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Description</h4>
                        <p className="text-sm text-gray-900">
                          {record.description}
                        </p>
                      </div>
                    )}
                    
                    {record.record_log && (
                      <div className="p-4 border-b border-gray-100">
                        <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Record/Log</h4>
                        <p className="text-sm text-gray-900">
                          {record.record_log}
                        </p>
                      </div>
                    )}
                    
                    {isSupervisor && (
                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex justify-end space-x-3">
                      <button
                        onClick={() => handleEdit(record)}
                        className="text-blue-600 hover:text-blue-800 transition-colors p-1"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(record.id)}
                        className="text-red-600 hover:text-red-800 transition-colors p-1"
                        disabled={deletingId === record.id}
                      >
                        {deletingId === record.id ? (
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

              {filteredRecords.length === 0 && (
                <div className="text-center py-12">
                  <ClipboardList className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-2">No records found</p>
                  <p className="text-gray-400 text-sm mb-4">Try adjusting your filters or add a new record</p>
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

export default CRFDailyCalfFeedRegister;