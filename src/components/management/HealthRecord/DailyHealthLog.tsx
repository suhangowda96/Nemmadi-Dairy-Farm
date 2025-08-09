import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Calendar, Search, Edit, X, Filter, 
  ChevronDown, ChevronUp, ClipboardList, Download, Trash2,
  Stethoscope, CheckSquare, AlertCircle, Thermometer, Eye, Utensils, Flag,
  ChevronRight, ChevronUpSquare
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { useAuth } from '../../../contexts/AuthContext';

interface AnimalHealthRecord {
  id: number;
  date: string;
  animal_id: string;
  symptoms_observed: string;
  feed_intake: boolean;
  temperature: number | null;
  behavior: string;
  action_taken: string;
  is_red_flag: boolean;
  recovery_started: string | null;
  vet_name: string | null;
  fully_recovered_on: string | null;
  still_under_treatment: string | null;
  remarks: string;
  created_at: string;
  user?: {
    username: string;
  };
}

interface DailyHealthLogProps {
  query?: string;
}

const DailyHealthLog: React.FC<DailyHealthLogProps> = ({ query = '' }) => {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AnimalHealthRecord | null>(null);
  const [records, setRecords] = useState<AnimalHealthRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const isAdmin = user?.role === 'admin';
  const showAddButton = !isAdmin; 
  const [animalOptions, setAnimalOptions] = useState<string[]>([]);
  const [showAnimalDropdown, setShowAnimalDropdown] = useState(false);
  const [animalSearchTerm, setAnimalSearchTerm] = useState('');
  const animalDropdownRef = useRef<HTMLDivElement>(null);
  const [expandedRecordId, setExpandedRecordId] = useState<number | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    animal_id: '',
    symptoms_observed: '',
    feed_intake: true,
    temperature: '',
    behavior: '',
    action_taken: '',
    is_red_flag: false,
    recovery_started: '',
    vet_name: '',
    fully_recovered_on: '',
    still_under_treatment: 'Y',
    remarks: ''
  });

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

  const fetchRecords = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      if (!user || !user.token) {
        setError('User not authenticated');
        setIsLoading(false);
        return;
      }
      
      const url = `https://nemmadi-dairy-farm.koyeb.app/api/daily-health-logs/${query}`;
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

  useEffect(() => {
    const fetchAnimals = async () => {
      if (!user || !user.token) return;
      
      try {
        const response = await fetch('https://nemmadi-dairy-farm.koyeb.app/api/animals/', {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          const activeAnimals = data.filter((animal: any) => animal.is_active);
          // Extract animal IDs as strings
          const animalIds = activeAnimals.map((animal: any) => animal.animal_id.toString());
          setAnimalOptions(animalIds); // Store only IDs
        }
      } catch (err) {
        console.error('Failed to fetch animals', err);
      }
    };
    
    fetchAnimals();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (animalDropdownRef.current && !animalDropdownRef.current.contains(event.target as Node)) {
        setShowAnimalDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter animal options based on search term
  const filteredAnimalOptions = animalOptions.filter(id => 
    id.toLowerCase().includes(animalSearchTerm.toLowerCase())
  );

  const filteredRecords = records.filter(record => {
    const matchesSearch = searchTerm === '' || 
      record.animal_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.symptoms_observed?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.remarks?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const recordDate = new Date(record.date);
    const matchesDate = (!startDate || recordDate >= startDate) && 
                        (!endDate || recordDate <= endDate);
    
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
      
      // Validate fully recovered date
      if (formData.still_under_treatment === 'N' && !formData.fully_recovered_on) {
        setError('Fully recovered date is required when treatment is completed');
        setIsSubmitting(false);
        return;
      }
      
      const payload = {
        ...formData,
        temperature: formData.temperature ? parseFloat(formData.temperature) : null,
        user: user.id,
        recovery_started: formData.recovery_started || null,
        vet_name: formData.vet_name || null,
        fully_recovered_on: formData.fully_recovered_on || null,
        still_under_treatment: formData.still_under_treatment || null
      };

      const url = editingRecord 
        ? `https://nemmadi-dairy-farm.koyeb.app/api/daily-health-logs/${editingRecord.id}/`
        : 'https://nemmadi-dairy-farm.koyeb.app/api/daily-health-logs/';
      
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

  const handleEdit = (record: AnimalHealthRecord) => {
    setEditingRecord(record);
    setFormData({
      date: record.date.split('T')[0],
      animal_id: record.animal_id,
      symptoms_observed: record.symptoms_observed,
      feed_intake: record.feed_intake,
      temperature: record.temperature ? record.temperature.toString() : '',
      behavior: record.behavior,
      action_taken: record.action_taken,
      is_red_flag: record.is_red_flag,
      recovery_started: record.recovery_started || '',
      vet_name: record.vet_name || '',
      fully_recovered_on: record.fully_recovered_on || '',
      still_under_treatment: record.still_under_treatment || 'Y',
      remarks: record.remarks || ''
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      animal_id: '',
      symptoms_observed: '',
      feed_intake: true,
      temperature: '',
      behavior: '',
      action_taken: '',
      is_red_flag: false,
      recovery_started: '',
      vet_name: '',
      fully_recovered_on: '',
      still_under_treatment: 'Y',
      remarks: ''
    });
    setEditingRecord(null);
    setError('');
  };

  const handlePopupClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
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

      let url = 'https://nemmadi-dairy-farm.koyeb.app/api/daily-health-logs/export/';
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
        a.download = `daily_health_logs_${new Date().toISOString().slice(0, 10)}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to export data');
      }
    } catch (err) {
      setError('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this health log? This action cannot be undone.')) {
      try {
        setDeletingId(id);
        
        if (!user || !user.token) {
          setError('User not authenticated');
          setDeletingId(null);
          return;
        }
        
        const response = await fetch(`https://nemmadi-dairy-farm.koyeb.app/api/daily-health-logs/${id}/`, {
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

  const toggleExpandRecord = (id: number) => {
    setExpandedRecordId(expandedRecordId === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Daily Animal Health Log</h1>
              <p className="text-gray-600 mt-1">Track daily observations and health status of animals</p>
            </div>
             {showAddButton && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl flex items-center justify-center space-x-2 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">Add Log</span>
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
                  placeholder="Search by animal ID, symptoms, or remarks..."
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
                    {editingRecord ? 'Edit Health Log' : 'Add Daily Health Log'}
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Animal ID *
                </label>
                <div className="relative" ref={animalDropdownRef}>
                  <div 
                    className="flex items-center border border-gray-300 rounded-xl cursor-pointer"
                    onClick={() => setShowAnimalDropdown(!showAnimalDropdown)}
                  >
                    <input
                      type="text"
                      readOnly
                      value={formData.animal_id}
                      placeholder="Select an animal..."
                      className="w-full px-4 py-3 bg-transparent cursor-pointer focus:outline-none"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      {showAnimalDropdown ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                  
                  {showAnimalDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {/* Search input at top */}
                      <div className="sticky top-0 bg-white p-2 border-b border-gray-200">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search animal..."
                            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={animalSearchTerm}
                            onChange={(e) => setAnimalSearchTerm(e.target.value)}
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                      
                      {/* Animal options list */}
                      <div className="py-1">
                        {filteredAnimalOptions.length > 0 ? (
                          filteredAnimalOptions.map((animalId) => (
                            <div
                              key={animalId}
                              className="px-4 py-2 hover:bg-blue-50 cursor-pointer flex items-center"
                              onClick={() => {
                                setFormData(prev => ({ ...prev, animal_id: animalId }));
                                setShowAnimalDropdown(false);
                                setAnimalSearchTerm('');
                              }}
                            >
                              <span className="truncate">{animalId}</span>
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-2 text-gray-500 text-center">
                            No animals found
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">Symptoms Observed *</label>
                      <textarea
                        name="symptoms_observed"
                        value={formData.symptoms_observed}
                        onChange={handleChange}
                        required
                        rows={3}
                        placeholder="Describe any symptoms observed..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Behavior *</label>
                      <textarea
                        name="behavior"
                        value={formData.behavior}
                        onChange={handleChange}
                        required
                        rows={3}
                        placeholder="Describe the animal's behavior..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Feed Intake *</label>
                      <div className="mt-1">
                        <label className="inline-flex items-center mr-6">
                          <input
                            type="radio"
                            name="feed_intake"
                            checked={formData.feed_intake}
                            onChange={() => setFormData(prev => ({ ...prev, feed_intake: true }))}
                            className="form-radio h-4 w-4 text-blue-600"
                          />
                          <span className="ml-2 text-gray-700">Yes</span>
                        </label>
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="feed_intake"
                            checked={!formData.feed_intake}
                            onChange={() => setFormData(prev => ({ ...prev, feed_intake: false }))}
                            className="form-radio h-4 w-4 text-blue-600"
                          />
                          <span className="ml-2 text-gray-700">No</span>
                        </label>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Temperature (°F)</label>
                      <input
                        type="number"
                        name="temperature"
                        value={formData.temperature}
                        onChange={handleChange}
                        min="0"
                        max="120"
                        step="0.1"
                        placeholder="e.g., 101.5"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Action Taken *</label>
                      <input
                        type="text"
                        name="action_taken"
                        value={formData.action_taken}
                        onChange={handleChange}
                        required
                        placeholder="e.g., Administered medication"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                  
                  {/* Red Flag Section */}
                  <div className="border-t border-gray-200 pt-6">
                    <div className="flex items-center mb-4">
                      <Flag className="w-5 h-5 text-red-500 mr-2" />
                      <h3 className="text-lg font-semibold text-gray-900">Red Flag Case</h3>
                    </div>
                    
                    <div className="flex items-center mb-4">
                      <input
                        type="checkbox"
                        id="is_red_flag"
                        name="is_red_flag"
                        checked={formData.is_red_flag}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          is_red_flag: e.target.checked
                        }))}
                        className="h-4 w-4 text-red-600 rounded focus:ring-red-500"
                      />
                      <label htmlFor="is_red_flag" className="ml-2 text-sm font-medium text-gray-700">
                        Mark as Red Flag Case
                      </label>
                    </div>
                    
                    {formData.is_red_flag && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Recovery Started Date
                          </label>
                          <input
                            type="date"
                            name="recovery_started"
                            value={formData.recovery_started}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Veterinarian Name
                          </label>
                          <input
                            type="text"
                            name="vet_name"
                            value={formData.vet_name}
                            onChange={handleChange}
                            placeholder="Dr. John Smith"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Still Under Treatment? *
                          </label>
                          <div className="mt-1">
                            <label className="inline-flex items-center mr-6">
                              <input
                                type="radio"
                                name="still_under_treatment"
                                value="Y"
                                checked={formData.still_under_treatment === 'Y'}
                                onChange={handleChange}
                                className="form-radio h-4 w-4 text-blue-600"
                              />
                              <span className="ml-2 text-gray-700">Yes</span>
                            </label>
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name="still_under_treatment"
                                value="N"
                                checked={formData.still_under_treatment === 'N'}
                                onChange={handleChange}
                                className="form-radio h-4 w-4 text-blue-600"
                              />
                              <span className="ml-2 text-gray-700">No</span>
                            </label>
                          </div>
                        </div>
                        
                        {formData.still_under_treatment === 'N' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Fully Recovered On *
                            </label>
                            <input
                              type="date"
                              name="fully_recovered_on"
                              value={formData.fully_recovered_on}
                              onChange={handleChange}
                              required={formData.still_under_treatment === 'N'}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
                    <textarea
                      name="remarks"
                      value={formData.remarks}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Additional notes about the animal's health..."
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
                        'Update Log'
                      ) : (
                        'Add Log'
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
              <h2 className="text-xl font-bold text-gray-900">Health Logs</h2>
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
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Flag</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Animal ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symptoms</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feed</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Temp (°F)</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Behavior</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action Taken</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRecords.map((record) => (
                      <React.Fragment key={record.id}>
                        <tr className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            {record.is_red_flag && (
                              <button
                                onClick={() => toggleExpandRecord(record.id)}
                                className="text-blue-600 hover:text-blue-800 p-1 rounded-lg transition-colors"
                                title={expandedRecordId === record.id ? "Hide details" : "Show details"}
                              >
                                {expandedRecordId === record.id ? (
                                  <ChevronUpSquare className="w-5 h-5" />
                                ) : (
                                  <ChevronRight className="w-5 h-5" />
                                )}
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            {record.is_red_flag ? (
                              <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-full">
                                <Flag className="w-4 h-4 text-red-600" />
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                              <span className="text-sm font-medium text-gray-900">
                                {new Date(record.date).toLocaleDateString('en-GB')}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              <span className="text-sm text-gray-900 font-medium">{record.animal_id}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 max-w-xs">
                            <div className="flex items-center">
                              <AlertCircle className="w-4 h-4 text-yellow-500 mr-2 flex-shrink-0" />
                              <span className="text-sm text-gray-900 line-clamp-2">
                                {record.symptoms_observed}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              {record.feed_intake ? (
                                <CheckSquare className="w-4 h-4 text-green-500 mr-2" />
                              ) : (
                                <X className="w-4 h-4 text-red-500 mr-2" />
                              )}
                              <span className="text-sm text-gray-900">
                                {record.feed_intake ? 'Yes' : 'No'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              <Thermometer className="w-4 h-4 text-red-500 mr-2" />
                              <span className="text-sm text-gray-900">
                                {record.temperature || '-'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 max-w-xs">
                            <div className="flex items-center">
                              <Eye className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0" />
                              <span className="text-sm text-gray-900 line-clamp-2">
                                {record.behavior}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 max-w-xs">
                            <div className="flex items-center">
                              <Stethoscope className="w-4 h-4 text-purple-500 mr-2 flex-shrink-0" />
                              <span className="text-sm text-gray-900 line-clamp-2">
                                {record.action_taken}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                              {!isAdmin && (
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
                        
                        {/* Red Flag Details Row */}
                        {record.is_red_flag && expandedRecordId === record.id && (
                          <tr className="bg-red-50">
                            <td colSpan={10} className="px-4 py-3">
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                  <p className="text-xs font-semibold text-red-700 uppercase">Recovery Started</p>
                                  <p className="text-sm text-gray-900">
                                    {record.recovery_started ? 
                                      new Date(record.recovery_started).toLocaleDateString('en-GB') : 
                                      'N/A'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-red-700 uppercase">Veterinarian</p>
                                  <p className="text-sm text-gray-900">
                                    {record.vet_name || 'N/A'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-red-700 uppercase">Treatment Status</p>
                                  <p className="text-sm text-gray-900">
                                    {record.still_under_treatment === 'Y' 
                                      ? 'Still under treatment' 
                                      : 'Treatment completed'}
                                  </p>
                                </div>
                                {record.still_under_treatment === 'N' && (
                                  <div>
                                    <p className="text-xs font-semibold text-red-700 uppercase">Fully Recovered On</p>
                                    <p className="text-sm text-gray-900">
                                      {record.fully_recovered_on ? 
                                        new Date(record.fully_recovered_on).toLocaleDateString('en-GB') : 
                                        'N/A'}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
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
                          {new Date(record.date).toLocaleDateString('en-GB')}
                        </span>
                      </div>
                      {!isAdmin && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(record)}
                          className="text-blue-600 hover:text-blue-800 transition-colors p-1"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(record.id)}
                          className="text-red-600 hover:text-red-800 transition-colors p-1"
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
                    
                    {/* Red Flag Badge */}
                    {record.is_red_flag && (
                      <div className="bg-red-50 border-b border-red-100 p-3 flex items-center">
                        <Flag className="w-5 h-5 text-red-600 mr-2" />
                        <span className="text-red-700 font-medium">Red Flag Case</span>
                      </div>
                    )}
                    
                    <div className="p-4 grid grid-cols-2 gap-4">
                      <div className="flex items-start">
                        <span className="bg-gray-200 text-gray-700 rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">
                          ID
                        </span>
                        <div>
                          <h3 className="text-xs font-semibold text-gray-500 uppercase">Animal ID</h3>
                          <p className="text-sm font-medium text-gray-900">
                            {record.animal_id}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <Thermometer className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                        <div className="ml-2">
                          <h3 className="text-xs font-semibold text-gray-500 uppercase">Temperature</h3>
                          <p className="text-sm font-medium text-gray-900">
                            {record.temperature || 'N/A'}°F
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <Utensils className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <div className="ml-2">
                          <h3 className="text-xs font-semibold text-gray-500 uppercase">Feed Intake</h3>
                          <p className="text-sm font-medium text-gray-900">
                            {record.feed_intake ? 'Yes' : 'No'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 grid grid-cols-1 gap-4 border-t border-gray-100">
                      <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Symptoms Observed</h3>
                        <p className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3">
                          {record.symptoms_observed}
                        </p>
                      </div>
                      
                      <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Behavior</h3>
                        <p className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3">
                          {record.behavior}
                        </p>
                      </div>
                      
                      <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Action Taken</h3>
                        <p className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3">
                          {record.action_taken}
                        </p>
                      </div>
                    </div>
                    
                    {/* Red Flag Details */}
                    {record.is_red_flag && (
                      <div className="p-4 border-t border-gray-100 bg-red-50">
                        <h3 className="text-xs font-semibold text-red-700 uppercase mb-2">Red Flag Details</h3>
                        <div className="grid grid-cols-1 gap-3">
                          {record.recovery_started && (
                            <div className="flex items-start">
                              <Calendar className="w-4 h-4 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                              <div>
                                <p className="text-xs font-medium text-red-800">Recovery Started</p>
                                <p className="text-sm text-gray-900">
                                  {new Date(record.recovery_started).toLocaleDateString('en-GB')}
                                </p>
                              </div>
                            </div>
                          )}
                          
                          {record.vet_name && (
                            <div className="flex items-start">
                              <Stethoscope className="w-4 h-4 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                              <div>
                                <p className="text-xs font-medium text-red-800">Veterinarian</p>
                                <p className="text-sm text-gray-900">{record.vet_name}</p>
                              </div>
                            </div>
                          )}
                          
                          {record.still_under_treatment && (
                            <div className="flex items-start">
                              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                              <div>
                                <p className="text-xs font-medium text-red-800">Treatment Status</p>
                                <p className="text-sm text-gray-900">
                                  {record.still_under_treatment === 'Y' ? 'Still under treatment' : 'Treatment completed'}
                                </p>
                              </div>
                            </div>
                          )}
                          
                          {record.fully_recovered_on && record.still_under_treatment === 'N' && (
                            <div className="flex items-start">
                              <CheckSquare className="w-4 h-4 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                              <div>
                                <p className="text-xs font-medium text-red-800">Fully Recovered</p>
                                <p className="text-sm text-gray-900">
                                  {new Date(record.fully_recovered_on).toLocaleDateString('en-GB')}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {record.remarks && (
                      <div className="p-4 border-t border-gray-100">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Remarks</h3>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-sm text-gray-900">
                            {record.remarks}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
                      Created: {formatCreatedAt(record.created_at)}
                    </div>
                  </div>
                ))}
              </div>

              {filteredRecords.length === 0 && (
                <div className="text-center py-12">
                  <ClipboardList className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-2">No health logs found</p>
                  <p className="text-gray-400 text-sm mb-4">Try adjusting your filters or add a new log</p>
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

export default DailyHealthLog;