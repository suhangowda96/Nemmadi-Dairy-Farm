import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Calendar, Search, Edit, X, Filter, 
  ChevronDown, ChevronUp, ClipboardList, Download, Trash2,
  Pill, User, Clock, HeartPulse
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { useAuth } from '../../../contexts/AuthContext';

// Define RECOVERY_STATUS constant
const RECOVERY_STATUS = [
  { value: 'Recovered', label: 'Recovered' },
  { value: 'Under Treatment', label: 'Under Treatment' },
  { value: 'Not Recovered', label: 'Not Recovered' },
];

// Define animal types
const ANIMAL_TYPES = [
  { value: 'cow', label: 'Cow' },
  { value: 'calf', label: 'Calf' },
];

interface MedicineRecord {
  id: number;
  date: string;
  animal_type: string;
  animal_id: string;
  medicine_type: string;
  batch_no: string;
  administered_by: string;
  dosage: string | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    username: string;
  };
  duration_days: number | null;
  recovery_status: string;
}

interface MedicineInventoryItem {
  batch_no: string;
  medicine_name: string;
  balance: number;
}

interface HealthMedicineRecordsProps {
  query?: string;
}

const HealthMedicineRecords: React.FC<HealthMedicineRecordsProps> = ({ query = '' }) => {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MedicineRecord | null>(null);
  const [records, setRecords] = useState<MedicineRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const isAdmin = user?.role === 'admin';
  const [animalOptions, setAnimalOptions] = useState<string[]>([]);
  const [calfOptions, setCalfOptions] = useState<string[]>([]);
  const [showAnimalDropdown, setShowAnimalDropdown] = useState(false);
  const [animalSearchTerm, setAnimalSearchTerm] = useState('');
  const animalDropdownRef = useRef<HTMLDivElement>(null);
  const [medicineInventory, setMedicineInventory] = useState<MedicineInventoryItem[]>([]);
  const [showBatchDropdown, setShowBatchDropdown] = useState(false);
  const [batchSearchTerm, setBatchSearchTerm] = useState('');
  const batchDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch medicine inventory batches with balance > 0
  useEffect(() => {
    const fetchMedicineInventory = async () => {
      if (!user || !user.token) return;
      
      try {
        const response = await fetch('http://localhost:8000/api/medicine-inventory/', {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          // Filter batches with balance > 0
          const validBatches = data.filter((item: MedicineInventoryItem) => item.balance > 0);
          setMedicineInventory(validBatches);
        }
      } catch (err) {
        console.error('Failed to fetch medicine inventory', err);
      }
    };
    
    fetchMedicineInventory();
  }, [user]);

  // Fetch cows
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

  // Fetch calves
  useEffect(() => {
    const fetchCalves = async () => {
      if (!user || !user.token) return;
      
      try {
        const response = await fetch(
          'http://localhost:8000/api/breeding-calving-records/?is_active=true', 
          {
            headers: { 'Authorization': `Bearer ${user.token}` }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          const activeCalves = data.map((record: any) => record.calf_id.toString()).filter(Boolean);
          setCalfOptions(activeCalves);
        }
      } catch (err) {
        console.error('Failed to fetch calves', err);
      }
    };
    
    fetchCalves();
  }, [user]);

  // Handle click outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (animalDropdownRef.current && !animalDropdownRef.current.contains(event.target as Node)) {
        setShowAnimalDropdown(false);
      }
      if (batchDropdownRef.current && !batchDropdownRef.current.contains(event.target as Node)) {
        setShowBatchDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter batch options
  const filteredBatchOptions = medicineInventory.filter(item => 
    item.batch_no.toLowerCase().includes(batchSearchTerm.toLowerCase()) ||
    item.medicine_name.toLowerCase().includes(batchSearchTerm.toLowerCase())
  );

  // Get animal options based on animal type
  const getAnimalOptions = (animalType: string) => {
    if (animalType === 'cow') return animalOptions;
    if (animalType === 'calf') return calfOptions;
    return [];
  };

  // Format date for display
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
      
      let url = `http://localhost:8000/api/health-medicine-records/${query}`;
      const params = new URLSearchParams();
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const sortedData = data.sort((a: MedicineRecord, b: MedicineRecord) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return dateB - dateA || new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        setRecords(sortedData);
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
      record.animal_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.animal_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.medicine_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.batch_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.administered_by?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const recordDate = new Date(record.date);
    const matchesDate = (!startDate || recordDate >= startDate) && 
                        (!endDate || recordDate <= endDate);
    
    return matchesSearch && matchesDate;
  });

  // Form state with new fields
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    animal_type: 'cow',
    animal_id: '',
    medicine_type: '',
    batch_no: '',
    administered_by: '',
    dosage: '',
    remarks: '',
    duration_days: '' as string | number,
    recovery_status: 'Under Treatment'
  });

  // Handle form submission
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
        duration_days: formData.duration_days ? Number(formData.duration_days) : null
      };

      const url = editingRecord 
        ? `http://localhost:8000/api/health-medicine-records/${editingRecord.id}/`
        : 'http://localhost:8000/api/health-medicine-records/';
      
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

  // Handle edit record
  const handleEdit = (record: MedicineRecord) => {
    setEditingRecord(record);
    setFormData({
      date: record.date.split('T')[0],
      animal_type: record.animal_type,
      animal_id: record.animal_id,
      medicine_type: record.medicine_type,
      batch_no: record.batch_no,
      administered_by: record.administered_by,
      dosage: record.dosage || '',
      remarks: record.remarks || '',
      duration_days: record.duration_days || '',
      recovery_status: record.recovery_status || 'Under Treatment'
    });
    setShowForm(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      animal_type: 'cow',
      animal_id: '',
      medicine_type: '',
      batch_no: '',
      administered_by: '',
      dosage: '',
      remarks: '',
      duration_days: '',
      recovery_status: 'Under Treatment'
    });
    setEditingRecord(null);
    setError('');
  };

  // Handle popup click
  const handlePopupClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Handle form change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'animal_type') {
      // Reset animal ID when animal type changes
      setFormData(prev => ({
        ...prev,
        animal_type: value,
        animal_id: ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm('');
    setStartDate(null);
    setEndDate(null);
  };

  // Export to Excel
  const exportToExcel = async () => {
    try {
      setIsExporting(true);
      setError('');
      
      if (!user || !user.token) {
        setError('User not authenticated');
        setIsExporting(false);
        return;
      }
      
      let url = 'http://localhost:8000/api/health-medicine-records/export/';
      const params = new URLSearchParams();

      if (user.role === 'admin') {
        if (query.includes('all_supervisors=true')) {
          params.append('all_supervisors', 'true');
        } else if (query.includes('supervisorId=')) {
          const supervisorId = query.split('supervisorId=')[1];
          params.append('supervisorId', supervisorId);
        }
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
        a.download = `medicine_records_${new Date().toISOString().slice(0, 10)}.xlsx`;
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

  // Handle record deletion
  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this medicine record? This action cannot be undone.')) {
      try {
        setDeletingId(id);
        
        if (!user || !user.token) {
          setError('User not authenticated');
          setDeletingId(null);
          return;
        }
        
        const response = await fetch(`http://localhost:8000/api/health-medicine-records/${id}/`, {
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
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Medicine Records</h1>
              <p className="text-gray-600 mt-1">Track animal medications and treatments</p>
            </div>
            {!isAdmin && (
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
                  placeholder="Search by animal ID, medicine, or batch..."
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
                    {editingRecord ? 'Edit Medicine Record' : 'Add Medicine Record'}
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
                    
                    {/* Animal Type Radio Buttons */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Animal Type *
                      </label>
                      <div className="flex space-x-4">
                        {ANIMAL_TYPES.map(type => (
                          <label 
                            key={type.value}
                            className="flex items-center space-x-2 cursor-pointer"
                          >
                            <input
                              type="radio"
                              name="animal_type"
                              value={type.value}
                              checked={formData.animal_type === type.value}
                              onChange={handleChange}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-gray-700">{type.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6">
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
                            
                            <div className="py-1">
                              {getAnimalOptions(formData.animal_type)
                                .filter(id => 
                                  id.toLowerCase().includes(animalSearchTerm.toLowerCase())
                                )
                                .map((animalId) => (
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
                              }
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Batch Number Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Batch Number *</label>
                      <div className="relative" ref={batchDropdownRef}>
                        <div 
                          className="flex items-center border border-gray-300 rounded-xl cursor-pointer"
                          onClick={() => {
                            setShowBatchDropdown(!showBatchDropdown);
                            setBatchSearchTerm('');
                          }}
                        >
                          <input
                            type="text"
                            readOnly
                            value={formData.batch_no}
                            placeholder="Select a batch..."
                            className="w-full px-4 py-3 bg-transparent cursor-pointer focus:outline-none"
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            {showBatchDropdown ? (
                              <ChevronUp className="w-5 h-5 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                        </div>
                        
                        {showBatchDropdown && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            <div className="sticky top-0 bg-white p-2 border-b border-gray-200">
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                  type="text"
                                  placeholder="Search batch..."
                                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  value={batchSearchTerm}
                                  onChange={(e) => setBatchSearchTerm(e.target.value)}
                                  autoFocus
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                            </div>
                            
                            <div className="py-1">
                              {filteredBatchOptions.length > 0 ? (
                                filteredBatchOptions.map((item) => (
                                  <div
                                    key={item.batch_no}
                                    className="px-4 py-2 hover:bg-blue-50 cursor-pointer flex flex-col"
                                    onClick={() => {
                                      setFormData(prev => ({ 
                                        ...prev, 
                                        batch_no: item.batch_no,
                                        medicine_type: item.medicine_name
                                      }));
                                      setShowBatchDropdown(false);
                                      setBatchSearchTerm('');
                                    }}
                                  >
                                    <div className="font-medium">{item.batch_no}</div>
                                    <div className="text-sm text-gray-600">{item.medicine_name}</div>
                                    <div className="text-xs text-gray-500 mt-1">Balance: {item.balance}</div>
                                  </div>
                                ))
                              ) : (
                                <div className="px-4 py-2 text-gray-500 text-center">
                                  No batches available
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Medicine Type Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Medicine Type *</label>
                      <input
                        type="text"
                        name="medicine_type"
                        value={formData.medicine_type}
                        onChange={handleChange}
                        required
                        readOnly
                        placeholder="e.g., Antibiotic"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                  
                  {/* New Fields: Duration and Recovery Status */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Treatment Duration (days)</label>
                      <input
                        type="number"
                        name="duration_days"
                        value={formData.duration_days}
                        onChange={handleChange}
                        placeholder="e.g., 7"
                        min="0"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Recovery Status *</label>
                      <select
                        name="recovery_status"
                        value={formData.recovery_status}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        {RECOVERY_STATUS.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Administered By *</label>
                      <input
                        type="text"
                        name="administered_by"
                        value={formData.administered_by}
                        onChange={handleChange}
                        required
                        placeholder="Veterinarian's name"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Dosage</label>
                      <input
                        type="text"
                        name="dosage"
                        value={formData.dosage}
                        onChange={handleChange}
                        placeholder="e.g., 5ml per kg"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
                    <textarea
                      name="remarks"
                      value={formData.remarks}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Additional notes about the medication..."
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
              <h2 className="text-xl font-bold text-gray-900">Medicine Records</h2>
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Animal ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medicine</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Administered By</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dosage</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
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
                            <span className="text-sm font-medium text-gray-900">
                              {new Date(record.date).toLocaleDateString('en-GB')}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900 font-medium capitalize">
                            {record.animal_type}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <span className="text-sm text-gray-900 font-medium">{record.animal_id}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <Pill className="w-4 h-4 text-purple-500 mr-2" />
                            <span className="text-sm text-gray-900">
                              {record.medicine_type}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900 font-mono">
                            {record.batch_no}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <User className="w-4 h-4 text-blue-500 mr-2" />
                            <span className="text-sm text-gray-900">
                              {record.administered_by}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">
                            {record.dosage || 'N/A'}
                          </div>
                        </td>
                        {/* New Fields: Duration and Status */}
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 text-amber-500 mr-2" />
                            <span className="text-sm text-gray-900">
                              {record.duration_days ? `${record.duration_days} days` : 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <HeartPulse className="w-4 h-4 text-green-500 mr-2" />
                            <span className="text-sm text-gray-900">
                              {record.recovery_status}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          <div className="text-sm text-gray-900 truncate">
                            {record.remarks}
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
                    <div className="p-4 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">
                          {new Date(record.date).toLocaleDateString('en-GB')}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full capitalize">
                          {record.animal_type}
                        </span>
                        <HeartPulse className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">
                          {record.recovery_status}
                        </span>
                      </div>
                    </div>
                    
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
                        <Pill className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                        <div className="ml-2">
                          <h3 className="text-xs font-semibold text-gray-500 uppercase">Medicine</h3>
                          <p className="text-sm font-medium text-gray-900">
                            {record.medicine_type}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <span className="bg-gray-200 text-gray-700 rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">
                          #
                        </span>
                        <div>
                          <h3 className="text-xs font-semibold text-gray-500 uppercase">Batch No</h3>
                          <p className="text-sm font-medium text-gray-900 font-mono">
                            {record.batch_no}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <User className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div className="ml-2">
                          <h3 className="text-xs font-semibold text-gray-500 uppercase">Administered By</h3>
                          <p className="text-sm font-medium text-gray-900">
                            {record.administered_by}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <span className="bg-gray-200 text-gray-700 rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">
                          D
                        </span>
                        <div>
                          <h3 className="text-xs font-semibold text-gray-500 uppercase">Dosage</h3>
                          <p className="text-sm font-medium text-gray-900">
                            {record.dosage || 'Not specified'}
                          </p>
                        </div>
                      </div>

                      {/* New Fields: Duration */}
                      <div className="flex items-start">
                        <Clock className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                        <div className="ml-2">
                          <h3 className="text-xs font-semibold text-gray-500 uppercase">Duration</h3>
                          <p className="text-sm font-medium text-gray-900">
                            {record.duration_days ? `${record.duration_days} days` : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
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
                    
                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                      <div className="text-xs text-gray-500">
                        Created: {formatCreatedAt(record.created_at)}
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
                  </div>
                ))}
              </div>

              {filteredRecords.length === 0 && (
                <div className="text-center py-12">
                  <ClipboardList className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-2">No medicine records found</p>
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

export default HealthMedicineRecords;