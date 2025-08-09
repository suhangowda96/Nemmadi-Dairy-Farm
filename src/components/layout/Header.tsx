import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Bell, User, X, Syringe, Calendar,
  Milk, PiggyBank, AlertTriangle, Wrench, Coins, UserCheck, Package, Pill
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DairyLogo from '../../../images/nemmadi.png';

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

interface UpcomingEvent {
  id: number;
  event_type: 'deworming' | 'vaccination' | 'purchase_order';
  title: string;
  due_date: string;
  animal_id?: string;
  dewormer?: string;
  vaccine?: string;
  po_no?: string;
  item?: string;
  created_at: string;
  time_ago: string;
}

// Persistent dismissal tracking with error handling
const useDismissedNotifications = () => {
  const getDismissed = () => {
    try {
      const saved = localStorage.getItem('dismissedNotifications');
      return saved ? new Set<number>(JSON.parse(saved)) : new Set<number>();
    } catch (e) {
      console.error('Error reading localStorage:', e);
      return new Set<number>();
    }
  };

  const [dismissedIds, setDismissedIds] = useState<Set<number>>(getDismissed);

  const dismissNotification = useCallback((id: number) => {
    setDismissedIds(prev => {
      const newSet = new Set(prev);
      newSet.add(id);
      try {
        localStorage.setItem('dismissedNotifications', JSON.stringify([...newSet]));
      } catch (e) {
        console.error('Error writing to localStorage:', e);
      }
      return newSet;
    });
  }, []);

  const dismissAllNotifications = useCallback((ids: number[]) => {
    setDismissedIds(prev => {
      const newSet = new Set(prev);
      ids.forEach(id => newSet.add(id));
      try {
        localStorage.setItem('dismissedNotifications', JSON.stringify([...newSet]));
      } catch (e) {
        console.error('Error writing to localStorage:', e);
      }
      return newSet;
    });
  }, []);

  const isDismissed = useCallback((id: number) => dismissedIds.has(id), [dismissedIds]);

  return { dismissNotification, dismissAllNotifications, isDismissed };
};

// Track shown notifications to prevent duplicates
const useShownNotifications = () => {
  const getShown = () => {
    try {
      const saved = localStorage.getItem('shownNotifications');
      return saved ? new Set<number>(JSON.parse(saved)) : new Set<number>();
    } catch (e) {
      console.error('Error reading localStorage:', e);
      return new Set<number>();
    }
  };

  const [shownIds, setShownIds] = useState<Set<number>>(getShown);

  const markAsShown = useCallback((id: number) => {
    setShownIds(prev => {
      const newSet = new Set(prev);
      newSet.add(id);
      try {
        localStorage.setItem('shownNotifications', JSON.stringify([...newSet]));
      } catch (e) {
        console.error('Error writing to localStorage:', e);
      }
      return newSet;
    });
  }, []);

  const markMultipleAsShown = useCallback((ids: number[]) => {
    setShownIds(prev => {
      const newSet = new Set(prev);
      ids.forEach(id => newSet.add(id));
      try {
        localStorage.setItem('shownNotifications', JSON.stringify([...newSet]));
      } catch (e) {
        console.error('Error writing to localStorage:', e);
      }
      return newSet;
    });
  }, []);

  const isShown = useCallback((id: number) => shownIds.has(id), [shownIds]);

  return { shownIds, markAsShown, markMultipleAsShown, isShown };
};

const useDismissedUpcomingEvents = () => {
  const getDismissed = () => {
    try {
      const saved = localStorage.getItem('dismissedUpcomingEvents');
      return saved ? new Set<string>(JSON.parse(saved)) : new Set<string>();
    } catch (e) {
      console.error('Error reading localStorage:', e);
      return new Set<string>();
    }
  };

  const [dismissedKeys, setDismissedKeys] = useState<Set<string>>(getDismissed);

  const dismissEvent = useCallback((key: string) => {
    setDismissedKeys(prev => {
      const newSet = new Set(prev);
      newSet.add(key);
      try {
        localStorage.setItem('dismissedUpcomingEvents', JSON.stringify([...newSet]));
      } catch (e) {
        console.error('Error writing to localStorage:', e);
      }
      return newSet;
    });
  }, []);

  const dismissAllEvents = useCallback((keys: string[]) => {
    setDismissedKeys(prev => {
      const newSet = new Set(prev);
      keys.forEach(key => newSet.add(key));
      try {
        localStorage.setItem('dismissedUpcomingEvents', JSON.stringify([...newSet]));
      } catch (e) {
        console.error('Error writing to localStorage:', e);
      }
      return newSet;
    });
  }, []);

  const isDismissed = useCallback((key: string) => dismissedKeys.has(key), [dismissedKeys]);

  return { dismissEvent, dismissAllEvents, isDismissed };
};

// Track shown upcoming events to prevent duplicates
const useShownUpcomingEvents = () => {
  const getShown = () => {
    try {
      const saved = localStorage.getItem('shownUpcomingEvents');
      return saved ? new Set<string>(JSON.parse(saved)) : new Set<string>();
    } catch (e) {
      console.error('Error reading localStorage:', e);
      return new Set<string>();
    }
  };

  const [shownKeys, setShownKeys] = useState<Set<string>>(getShown);

  const markAsShown = useCallback((key: string) => {
    setShownKeys(prev => {
      const newSet = new Set(prev);
      newSet.add(key);
      try {
        localStorage.setItem('shownUpcomingEvents', JSON.stringify([...newSet]));
      } catch (e) {
        console.error('Error writing to localStorage:', e);
      }
      return newSet;
    });
  }, []);

  const markMultipleAsShown = useCallback((keys: string[]) => {
    setShownKeys(prev => {
      const newSet = new Set(prev);
      keys.forEach(key => newSet.add(key));
      try {
        localStorage.setItem('shownUpcomingEvents', JSON.stringify([...newSet]));
      } catch (e) {
        console.error('Error writing to localStorage:', e);
      }
      return newSet;
    });
  }, []);

  const isShown = useCallback((key: string) => shownKeys.has(key), [shownKeys]);

  return { shownKeys, markAsShown, markMultipleAsShown, isShown };
};

// Map notification types to icons
const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'milk_yield':
      return <Milk className="w-4 h-4 text-blue-600" />;
    case 'equipment':
      return <Wrench className="w-4 h-4 text-yellow-600" />;
    case 'inspection':
      return <PiggyBank className="w-4 h-4 text-red-600" />;
    case 'red_flag':
      return <AlertTriangle className="w-4 h-4 text-red-600" />;
    case 'financial':
      return <Coins className="w-4 h-4 text-green-600" />;
    case 'staff_attendance':
      return <UserCheck className="w-4 h-4 text-purple-600" />;
    default:
      return <Bell className="w-4 h-4 text-gray-600" />;
  }
};

// Map notification types to background colors
const getNotificationBgColor = (type: string) => {
  switch (type) {
    case 'milk_yield':
      return 'bg-blue-50';
    case 'equipment':
      return 'bg-yellow-50';
    case 'inspection':
      return 'bg-red-50';
    case 'red_flag':
      return 'bg-red-50';
    case 'financial':
      return 'bg-green-50';
    case 'staff_attendance':
      return 'bg-purple-50';
    default:
      return 'bg-gray-50';
  }
};

// Map event types to icons
const getEventIcon = (type: string) => {
  switch (type) {
    case 'deworming':
      return <Pill className="w-4 h-4 text-green-600" />;
    case 'vaccination':
      return <Syringe className="w-4 h-4 text-blue-600" />;
    case 'purchase_order':
      return <Package className="w-4 h-4 text-purple-600" />;
    default:
      return <Calendar className="w-4 h-4 text-gray-600" />;
  }
};

// Map event types to background colors
const getEventBgColor = (type: string) => {
  switch (type) {
    case 'deworming':
      return 'bg-green-50';
    case 'vaccination':
      return 'bg-blue-50';
    case 'purchase_order':
      return 'bg-purple-50';
    default:
      return 'bg-gray-50';
  }
};

// Push notification setup
const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    setIsSupported('Notification' in window);
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;
    
    const newPermission = await Notification.requestPermission();
    setPermission(newPermission);
    return newPermission === 'granted';
  }, [isSupported]);

  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!isSupported || permission !== 'granted') return;
    
    // Use the simpler Notification API
    new Notification(title, {
      ...options,
      icon: DairyLogo,
    });
  }, [isSupported, permission]);

  return { isSupported, permission, requestPermission, showNotification };
};


const Header: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUpcomingEvents, setShowUpcomingEvents] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const eventsRef = useRef<HTMLDivElement>(null);
  
  const { 
    dismissNotification, 
    dismissAllNotifications, 
    isDismissed 
  } = useDismissedNotifications();

  const { 
    markAsShown: markNotificationAsShown,
    isShown: isNotificationShown
  } = useShownNotifications();

  const { 
    dismissEvent, 
    dismissAllEvents, 
    isDismissed: isEventDismissed 
  } = useDismissedUpcomingEvents();

  const { 
    markAsShown: markEventAsShown,
    isShown: isEventShown
  } = useShownUpcomingEvents();

  const { 
    isSupported: pushSupported,
    permission: pushPermission,
    requestPermission: requestPushPermission,
    showNotification
  } = usePushNotifications();

  // Filter out dismissed notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter(notification => !isDismissed(notification.id));
  }, [notifications, isDismissed]);

  // Filter out dismissed upcoming events
  const filteredUpcomingEvents = useMemo(() => {
    return upcomingEvents.filter(event => 
      !isEventDismissed(`${event.event_type}_${event.id}`)
    );
  }, [upcomingEvents, isEventDismissed]);

  // Calculate unread count
  const unreadCount = useMemo(() => {
    return filteredNotifications.filter(notification => !notification.is_read).length;
  }, [filteredNotifications]);

  // Calculate upcoming events count
  const upcomingEventsCount = useMemo(() => {
    return filteredUpcomingEvents.length;
  }, [filteredUpcomingEvents]);

  // Check if event is due today
  const isDueToday = (dateString: string) => {
    const today = new Date();
    const dueDate = new Date(dateString);
    return dueDate.toDateString() === today.toDateString();
  };

  // Fetch all notifications for authenticated users
  const fetchNotifications = useCallback(async () => {
    if (!user || !user.token) {
      setLoading(false);
      return;
    }
    
    setError(null);
    setLoading(true);
    
    try {
      const response = await axios.get(
        'http://localhost:8000/api/notifications/', 
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
  }, [user]);

  // Fetch upcoming events for admin and supervisor
  const fetchUpcomingEvents = useCallback(async () => {
    if (!user || !user.token || (user.role !== 'admin' && user.role !== 'supervisor')) {
      setLoadingEvents(false);
      return;
    }
    
    setEventsError(null);
    setLoadingEvents(true);
    
    try {
      // Add query parameters for admin filtering
      const params: Record<string, string> = {};
      if (user.role === 'admin') {
        params.all_supervisors = 'true';
      }

      const response = await axios.get(
        'http://localhost:8000/api/upcoming-events/', 
        {
          headers: {
            Authorization: `Bearer ${user.token}`
          },
          params
        }
      );
      setUpcomingEvents(response.data);
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
      setEventsError('Failed to fetch upcoming events. Please try again.');
    } finally {
      setLoadingEvents(false);
    }
  }, [user]);

  // Handle push notification permission
  useEffect(() => {
    if (pushSupported && pushPermission === 'default' && user?.token) {
      requestPushPermission();
    }
  }, [pushSupported, pushPermission, requestPushPermission, user]);

  // Show push notification when new notification arrives (only once)
  useEffect(() => {
    if (notifications.length > 0 && pushPermission === 'granted') {
      notifications.forEach(notification => {
        // Only show if not dismissed and not previously shown
        if (!isDismissed(notification.id) && !isNotificationShown(notification.id)) {
          showNotification(notification.record_name, {
            body: notification.message,
          });
          // Mark as shown so it won't appear again
          markNotificationAsShown(notification.id);
        }
      });
    }
  }, [notifications, showNotification, pushPermission, isDismissed, isNotificationShown, markNotificationAsShown]);

  // Show push notification for upcoming events due today (only once)
  useEffect(() => {
    if (upcomingEvents.length > 0 && pushPermission === 'granted') {
      upcomingEvents.forEach(event => {
        const eventKey = `${event.event_type}_${event.id}`;
        const isToday = isDueToday(event.due_date);
        
        // Only show if due today, not dismissed, and not previously shown
        if (isToday && !isEventDismissed(eventKey) && !isEventShown(eventKey)) {
          let eventDetails = '';
          
          switch (event.event_type) {
            case 'deworming':
              eventDetails = `Animal: ${event.animal_id} • Dewormer: ${event.dewormer}`;
              break;
            case 'vaccination':
              eventDetails = `Animal: ${event.animal_id} • Vaccine: ${event.vaccine}`;
              break;
            case 'purchase_order':
              eventDetails = `PO: ${event.po_no} • Item: ${event.item}`;
              break;
          }
          
          showNotification(event.title, {
            body: eventDetails,
          });
          
          // Mark as shown so it won't appear again
          markEventAsShown(eventKey);
        }
      });
    }
  }, [upcomingEvents, showNotification, pushPermission, isEventDismissed, isEventShown, markEventAsShown, isDueToday]);

  useEffect(() => {
    // Fetch notifications for all authenticated users
    if (user?.token) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 3600000);
      return () => clearInterval(interval);
    }
  }, [user, fetchNotifications]);

  useEffect(() => {
    // Fetch upcoming events for admin and supervisor
    if (user && (user.role === 'admin' || user.role === 'supervisor')) {
      fetchUpcomingEvents();
      const interval = setInterval(fetchUpcomingEvents, 3600000);
      return () => clearInterval(interval);
    }
  }, [user, fetchUpcomingEvents]);

  // Close popups when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && 
          !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      
      if (eventsRef.current && 
          !eventsRef.current.contains(event.target as Node)) {
        setShowUpcomingEvents(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const handleTitleClick = () => {
    if (user?.role === 'admin') {
      navigate('/all-supervisors-data');
    } else {
      navigate('/');
    }
  };

  const toggleNotifications = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowNotifications(!showNotifications);
    setShowUpcomingEvents(false);
  };

  const toggleUpcomingEvents = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowUpcomingEvents(!showUpcomingEvents);
    setShowNotifications(false);
  };

  const goToNotificationPage = () => {
    navigate('/Notification-Page');
    setShowNotifications(false);
  };

  const handleDismiss = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    dismissNotification(id);
  };

  const handleDismissAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    const ids = filteredNotifications.map(n => n.id);
    dismissAllNotifications(ids);
  };

  const handleDismissEvent = (event: UpcomingEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    dismissEvent(`${event.event_type}_${event.id}`);
  };

  const handleDismissAllEvents = (e: React.MouseEvent) => {
    e.stopPropagation();
    const keys = filteredUpcomingEvents.map(e => `${e.event_type}_${e.id}`);
    dismissAllEvents(keys);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 sticky top-0 z-50">
      <div className="flex items-center justify-between">
        {/* Logo and title */}
        <div className="flex items-center">
          <div 
            onClick={handleTitleClick}
            className="flex items-center gap-1 sm:gap-2 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <img 
              src={DairyLogo} 
              alt="Dairy Farm Logo" 
              className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover border border-gray-200"
            />
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">Nemmadi Dairy Farm</h1>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Upcoming Events Bell - For admin and supervisor */}
          {(user?.role === 'admin' || user?.role === 'supervisor') && (
            <div className="relative" ref={eventsRef}>
              <button 
                onClick={toggleUpcomingEvents}
                className="p-1 sm:p-2 text-gray-400 hover:text-yellow-600 transition-colors relative"
              >
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                {upcomingEventsCount > 0 && (
                  <span className="absolute top-0 right-0 bg-yellow-500 text-white text-[8px] sm:text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center">
                    {upcomingEventsCount}
                  </span>
                )}
              </button>
              
              {showUpcomingEvents && (
                <div className="fixed inset-0 z-50 flex items-center justify-center sm:items-start sm:justify-end sm:inset-auto">
                  {/* Backdrop for mobile */}
                  <div 
                    className="fixed inset-0 bg-black bg-opacity-50 sm:hidden"
                    onClick={() => setShowUpcomingEvents(false)}
                  ></div>

                  <div 
                    ref={eventsRef}
                    className="relative w-[90%] max-w-md max-h-[80vh] bg-white rounded-lg shadow-lg overflow-hidden sm:absolute sm:right-0 sm:top-full sm:mt-2 sm:w-[32rem] sm:max-w-[100vw] sm:rounded-md sm:shadow-xl sm:border sm:border-gray-200"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex flex-col h-full">
                      <div className="p-3 sm:p-4 flex-shrink-0 bg-white border-b">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="font-medium text-gray-900 text-base sm:text-lg">Upcoming Events</h3>
                          <div className="flex space-x-2">
                            {filteredUpcomingEvents.length > 0 && (
                              <button 
                                onClick={handleDismissAllEvents}
                                className="text-xs sm:text-sm text-blue-600 hover:text-blue-800"
                              >
                                Clear All
                              </button>
                            )}
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowUpcomingEvents(false);
                              }}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <X className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Scrollable content area */}
                      <div className="flex-1 overflow-y-auto max-h-[calc(100vh-180px)] sm:max-h-[calc(70vh-60px)]">
                        {loadingEvents ? (
                          <div className="flex justify-center items-center py-6">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                          </div>
                        ) : eventsError ? (
                          <div className="bg-red-50 border border-red-200 rounded p-3 text-red-800 text-xs sm:text-sm mx-3 mb-3">
                            {eventsError}
                          </div>
                        ) : filteredUpcomingEvents.length === 0 ? (
                          <p className="text-sm text-gray-500 py-4 text-center">No upcoming events</p>
                        ) : (
                          <div className="divide-y divide-gray-100">
                            {filteredUpcomingEvents.map((event) => {
                              const dueDate = new Date(event.due_date);
                              const today = isDueToday(event.due_date);
                              
                              return (
                                <div 
                                  key={`${event.event_type}-${event.id}`}
                                  className={`py-3 sm:py-4 hover:bg-gray-50 px-3 ${getEventBgColor(event.event_type)}`}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="flex items-start">
                                    <div className="flex-shrink-0 pt-0.5">
                                      <div className="p-1.5 rounded-full bg-white">
                                        {getEventIcon(event.event_type)}
                                      </div>
                                    </div>
                                    <div className="ml-3 flex-1 min-w-0">
                                      <div className="flex justify-between">
                                        <div>
                                          <p className="text-sm sm:text-base font-medium line-clamp-1">
                                            {event.title}
                                          </p>
                                          <p className="text-xs sm:text-sm text-gray-700 mt-1 line-clamp-2">
                                            {event.event_type === 'deworming' && `Animal: ${event.animal_id} • Dewormer: ${event.dewormer}`}
                                            {event.event_type === 'vaccination' && `Animal: ${event.animal_id} • Vaccine: ${event.vaccine}`}
                                            {event.event_type === 'purchase_order' && `PO: ${event.po_no} • Item: ${event.item}`}
                                          </p>
                                        </div>
                                        <button
                                          onClick={(e) => handleDismissEvent(event, e)}
                                          className="text-[10px] sm:text-xs bg-white hover:bg-gray-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded ml-2"
                                        >
                                          Dismiss
                                        </button>
                                      </div>
                                      
                                      <div className="mt-2 flex justify-between items-end">
                                        <div className="flex flex-col">
                                          <p className="text-xs text-gray-500">
                                            Due: {dueDate.toLocaleDateString('en-US', { 
                                              month: 'short', 
                                              day: 'numeric',
                                              year: 'numeric'
                                            })}
                                          </p>
                                          <p className="text-xs text-gray-500 mt-1">
                                            Created {event.time_ago}
                                          </p>
                                        </div>
                                        {today && (
                                          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                            Due Today!
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Notification Bell - For authenticated users */}
          {user?.token && (
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={toggleNotifications}
                className="p-1 sm:p-2 text-gray-400 hover:text-gray-600 transition-colors relative"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-[8px] sm:text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
              
              {showNotifications && (
                <div className="fixed inset-0 z-50 flex items-center justify-center sm:items-start sm:justify-end sm:inset-auto">
                  {/* Backdrop for mobile */}
                  <div 
                    className="fixed inset-0 bg-black bg-opacity-50 sm:hidden"
                    onClick={() => setShowNotifications(false)}
                  ></div>

                  <div 
                    ref={notificationRef}
                    className="relative w-[90%] max-w-md max-h-[80vh] bg-white rounded-lg shadow-lg overflow-hidden sm:absolute sm:right-0 sm:top-full sm:mt-2 sm:w-[32rem] sm:max-w-[100vw] sm:rounded-md sm:shadow-xl sm:border sm:border-gray-200"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex flex-col h-full">
                      <div className="p-3 sm:p-4 flex-shrink-0 bg-white border-b">
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center">
                            <img 
                              src={DairyLogo} 
                              alt="Nemmadi Dairy" 
                              className="h-6 w-6 mr-2"
                            />
                            <h3 className="font-medium text-gray-900 text-base sm:text-lg">Farm Notifications</h3>
                          </div>
                          <div className="flex space-x-2">
                            {filteredNotifications.length > 0 && (
                              <button 
                                onClick={handleDismissAll}
                                className="text-xs sm:text-sm text-blue-600 hover:text-blue-800"
                              >
                                Clear All
                              </button>
                            )}
                            <button 
                              onClick={goToNotificationPage}
                              className="text-xs sm:text-sm text-blue-600 hover:text-blue-800"
                              aria-label="View notification history"
                            >
                              View History
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowNotifications(false);
                              }}
                              className="text-gray-400 hover:text-gray-600"
                              aria-label="Close notifications"
                            >
                              <X className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Scrollable content area with explicit max height */}
                      <div className="flex-1 overflow-y-auto max-h-[calc(100vh-180px)] sm:max-h-[calc(70vh-60px)]">
                        {loading ? (
                          <div className="flex justify-center items-center py-6">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                          </div>
                        ) : error ? (
                          <div className="bg-red-50 border border-red-200 rounded p-3 text-red-800 text-xs sm:text-sm mx-3 mb-3">
                            {error}
                          </div>
                        ) : filteredNotifications.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-8">
                            <img 
                              src={DairyLogo} 
                              alt="No notifications" 
                              className="h-16 w-16 mb-4 opacity-50"
                            />
                            <p className="text-sm text-gray-500">No notifications</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-100">
                            {filteredNotifications.map((notification) => (
                              <div 
                                key={notification.id}
                                className={`py-3 last:border-b-0 hover:bg-gray-50 px-3 ${getNotificationBgColor(notification.notification_type)}`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="flex items-start">
                                  <div className="flex-shrink-0 pt-0.5">
                                    <div className="p-1.5 rounded-full bg-white">
                                      {getNotificationIcon(notification.notification_type)}
                                    </div>
                                  </div>
                                  
                                  <div className="ml-3 flex-1 min-w-0">
                                    <div className="flex justify-between">
                                      <div>
                                        <p className="text-xs sm:text-sm font-medium line-clamp-1">
                                          {notification.record_name}
                                        </p>
                                        <p className="text-xs text-gray-700 mt-1 line-clamp-2">
                                          {notification.message}
                                        </p>
                                      </div>
                                      <button
                                        onClick={(e) => handleDismiss(notification.id, e)}
                                        className="text-[10px] sm:text-xs bg-white hover:bg-gray-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded ml-2"
                                        aria-label="Dismiss notification"
                                      >
                                        Dismiss
                                      </button>
                                    </div>
                                    
                                    <div className="mt-2 flex justify-between items-end">
                                      <div>
                                        {notification.supervisor_username && (
                                          <p className="text-xs text-gray-500 line-clamp-1">
                                            Supervisor: {notification.supervisor_username}
                                          </p>
                                        )}
                                        <p className="text-xs text-gray-500 whitespace-nowrap">
                                          {notification.time_ago}
                                        </p>
                                      </div>
                                      <span className="text-[10px] sm:text-xs px-1.5 py-0.5 bg-gray-100 rounded capitalize">
                                        {notification.notification_type.replace('_', ' ')}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* User Profile Section */}
          <div className="flex items-center space-x-1 sm:space-x-3">
            <div 
              className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-200"
              onClick={handleProfileClick}
              aria-label="User profile"
            >
              <User className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
            </div>
            
            <div className="hidden sm:block">
              <p className="text-xs sm:text-sm font-medium text-gray-900">{user?.username}</p>
              <p className="text-[10px] text-gray-500 uppercase">{user?.role}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;