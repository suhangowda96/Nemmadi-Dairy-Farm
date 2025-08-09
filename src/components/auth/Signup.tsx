import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import DairyLogo from '../../../images/nemmadi.png';

const Signup: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'admin' | 'supervisor'>('supervisor');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    role: 'supervisor'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

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

  const handleTabChange = (tab: 'admin' | 'supervisor') => {
    setActiveTab(tab);
    setFormData(prev => ({
      ...prev,
      role: tab
    }));
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

      const { success, fieldErrors: apiErrors } = await signup({
        username: formData.username,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        role: activeTab
      });

      if (apiErrors) {
        setFieldErrors(apiErrors);
      }

      if (success) {
        navigate('/dashboard');
      }
    } catch (error) {
      setFieldErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-8">
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
            Create Account
          </h2>
          <p className="text-blue-100">Join our platform</p>
        </div>

        <div className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection Tabs - Moved here and styled as connected buttons */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Type
              </label>
              <div className="inline-flex rounded-md shadow-sm">
                <button
                  type="button"
                  onClick={() => handleTabChange('admin')}
                  className={`px-4 py-2 text-sm font-medium ${
                    activeTab === 'admin'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  } border border-gray-300 rounded-l-lg transition-colors duration-200`}
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('supervisor')}
                  className={`px-4 py-2 text-sm font-medium ${
                    activeTab === 'supervisor'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  } border border-gray-300 border-l-0 rounded-r-lg transition-colors duration-200`}
                >
                  Supervisor
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Creating {activeTab} account
              </p>
            </div>

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
                  placeholder="Choose a unique username"
                  required
                  autoComplete="username"
                />
                {fieldErrors.username && (
                  <div className="text-red-500 text-sm mt-1 animate-fade-in">
                    {fieldErrors.username}
                  </div>
                )}
              </div>
            </div>

            {/* Rest of the form remains the same */}
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
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={`block w-full pl-10 pr-4 py-3 border ${
                    fieldErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                  placeholder="Confirm your password"
                  required
                  autoComplete="new-password"
                />
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

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting || passwordErrors.length > 0}
                className={`w-full flex justify-center items-center gap-2 ${
                  isSubmitting || passwordErrors.length > 0
                    ? 'bg-blue-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 pt-5 border-t border-gray-200">
            <p className="text-gray-600 text-center">
              Already have an account?{' '}
              <Link 
                to="/login" 
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
              >
                Sign in here
              </Link>
            </p>
            
            <div className="mt-4 text-center">
              <Link 
                to="/forgot-password" 
                className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
              >
                Forgot password?
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;