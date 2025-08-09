import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  User, Lock, Edit, X, Check, LogOut, Eye, EyeOff, 
  Plus, Search, ChevronDown, ChevronUp, Shield, Users 
} from 'lucide-react';

interface ProfileUser {
  id: string;
  username: string;
  email: string;
  role: string;
}

const ProfilePage: React.FC = () => {
  const { user, logout, updateUsername, changePassword } = useAuth();
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newUsername, setNewUsername] = useState(user?.username || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  
  // Admin management states
  const [activeTab, setActiveTab] = useState<'supervisor' | 'admin'>('supervisor');
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<ProfileUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState('');
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showAdminUsernameModal, setShowAdminUsernameModal] = useState(false);
  const [showAdminPasswordModal, setShowAdminPasswordModal] = useState(false);
  const [selectedAdminUser, setSelectedAdminUser] = useState<ProfileUser | null>(null);
  const [adminNewUsername, setAdminNewUsername] = useState('');
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');
  const [adminPasswordError, setAdminPasswordError] = useState('');

  // Get auth token
  const getToken = () => {
    const userData = localStorage.getItem('dairyFarmUser');
    if (!userData) return null;
    try {
      return JSON.parse(userData).token;
    } catch (err) {
      console.error('Error parsing user data:', err);
      return null;
    }
  };

  // Fetch all users for admin management
  useEffect(() => {
    if (user?.role !== 'admin') return;

    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        setUsersError('');
        
        const token = getToken();
        if (!token) {
          setUsersError('Authentication token not found');
          setLoadingUsers(false);
          return;
        }
        
        const response = await fetch(`https://nemmadi-dairy-farm.koyeb.app/api/users/?role=${activeTab}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            setUsersError('Session expired. Please login again.');
          } else {
            throw new Error('Failed to fetch users');
          }
          return;
        }
        
        const data = await response.json();
        setUsers(data);
        setLoadingUsers(false);
      } catch (err) {
        setUsersError(err instanceof Error ? err.message : 'Failed to load users');
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [activeTab, user]);

  // Current user actions
  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setUsernameError('');
    
    try {
      await updateUsername(newUsername);
      setShowUsernameModal(false);
    } catch (err) {
      setUsernameError(err instanceof Error ? err.message : 'Failed to update username');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setPasswordError('');
    
    try {
      if (newPassword !== confirmPassword) {
        throw new Error("Passwords don't match");
      }
      
      await changePassword(currentPassword, newPassword);
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Admin user actions
  const handleAdminUsernameSubmit = async () => {
    if (!selectedAdminUser || !adminNewUsername.trim()) {
      setAdminPasswordError('Username cannot be empty');
      return;
    }
    
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found');
      
      const response = await fetch(`https://nemmadi-dairy-farm.koyeb.app/api/users/${selectedAdminUser.id}/update-username/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ new_username: adminNewUsername })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update username');
      }
      
      // Update local state
      setUsers(users.map(u => 
        u.id === selectedAdminUser.id ? {...u, username: adminNewUsername} : u
      ));
      
      setShowAdminUsernameModal(false);
      setAdminNewUsername('');
    } catch (err) {
      setAdminPasswordError(err instanceof Error ? err.message : 'Failed to update username');
    }
  };

  const handleAdminPasswordSubmit = async () => {
    if (!selectedAdminUser) return;
    
    if (adminNewPassword !== adminConfirmPassword) {
      setAdminPasswordError("Passwords don't match");
      return;
    }
    
    if (adminNewPassword.length < 8) {
      setAdminPasswordError('Password must be at least 8 characters');
      return;
    }
    
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication token not found');
      
      const response = await fetch(`https://nemmadi-dairy-farm.koyeb.app/api/users/${selectedAdminUser.id}/change-password/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ new_password: adminNewPassword })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to change password');
      }
      
      setShowAdminPasswordModal(false);
      setAdminNewPassword('');
      setAdminConfirmPassword('');
      setAdminPasswordError('');
    } catch (err) {
      setAdminPasswordError(err instanceof Error ? err.message : 'Failed to change password');
    }
  };

  // Filter users based on search
  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user) {
    return <div className="flex justify-center items-center h-screen">Loading profile...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-4 px-3 sm:py-8 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 p-4 sm:p-6 lg:p-8">
            <div className="flex items-center">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl border border-white/30">
                <User className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
              </div>
              <div className="ml-4 sm:ml-6">
                <h1 className="text-xl sm:text-2xl font-bold text-white truncate max-w-48 sm:max-w-none">
                  {user.username}
                </h1>
                <p className="text-blue-100 mt-1 text-sm sm:text-base flex items-center">
                  <Shield className="h-4 w-4 mr-2" />
                  {user.role === 'admin' ? 'Admin Account' : 'Supervisor Account'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Profile Actions */}
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="space-y-4 sm:space-y-6">
              {/* Username Section */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 space-y-3 sm:space-y-0">
                <div className="flex items-center min-w-0 flex-1">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="ml-3 min-w-0 flex-1">
                    <span className="text-sm text-gray-600 block mb-1">Username</span>
                    <span className="font-semibold text-gray-900 truncate block">{user.username}</span>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setNewUsername(user.username);
                    setShowUsernameModal(true);
                  }}
                  className="flex items-center justify-center px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-200 font-medium text-sm"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Change
                </button>
              </div>
              
              {/* Password Section */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 space-y-3 sm:space-y-0">
                <div className="flex items-center min-w-0 flex-1">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <Lock className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="ml-3 min-w-0 flex-1">
                    <span className="text-sm text-gray-600 block mb-1">Password</span>
                    <span className="font-semibold text-gray-900">••••••••</span>
                  </div>
                </div>
                <button 
                  onClick={() => setShowPasswordModal(true)}
                  className="flex items-center justify-center px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-200 font-medium text-sm"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Change
                </button>
              </div>
              
              {/* User Management Section - Only for Admins */}
              {user.role === 'admin' && (
                <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => setShowUserManagement(!showUserManagement)}
                    className="w-full flex justify-between items-center p-4 text-left font-medium text-gray-800 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center">
                      <Users className="h-5 w-5 mr-3 text-indigo-600" />
                      <span>User Management</span>
                    </div>
                    {showUserManagement ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </button>
                  
                  {showUserManagement && (
                    <div className="p-4 border-t border-gray-200">
                      <div className="mb-6">
                        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
                          <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Search className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              type="text"
                              placeholder="Search users..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                          </div>
                          
                          <button 
                          // In ProfilePage
                          onClick={() => navigate('/Add-Users')}
                          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-all whitespace-nowrap"
                        >
                          <Plus className="h-5 w-5" />
                          Add User
                        </button>
                        </div>
                        
                        {/* Tabs */}
                        <div className="flex border-b border-gray-200 mb-4">
                          <button
                            className={`py-2 px-4 font-medium text-sm ${
                              activeTab === 'supervisor'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                            onClick={() => setActiveTab('supervisor')}
                          >
                            Supervisor Users
                          </button>
                          <button
                            className={`py-2 px-4 font-medium text-sm ${
                              activeTab === 'admin'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                            onClick={() => setActiveTab('admin')}
                          >
                            Admin Users
                          </button>
                        </div>
                        
                        {/* User Table */}
                        {loadingUsers ? (
                          <div className="flex justify-center items-center h-32">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                          </div>
                        ) : usersError ? (
                          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg">
                            {usersError}
                          </div>
                        ) : filteredUsers.length === 0 ? (
                          <div className="text-center py-6 text-gray-500">
                            No users found
                          </div>
                        ) : (
                          <div>
                            {/* Desktop Table */}
                            <div className="hidden sm:block overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-4 py-2 text-left font-medium text-gray-500">Username</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-500">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {filteredUsers.map((u) => (
                                    <tr key={u.id} className="hover:bg-gray-50">
                                      <td className="px-4 py-3">
                                        <div className="flex items-center">
                                          <span className="font-medium text-gray-900">{u.username}</span>
                                          <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                                            u.role === 'admin' 
                                              ? 'bg-purple-100 text-purple-800' 
                                              : 'bg-blue-100 text-blue-800'
                                          }`}>
                                            {u.role}
                                          </span>
                                        </div>
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="flex gap-2">
                                          <button
                                            onClick={() => {
                                              setSelectedAdminUser(u);
                                              setAdminNewUsername(u.username);
                                              setShowAdminUsernameModal(true);
                                            }}
                                            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 px-2 py-1 hover:bg-blue-50 rounded border border-blue-100"
                                          >
                                            <User className="h-3 w-3" />
                                            Username
                                          </button>
                                          <button
                                            onClick={() => {
                                              setSelectedAdminUser(u);
                                              setShowAdminPasswordModal(true);
                                            }}
                                            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 px-2 py-1 hover:bg-blue-50 rounded border border-blue-100"
                                          >
                                            <Lock className="h-3 w-3" />
                                            Password
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            
                            {/* Mobile List */}
                            <div className="sm:hidden space-y-3">
                              {filteredUsers.map((u) => (
                                <div key={u.id} className="bg-white rounded-lg border border-gray-200 p-4">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <div className="font-medium text-gray-900">{u.username}</div>
                                      <span className={`text-xs px-2 py-1 rounded-full mt-1 ${
                                        u.role === 'admin' 
                                          ? 'bg-purple-100 text-purple-800' 
                                          : 'bg-blue-100 text-blue-800'
                                      }`}>
                                        {u.role}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="mt-3 flex gap-2">
                                    <button
                                      onClick={() => {
                                        setSelectedAdminUser(u);
                                        setAdminNewUsername(u.username);
                                        setShowAdminUsernameModal(true);
                                      }}
                                      className="flex-1 flex items-center justify-center gap-1 text-xs text-blue-600 hover:text-blue-800 px-2 py-2 hover:bg-blue-50 rounded border border-blue-100"
                                    >
                                      <User className="h-3 w-3" />
                                      Username
                                    </button>
                                    <button
                                      onClick={() => {
                                        setSelectedAdminUser(u);
                                        setShowAdminPasswordModal(true);
                                      }}
                                      className="flex-1 flex items-center justify-center gap-1 text-xs text-blue-600 hover:text-blue-800 px-2 py-2 hover:bg-blue-50 rounded border border-blue-100"
                                    >
                                      <Lock className="h-3 w-3" />
                                      Password
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Logout Button */}
              <div className="pt-4 sm:pt-6">
                <button
                  onClick={logout}
                  className="w-full py-3 px-4 bg-gradient-to-r from-red-50 to-red-100 text-red-700 rounded-xl font-semibold hover:from-red-100 hover:to-red-200 flex items-center justify-center transition-all duration-200 border border-red-200 hover:border-red-300"
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Current User Username Change Modal */}
      {showUsernameModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto border border-gray-200">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Change Username</h2>
                <button 
                  onClick={() => setShowUsernameModal(false)} 
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div>
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    New Username
                  </label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-base"
                    placeholder="Enter new username"
                    required
                  />
                </div>
                
                {usernameError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {usernameError}
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowUsernameModal(false)}
                    disabled={isSubmitting}
                    className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-colors duration-200 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    onClick={handleUsernameSubmit}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center justify-center font-medium transition-colors duration-200 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Updating...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Update Username
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Current User Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Change Password</h2>
                <button 
                  onClick={() => setShowPasswordModal(false)} 
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-base"
                      placeholder="Enter current password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                    >
                      {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-base"
                      placeholder="Enter new password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                    >
                      {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-base"
                      placeholder="Confirm new password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                
                {passwordError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {passwordError}
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    disabled={isSubmitting}
                    className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-colors duration-200 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    onClick={handlePasswordSubmit}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center justify-center font-medium transition-colors duration-200 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Updating...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Change Password
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Admin Username Change Modal */}
      {showAdminUsernameModal && selectedAdminUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto border border-gray-200">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">
                  Update Username for {selectedAdminUser.username}
                </h2>
                <button 
                  onClick={() => setShowAdminUsernameModal(false)} 
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div>
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    New Username
                  </label>
                  <input
                    type="text"
                    value={adminNewUsername}
                    onChange={(e) => setAdminNewUsername(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-base"
                    placeholder="Enter new username"
                    required
                  />
                </div>
                
                {adminPasswordError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {adminPasswordError}
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAdminUsernameModal(false)}
                    className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAdminUsernameSubmit}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center justify-center font-medium transition-colors duration-200"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Update Username
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Admin Password Change Modal */}
      {showAdminPasswordModal && selectedAdminUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto border border-gray-200">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">
                  Change Password for {selectedAdminUser.username}
                </h2>
                <button 
                  onClick={() => setShowAdminPasswordModal(false)} 
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={adminNewPassword}
                      onChange={(e) => setAdminNewPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-base"
                      placeholder="Enter new password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                    >
                      {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={adminConfirmPassword}
                      onChange={(e) => setAdminConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-base"
                      placeholder="Confirm new password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                
                {adminPasswordError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {adminPasswordError}
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAdminPasswordModal(false)}
                    className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAdminPasswordSubmit}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center justify-center font-medium transition-colors duration-200"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Change Password
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;