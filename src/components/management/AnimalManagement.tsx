import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, X, Tag, Milk, Search, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface Animal {
  animal_id: string;
  target_milk: number;
  is_active: boolean;
  created_at: string;
}

const AnimalManagement = () => {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [newAnimal, setNewAnimal] = useState({ 
    animal_id: '', 
    target_milk: '',
    is_active: true
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentEditAnimal, setCurrentEditAnimal] = useState<Animal | null>(null);
  const [editForm, setEditForm] = useState({ 
    animal_id: '', 
    target_milk: '',
    is_active: true
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const { user, logout } = useAuth();

  const fetchAnimals = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!user) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const url = `https://nemmadi-dairy-farm.koyeb.app/api/animals/?${params.toString()}`;
      
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
        throw new Error(`Failed to fetch animals: ${response.statusText}`);
      }

      const data = await response.json();
      // Sort by created_at descending (newest first)
      const sortedData = data.sort((a: Animal, b: Animal) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      setAnimals(sortedData);
      setLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch animals';
      setError(errorMessage);
      setLoading(false);
    }
  }, [user, logout, searchTerm]);

  useEffect(() => {
    fetchAnimals();
  }, [fetchAnimals]);

  const handleAddAnimal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnimal.animal_id || !newAnimal.target_milk) {
      setError('Both fields are required');
      return;
    }

    try {
      setAddLoading(true);
      setError('');
      
      if (!user) {
        setError('Authentication required');
        return;
      }

      const response = await fetch('https://nemmadi-dairy-farm.koyeb.app/api/animals/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          animal_id: newAnimal.animal_id,
          target_milk: parseFloat(newAnimal.target_milk),
          is_active: newAnimal.is_active
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          return;
        }
        
        const errorData = await response.json();
        const errorMessage = errorData.detail || 
                             errorData.animal_id?.[0] || 
                             'Failed to add animal';
        throw new Error(errorMessage);
      }

      setNewAnimal({ animal_id: '', target_milk: '', is_active: true });
      fetchAnimals();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add animal';
      setError(errorMessage);
    } finally {
      setAddLoading(false);
    }
  };

  const openEditModal = (animal: Animal) => {
    setCurrentEditAnimal(animal);
    setEditForm({
      animal_id: animal.animal_id,
      target_milk: animal.target_milk.toString(),
      is_active: animal.is_active
    });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setCurrentEditAnimal(null);
    setEditForm({ animal_id: '', target_milk: '', is_active: true });
  };

  const handleUpdate = async () => {
    if (!editForm.animal_id || !editForm.target_milk) {
      setError('Both fields are required');
      return;
    }

    try {
      setUpdateLoading(true);
      setError('');
      
      if (!user || !currentEditAnimal) {
        setError('Authentication required');
        return;
      }

      const response = await fetch(`https://nemmadi-dairy-farm.koyeb.app/api/animals/${currentEditAnimal.animal_id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
        },
        body: JSON.stringify({ 
          animal_id: editForm.animal_id,
          target_milk: parseFloat(editForm.target_milk),
          is_active: editForm.is_active
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          return;
        }
        
        const errorData = await response.json();
        const errorMessage = errorData.detail || 
                             errorData.target_milk?.[0] || 
                             errorData.animal_id?.[0] ||
                             'Failed to update animal';
        throw new Error(errorMessage);
      }

      closeEditModal();
      fetchAnimals();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update animal';
      setError(errorMessage);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleToggleStatus = async (animal: Animal) => {
    try {
      const newStatus = !animal.is_active;
      
      setAnimals(prev => prev.map(a => 
        a.animal_id === animal.animal_id 
          ? { ...a, is_active: newStatus } 
          : a
      ));
      
      const response = await fetch(
        `https://nemmadi-dairy-farm.koyeb.app/api/animals/${animal.animal_id}/`, 
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user?.token}`,
          },
          body: JSON.stringify({ is_active: newStatus }),
        }
      );

      if (!response.ok) {
        setAnimals(prev => prev.map(a => 
          a.animal_id === animal.animal_id 
            ? { ...a, is_active: animal.is_active } 
            : a
        ));
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update status');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update status';
      setError(errorMessage);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Edit Animal Modal */}
      {isEditModalOpen && currentEditAnimal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center">
                <Pencil className="mr-2" size={20} />
                Edit Animal
              </h2>
              <button 
                onClick={closeEditModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Animal ID
                </label>
                <div className="w-full p-2 bg-gray-100 rounded-md">
                  <p className="text-gray-900 font-medium">{currentEditAnimal.animal_id}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Milk (L/day) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={editForm.target_milk}
                  onChange={(e) => setEditForm({...editForm, target_milk: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="e.g. 25.5"
                  required
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={editForm.is_active}
                  onChange={(e) => setEditForm({...editForm, is_active: e.target.checked})}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                  Currently Active
                </label>
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
          <Tag className="mr-2" size={24} />
          Animal Management
        </h1>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by animal ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Add Animal Form */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <Plus className="mr-2" size={20} />
          Add New Animal
        </h2>
        
        <form onSubmit={handleAddAnimal} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Animal ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newAnimal.animal_id}
              onChange={(e) => setNewAnimal({ ...newAnimal, animal_id: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="e.g. COW-001"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Milk (L/day) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={newAnimal.target_milk}
              onChange={(e) => setNewAnimal({ ...newAnimal, target_milk: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="e.g. 25.5"
              required
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="new_is_active"
              checked={newAnimal.is_active}
              onChange={(e) => setNewAnimal({...newAnimal, is_active: e.target.checked})}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <label htmlFor="new_is_active" className="ml-2 text-sm text-gray-700">
              Currently Active
            </label>
          </div>
          
          <div className="flex justify-end md:col-span-2">
            <button
              type="submit"
              disabled={addLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center disabled:opacity-50 min-w-[120px]"
            >
              {addLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Animal"
              )}
            </button>
          </div>
        </form>
        
        {error && (
          <div className="mt-3 p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Animal List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b flex flex-col sm:flex-row sm:justify-between sm:items-center">
          <h2 className="text-lg font-semibold flex items-center mb-2 sm:mb-0">
            <Milk className="mr-2" size={20} />
            Animal List
          </h2>
          <p className="text-sm text-gray-500">
            {animals.length} animal{animals.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2">Loading animals...</p>
          </div>
        ) : animals.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchTerm ? 'No animals match your search' : 'No animals found. Add your first animal.'}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Animal ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Target Milk (L/day)
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
                  {animals.map((animal) => (
                    <tr key={animal.animal_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {animal.animal_id}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {animal.target_milk}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(animal)}
                          className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 ${
                            animal.is_active ? 'bg-green-500' : 'bg-gray-300'
                          }`}
                        >
                          <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ${
                            animal.is_active ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                        <span className="ml-2 text-sm">
                          {animal.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openEditModal(animal)}
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
              {animals.map((animal) => (
                <div 
                  key={animal.animal_id} 
                  className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200"
                >
                  <div className="p-4 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Tag className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">
                        {animal.animal_id}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditModal(animal)}
                        className="text-blue-600 hover:text-blue-800 transition-colors p-1"
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(animal)}
                        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 ${
                          animal.is_active ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ${
                          animal.is_active ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500">Target Milk</p>
                        <p className="font-medium">{animal.target_milk} L/day</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500">Status</p>
                        <p className={`font-medium ${animal.is_active ? 'text-green-600' : 'text-red-600'}`}>
                          {animal.is_active ? 'Active' : 'Inactive'}
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

export default AnimalManagement;