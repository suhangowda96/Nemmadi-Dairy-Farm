import React, { useState, useEffect } from 'react';
import { 
  Plus, Calendar, ClipboardCheck, User, AlertCircle, 
  Search, Edit, X, Download, Trash2, Check, 
  Filter, ChevronDown, ChevronUp, ClipboardList
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { useAuth } from '../../../contexts/AuthContext';

interface RMAuditChecklistProps {
  query?: string;
}

const RMAuditChecklist: React.FC<RMAuditChecklistProps> = ({ query = '' }) => {
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
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    record_type: '',
    verified_by: '',
    missing_entries: 'N',
    last_updated_on: new Date().toISOString().split('T')[0],
    remarks: ''
  });

  const formatCreatedAt = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
      
      const url = `https://nemmadi-dairy-farm.koyeb.app/api/rm-audit-checklists/${query}`;
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
    if (user) fetchRecords();
  }, [user]);

  const filteredRecords = records.filter(record => {
    const matchesSearch = searchTerm === '' || 
      record.record_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
      
      const payload = {
        ...formData,
        user: user.id
      };

      const url = editingRecord 
        ? `https://nemmadi-dairy-farm.koyeb.app/api/rm-audit-checklists/${editingRecord.id}/`
        : 'https://nemmadi-dairy-farm.koyeb.app/api/rm-audit-checklists/';
      
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
        setShowForm(false);
        resetForm();
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
      record_type: record.record_type,
      verified_by: record.verified_by,
      missing_entries: record.missing_entries,
      last_updated_on: record.last_updated_on,
      remarks: record.remarks || ''
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      record_type: '',
      verified_by: '',
      missing_entries: 'N',
      last_updated_on: new Date().toISOString().split('T')[0],
      remarks: ''
    });
    setEditingRecord(null);
    setError('');
  };

  const handlePopupClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, missing_entries: e.target.value }));
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
      
      let url = 'https://nemmadi-dairy-farm.koyeb.app/api/rm-audit-checklists/export/';
      const params = new URLSearchParams();
      
      if (isAdmin) {
        params.append('all_supervisors', 'true');
      } else {
        params.append('supervisorId', user.id.toString());
      }
      
      // Add filter parameters
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
        a.download = `rm_audit_checklists_${new Date().toISOString().slice(0, 10)}.xlsx`;
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
    if (window.confirm('Are you sure you want to delete this audit record?')) {
      try {
        setDeletingId(id);
        
        if (!user || !user.token) {
          setError('User not authenticated');
          setDeletingId(null);
          return;
        }
        
        const response = await fetch(`https://nemmadi-dairy-farm.koyeb.app/api/rm-audit-checklists/${id}/`, {
          method: 'DELETE',
          headers: { 
            'Authorization': `Bearer ${user.token}` 
          }
        });
        
        if (response.ok) {
          setRecords(prev => prev.filter(record => record.id !== id));
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">RM Audit Checklists</h1>
              <p className="text-gray-600 mt-1">Track verification and completeness of records</p>
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
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                <DatePicker
                  selected={startDate}
                  onChange={setStartDate}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholderText="Select date"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                <DatePicker
                  selected={endDate}
                  onChange={setEndDate}
                  minDate={startDate || undefined}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholderText="Select date"
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
                    {editingRecord ? 'Edit Audit Record' : 'Add Audit Record'}
                  </h2>
                  <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg">
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">Record Type *</label>
                      <input
                        type="text"
                        name="record_type"
                        value={formData.record_type}
                        onChange={handleChange}
                        required
                        placeholder="Record type"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Verified By *</label>
                      <input
                        type="text"
                        name="verified_by"
                        value={formData.verified_by}
                        onChange={handleChange}
                        required
                        placeholder="Verifier name"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Last Updated On *</label>
                      <input
                        type="date"
                        name="last_updated_on"
                        value={formData.last_updated_on}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Missing Entries *</label>
                    <div className="flex space-x-6">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="missing_entries"
                          value="Y"
                          checked={formData.missing_entries === 'Y'}
                          onChange={handleRadioChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-gray-700">Yes</span>
                      </label>
                      
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="missing_entries"
                          value="N"
                          checked={formData.missing_entries === 'N'}
                          onChange={handleRadioChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-gray-700">No</span>
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
                    <textarea
                      name="remarks"
                      value={formData.remarks}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Additional remarks"
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
                      onClick={() => setShowForm(false)}
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

        {/* Export Loading Indicator */}
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
              <h2 className="text-xl font-bold text-gray-900">Audit Records</h2>
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Record Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verified By</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Missing Entries</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
                      {isSupervisor && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>}
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
                          <span className="text-sm text-gray-900">{record.record_type}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <User className="w-4 h-4 text-blue-400 mr-2" />
                            <span className="text-sm text-gray-900">{record.verified_by}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            {record.missing_entries === 'Y' ? (
                              <>
                                <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                                <span className="text-sm text-red-600 font-medium">Yes</span>
                              </>
                            ) : (
                              <>
                                <Check className="w-4 h-4 text-green-500 mr-2" />
                                <span className="text-sm text-green-600 font-medium">No</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-900">
                            {formatDate(record.last_updated_on)}
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
                        {isSupervisor && (
                          <td className="px-4 py-3 whitespace-nowrap">
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
                          </td>
                        )}
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
                          {formatDate(record.date)}
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
                    
                    <div className="p-4 grid grid-cols-1 gap-4">
                      <div className="flex items-start">
                        <ClipboardCheck className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                        <div className="ml-3">
                          <h3 className="text-xs font-semibold text-gray-500 uppercase">Record Type</h3>
                          <p className="text-sm font-medium text-gray-900">
                            {record.record_type}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <User className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="ml-3">
                          <h3 className="text-xs font-semibold text-gray-500 uppercase">Verified By</h3>
                          <p className="text-sm font-medium text-gray-900">
                            {record.verified_by}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        {record.missing_entries === 'Y' ? (
                          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                        ) : (
                          <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="ml-3">
                          <h3 className="text-xs font-semibold text-gray-500 uppercase">Missing Entries</h3>
                          <p className={`text-sm font-medium ${record.missing_entries === 'Y' ? 'text-red-600' : 'text-green-600'}`}>
                            {record.missing_entries === 'Y' ? 'Yes' : 'No'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <Calendar className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                        <div className="ml-3">
                          <h3 className="text-xs font-semibold text-gray-500 uppercase">Last Updated</h3>
                          <p className="text-sm text-gray-900">
                            {formatDate(record.last_updated_on)}
                          </p>
                        </div>
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
                  <p className="text-gray-500 text-lg mb-2">No audit records found</p>
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

export default RMAuditChecklist;