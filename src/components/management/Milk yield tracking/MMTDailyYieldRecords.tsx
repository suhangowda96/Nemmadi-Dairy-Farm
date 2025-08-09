import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Calendar, Search, Edit, X, Filter, 
  ChevronDown, ChevronUp, ClipboardList, Download, Trash2,
  Milk, Target, Users, Eye, BarChart2, IndianRupee
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { useAuth } from '../../../contexts/AuthContext';

interface YieldRecord {
  id: number;
  date: string;
  batch_no: string | null;
  animal_ids: string;
  total_animals: number;
  morning_yield: number;
  evening_yield: number;
  total_yield: number;
  avg_yield_per_animal: number;
  targeted_yield: number | null;
  performance: string | null;
  cost_per_litre: number | null;
  total_cost: number | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    username: string;
  };
}

interface Animal {
  id: number;
  animal_id: string;
  target_milk: number;
}

interface MMTDailyYieldRecordsProps {
  query?: string;
}

const MMTDailyYieldRecords: React.FC<MMTDailyYieldRecordsProps> = ({ query = '' }) => {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editingRecord, setEditingRecord] = useState<YieldRecord | null>(null);
  const [records, setRecords] = useState<YieldRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const isAdmin = user?.role === 'admin';
  const [animalOptions, setAnimalOptions] = useState<Animal[]>([]);
  const [showAnimalDropdown, setShowAnimalDropdown] = useState(false);
  const [animalSearchTerm, setAnimalSearchTerm] = useState('');
  const animalDropdownRef = useRef<HTMLDivElement>(null);
  const [targetedYield, setTargetedYield] = useState<number>(0);
  const [performanceStatus, setPerformanceStatus] = useState<string>('');
  const [viewingAnimals, setViewingAnimals] = useState<{ids: string[], date: string} | null>(null);

  // Format numbers in Indian style (1,00,000)
  const formatIndianNumber = (value: number | null | undefined, decimalPlaces: number = 2) => {
    if (value === null || value === undefined || isNaN(value)) return 'N/A';
    
    // Handle negative values
    const isNegative = value < 0;
    const absoluteValue = Math.abs(value);
    
    // Format the number with Indian comma separators
    const parts = absoluteValue.toFixed(decimalPlaces).split('.');
    let integerPart = parts[0];
    const fractionalPart = parts[1] ? `.${parts[1]}` : '';
    
    // Add commas in Indian format
    const lastThree = integerPart.slice(-3);
    const otherNumbers = integerPart.slice(0, -3);
    if (otherNumbers === '') {
      integerPart = lastThree;
    } else {
      integerPart = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree;
    }
    
    return `${isNegative ? '-' : ''}${integerPart}${fractionalPart}`;
  };

  // Format currency specifically (₹1,00,000.00)
  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined || isNaN(value)) return 'N/A';
    return `₹${formatIndianNumber(value, 2)}`;
  };

  // Generate batch number
  const generateBatchNumber = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const random = Math.floor(100 + Math.random() * 900);
    return `dmy-${day}${month}${year}${random}`;
  };

  // Fetch animals
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
          // Filter out inactive animals
          const activeAnimals = data.filter((animal: any) => animal.is_active);
          setAnimalOptions(activeAnimals);
        }
      } catch (err) {
        console.error('Failed to fetch animals', err);
      }
    };
    
    fetchAnimals();
  }, [user]);

  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    batch_no: generateBatchNumber(),
    animal_ids: [] as string[],
    morning_yield: '',
    evening_yield: '',
    total_yield: 0,
    targeted_yield: '',
    performance: '',
    cost_per_litre: '',
    total_cost: '',
    remarks: ''
  });

  // Calculate performance
  useEffect(() => {
    const morning = parseFloat(formData.morning_yield) || 0;
    const evening = parseFloat(formData.evening_yield) || 0;
    const totalYield = morning + evening;
    
    if (targetedYield > 0) {
      const difference = totalYield - targetedYield;
      
      if (difference > 0.1) {
        setPerformanceStatus('High');
      } else if (difference < -0.1) {
        setPerformanceStatus('Low');
      } else {
        setPerformanceStatus('On Target');
      }
    } else {
      setPerformanceStatus('');
    }
    
    setFormData(prev => ({ ...prev, performance: performanceStatus }));
  }, [formData.morning_yield, formData.evening_yield, targetedYield]);

  // Calculate total cost
  useEffect(() => {
    const costPerLitre = parseFloat(formData.cost_per_litre) || 0;
    const totalYield = (parseFloat(formData.morning_yield) || 0) + (parseFloat(formData.evening_yield) || 0);
    const totalCost = costPerLitre * totalYield;
    
    setFormData(prev => ({
      ...prev,
      total_cost: isNaN(totalCost) ? '' : totalCost.toFixed(2)
    }));
  }, [formData.cost_per_litre, formData.morning_yield, formData.evening_yield]);

  // Click outside dropdown handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (animalDropdownRef.current && !animalDropdownRef.current.contains(event.target as Node)) {
        setShowAnimalDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter animal options
  const filteredAnimalOptions = animalOptions.filter(animal => 
    animal.animal_id.toLowerCase().includes(animalSearchTerm.toLowerCase())
  );

  // Calculate targeted yield
  useEffect(() => {
    const totalTarget = formData.animal_ids.reduce((sum, animalId) => {
      const animal = animalOptions.find(a => a.animal_id === animalId);
      return sum + (animal?.target_milk || 0);
    }, 0);
    
    setTargetedYield(totalTarget);
    setFormData(prev => ({ ...prev, targeted_yield: totalTarget.toString() }));
  }, [formData.animal_ids, animalOptions]);

  // Calculate total yield
  useEffect(() => {
    const morning = parseFloat(formData.morning_yield) || 0;
    const evening = parseFloat(formData.evening_yield) || 0;
    const total = morning + evening;
    
    setFormData(prev => ({ ...prev, total_yield: total }));
  }, [formData.morning_yield, formData.evening_yield]);

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
      
      let url = `https://nemmadi-dairy-farm.koyeb.app/api/myt-daily-yield-records/${query}`;
      const params = new URLSearchParams();
      
      if (searchTerm) params.append('search', searchTerm);
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await fetch(url, { headers: { 'Authorization': `Bearer ${user.token}` } });
      
      if (response.ok) {
        const data = await response.json();
        const sortedData = data.sort((a: YieldRecord, b: YieldRecord) => 
          new Date(b.date).getTime() - new Date(a.date).getTime() || 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        // Convert API values to numbers
        const convertedData = sortedData.map((record: any) => ({
          ...record,
          morning_yield: parseFloat(record.morning_yield),
          evening_yield: parseFloat(record.evening_yield),
          total_yield: parseFloat(record.total_yield),
          avg_yield_per_animal: parseFloat(record.avg_yield_per_animal),
          targeted_yield: record.targeted_yield ? parseFloat(record.targeted_yield) : null,
          cost_per_litre: record.cost_per_litre ? parseFloat(record.cost_per_litre) : null,
          total_cost: record.total_cost ? parseFloat(record.total_cost) : null,
        }));
        
        setRecords(convertedData);
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
    if (user) fetchRecords();
  }, [user, query]);

  // Filter records
  const filteredRecords = records.filter(record => {
    const recordDate = new Date(record.date);
    const matchesSearch = searchTerm === '' || 
      record.batch_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.animal_ids.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = (!startDate || recordDate >= startDate) && 
                        (!endDate || recordDate <= endDate);
    return matchesSearch && matchesDate;
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
        animal_ids: formData.animal_ids.join(','),
        user: user.id,
        performance: performanceStatus,
        morning_yield: parseFloat(formData.morning_yield),
        evening_yield: parseFloat(formData.evening_yield),
        total_yield: formData.total_yield,
        targeted_yield: formData.targeted_yield ? parseFloat(formData.targeted_yield) : null,
        cost_per_litre: formData.cost_per_litre ? parseFloat(formData.cost_per_litre) : null,
        total_cost: formData.total_cost ? parseFloat(formData.total_cost) : null,
      };

      const url = editingRecord 
        ? `https://nemmadi-dairy-farm.koyeb.app/api/myt-daily-yield-records/${editingRecord.id}/`
        : 'https://nemmadi-dairy-farm.koyeb.app/api/myt-daily-yield-records/';
      
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
  const handleEdit = (record: YieldRecord) => {
    setEditingRecord(record);
    setFormData({
      date: record.date.split('T')[0],
      batch_no: record.batch_no || generateBatchNumber(),
      animal_ids: record.animal_ids.split(','),
      morning_yield: record.morning_yield.toString(),
      evening_yield: record.evening_yield.toString(),
      total_yield: record.total_yield,
      targeted_yield: record.targeted_yield?.toString() || '',
      performance: record.performance || '',
      cost_per_litre: record.cost_per_litre?.toString() || '',
      total_cost: record.total_cost?.toString() || '',
      remarks: record.remarks || ''
    });
    
    // Set performance status
    if (record.targeted_yield && record.total_yield) {
      const difference = record.total_yield - record.targeted_yield;
      setPerformanceStatus(
        difference > 0.1 ? 'High' : 
        difference < -0.1 ? 'Low' : 'On Target'
      );
    }
    
    setShowForm(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      batch_no: generateBatchNumber(),
      animal_ids: [],
      morning_yield: '',
      evening_yield: '',
      total_yield: 0,
      targeted_yield: '',
      performance: '',
      cost_per_litre: '',
      total_cost: '',
      remarks: ''
    });
    setTargetedYield(0);
    setPerformanceStatus('');
    setEditingRecord(null);
    setError('');
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
      
      let url = 'https://nemmadi-dairy-farm.koyeb.app/api/myt-daily-yield-records/export/';
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
      
      const response = await fetch(url, { headers: { 'Authorization': `Bearer ${user.token}` } });

      if (response.ok) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `yield_records_${new Date().toISOString().slice(0, 10)}.xlsx`;
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

  // Handle form change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Toggle animal selection
  const toggleAnimalSelection = (animalId: string) => {
    setFormData(prev => {
      if (prev.animal_ids.includes(animalId)) {
        return { ...prev, animal_ids: prev.animal_ids.filter(id => id !== animalId) };
      } else {
        return { ...prev, animal_ids: [...prev.animal_ids, animalId] };
      }
    });
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm('');
    setStartDate(null);
    setEndDate(null);
  };

  // Handle record deletion
  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this yield record? This action cannot be undone.')) {
      try {
        setDeletingId(id);
        
        if (!user || !user.token) {
          setError('User not authenticated');
          setDeletingId(null);
          return;
        }
        
        const response = await fetch(`https://nemmadi-dairy-farm.koyeb.app/api/myt-daily-yield-records/${id}/`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        
        if (response.ok) {
          setRecords(prevRecords => prevRecords.filter(record => record.id !== id));
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

  // View animal IDs
  const handleViewAnimals = (animalIds: string, date: string) => {
    setViewingAnimals({ ids: animalIds.split(','), date });
  };

  // Format numbers
  const formatNumber = (value: number | null | undefined, decimalPlaces: number = 2) => {
    if (value === null || value === undefined || isNaN(value)) return 'N/A';
    return value.toFixed(decimalPlaces);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Milk Yield Tracking</h1>
              <p className="text-gray-600 mt-1">Daily milk production records</p>
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
            {showFilters ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
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
                  placeholder="Search by batch or animal ID..."
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
                  onChange={setStartDate}
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
                  onChange={setEndDate}
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
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 lg:p-6 rounded-t-xl">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">
                    {editingRecord ? 'Edit Yield Record' : 'Add Yield Record'}
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
                        Batch No *
                      </label>
                      <div className="w-full px-4 py-3 border border-gray-300 bg-gray-50 rounded-xl">
                        <div className="font-medium text-gray-900">{formData.batch_no}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Animal IDs *
                    </label>
                    <div className="relative" ref={animalDropdownRef}>
                      <div 
                        className="flex items-center border border-gray-300 rounded-xl cursor-pointer"
                        onClick={() => setShowAnimalDropdown(!showAnimalDropdown)}
                      >
                        <div className="flex flex-wrap gap-1 p-2 min-h-[48px] w-full">
                          {formData.animal_ids.length > 0 ? (
                            formData.animal_ids.map(id => (
                              <span 
                                key={id}
                                className="bg-blue-100 text-blue-800 px-2 py-1 rounded-lg text-sm flex items-center"
                              >
                                {id}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleAnimalSelection(id);
                                  }}
                                  className="ml-1 text-blue-600 hover:text-blue-800"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-500">Select animals...</span>
                          )}
                        </div>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          {showAnimalDropdown ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
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
                            {filteredAnimalOptions.length > 0 ? (
                              filteredAnimalOptions.map((animal) => (
                                <div
                                  key={animal.animal_id}
                                  className="px-4 py-2 hover:bg-blue-50 cursor-pointer flex items-center"
                                  onClick={() => toggleAnimalSelection(animal.animal_id)}
                                >
                                  <input
                                    type="checkbox"
                                    checked={formData.animal_ids.includes(animal.animal_id)}
                                    onChange={() => {}}
                                    className="mr-2 h-4 w-4 text-blue-600 rounded"
                                  />
                                  <span>{animal.animal_id}</span>
                                  <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                                    Target: {animal.target_milk}L
                                  </span>
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
                    <div className="text-sm text-gray-500 mt-1">
                      {formData.animal_ids.length} animal(s) selected
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Morning Yield (L) *</label>
                      <input
                        type="number"
                        name="morning_yield"
                        value={formData.morning_yield}
                        onChange={handleChange}
                        required
                        step="0.01"
                        min="0"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Evening Yield (L) *</label>
                      <input
                        type="number"
                        name="evening_yield"
                        value={formData.evening_yield}
                        onChange={handleChange}
                        required
                        step="0.01"
                        min="0"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Total Yield (L)</label>
                      <div className="w-full px-4 py-3 border border-gray-300 bg-gray-50 rounded-xl">
                        <div className="font-medium text-gray-900">{formData.total_yield.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Targeted Yield (L)</label>
                      <div className="w-full px-4 py-3 border border-gray-300 bg-gray-50 rounded-xl">
                        <div className="font-medium text-gray-900">{targetedYield.toFixed(2)}</div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Performance</label>
                      <div className="w-full px-4 py-3 border border-gray-300 bg-gray-50 rounded-xl">
                        <div className="font-medium text-gray-900">{performanceStatus}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cost per Litre (₹)</label>
                      <input
                        type="number"
                        name="cost_per_litre"
                        value={formData.cost_per_litre}
                        onChange={handleChange}
                        step="0.01"
                        min="0"
                        placeholder="Cost per litre"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Total Cost (₹)</label>
                      <div className="w-full px-4 py-3 border border-gray-300 bg-gray-50 rounded-xl">
                        <div className="font-medium text-gray-900">
                          {formData.total_cost || '0.00'}
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
                      placeholder="Additional notes..."
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

        {/* Animals View Popup */}
        {viewingAnimals && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setViewingAnimals(null)}
          >
            <div 
              className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 lg:p-6 rounded-t-xl">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">
                    Animals for {viewingAnimals.date}
                  </h2>
                  <button
                    onClick={() => setViewingAnimals(null)}
                    className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <p className="text-gray-600 mt-1">
                  Total animals: {viewingAnimals.ids.length}
                </p>
              </div>
              
              <div className="p-4 lg:p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {viewingAnimals.ids.map((id, index) => (
                    <div 
                      key={index} 
                      className="bg-gray-50 rounded-lg p-3 text-center"
                    >
                      <div className="font-medium text-gray-900">{id}</div>
                    </div>
                  ))}
                </div>
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
              <h2 className="text-xl font-bold text-gray-900">Daily Yield Records</h2>
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
              {/* Desktop Table - Now scrollable */}
              <div className="hidden lg:block overflow-x-auto">
                <div className="min-w-[1200px] overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px]">Batch</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">Animals</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">Morning (L)</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">Evening (L)</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">Total (L)</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">Target (L)</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">Avg/L per Animal</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[130px]">Cost/Litre (₹)</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[130px]">Total Cost (₹)</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">Performance</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">Remarks</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">Actions</th>
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
                            <div className="text-sm text-gray-900 font-medium">
                              {record.batch_no || 'N/A'}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleViewAnimals(record.animal_ids, record.date)}
                              className="flex items-center text-blue-600 hover:text-blue-800"
                            >
                              <Users className="w-4 h-4 mr-1" />
                              <span className="text-sm">
                                {record.animal_ids.split(',').length} animals
                              </span>
                              <Eye className="w-4 h-4 ml-2" />
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900">
                              {formatNumber(record.morning_yield)}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900">
                              {formatNumber(record.evening_yield)}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              <Milk className="w-4 h-4 text-blue-500 mr-1" />
                              <span className="text-sm font-medium text-gray-900">
                                {formatNumber(record.total_yield)}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              <Target className="w-4 h-4 text-green-500 mr-1" />
                              <span className="text-sm font-medium text-gray-900">
                                {formatNumber(record.targeted_yield) || 'N/A'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              <BarChart2 className="w-4 h-4 text-purple-500 mr-1" />
                              <span className="text-sm font-medium text-gray-900">
                                {formatNumber(record.avg_yield_per_animal)}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              <IndianRupee className="w-4 h-4 text-yellow-500 mr-1" />
                              <span className="text-sm font-medium text-gray-900">
                                {formatCurrency(record.cost_per_litre)}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              <IndianRupee className="w-4 h-4 text-green-600 mr-1" />
                              <span className="text-sm font-medium text-gray-900">
                                {formatCurrency(record.total_cost)}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className={`text-sm font-medium ${
                              record.performance === 'High' ? 'text-green-600' :
                              record.performance === 'Low' ? 'text-red-600' : 'text-gray-900'
                            }`}>
                              {record.performance || 'N/A'}
                            </div>
                          </td>
                          <td className="px-4 py-3 max-w-xs">
                            <div className="text-sm text-gray-900 truncate" title={record.remarks || ''}>
                              {record.remarks || 'N/A'}
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
              </div>

              {/* Mobile Cards - Updated with cost fields */}
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
                      <div className="text-sm font-medium bg-blue-100 px-2 py-1 rounded">
                        {record.batch_no || 'No Batch'}
                      </div>
                    </div>
                    
                    <div className="p-4 grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <button
                          onClick={() => handleViewAnimals(record.animal_ids, record.date)}
                          className="flex items-center text-blue-600 hover:text-blue-800 w-full"
                        >
                          <Users className="w-5 h-5 mr-2" />
                          <h3 className="text-xs font-semibold text-gray-500 uppercase">
                            Animals ({record.animal_ids.split(',').length})
                          </h3>
                          <Eye className="w-4 h-4 ml-2" />
                        </button>
                      </div>
                      
                      <div className="flex items-start">
                        <Milk className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div className="ml-2">
                          <h3 className="text-xs font-semibold text-gray-500 uppercase">Morning Yield</h3>
                          <p className="text-sm font-medium text-gray-900">
                            {formatNumber(record.morning_yield)}L
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <Milk className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div className="ml-2">
                          <h3 className="text-xs font-semibold text-gray-500 uppercase">Evening Yield</h3>
                          <p className="text-sm font-medium text-gray-900">
                            {formatNumber(record.evening_yield)}L
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <Milk className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div className="ml-2">
                          <h3 className="text-xs font-semibold text-gray-500 uppercase">Total Yield</h3>
                          <p className="text-sm font-medium text-gray-900">
                            {formatNumber(record.total_yield)}L
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <BarChart2 className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                        <div className="ml-2">
                          <h3 className="text-xs font-semibold text-gray-500 uppercase">Avg per Animal</h3>
                          <p className="text-sm font-medium text-gray-900">
                            {formatNumber(record.avg_yield_per_animal)} L
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <Target className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <div className="ml-2">
                          <h3 className="text-xs font-semibold text-gray-500 uppercase">Targeted Yield</h3>
                          <p className="text-sm font-medium text-gray-900">
                            {formatNumber(record.targeted_yield) || 'N/A'}L
                          </p>
                        </div>
                      </div>
                      
                     <div className="flex items-start">
                      <IndianRupee className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <div className="ml-2">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase">Cost/Litre</h3>
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(record.cost_per_litre)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <IndianRupee className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="ml-2">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase">Total Cost</h3>
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(record.total_cost)}
                        </p>
                      </div>
                    </div>
                                          
                      <div className="col-span-2">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase">Performance</h3>
                        <p className={`text-sm font-medium ${
                          record.performance === 'High' ? 'text-green-600' :
                          record.performance === 'Low' ? 'text-red-600' : 'text-gray-900'
                        }`}>
                          {record.performance || 'Not specified'}
                        </p>
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
                        Created: {new Date(record.created_at).toLocaleDateString()}
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
                  <p className="text-gray-500 text-lg mb-2">No yield records found</p>
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

export default MMTDailyYieldRecords;