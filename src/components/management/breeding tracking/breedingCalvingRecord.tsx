import React, { useState, useEffect,  useRef } from 'react';
import { 
  Plus, Calendar, Baby, Activity, 
  Search, Edit, X, Filter, ChevronDown, ChevronUp, ClipboardList, Download, Trash2
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { useAuth } from '../../../contexts/AuthContext';

// Format date for display
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const formatTime = (timeString: string) => {
  const date = new Date(timeString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

interface BreedingCalvingRecordProps {
  query?: string;
}

const BreedingCalvingRecord: React.FC<BreedingCalvingRecordProps> = ({ query = '' }) => {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
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
  const [animalOptions, setAnimalOptions] = useState<string[]>([]);
  const [showAnimalDropdown, setShowAnimalDropdown] = useState(false);
  const [animalSearchTerm, setAnimalSearchTerm] = useState('');
  const animalDropdownRef = useRef<HTMLDivElement>(null);
  const [nextCalfSequence, setNextCalfSequence] = useState<{ [year: string]: number }>({});

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
          const animalIds = activeAnimals.map((animal: any) => animal.animal_id.toString());
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

  // Fetch calf sequence numbers when records are loaded
  useEffect(() => {
    if (records.length > 0) {
      const sequenceMap: { [year: string]: number } = {};
      
      records.forEach(record => {
        if (record.calf_id && record.calf_id.startsWith('clf-')) {
          const year = record.calf_id.substring(4, 8);
          const sequenceStr = record.calf_id.substring(8);
          const sequence = parseInt(sequenceStr, 10);
          
          if (!isNaN(sequence)) {
            if (!sequenceMap[year] || sequence > sequenceMap[year]) {
              sequenceMap[year] = sequence;
            }
          }
        }
      });
      
      setNextCalfSequence(sequenceMap);
    }
  }, [records]);

  const filteredAnimalOptions = animalOptions.filter(id => 
    id.toLowerCase().includes(animalSearchTerm.toLowerCase())
  );

  const [formData, setFormData] = useState({
    animal_id: '',
    calving_date: new Date().toISOString().split('T')[0],
    calf_gender: 'Male',
    calf_id: '',
    delivery_type: 'Normal',
    calf_alive: 'Y',
    remarks: ''
  });

  // Generate calf ID when form is shown or calving date changes
  useEffect(() => {
    if (showForm && !editingRecord) {
      generateCalfId();
    }
  }, [showForm, formData.calving_date]);

  const generateCalfId = () => {
    const calvingYear = new Date(formData.calving_date).getFullYear().toString();
    const currentSequence = nextCalfSequence[calvingYear] || 0;
    const nextSequence = currentSequence + 1;
    const paddedSequence = nextSequence.toString().padStart(3, '0');
    
    setFormData(prev => ({
      ...prev,
      calf_id: `clf-${calvingYear}${paddedSequence}`
    }));
  };

  const formatCreatedAt = (dateString: string) => {
    const formattedDate = formatDate(dateString);
    const formattedTime = formatTime(dateString);
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
      
      const url = `https://nemmadi-dairy-farm.koyeb.app/api/breeding-calving-records/${query}`;
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
      record.animal_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.calf_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.remarks?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const recordDate = new Date(record.calving_date);
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
      
      const payload = {
        ...formData,
        user: user.id
      };

      const url = editingRecord 
        ? `https://nemmadi-dairy-farm.koyeb.app/api/breeding-calving-records/${editingRecord.id}/`
        : 'https://nemmadi-dairy-farm.koyeb.app/api/breeding-calving-records/';
      
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
      animal_id: record.animal_id,
      calving_date: record.calving_date,
      calf_gender: record.calf_gender,
      calf_id: record.calf_id,
      delivery_type: record.delivery_type,
      calf_alive: record.calf_alive,
      remarks: record.remarks || ''
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      animal_id: '',
      calving_date: new Date().toISOString().split('T')[0],
      calf_gender: 'Male',
      calf_id: '',
      delivery_type: 'Normal',
      calf_alive: 'Y',
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
        
      let url = 'https://nemmadi-dairy-farm.koyeb.app/api/breeding-calving-records/export/';
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
        a.download = `calving_records_${new Date().toISOString().slice(0, 10)}.xlsx`;
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
    if (window.confirm('Are you sure you want to delete this calving record? This action cannot be undone.')) {
      try {
        setDeletingId(id);
        
        if (!user || !user.token) {
          setError('User not authenticated');
          setDeletingId(null);
          return;
        }
        
        const response = await fetch(`https://nemmadi-dairy-farm.koyeb.app/api/breeding-calving-records/${id}/`, {
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
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Calving Records</h1>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search Field */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search animal ID, calf ID or remarks..."
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholderText="Select start date"
                />
              </div>
              
              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                <DatePicker
                  selected={endDate}
                  onChange={(date) => setEndDate(date)}
                  minDate={startDate || undefined}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholderText="Select end date"
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
                    {editingRecord ? 'Edit Calving Record' : 'Add Calving Record'}
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Calving Date *</label>
                      <input
                        type="date"
                        name="calving_date"
                        value={formData.calving_date}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Calf Gender *</label>
                      <select
                        name="calf_gender"
                        value={formData.calf_gender}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Calf ID</label>
                      <input
                        type="text"
                        name="calf_id"
                        value={formData.calf_id}
                        readOnly
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-100 cursor-not-allowed"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Type *</label>
                      <div className="flex space-x-4">
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="delivery_type"
                            value="Normal"
                            checked={formData.delivery_type === 'Normal'}
                            onChange={handleChange}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <span>Normal</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="delivery_type"
                            value="C-Section"
                            checked={formData.delivery_type === 'C-Section'}
                            onChange={handleChange}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <span>C-Section</span>
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Calf Alive *</label>
                      <div className="flex space-x-4">
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="calf_alive"
                            value="Y"
                            checked={formData.calf_alive === 'Y'}
                            onChange={handleChange}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <span>Yes</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="calf_alive"
                            value="N"
                            checked={formData.calf_alive === 'N'}
                            onChange={handleChange}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <span>No</span>
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
                    <textarea
                      name="remarks"
                      value={formData.remarks}
                      onChange={handleChange}
                      rows={4}
                      placeholder="Additional notes about the calving"
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
              <h2 className="text-xl font-bold text-gray-900">Calving Records</h2>
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Animal ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Calving Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Calf Gender</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Calf ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Calf Alive</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <Activity className="w-4 h-4 text-blue-500 mr-2" />
                            <span className="text-sm font-medium text-gray-900">
                              {record.animal_id}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 text-blue-400 mr-2" />
                            <span className="text-sm text-gray-900">
                              {formatDate(record.calving_date)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <span className="text-sm text-gray-900">{record.calf_gender}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <Baby className="w-4 h-4 text-yellow-500 mr-2" />
                            <span className="text-sm text-gray-900">{record.calf_id || '-'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            record.delivery_type === 'Normal' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {record.delivery_type}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            record.calf_alive === 'Y' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {record.calf_alive === 'Y' ? 'Yes' : 'No'}
                          </span>
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
                        <Activity className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">
                          {record.animal_id}
                        </span>
                      </div>
                      {isSupervisor && (
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
                    
                    <div className="p-4 grid grid-cols-2 gap-4">
                      <div className="flex items-start">
                        <Calendar className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="ml-3">
                          <h3 className="text-xs font-semibold text-gray-500 uppercase">Calving Date</h3>
                          <p className="text-sm font-medium text-gray-900">
                            {formatDate(record.calving_date)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="ml-3">
                          <h3 className="text-xs font-semibold text-gray-500 uppercase">Calf Gender</h3>
                          <p className="text-sm font-medium text-gray-900">
                            {record.calf_gender}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <Baby className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <div className="ml-3">
                          <h3 className="text-xs font-semibold text-gray-500 uppercase">Calf ID</h3>
                          <p className="text-sm font-medium text-gray-900">
                            {record.calf_id || '-'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="mt-0.5 flex-shrink-0 w-5 h-5 flex items-center justify-center">
                          {record.calf_alive === 'Y' ? (
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                          )}
                        </div>
                        <div className="ml-3">
                          <h3 className="text-xs font-semibold text-gray-500 uppercase">Calf Alive</h3>
                          <p className="text-sm font-medium text-gray-900">
                            {record.calf_alive === 'Y' ? 'Yes' : 'No'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 border-t border-gray-100">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Delivery Type</h3>
                      <div className="flex">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          record.delivery_type === 'Normal' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {record.delivery_type}
                        </span>
                      </div>
                    </div>
                    
                    {record.remarks && (
                      <div className="p-4 border-t border-gray-100">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Remarks</h3>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-sm text-gray-900 break-words">
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
                  <p className="text-gray-500 text-lg mb-2">No calving records found</p>
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

export default BreedingCalvingRecord;