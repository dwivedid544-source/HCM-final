import React, { useState, useEffect, useRef, useContext } from 'react';
import { 
  Bell, 
  Search, 
  Menu, 
  X, 
  ChevronDown, 
  Settings, 
  User, 
  LogOut,
  Plus,
  Moon,
  Sun
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { cn } from '../../../utils/cn';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CandidateContext } from '../../../context/CandidateContext';
import { notificationAPI } from '../../../utils/apiService';
import UserAvatar from '../ui/UserAvatar';

const Navbar = ({ toggleMobileSidebar }) => {
  const { user, logout, effectiveRole } = useAuth();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);
  const navigate = useNavigate();
  const candidateContext = useContext(CandidateContext);

  const [unreadCount, setUnreadCount] = useState(0);

  const candidateProfileName = candidateContext?.profile?.fullName;
  const effectiveUser = {
    ...user,
    name: (user?.role === 'CANDIDATE' && candidateProfileName) ? candidateProfileName : (user?.name || 'User')
  };

  const formatRelativeTime = (dateStr) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${diffDays}d ago`;
    } catch (e) {
      return 'Just now';
    }
  };

  const fetchNotifications = async () => {
    const token = localStorage.getItem('hcm_token');
    if (!token) return;
    try {
      const res = await notificationAPI.getNotifications();
      if (res.data?.success) {
        setNotifications(res.data.data);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      if (err.response?.status !== 401) {
        console.error('Failed to fetch notifications:', err);
      }
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotificationsDropdown(false);
      }
    };
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        setShowProfileDropdown(false);
        setShowNotificationsDropdown(false);
        setShowLogoutModal(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  const markAllRead = async () => {
    try {
      const res = await notificationAPI.markAllAsRead();
      if (res.data?.success) {
        fetchNotifications();
      }
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const toggleRead = async (id) => {
    try {
      const res = await notificationAPI.markAsRead(id);
      if (res.data?.success) {
        fetchNotifications();
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const clearAll = async () => {
    try {
      const res = await notificationAPI.clearAllNotifications();
      if (res.data?.success) {
        fetchNotifications();
      }
    } catch (err) {
      console.error('Failed to clear notifications:', err);
    }
  };

  const handleProfileClick = () => {
    setShowProfileDropdown(false);
    const roleLower = (user?.role || '').toLowerCase();
    if (roleLower === 'candidate') navigate('/candidate/settings');
    else if (roleLower === 'employee') navigate('/employee/profile');
    else navigate(`/${roleLower || 'admin'}/profile`);
  };

  const handleSettingsClick = () => {
    setShowProfileDropdown(false);
    const roleLower = (user?.role || '').toLowerCase();
    if (roleLower === 'candidate') navigate('/candidate/settings');
    else navigate(`/${roleLower || 'admin'}/settings`);
  };

  return (
    <>
      <header className="sticky top-0 z-50 h-16 bg-white dark:bg-slate-900 shadow-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
        <div className="flex items-center justify-between h-full px-4 sm:px-8">
        
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <button 
            type="button"
            onClick={toggleMobileSidebar}
            aria-label="Open mobile menu"
            className="lg:hidden p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center">
            <Menu size={20} />
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">

          <div className="relative" ref={notificationRef}>
            <button 
              type="button"
              aria-label="Notifications"
              className="relative p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
              onClick={() => {
                if (candidateContext) {
                  navigate('/candidate/notifications');
                } else {
                  setShowNotificationsDropdown(!showNotificationsDropdown);
                }
              }}>
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
              )}
            </button>

            <AnimatePresence>
              {showNotificationsDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-1 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                     <span className="text-sm font-bold text-slate-800 dark:text-slate-100">Notifications</span>
                     {unreadCount > 0 && (
                       <button type="button" onClick={markAllRead} className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline">
                         Mark all read
                       </button>
                     )}
                  </div>
                  
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map(note => (
                        <div 
                          key={note.id} 
                          onClick={() => toggleRead(note.id)}
                          className={cn("px-4 py-3 border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer flex gap-3 items-start transition-all",
                            !note.isRead && "bg-primary-50/20 dark:bg-primary-950/10"
                          )}
                        >
                          <div className={cn(
                            "w-2 h-2 rounded-full mt-1.5 shrink-0",
                            !note.isRead ? "bg-primary-500" : "bg-transparent"
                          )} />
                          <div className="flex-1 text-left">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{note.title}</p>
                            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{note.message}</p>
                            <p className="text-[9px] font-medium text-slate-400 mt-1">{formatRelativeTime(note.createdAt)}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center text-slate-400">
                        <Bell size={24} className="mx-auto mb-2 opacity-40" />
                        <p className="text-xs font-bold">No notifications</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                     <button type="button" onClick={clearAll} className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium">
                       Clear All
                     </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1"></div>

          {/* User Profile */}
          <div className="relative" ref={dropdownRef}>
            <button 
              type="button"
              aria-label="User Profile"
              className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[40px] cursor-pointer"
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
              <UserAvatar user={effectiveUser} size="sm" />
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-none">{effectiveUser?.name || 'User'}</p>
                <p className="text-[10px] font-medium text-slate-500 mt-1 capitalize">{effectiveUser?.role || 'Member'}</p>
              </div>
              <ChevronDown size={14} className={cn("text-slate-400 transition-transform", showProfileDropdown && "rotate-180")} />
            </button>

            <AnimatePresence>
              {showProfileDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-1 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                     <UserAvatar user={effectiveUser} size="sm" />
                     <div className="min-w-0 flex-1 text-left">
                       <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{effectiveUser?.name || 'User'}</p>
                       <p className="text-xs text-slate-500 truncate">{effectiveUser?.email}</p>
                     </div>
                  </div>
                  
                  <div className="p-1">
                    <button type="button" onClick={handleProfileClick} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                      <User size={16} />
                      <span>My Profile</span>
                    </button>
                    <button type="button" onClick={handleSettingsClick} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                      <Settings size={16} />
                      <span>Settings</span>
                    </button>
                  </div>
                  
                  <div className="p-1 border-t border-slate-100 dark:border-slate-800">
                    <button 
                      type="button"
                      onClick={() => {
                        setShowProfileDropdown(false);
                        setShowLogoutModal(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors">
                      <LogOut size={16} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      </header>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
         {showLogoutModal && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 overflow-y-auto">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowLogoutModal(false)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" />
               <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 text-center z-10 my-auto">
                  <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white dark:border-slate-900 shadow-sm">
                     <LogOut size={28}/>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Sign Out</h3>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-8 px-4">Are you sure you want to sign out of your account?</p>
                  <div className="flex items-center gap-3">
                     <button type="button" className="btn-secondary flex-1" onClick={() => setShowLogoutModal(false)}>Cancel</button>
                     <button type="button" className="btn-danger flex-1" onClick={() => {
                        setShowLogoutModal(false);
                        logout();
                     }}>Sign Out</button>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
