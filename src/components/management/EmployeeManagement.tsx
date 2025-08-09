import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Pencil, X, User, Briefcase, Search, Camera, RotateCw, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Webcam from 'react-webcam';

interface EmployeeManagementProps {
  query?: string;
}

interface Employee {
  employee_id: string;
  staff_name: string;
  designation: string;
  payment_per_day: number;
  is_active: boolean;
  created_at: string;
  picture?: string;
}

const dataURLtoBlob = (dataURL: string): Blob => {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

const EmployeeManagement: React.FC<EmployeeManagementProps> = ({ query = '' }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentEditEmployee, setCurrentEditEmployee] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { user, logout } = useAuth();
  const [generatedEmployeeId, setGeneratedEmployeeId] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [viewImage, setViewImage] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const webcamRef = useRef<Webcam>(null);

  const [newEmployee, setNewEmployee] = useState({
    staff_name: '',
    designation: '',
    payment_per_day: '',
    is_active: true
  });

  const [editForm, setEditForm] = useState({
    staff_name: '',
    designation: '',
    payment_per_day: '',
    is_active: true
  });

  // Generate employee ID
  const generateEmployeeId = useCallback(() => {
    const currentYear = new Date().getFullYear().toString();
    const employeesThisYear = employees.filter(emp => 
      emp.employee_id.startsWith(`NDF-${currentYear}`)
    );

    let maxSerial = 0;
    employeesThisYear.forEach(emp => {
      const serialPart = emp.employee_id.substring(9);
      const serial = parseInt(serialPart);
      if (!isNaN(serial)) {
        maxSerial = Math.max(maxSerial, serial);
      }
    });

    const nextSerial = maxSerial + 1;
    return `NDF-${currentYear}` + nextSerial.toString().padStart(3, '0');
  }, [employees]);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!user) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      const queryParams = new URLSearchParams(query);
      for (const [key, value] of queryParams.entries()) {
        params.append(key, value);
      }
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const url = `http://localhost:8000/api/employees/?${params.toString()}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          return;
        }
        throw new Error(`Failed to fetch employees: ${response.statusText}`);
      }

      const data = await response.json();
      setEmployees(data);
      setLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch employees';
      setError(errorMessage);
      setLoading(false);
    }
  }, [user, query, searchTerm, logout]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const openAddModal = () => {
    const newId = generateEmployeeId();
    setGeneratedEmployeeId(newId);
    setIsAddModalOpen(true);
    setNewEmployee({
      staff_name: '',
      designation: '',
      payment_per_day: '',
      is_active: true
    });
    setCameraActive(false);
    setCapturedImage(null);
    setError('');
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setCameraActive(false);
    setCapturedImage(null);
  };

  // Camera functions
  const captureImage = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setCapturedImage(imageSrc);
        setCameraActive(false);
      }
    }
  };

  const toggleCamera = () => {
    setCameraActive(!cameraActive);
    setCapturedImage(null);
  };

  const switchCamera = () => {
    setFacingMode(facingMode === 'user' ? 'environment' : 'user');
  };

  const removeImage = () => {
    setCapturedImage(null);
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newEmployee.staff_name.trim() || !newEmployee.designation.trim() || !newEmployee.payment_per_day) {
      setError('All fields are required');
      return;
    }

    const payment = parseFloat(newEmployee.payment_per_day);
    if (isNaN(payment) || payment <= 0) {
      setError('Payment must be a valid positive number');
      return;
    }

    if (!capturedImage) {
      setError('Employee picture is required');
      return;
    }

    try {
      setAddLoading(true);
      setError('');
      
      if (!user) {
        setError('Authentication required');
        return;
      }

      const formData = new FormData();
      formData.append('employee_id', generatedEmployeeId);
      formData.append('staff_name', newEmployee.staff_name.trim());
      formData.append('designation', newEmployee.designation.trim());
      formData.append('payment_per_day', payment.toString());
      formData.append('is_active', newEmployee.is_active.toString());
      
      const filename = `employee-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.jpg`;
      if (capturedImage) {
        const blob = dataURLtoBlob(capturedImage);
        formData.append('picture', blob, filename);
      }

      const response = await fetch('http://localhost:8000/api/employees/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        let errorMessage = 'Failed to add employee';
        if (response.status === 400 && errorData) {
          errorMessage = Object.values(errorData)
            .flatMap((errors) => Array.isArray(errors) ? errors : [errors])
            .join(', ');
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        }
        throw new Error(errorMessage);
      }

      closeAddModal();
      fetchEmployees();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add employee';
      setError(errorMessage);
      if (errorMessage.includes('employee_id') || errorMessage.includes('unique')) {
        const newId = generateEmployeeId();
        setGeneratedEmployeeId(newId);
      }
    } finally {
      setAddLoading(false);
    }
  };

  const openEditModal = (employee: Employee) => {
    setCurrentEditEmployee(employee);
    setEditForm({
      staff_name: employee.staff_name,
      designation: employee.designation,
      payment_per_day: employee.payment_per_day.toString(),
      is_active: employee.is_active
    });
    setCapturedImage(null);
    setCameraActive(false);
    setIsEditModalOpen(true);
    setError('');
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setCurrentEditEmployee(null);
    setCameraActive(false);
    setCapturedImage(null);
  };

  const handleUpdate = async () => {
    if (!editForm.staff_name || !editForm.designation || !editForm.payment_per_day) {
      setError('All fields are required');
      return;
    }

    const payment = parseFloat(editForm.payment_per_day);
    if (isNaN(payment)) {
      setError('Payment must be a valid number');
      return;
    }

    if (!currentEditEmployee?.picture && !capturedImage) {
      setError('Employee picture is required');
      return;
    }

    try {
      setUpdateLoading(true);
      setError('');
      
      if (!user || !currentEditEmployee) {
        setError('Authentication required');
        return;
      }

      const formData = new FormData();
      formData.append('staff_name', editForm.staff_name);
      formData.append('designation', editForm.designation);
      formData.append('payment_per_day', payment.toString());
      formData.append('is_active', editForm.is_active.toString());
      
      if (capturedImage) {
        const blob = dataURLtoBlob(capturedImage);
        formData.append('picture', blob, 'employee-photo.jpg');
      }

      const response = await fetch(
        `http://localhost:8000/api/employees/${currentEditEmployee.employee_id}/`, 
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${user.token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          return;
        }
        const errorData = await response.json();
        let errorMessage = 'Failed to update employee';
        if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (typeof errorData === 'object') {
          const firstError = Object.values(errorData)[0];
          if (Array.isArray(firstError)) {
            errorMessage = firstError[0];
          } else if (typeof firstError === 'string') {
            errorMessage = firstError;
          }
        }
        throw new Error(errorMessage);
      }

      closeEditModal();
      fetchEmployees();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update employee';
      setError(errorMessage);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleToggleStatus = async (employee: Employee) => {
    try {
      const newStatus = !employee.is_active;
      
      setEmployees(prev => prev.map(emp => 
        emp.employee_id === employee.employee_id 
          ? { ...emp, is_active: newStatus } 
          : emp
      ));
      
      const formData = new FormData();
      formData.append('is_active', newStatus.toString());

      const response = await fetch(
        `http://localhost:8000/api/employees/${employee.employee_id}/`, 
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${user?.token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        setEmployees(prev => prev.map(emp => 
          emp.employee_id === employee.employee_id 
            ? { ...emp, is_active: employee.is_active } 
            : emp
        ));
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update status');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update status';
      setError(errorMessage);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };


  const renderCamera = () => (
    <div className="flex flex-col items-center">
      <div className="relative w-full max-w-xs">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={{ facingMode }}
          className="w-full rounded-md border border-gray-300"
        />
        <button 
          onClick={switchCamera}
          className="absolute bottom-4 right-4 bg-white p-2 rounded-full shadow-md"
        >
          <RotateCw size={20} />
        </button>
      </div>
      <button
        onClick={captureImage}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
      >
        <Camera className="mr-2" size={18} />
        Capture Photo
      </button>
    </div>
  );

  const renderCapturedImage = () => (
    <div className="flex flex-col items-center">
      <div className="relative">
        {capturedImage && (
          <img 
            src={capturedImage} 
            alt="Captured employee" 
            className="w-48 h-48 object-cover rounded-md border border-gray-300"
          />
        )}
        <button
          onClick={removeImage}
          className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
        >
          <X size={16} />
        </button>
      </div>
      <button
        onClick={toggleCamera}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Retake Photo
      </button>
    </div>
  );

  const renderImageSection = () => (
    <div className="mt-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Employee Picture <span className="text-red-500">*</span>
      </label>
      {cameraActive ? renderCamera() : capturedImage ? renderCapturedImage() : (
        <div className="flex flex-col items-center">
          <div className="w-48 h-48 bg-gray-100 border-2 border-dashed rounded-md flex items-center justify-center mb-4">
            <Camera size={32} className="text-gray-400" />
          </div>
          <button
            onClick={toggleCamera}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          >
            <Camera className="mr-2" size={18} />
            Take Photo
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Image View Modal */}
      {viewImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
          onClick={() => setViewImage(null)}
        >
          <div className="max-w-4xl w-full p-4">
            <div className="flex justify-end mb-2">
              <button 
                onClick={() => setViewImage(null)}
                className="text-white hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>
            <img 
              src={viewImage} 
              alt="Employee" 
              className="w-full h-auto max-h-[80vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center">
                <Plus className="mr-2" size={20} />
                Add New Employee
              </h2>
              <button 
                onClick={closeAddModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="overflow-y-auto p-4 space-y-4 flex-grow">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee ID
                </label>
                <div className="w-full p-2 bg-gray-100 rounded-md">
                  <p className="text-gray-900 font-medium">{generatedEmployeeId}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Staff Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newEmployee.staff_name}
                  onChange={(e) => setNewEmployee({...newEmployee, staff_name: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="e.g. Rajesh Kumar"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Designation <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newEmployee.designation}
                  onChange={(e) => setNewEmployee({...newEmployee, designation: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="e.g. milker"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Per Day (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={newEmployee.payment_per_day}
                  onChange={(e) => setNewEmployee({...newEmployee, payment_per_day: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="e.g. 1500"
                  required
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={newEmployee.is_active}
                  onChange={(e) => setNewEmployee({...newEmployee, is_active: e.target.checked})}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                  Currently Active
                </label>
              </div>
              
              {renderImageSection()}
              
              {error && (
                <div className="mt-2 p-2 bg-red-50 text-red-700 rounded-md text-sm">
                  {error}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t flex justify-end space-x-2">
              <button
                onClick={closeAddModal}
                disabled={addLoading}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddEmployee}
                disabled={addLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center disabled:opacity-50 min-w-[120px]"
              >
                {addLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Employee"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {isEditModalOpen && currentEditEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center">
                <Pencil className="mr-2" size={20} />
                Edit Employee
              </h2>
              <button 
                onClick={closeEditModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="overflow-y-auto p-4 space-y-4 flex-grow">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee ID
                </label>
                <div className="w-full p-2 bg-gray-100 rounded-md">
                  <p className="text-gray-900 font-medium">{currentEditEmployee.employee_id}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Staff Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.staff_name}
                  onChange={(e) => setEditForm({...editForm, staff_name: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Designation <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.designation}
                  onChange={(e) => setEditForm({...editForm, designation: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Per Day (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={editForm.payment_per_day}
                  onChange={(e) => setEditForm({...editForm, payment_per_day: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="edit_is_active"
                  checked={editForm.is_active}
                  onChange={(e) => setEditForm({...editForm, is_active: e.target.checked})}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <label htmlFor="edit_is_active" className="ml-2 text-sm text-gray-700">
                  Currently Active
                </label>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee Picture <span className="text-red-500">*</span>
                </label>
                {currentEditEmployee.picture && !capturedImage && !cameraActive && (
                  <div className="flex flex-col items-center">
                    <img 
                      src={currentEditEmployee.picture} 
                      alt="Current employee" 
                      className="w-48 h-48 object-cover rounded-md border border-gray-300 cursor-pointer"
                      onClick={() => setViewImage(currentEditEmployee.picture || '')}
                    />
                    <button
                      onClick={toggleCamera}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Update Photo
                    </button>
                  </div>
                )}
                {cameraActive && renderCamera()}
                {capturedImage && renderCapturedImage()}
                {!currentEditEmployee.picture && !cameraActive && !capturedImage && (
                  <div className="flex flex-col items-center">
                    <div className="w-48 h-48 bg-gray-100 border-2 border-dashed rounded-md flex items-center justify-center mb-4">
                      <Camera size={32} className="text-gray-400" />
                    </div>
                    <button
                      onClick={toggleCamera}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                    >
                      <Camera className="mr-2" size={18} />
                      Take Photo
                    </button>
                  </div>
                )}
              </div>
              
              {error && (
                <div className="mt-2 p-2 bg-red-50 text-red-700 rounded-md text-sm">
                  {error}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t flex justify-end space-x-2">
              <button
                onClick={closeEditModal}
                disabled={updateLoading}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={updateLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center disabled:opacity-50 min-w-[120px]"
              >
                {updateLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
          <User className="mr-2" size={24} />
          Employee Management
        </h1>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={openAddModal}
            className="flex items-center bg-blue-600 text-white px-2 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="mr-1" size={20} />
            Add Employee
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or employee ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Employee List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b flex flex-col sm:flex-row sm:justify-between sm:items-center">
          <h2 className="text-lg font-semibold flex items-center mb-2 sm:mb-0">
            <Briefcase className="mr-2" size={20} />
            Employee List
          </h2>
          <p className="text-sm text-gray-500">
            {employees.length} employee{employees.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2">Loading employees...</p>
          </div>
        ) : employees.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchTerm ? 'No employees match your search' : 'No employees found. Add your first employee.'}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Photo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Designation
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment/Day
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {employees.map((employee) => (
                    <tr key={employee.employee_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        {employee.picture ? (
                          <img 
                            src={employee.picture} 
                            alt={employee.staff_name}
                            className="w-10 h-10 rounded-full object-cover cursor-pointer"
                            onClick={() => setViewImage(employee.picture || '')}
                          />
                        ) : (
                          <div className="bg-gray-200 border-2 border-dashed rounded-full w-10 h-10 flex items-center justify-center">
                            <User size={16} className="text-gray-500" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {employee.employee_id}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {employee.staff_name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {employee.designation}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(employee.payment_per_day)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(employee)}
                          className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 ${
                            employee.is_active ? 'bg-green-500' : 'bg-gray-300'
                          }`}
                        >
                          <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ${
                            employee.is_active ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                        <span className="ml-2 text-sm">
                          {employee.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openEditModal(employee)}
                          className="text-blue-600 hover:text-blue-900 flex items-center justify-end w-full"
                        >
                          <Pencil className="mr-1" size={16} />
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-4 p-4">
              {employees.map((employee) => (
                <div 
                  key={employee.employee_id} 
                  className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200"
                >
                  <div className="p-4 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">
                        {employee.employee_id}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditModal(employee)}
                        className="text-blue-600 hover:text-blue-800 transition-colors p-1"
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(employee)}
                        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 ${
                          employee.is_active ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ${
                          employee.is_active ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-4 space-y-4">
                    <div className="flex justify-center">
                      {employee.picture ? (
                        <img 
                          src={employee.picture} 
                          alt={employee.staff_name}
                          className="w-24 h-24 rounded-full object-cover border-2 border-blue-200 cursor-pointer"
                          onClick={() => setViewImage(employee.picture || '')}
                        />
                      ) : (
                        <div className="bg-gray-200 border-2 border-dashed rounded-full w-24 h-24 flex items-center justify-center">
                          <User size={32} className="text-gray-500" />
                        </div>
                      )}
                    </div>
                    
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-gray-900">{employee.staff_name}</h3>
                      <p className="text-sm text-gray-500">{employee.designation}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500">Daily Payment</p>
                        <p className="font-medium">{formatCurrency(employee.payment_per_day)}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500">Status</p>
                        <p className={`font-medium ${employee.is_active ? 'text-green-600' : 'text-red-600'}`}>
                          {employee.is_active ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EmployeeManagement;