import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, XCircle, ChevronDown, ChevronUp, 
  Calendar, Search, Filter, X, ClipboardList, User
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { useAuth } from '../../contexts/AuthContext';

interface ApprovalPageProps {
  query?: string;
}

const formatDisplayDate = (dateString: string) => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

interface ApprovalRecord {
  id: number;
  date: string;
  item_type: string;
  item_requested: string;
  quantity: number;
  requested_by: string;
  approval_status: string;
  approved_by: string | null;
  requester_remarks: string;
  approver_remarks: string;
  created_at: string;
}

const ApprovalPage: React.FC<ApprovalPageProps> = ({ query = '' }) => {
  const { user } = useAuth();
  const [records, setRecords] = useState<ApprovalRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [itemFilter, setItemFilter] = useState('');
  const [requesterFilter, setRequesterFilter] = useState('');
  const [itemTypeFilter, setItemTypeFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [actionRecord, setActionRecord] = useState<ApprovalRecord | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [approverRemarks, setApproverRemarks] = useState('');

  // Initialize approverRemarks when actionRecord changes
  useEffect(() => {
    if (actionRecord) {
      setApproverRemarks(actionRecord.approver_remarks || '');
    }
  }, [actionRecord]);

  const fetchRecords = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      if (!user || !user.token) {
        setError('User not authenticated');
        setIsLoading(false);
        return;
      }
      
      // Create base URL
      const baseUrl = `http://localhost:8000/api/PVpurchase-approvals/`;
      
      // Create URLSearchParams for all parameters
      const params = new URLSearchParams();
      
      // Add base query parameters (from props)
      if (query.includes('all_supervisors=true')) {
        params.append('all_supervisors', 'true');
      } else if (query.includes('supervisorId=')) {
        const supervisorId = query.split('=')[1];
        params.append('supervisorId', supervisorId);
      }
      
      // Add filter parameters
      if (startDate) params.append('start_date', startDate.toISOString().split('T')[0]);
      if (endDate) params.append('end_date', endDate.toISOString().split('T')[0]);
      if (searchTerm) params.append('search', searchTerm);
      if (itemFilter) params.append('item', itemFilter);
      if (requesterFilter) params.append('requester', requesterFilter);
      if (itemTypeFilter) params.append('item_type', itemTypeFilter);
      
      // CRITICAL: Add approval status filter
      params.append('approval_status', 'P');
      
      // Construct final URL
      const url = `${baseUrl}?${params.toString()}`;
      
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
  }, [user, query]);

  const filteredRecords = records.filter(record => {
    const matchesSearch = searchTerm === '' || 
      record.item_requested.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.requested_by.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.requester_remarks?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const recordDate = new Date(record.date);
    const matchesDate = (!startDate || recordDate >= startDate) && 
                        (!endDate || recordDate <= endDate);
    
    const matchesItem = itemFilter === '' || 
      record.item_requested === itemFilter;
    
    const matchesRequester = requesterFilter === '' || 
      record.requested_by === requesterFilter;
    
    const matchesItemType = itemTypeFilter === '' || 
      record.item_type === itemTypeFilter;
    
    return matchesSearch && matchesDate && matchesItem && matchesRequester && matchesItemType;
  });

  const handleAction = async () => {
    if (!actionRecord || !actionType || !user) return;

    try {
      setIsSubmitting(true);
      
      const payload = {
        approval_status: actionType === 'approve' ? 'A' : 'R',
        approved_by: user.username,
        approver_remarks: approverRemarks,
        ...(actionType === 'approve' && { quantity: actionRecord.quantity })
      };

      const response = await fetch(
        `http://localhost:8000/api/PVpurchase-approvals/${actionRecord.id}/approve-reject/`, 
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          },
          body: JSON.stringify(payload),
        }
      );
      
      if (response.ok) {
        setRecords(prev => prev.filter(r => r.id !== actionRecord.id));
        setActionRecord(null);
        setActionType(null);
        setApproverRemarks('');
      } else {
        const errorData = await response.json();
        setError(Object.values(errorData).join(', ') || 'Failed to process request');
      }
    } catch (err) {
      setError('Failed to process request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setItemFilter('');
    setRequesterFilter('');
    setItemTypeFilter('');
    setStartDate(null);
    setEndDate(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Purchase Approvals</h1>
              <p className="text-gray-600 mt-1">Review and approve/reject purchase requests</p>
            </div>
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
                  placeholder="Search requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              
              {/* Item Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Item</label>
                <input
                  type="text"
                  placeholder="Filter by item..."
                  value={itemFilter}
                  onChange={(e) => setItemFilter(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              
              {/* Requester Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Requester</label>
                <input
                  type="text"
                  placeholder="Filter by requester..."
                  value={requesterFilter}
                  onChange={(e) => setRequesterFilter(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
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
                  <option value="FEED">Feed</option>
                  <option value="CALF_FEED">Calf Feed</option>
                  <option value="VACCINATION">Vaccination</option>
                  <option value="MEDICINE">Medicine</option>
                  <option value="SPAREPARTS">Spareparts</option>
                  <option value="EQUIPMENT">Equipment</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
              
              <div className="flex items-end justify-end">
                <button
                  onClick={clearFilters}
                  className="border border-gray-300 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors flex items-center space-x-2"
                >
                  <X className="w-4 h-4" />
                  <span>Clear Filters</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Action Modal */}
        {actionRecord && actionType && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
              <div className="p-4 lg:p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">
                  {actionType === 'approve' ? 'Approve Request' : 'Reject Request'}
                </h2>
              </div>
              
              <div className="p-4 lg:p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Request Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Item Type:</p>
                      <p className="font-medium">{actionRecord.item_type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Item:</p>
                      <p className="font-medium">{actionRecord.item_requested}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Quantity:</p>
                      {actionType === 'approve' ? (
                        <input
                          type="number"
                          min="1"
                          value={actionRecord.quantity}
                          onChange={(e) => {
                            const newQuantity = parseInt(e.target.value) || 1;
                            setActionRecord(prev => ({
                              ...prev!,
                              quantity: newQuantity > 0 ? newQuantity : 1
                            }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="font-medium">{actionRecord.quantity}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Requested By:</p>
                      <p className="font-medium">{actionRecord.requested_by}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Date:</p>
                      <p className="font-medium">{formatDisplayDate(actionRecord.date)}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600">Requester Remarks:</p>
                      <p className="font-medium">{actionRecord.requester_remarks || 'None'}</p>
                    </div>
                  </div>
                  
                  {/* Approver Remarks */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Remarks *
                    </label>
                    <textarea
                      value={approverRemarks}
                      onChange={(e) => setApproverRemarks(e.target.value)}
                      rows={3}
                      required
                      placeholder="Enter your comments"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    />
                  </div>
                  
                  {/* Action Performed By */}
                  <div className="mt-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <div className="flex items-center">
                      <User className="w-5 h-5 text-blue-600 mr-2" />
                      <div>
                        <p className="text-sm text-blue-800">
                          This action will be recorded under your username:
                        </p>
                        <p className="font-medium text-blue-900">
                          {user?.username}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button
                    onClick={handleAction}
                    disabled={isSubmitting}
                    className={`flex-1 py-3 px-6 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all ${
                      actionType === 'approve' 
                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    } ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2 inline-block"></div>
                        Processing...
                      </>
                    ) : actionType === 'approve' ? (
                      'Approve Request'
                    ) : (
                      'Reject Request'
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setActionRecord(null);
                      setActionType(null);
                    }}
                    className="flex-1 border border-gray-300 text-gray-700 py-3 px-6 rounded-xl hover:bg-gray-50 transition-all font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Records Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 lg:p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <h2 className="text-xl font-bold text-gray-900">Pending Approval Requests</h2>
              <p className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                {filteredRecords.length} pending requests
              </p>
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested By</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requester Remarks</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRecords.map((record) => (
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
                          <span className="text-sm text-gray-900">{record.requested_by}</span>
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          <span className="text-sm text-gray-900 break-words">
                            {record.requester_remarks || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setActionRecord(record);
                                setActionType('approve');
                              }}
                              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setActionRecord(record);
                                setActionType('reject');
                              }}
                              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </button>
                          </div>
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
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{record.item_requested}</h3>
                          <p className="text-sm text-gray-500">{record.item_type}</p>
                        </div>
                        <span className="text-sm text-gray-500">{formatDisplayDate(record.date)}</span>
                      </div>
                    </div>
                    
                    <div className="p-4 grid gap-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Quantity</p>
                          <p className="text-sm font-medium">{record.quantity}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Requested By</p>
                          <p className="text-sm font-medium">{record.requested_by}</p>
                        </div>
                      </div>
                      
                      {record.requester_remarks && (
                        <div>
                          <p className="text-xs text-gray-500">Requester Remarks</p>
                          <p className="text-sm">{record.requester_remarks}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4 border-t border-gray-200 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          setActionRecord(record);
                          setActionType('approve');
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg flex items-center justify-center transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          setActionRecord(record);
                          setActionType('reject');
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg flex items-center justify-center transition-colors"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {filteredRecords.length === 0 && (
                <div className="text-center py-12">
                  <ClipboardList className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No pending approval requests</p>
                  <p className="text-gray-400 mt-2">All requests have been processed</p>
                  <button
                    onClick={clearFilters}
                    className="mt-4 text-blue-600 hover:text-blue-800 transition-colors font-medium"
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

export default ApprovalPage;