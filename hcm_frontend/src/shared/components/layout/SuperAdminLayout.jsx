import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useAuth } from '../../../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../utils/cn';
import RolePreviewBanner from './RolePreviewBanner';
import Toast from '../../../features/admin/components/Toast';
import ProtectedRoute from './ProtectedRoute';
import ErrorBoundary from '../common/ErrorBoundary';

const SuperAdminLayout = () => {
  const { user, loading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const mainContentRef = React.useRef(null);

  // Scroll only the main content area to top on route change
  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo(0, 0);
    }
  }, [location.pathname]);

  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;

  if ((user.role || '').toUpperCase() !== 'SUPERADMIN') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex overflow-x-hidden transition-colors duration-300">
      <RolePreviewBanner />
      <Toast />
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} allRoles={true} />
      </div>
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-64 max-w-[80vw] shadow-2xl"
            >
              <Sidebar collapsed={false} setCollapsed={() => {}} allRoles={true} isMobile={true} onItemClick={() => setMobileSidebarOpen(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Main content area */}
      <div
        ref={mainContentRef}
        className={cn(
          "flex-1 flex flex-col transition-all duration-200 h-screen overflow-y-auto min-w-0 max-w-full",
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
        )}>
        <Navbar toggleMobileSidebar={() => setMobileSidebarOpen(true)} />
        <main className="flex-1 p-3 sm:p-5 lg:p-8 min-w-0 max-w-full overflow-x-hidden">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}>
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
