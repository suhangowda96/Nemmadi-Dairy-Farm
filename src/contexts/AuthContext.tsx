import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface User {
  id: string;
  username: string;
  token: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (data: { username: string; password: string; role: string }) => Promise<{ success: boolean; fieldErrors?: Record<string, string> }>;
  signup: (data: { username: string; password: string; confirmPassword: string; role: string }) => Promise<{ success: boolean; fieldErrors?: Record<string, string> }>;
  addUser: (data: { username: string; password: string; confirmPassword: string; role: string }) => Promise<{ success: boolean; fieldErrors?: Record<string, string> }>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  updateUsername: (newUsername: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const initializeAuth = async () => {
      const savedUser = localStorage.getItem('dairyFarmUser');
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
        } catch (err) {
          console.error('Error parsing saved user:', err);
          localStorage.removeItem('dairyFarmUser');
        }
      }
      setIsInitializing(false);
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    if (isInitializing) return;

    const publicRoutes = ['/login', '/signup', '/forgot-password'];
    const isPublicRoute = publicRoutes.includes(location.pathname);

    if (!user && !isPublicRoute) {
      navigate('/login', { replace: true });
    } else if (user && isPublicRoute) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, isInitializing, location, navigate]);

  const signup = async (data: { 
    username: string; 
    password: string;
    confirmPassword: string;
    role: string;
  }): Promise<{ success: boolean; fieldErrors?: Record<string, string> }> => {
    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        username: data.username,
        password: data.password,
        confirmPassword: data.confirmPassword,
        role: data.role
      };
    
      const response = await fetch('http://localhost:8000/api/signup/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        const fieldErrors: Record<string, string> = {};
        
        if (errorData.username) {
          fieldErrors.username = Array.isArray(errorData.username) 
            ? errorData.username[0] 
            : errorData.username;
        } 
        if (errorData.password) {
          fieldErrors.password = Array.isArray(errorData.password)
            ? errorData.password.join(' ') 
            : errorData.password;
        }
        if (errorData.confirmPassword) {
          fieldErrors.confirmPassword = Array.isArray(errorData.confirmPassword)
            ? errorData.confirmPassword.join(' ') 
            : errorData.confirmPassword;
        }
        if (errorData.role) {
          fieldErrors.role = Array.isArray(errorData.role)
            ? errorData.role.join(' ')
            : errorData.role;
        }
        if (errorData.detail) {
          fieldErrors.general = errorData.detail;
        } 
        if (errorData.non_field_errors) {
          fieldErrors.general = errorData.non_field_errors.join(' ');
        }
        
        return { success: false, fieldErrors };
      }

      const responseData = await response.json();
  
      const newUser: User = {
        id: responseData.user_id.toString(),
        username: responseData.username,
        token: responseData.access,
        role: responseData.role
      };

      setUser(newUser);
      localStorage.setItem('dairyFarmUser', JSON.stringify(newUser));
      setIsLoading(false);
      return { success: true };
    } catch (err) {
      console.error('[AuthContext] Signup error:', err);
      setIsLoading(false);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      return { 
        success: false, 
        fieldErrors: { general: errorMessage } 
      };
    }
  };

  const login = async (data: { 
    username: string; 
    password: string;
    role: string;
  }): Promise<{ success: boolean; fieldErrors?: Record<string, string> }> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/api/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: data.username,
          password: data.password,
          role: data.role
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        const fieldErrors: Record<string, string> = {};
        
        if (errorData.detail) {
          fieldErrors.general = errorData.detail;
        } else if (errorData.non_field_errors) {
          fieldErrors.general = errorData.non_field_errors.join(' ');
        } else if (errorData.role) {
          fieldErrors.role = Array.isArray(errorData.role)
            ? errorData.role.join(' ')
            : errorData.role;
        } else {
          fieldErrors.general = 'Login failed';
        }
        
        return { 
        success: false, 
        fieldErrors: { 
          general: 'Invalid username or password' 
        } 
      };
    }

      const responseData = await response.json();
      
      // Verify role matches
      if (responseData.role !== data.role) {
        return { 
          success: false, 
          fieldErrors: { 
            general: `User is not registered as ${data.role}` 
          } 
        };
      }
      
      const loggedInUser: User = {
      id: responseData.user_id.toString(),
      username: responseData.username,
      token: responseData.access,
      role: responseData.role
    };

    setUser(loggedInUser);
    localStorage.setItem('dairyFarmUser', JSON.stringify(loggedInUser));
    setIsLoading(false);
    navigate('/dashboard');
    return { success: true };
  } catch (err) {
    console.error('[AuthContext] Login error:', err);
    setIsLoading(false);
    return { 
      success: false, 
      fieldErrors: { general: 'Invalid username or password' } 
    };
  }
};

  const addUser = async (data: { 
    username: string; 
    password: string;
    confirmPassword: string;
    role: string 
  }): Promise<{ success: boolean; fieldErrors?: Record<string, string> }> => {
    if (!user || user.role !== 'admin') {
      return { success: false, fieldErrors: { general: 'Unauthorized' } };
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/api/signup/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          username: data.username,
          password: data.password,
          confirmPassword: data.confirmPassword,
          role: data.role
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        const fieldErrors: Record<string, string> = {};

        // Handle different error types
        if (errorData.username) {
          fieldErrors.username = Array.isArray(errorData.username) 
            ? errorData.username[0] 
            : errorData.username;
        }
        if (errorData.password) {
          fieldErrors.password = Array.isArray(errorData.password) 
            ? errorData.password.join(' ') 
            : errorData.password;
        }
        if (errorData.confirmPassword) {
          fieldErrors.confirmPassword = Array.isArray(errorData.confirmPassword) 
            ? errorData.confirmPassword.join(' ') 
            : errorData.confirmPassword;
        }
        if (errorData.role) {
          fieldErrors.role = Array.isArray(errorData.role) 
            ? errorData.role.join(' ') 
            : errorData.role;
        }
        if (errorData.detail) {
          fieldErrors.general = errorData.detail;
        }
        if (errorData.non_field_errors) {
          fieldErrors.general = errorData.non_field_errors.join(' ');
        }

        return { success: false, fieldErrors };
      }

      setIsLoading(false);
      return { success: true };
    } catch (err) {
      console.error('[AuthContext] Add user error:', err);
      setIsLoading(false);
      return { success: false, fieldErrors: { general: 'An error occurred' } };
    }
  };

  const updateUsername = async (newUsername: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:8000/api/user/change-username/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ new_username: newUsername })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update username');
      }

      const updatedUser = { ...user, username: newUsername };
      setUser(updatedUser);
      localStorage.setItem('dairyFarmUser', JSON.stringify(updatedUser));
    } catch (err) {
      console.error('[AuthContext] Update username error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:8000/api/user/change-password/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ 
          old_password: currentPassword,
          new_password: newPassword,
          confirm_password: newPassword
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.old_password?.[0] || 
          errorData.new_password?.[0] || 
          'Failed to change password'
        );
      }
    } catch (err) {
      console.error('[AuthContext] Change password error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('dairyFarmUser');
    navigate('/login');
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    login,
    signup,
    addUser,
    logout,
    isLoading,
    error,
    clearError,
    updateUsername,
    changePassword
  };

  if (isInitializing) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};