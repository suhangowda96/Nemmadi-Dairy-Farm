import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Search, Edit, X, Filter, ChevronDown, ChevronUp, Trash2 ,
  Calendar, Check, XCircle, Download, Loader2
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { useAuth } from '../../../contexts/AuthContext';

const formatDate = (date: Date | string) => {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Helper function to format time in 12-hour format
const formatTime = (timeString: string) => {
  const date = new Date(timeString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

// Helper function for backend date format
const formatBackendDate = (date: Date | null) => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface MilkingHygieneProps {
  query?: string;
}

const MilkingHygiene: React.FC<MilkingHygieneProps> = ({ query = '' }) => {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [foremilkFilter, setForemilkFilter] = useState('');
  const [clotsFilter, setClotsFilter] = useState('');
  const [swellingFilter, setSwellingFilter] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const showAddButton = user?.role === 'supervisor' && !query;
  const isAdmin = user?.role === 'admin';
  const isSupervisor = user?.role === 'supervisor';
  const [animalOptions, setAnimalOptions] = useState<string[]>([]);
  const [showAnimalDropdown, setShowAnimalDropdown] = useState(false);
  const [animalSearchTerm, setAnimalSearchTerm] = useState('');
  const animalDropdownRef = useRef<HTMLDivElement>(null);
  
    useEffect(() => {
          const fetchAnimals = async () => {
            if (!user || !user.token) return;
            
            try {
              const response = await fetch('http://localhost:8000/api/animals/', {
                headers: {
                  'Authorization': `Bearer ${user.token}`
                }
              });
              
              if (response.ok) {
                const data = await response.json();
                const animalIds = data.map((animal: any) => animal.animal_id);
                setAnimalOptions(animalIds);
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

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    animal_id: '',
    foremilk_tested: 'N',
    clots_blood: 'N',
    udder_swelling: 'N',
    action_taken: '',
    remarks: ''
  });

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
      
      const url = `http://localhost:8000/api/milking-hygiene/${query}`;
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

  // Filter records
  const filteredRecords = records.filter(record => {
    const matchesSearch = searchTerm === '' || 
      record.animal_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.remarks && record.remarks.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesForemilk = foremilkFilter === '' || 
      record.foremilk_tested === foremilkFilter;
    
    const matchesClots = clotsFilter === '' || 
      record.clots_blood === clotsFilter;
    
    const matchesSwelling = swellingFilter === '' || 
      record.udder_swelling === swellingFilter;
    
    const recordDate = new Date(record.date);
    const matchesDate = (!startDate || recordDate >= startDate) && 
                        (!endDate || recordDate <= endDate);
    
    return matchesSearch && matchesForemilk && matchesClots && matchesSwelling && matchesDate;
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
        ...formData
      };

      const url = editingRecord 
        ? `http://localhost:8000/api/milking-hygiene/${editingRecord.id}/`
        : 'http://localhost:8000/api/milking-hygiene/';
      
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
      animal_id: record.animal_id,
      foremilk_tested: record.foremilk_tested,
      clots_blood: record.clots_blood,
      udder_swelling: record.udder_swelling,
      action_taken: record.action_taken || '',
      remarks: record.remarks || ''
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      animal_id: '',
      foremilk_tested: 'N',
      clots_blood: 'N',
      udder_swelling: 'N',
      action_taken: '',
      remarks: ''
    });
    setEditingRecord(null);
    setError('');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setForemilkFilter('');
    setClotsFilter('');
    setSwellingFilter('');
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
      
      // Build URL with parameters
      let url = 'http://localhost:8000/api/milking-hygiene/export/';
      const params = new URLSearchParams();

      if (isAdmin) {
      params.append('all_supervisors', 'true');
    } else {
      params.append('supervisorId', user.id.toString());
    }

      
      if (startDate) params.append('start_date', formatBackendDate(startDate));
      if (endDate) params.append('end_date', formatBackendDate(endDate));
      if (foremilkFilter) params.append('foremilk_tested', foremilkFilter);
      if (clotsFilter) params.append('clots_blood', clotsFilter);
      if (swellingFilter) params.append('udder_swelling', swellingFilter);
      
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
        a.download = `milking_hygiene_${new Date().toISOString().slice(0, 10)}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);
      } else {
        const errorText = await response.text();
        setError(`Export failed: ${errorText}`);
      }
    } catch (err) {
      setError('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this health record? This action cannot be undone.')) {
      try {
        setDeletingId(id); // Track which record is being deleted
        
        if (!user || !user.token) {
          setError('User not authenticated');
          setDeletingId(null);
          return;
        }
        
        const response = await fetch(`http://localhost:8000/api/milking-hygiene/${id}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });
        
        if (response.ok) {
          // Remove from local state
          setRecords(prevRecords => prevRecords.filter(record => record.id !== id));
        } else if (response.status === 404) {
          setError('Record not found');
        } else {
          setError('Failed to delete record');
        }
      } catch (err) {
        setError('Network error while deleting');
      } finally {
        setDeletingId(null); // Reset deleting state
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
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Mastitis Monitoring</h1>
              <p className="text-gray-600 mt-1">Monitor and maintain milking hygiene standards</p>
            </div>
            {showAddButton && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl flex items-center justify-center space-x-2 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Plus className="w-5 h-5" />
                <span className="font-medium">New Record</span>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search Field */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by animal ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              
              {/* Foremilk Tested Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Foremilk Tested</label>
                <select
                  value={foremilkFilter}
                  onChange={(e) => setForemilkFilter(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">All</option>
                  <option value="Y">Yes</option>
                  <option value="N">No</option>
                </select>
              </div>
              
              {/* Clots/Blood Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Clots/Blood</label>
                <select
                  value={clotsFilter}
                  onChange={(e) => setClotsFilter(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">All</option>
                  <option value="Y">Yes</option>
                  <option value="N">No</option>
                </select>
              </div>
              
              {/* Udder Swelling Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Udder Swelling</label>
                <select
                  value={swellingFilter}
                  onChange={(e) => setSwellingFilter(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">All</option>
                  <option value="Y">Yes</option>
                  <option value="N">No</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                <DatePicker
                  selected={startDate}
                  onChange={(date) => setStartDate(date)}
                  dateFormat="dd/MM/yyyy"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholderText="dd/mm/yyyy"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                <DatePicker
                  selected={endDate}
                  onChange={(date) => setEndDate(date)}
                  dateFormat="dd/MM/yyyy"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholderText="dd/mm/yyyy"
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

        {/* Loading indicator for export */}
        {isExporting && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-700">Preparing your download...</p>
            </div>
          </div>
        )}

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
              className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 lg:p-6 rounded-t-xl">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">
                    {editingRecord ? 'Edit Milking Record' : 'Add New Milking Record'}
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
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
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
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Foremilk Tested *</label>
                      <div className="flex space-x-4">
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="foremilk_tested"
                            value="Y"
                            checked={formData.foremilk_tested === 'Y'}
                            onChange={() => setFormData({...formData, foremilk_tested: 'Y'})}
                            className="form-radio h-5 w-5 text-blue-600"
                          />
                          <span className="ml-2 text-gray-700">Yes</span>
                        </label>
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="foremilk_tested"
                            value="N"
                            checked={formData.foremilk_tested === 'N'}
                            onChange={() => setFormData({...formData, foremilk_tested: 'N'})}
                            className="form-radio h-5 w-5 text-blue-600"
                          />
                          <span className="ml-2 text-gray-700">No</span>
                        </label>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Clots/Blood *</label>
                      <div className="flex space-x-4">
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="clots_blood"
                            value="Y"
                            checked={formData.clots_blood === 'Y'}
                            onChange={() => setFormData({...formData, clots_blood: 'Y'})}
                            className="form-radio h-5 w-5 text-blue-600"
                          />
                          <span className="ml-2 text-gray-700">Yes</span>
                        </label>
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="clots_blood"
                            value="N"
                            checked={formData.clots_blood === 'N'}
                            onChange={() => setFormData({...formData, clots_blood: 'N'})}
                            className="form-radio h-5 w-5 text-blue-600"
                          />
                          <span className="ml-2 text-gray-700">No</span>
                        </label>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Udder Swelling *</label>
                      <div className="flex space-x-4">
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="udder_swelling"
                            value="Y"
                            checked={formData.udder_swelling === 'Y'}
                            onChange={() => setFormData({...formData, udder_swelling: 'Y'})}
                            className="form-radio h-5 w-5 text-blue-600"
                          />
                          <span className="ml-2 text-gray-700">Yes</span>
                        </label>
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="udder_swelling"
                            value="N"
                            checked={formData.udder_swelling === 'N'}
                            onChange={() => setFormData({...formData, udder_swelling: 'N'})}
                            className="form-radio h-5 w-5 text-blue-600"
                          />
                          <span className="ml-2 text-gray-700">No</span>
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Action Taken</label>
                    <textarea
                      name="action_taken"
                      value={formData.action_taken}
                      onChange={(e) => setFormData({...formData, action_taken: e.target.value})}
                      rows={2}
                      placeholder="Describe any actions taken"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
                    <textarea
                      name="remarks"
                      value={formData.remarks}
                      onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                      rows={2}
                      placeholder="Additional observations or notes"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    />
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl flex-1 flex items-center justify-center"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          {editingRecord ? 'Updating...' : 'Adding...'}
                        </>
                      ) : editingRecord ? 'Update Record' : 'Add Record'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        resetForm();
                      }}
                      className="border border-gray-300 text-gray-700 px-8 py-3 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium flex-1"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Records List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 lg:p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <h2 className="text-xl font-bold text-gray-900">Milking Hygiene Records</h2>
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Animal ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Foremilk Tested</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clots/Blood</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Udder Swelling</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900">
                              {formatDate(record.date)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-gray-900">{record.animal_id}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            record.foremilk_tested === 'Y' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {record.foremilk_tested === 'Y' ? (
                              <Check className="w-3 h-3 mr-1" />
                            ) : (
                              <XCircle className="w-3 h-3 mr-1" />
                            )}
                            {record.foremilk_tested === 'Y' ? 'Yes' : 'No'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            record.clots_blood === 'Y' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {record.clots_blood === 'Y' ? (
                              <Check className="w-3 h-3 mr-1" />
                            ) : (
                              <XCircle className="w-3 h-3 mr-1" />
                            )}
                            {record.clots_blood === 'Y' ? 'Yes' : 'No'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            record.udder_swelling === 'Y' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {record.udder_swelling === 'Y' ? (
                              <Check className="w-3 h-3 mr-1" />
                            ) : (
                              <XCircle className="w-3 h-3 mr-1" />
                            )}
                            {record.udder_swelling === 'Y' ? 'Yes' : 'No'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                            {record.remarks ? (
                                <p className="text-sm text-gray-900 bg-gray-50 rounded-lg p-2">
                                {record.remarks}
                                </p>
                            ) : (
                                <span className="text-sm text-gray-500">No remarks</span>
                            )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {isSupervisor && (
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

              {/* Mobile Cards - Updated styling */}
              <div className="lg:hidden space-y-4 p-4">
                {filteredRecords.map((record) => (
                  <div 
                    key={record.id} 
                    className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200"
                  >
                    <div className="p-4 bg-blue-50 border-b border-blue-100">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          <span className="text-base font-bold text-blue-800">
                            {formatDate(record.date)}
                          </span>
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {record.animal_id}
                        </div>
                      </div>
                    </div>
                    
                    <div className="px-4 py-3 space-y-3">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-center">
                          <p className="text-xs text-gray-500 mb-1">Foremilk Tested</p>
                          <div className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium ${
                            record.foremilk_tested === 'Y' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {record.foremilk_tested === 'Y' ? 'Yes' : 'No'}
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500 mb-1">Clots/Blood</p>
                          <div className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium ${
                            record.clots_blood === 'Y' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {record.clots_blood === 'Y' ? 'Yes' : 'No'}
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500 mb-1">Udder Swelling</p>
                          <div className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium ${
                            record.udder_swelling === 'Y' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {record.udder_swelling === 'Y' ? 'Yes' : 'No'}
                          </div>
                        </div>
                      </div>
                      
                      {record.action_taken && (
                        <div>
                          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Action Taken</h3>
                          <p className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3">
                            {record.action_taken}
                          </p>
                        </div>
                      )}
                      
                      {record.remarks && (
                        <div>
                          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Remarks</h3>
                          <p className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3">
                            {record.remarks}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* Created at timestamp */}
                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                      <div className="text-xs text-gray-500">
                        Created: {formatDate(record.created_at)} at {formatTime(record.created_at)}
                      </div>
                      {isSupervisor && (
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
                ))}
              </div>

              {filteredRecords.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg mb-2">No milking hygiene records found</p>
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

export default MilkingHygiene;