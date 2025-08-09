import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios, { AxiosError } from 'axios';
import { 
  Bell, X, Milk, ClipboardCheck, Trash2,
  AlertTriangle, Wrench, BadgeIndianRupeeIcon, User,
  Loader
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: number;
  notification_type: string;
  message: string;
  record_name: string;
  is_read: boolean;
  created_at: string;
  time_ago: string;
  supervisor_username?: string;
}

const NotificationPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get icon for notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'milk_yield': return <Milk className="w-5 h-5 text-blue-600" />;
      case 'inspection': return <ClipboardCheck className="w-5 h-5 text-red-600" />;
      case 'red_flag': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'equipment': return <Wrench className="w-5 h-5 text-yellow-600" />;
      case 'financial': return <BadgeIndianRupeeIcon className="w-5 h-5 text-green-600" />;
      case 'staff_attendance': return <User className="w-5 h-5 text-purple-600" />;
      default: return <ClipboardCheck className="w-5 h-5" />;
    }
  };

  // Get color for notification type
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'milk_yield': return 'bg-blue-50 border-blue-200';
      case 'inspection': return 'bg-red-50 border-red-200';
      case 'red_flag': return 'bg-red-50 border-red-200';
      case 'equipment': return 'bg-yellow-50 border-yellow-200';
      case 'financial': return 'bg-green-50 border-green-200';
      case 'staff_attendance': return 'bg-purple-50 border-purple-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  // Fetch all notifications
  const fetchNotifications = async () => {
    if (!user || !user.token) return;
    
    setError(null);
    setLoading(true);
    
    try {
      const response = await axios.get(
        'https://nemmadi-dairy-farm.koyeb.app/api/notifications/', 
        {
          headers: {
            Authorization: `Bearer ${user.token}`
          }
        }
      );
      
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Failed to fetch notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Clear all notifications
  const clearAllNotifications = async () => {
    if (!user || !user.token || notifications.length === 0) return;
    
    setClearing(true);
    setError(null);
    
    try {
      await axios.delete(
        'https://nemmadi-dairy-farm.koyeb.app/api/notifications/clear-all/', 
        {
          headers: {
            Authorization: `Bearer ${user.token}`
          }
        }
      );
      
      setNotifications([]);
    } catch (err) {
      const axiosError = err as AxiosError;
      console.error('Error clearing notifications:', axiosError);
      
      if (axiosError.response?.status === 405) {
        setError('Server configuration error. Contact administrator.');
      } else if (axiosError.code === 'ERR_NETWORK') {
        setError('Network error. Check your connection or CORS configuration.');
      } else {
        setError('Failed to clear notifications. Please try again.');
      }
    } finally {
      setClearing(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchNotifications();
    } else {
      navigate('/');
    }
  }, [user, navigate]);

  if (user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Bell className="h-8 w-8 text-white" />
                <h1 className="text-2xl font-bold text-white">Notifications Management</h1>
              </div>
              <button
                onClick={() => navigate(-1)}
                className="text-white hover:text-blue-200 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
          
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <p className="text-gray-600">
                {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
              </p>
              <button
                onClick={clearAllNotifications}
                disabled={notifications.length === 0 || clearing}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md ${
                  notifications.length === 0 || clearing
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {clearing ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    <span>Clearing...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    <span>Clear All</span>
                  </>
                )}
              </button>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mx-6 mt-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="divide-y divide-gray-200">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">No notifications</h3>
                <p className="mt-1 text-gray-500">All caught up! No notifications to display.</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`p-4 hover:bg-gray-50 ${getNotificationColor(notification.notification_type)}`}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 p-2 rounded-full bg-white border">
                      {getNotificationIcon(notification.notification_type)}
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="text-base font-medium text-gray-900">
                            {notification.record_name}
                          </h3>
                          <p className="mt-1 text-sm text-gray-600">
                            {notification.message}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-2 flex flex-wrap justify-between">
                        <div className="flex items-center space-x-2">
                          {notification.supervisor_username && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                              <User className="mr-1 h-3 w-3" />
                              {notification.supervisor_username}
                            </span>
                          )}
                          
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                            {notification.notification_type.replace('_', ' ')}
                          </span>
                        </div>
                        
                        <div className="mt-2 sm:mt-0 flex items-center">
                          <p className="text-xs text-gray-500">
                            {notification.time_ago}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPage;