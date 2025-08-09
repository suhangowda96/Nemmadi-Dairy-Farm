import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import DairyLogo from '../../../images/nemmadi.png';

const AddUserPage: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    role: 'supervisor'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { user, addUser } = useAuth();
  const navigate = useNavigate();

  // Redirect if not admin
  React.useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    if (name === 'password') {
      validatePassword(value);
    }
  };

  const validatePassword = (password: string) => {
    const errors = [];
    
    if (password.length < 8) {
      errors.push("At least 8 characters");
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push("One uppercase letter");
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push("One number");
    }
    
    if (!/[!@#$%^&*()\-_=+[\]{}|;:'",.<>/?]/.test(password)) {
      errors.push("One special character");
    }
    
    setPasswordErrors(errors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFieldErrors({});
    setPasswordErrors([]);

    try {
      if (!formData.username || !formData.password || !formData.confirmPassword) {
        setFieldErrors({ general: 'Please fill in all fields' });
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setFieldErrors({ confirmPassword: 'Passwords do not match' });
        return;
      }

      validatePassword(formData.password);
      if (passwordErrors.length > 0) {
        setFieldErrors({ password: 'Password does not meet requirements' });
        return;
      }

      const { success, fieldErrors: apiErrors } = await addUser({
        username: formData.username,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        role: formData.role
      });

      if (apiErrors) {
        setFieldErrors(apiErrors);
      }

      if (success) {
        setIsSuccess(true);
        setFormData({
          username: '',
          password: '',
          confirmPassword: '',
          role: 'supervisor'
        });
        setPasswordErrors([]);
        setShowPassword(false);
        setShowConfirmPassword(false);
        
        setTimeout(() => {
          setIsSuccess(false);
        }, 3000);
      }
    } catch (error) {
      setFieldErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-8">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 p-8 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            You must be an admin to access this page.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-8">
      {isSuccess && (
        <div className="fixed top-6 right-6 z-50">
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-lg flex items-center animate-fade-in">
            <Check className="h-5 w-5 mr-2" />
            <span className="font-medium">Account created successfully!</span>
          </div>
        </div>
      )}

      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full backdrop-blur-sm overflow-hidden">
            <img 
              src={DairyLogo} 
              alt="Dairy Farm Logo" 
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mt-4 mb-2">
            Add New User
          </h2>
          <p className="text-blue-100">Create a new system account</p>
        </div>

        <div className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={`block w-full pl-10 pr-4 py-3 border ${
                    fieldErrors.username ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                  placeholder="Enter a username"
                  required
                  autoComplete="new-username"
                />
                {fieldErrors.username && (
                  <div className="text-red-500 text-sm mt-1 animate-fade-in">
                    {fieldErrors.username}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({...prev, role: 'admin'}))}
                  className={`px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    formData.role === 'admin'
                      ? 'bg-blue-600 text-white border border-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                  }`}
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({...prev, role: 'supervisor'}))}
                  className={`px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    formData.role === 'supervisor'
                      ? 'bg-blue-600 text-white border border-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                  }`}
                >
                  Supervisor
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Creating {formData.role} account
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={`block w-full pl-10 pr-12 py-3 border ${
                    fieldErrors.password ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                  placeholder="Create a strong password"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? 
                    <EyeOff className="h-5 w-5" /> : 
                    <Eye className="h-5 w-5" />
                  }
                </button>
                {fieldErrors.password && (
                  <div className="text-red-500 text-sm mt-1 animate-fade-in">
                    {fieldErrors.password}
                  </div>
                )}
              </div>
              {passwordErrors.length > 0 && (
                <div className="mt-2 text-sm text-gray-600">
                  <p className="font-medium">Password must contain:</p>
                  <ul className="mt-1 space-y-1">
                    {passwordErrors.map((err, index) => (
                      <li 
                        key={index} 
                        className="flex items-center"
                      >
                        <span className={`inline-block w-1.5 h-1.5 rounded-full mr-2 ${
                          formData.password && 
                          (err === "At least 8 characters" && formData.password.length >= 8) ||
                          (err === "One uppercase letter" && /[A-Z]/.test(formData.password)) ||
                          (err === "One number" && /[0-9]/.test(formData.password)) ||
                          (err === "One special character" && /[!@#$%^&*()\-_=+[\]{}|;:'",.<>/?]/.test(formData.password)) 
                            ? 'bg-green-500' : 'bg-red-500'
                        }`}></span>
                        <span className={formData.password && 
                          (err === "At least 8 characters" && formData.password.length >= 8) ||
                          (err === "One uppercase letter" && /[A-Z]/.test(formData.password)) ||
                          (err === "One number" && /[0-9]/.test(formData.password)) ||
                          (err === "One special character" && /[!@#$%^&*()\-_=+[\]{}|;:'",.<>/?]/.test(formData.password)) 
                            ? 'text-green-600' : 'text-red-500'
                        }>
                          {err}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={`block w-full pl-10 pr-12 py-3 border ${
                    fieldErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                  placeholder="Confirm your password"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isSubmitting}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? 
                    <EyeOff className="h-5 w-5" /> : 
                    <Eye className="h-5 w-5" />
                  }
                </button>
                {fieldErrors.confirmPassword && (
                  <div className="text-red-500 text-sm mt-1 animate-fade-in">
                    {fieldErrors.confirmPassword}
                  </div>
                )}
              </div>
            </div>

            {fieldErrors.general && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm animate-fade-in">
                {fieldErrors.general}
              </div>
            )}

            <div className="pt-4 flex gap-3">
              <button
                type="button"
                onClick={() => navigate('/profile')}
                disabled={isSubmitting}
                className="flex-1 bg-gray-200 text-gray-800 hover:bg-gray-300 font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || passwordErrors.length > 0}
                className={`flex-1 flex justify-center items-center gap-2 ${
                  isSubmitting || passwordErrors.length > 0
                    ? 'bg-blue-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Adding User...
                  </>
                ) : (
                  'Add User'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddUserPage;