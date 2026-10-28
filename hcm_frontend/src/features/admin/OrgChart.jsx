import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import { 
  Building2, 
  Users, 
  ChevronDown, 
  ChevronRight, 
  Search, 
  RefreshCw, 
  Plus, 
  Minus, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Briefcase, 
  Layers, 
  X, 
  Compass, 
  RotateCcw,
  AlertCircle, 
  MapPin, 
  FileText,
  UserCheck
} from 'lucide-react';
import { cn } from '../../utils/cn';
import PageHeader from '../../shared/components/ui/PageHeader';

// ============================================================
// Safe Avatar Component
// ============================================================
// Strictly bounds the profile image container to prevent blowout
// or full-page expansion regardless of original image dimensions.
const SafeAvatar = ({ 
  src, 
  alt = '', 
  name = '', 
  size = 40, 
  accentColor = '#4f46e5',
  className = '',
  shape = 'circle' // 'circle' or 'rounded'
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Reset error/loaded state if src changes
  useEffect(() => {
    setHasError(false);
    setIsLoaded(false);
  }, [src]);

  const isValidUrl = useMemo(() => {
    if (!src || typeof src !== 'string') return false;
    const clean = src.trim();
    if (
      clean === '' || 
      clean === 'null' || 
      clean === 'undefined' || 
      clean === '[object Object]'
    ) {
      return false;
    }
    return (
      clean.startsWith('http://') || 
      clean.startsWith('https://') || 
      clean.startsWith('/') || 
      clean.startsWith('data:image/')
    );
  }, [src]);

  const initials = useMemo(() => {
    if (!name || typeof name !== 'string') return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }, [name]);

  const shapeClass = shape === 'circle' ? 'rounded-full' : 'rounded-2xl';

  return (
    <div 
      className={cn(
        "relative shrink-0 overflow-hidden select-none flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-xs",
        shapeClass,
        className
      )}
      style={{ 
        width: `${size}px`, 
        height: `${size}px`, 
        minWidth: `${size}px`, 
        maxWidth: `${size}px`, 
        minHeight: `${size}px`, 
        maxHeight: `${size}px`,
        backgroundColor: (!isValidUrl || hasError) ? accentColor : '#e2e8f0'
      }}
    >
      {isValidUrl && !hasError ? (
        <>
          <img 
            src={src} 
            alt={alt || name}
            onError={() => setHasError(true)}
            onLoad={() => setIsLoaded(true)}
            style={{ 
              width: '100%', 
              height: '100%', 
              maxWidth: '100%', 
              maxHeight: '100%', 
              objectFit: 'cover',
              objectPosition: 'center',
              display: isLoaded ? 'block' : 'none'
            }}
          />
          {!isLoaded && (
            <div 
              className="w-full h-full flex items-center justify-center text-white font-extrabold"
              style={{ 
                backgroundColor: accentColor,
                fontSize: `${Math.max(10, Math.floor(size * 0.34))}px`
              }}
            >
              {initials}
            </div>
          )}
        </>
      ) : (
        <span 
          className="text-white font-extrabold select-none"
          style={{ fontSize: `${Math.max(10, Math.floor(size * 0.34))}px` }}
        >
          {initials}
        </span>
      )}
    </div>
  );
};

// ============================================================
// Helper: Check if a node or descendant matches search
// ============================================================
const nodeOrDescendantMatches = (node, query) => {
  if (!query) return false;
  const q = query.toLowerCase().trim();

  // Check self
  const selfMatches = 
    (node.name && node.name.toLowerCase().includes(q)) ||
    (node.fullName && node.fullName.toLowerCase().includes(q)) ||
    (node.role && node.role.toLowerCase().includes(q)) ||
    (node.code && node.code.toLowerCase().includes(q)) ||
    (node.email && node.email.toLowerCase().includes(q)) ||
    (node.employeeId && node.employeeId.toLowerCase().includes(q)) ||
    (node.departmentName && node.departmentName.toLowerCase().includes(q)) ||
    (node.head && node.head.toLowerCase().includes(q));

  if (selfMatches) return true;

  // Check child departments
  if (node.children && node.children.some(c => nodeOrDescendantMatches(c, query))) {
    return true;
  }

  // Check direct employees
  if (node.employees && node.employees.some(e => nodeOrDescendantMatches(e, query))) {
    return true;
  }

  // Check direct reports
  if (node.directReports && node.directReports.some(r => nodeOrDescendantMatches(r, query))) {
    return true;
  }

  return false;
};

// ============================================================
// Recursive Org Chart Node Component
// ============================================================
const OrgChartNode = ({ 
  node, 
  isRoot = false, 
  searchQuery = '', 
  parentColor = null,
  onSelectNode,
  selectedNodeId,
  autoExpandAll = false,
  visitedNodeIds = new Set()
}) => {
  const [isExpanded, setIsExpanded] = useState(isRoot || node.type === 'department');

  // Infinite recursion / cycle guard
  if (!node || !node.id || visitedNodeIds.has(node.id)) {
    return null;
  }

  const nextVisited = new Set(visitedNodeIds);
  nextVisited.add(node.id);

  // Auto-expand when search query matches descendant or when expand-all is toggled
  useEffect(() => {
    if (autoExpandAll) {
      setIsExpanded(true);
    } else if (searchQuery && nodeOrDescendantMatches(node, searchQuery)) {
      setIsExpanded(true);
    }
  }, [searchQuery, autoExpandAll, node]);

  const branchColor = node.color || parentColor || '#6366f1';

  // Direct match highlighting
  const isDirectMatch = searchQuery && (
    (node.name && node.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (node.fullName && node.fullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (node.role && node.role.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (node.code && node.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (node.email && node.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (node.employeeId && node.employeeId.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (node.head && node.head.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const isSelected = selectedNodeId === node.id;

  const toggleExpand = (e) => {
    e.stopPropagation();
    setIsExpanded(prev => !prev);
  };

  const handleCardClick = (e) => {
    e.stopPropagation();
    if (onSelectNode) {
      onSelectNode(node);
    }
  };

  // ──────────────────────────────────────────────────────────
  // 1. Department Node
  // ──────────────────────────────────────────────────────────
  if (node.type === 'department') {
    const childrenDepts = node.children || [];
    const directEmployees = node.employees || [];
    const allChildren = [...childrenDepts, ...directEmployees];
    const totalChildCount = allChildren.length;

    return (
      <div className="flex flex-col items-center relative select-none">
        {/* Department Card */}
        <motion.div 
          layout
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleCardClick}
          className={cn(
            "relative bg-white dark:bg-slate-900 rounded-2xl shadow-sm border-2 w-64 p-4 z-10 transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 cursor-pointer text-left",
            isDirectMatch 
              ? "border-amber-400 ring-4 ring-amber-400/30 bg-amber-50/20 dark:bg-amber-950/20" 
              : isSelected
              ? "border-primary-500 ring-4 ring-primary-500/20 shadow-md"
              : "border-slate-200 dark:border-slate-800",
            isRoot && "ring-2 ring-indigo-500/20 shadow-md"
          )}
          style={{ borderTopColor: branchColor, borderTopWidth: '4px' }}
        >
          {/* Top Row: Icon, Code & Expand Button */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs font-bold shrink-0"
              style={{ backgroundColor: branchColor }}
            >
              <Building2 size={20} />
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {node.code && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {node.code}
                </span>
              )}
              {totalChildCount > 0 && (
                <button 
                  type="button"
                  onClick={toggleExpand}
                  title={isExpanded ? "Collapse sub-items" : "Expand sub-items"}
                  className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors cursor-pointer"
                >
                  <span>{totalChildCount}</span>
                  {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                </button>
              )}
            </div>
          </div>
          
          <h3 className="font-extrabold text-slate-900 dark:text-white text-sm tracking-tight truncate" title={node.name}>
            {node.name}
          </h3>
          
          {node.head && (
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5 my-1.5 truncate">
              <span 
                className="w-4 h-4 rounded-full text-white flex items-center justify-center text-[9px] font-bold shrink-0"
                style={{ backgroundColor: branchColor }}
              >
                H
              </span>
              <span className="truncate">Head: {node.head}</span>
            </p>
          )}

          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px]">
            <div 
              className="flex items-center gap-1.5 font-extrabold"
              style={{ color: branchColor }}
            >
              <Users size={13} />
              <span>{node.employeeCount || 0} Members</span>
            </div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {node.parentName && node.parentName !== 'Corporate' ? node.parentName : 'DEPT'}
            </span>
          </div>
        </motion.div>

        {/* Vertical connector line extending down */}
        {isExpanded && totalChildCount > 0 && (
          <div className="w-[2px] h-6 shrink-0" style={{ backgroundColor: branchColor }} />
        )}

        {/* Children (Sub-departments & Direct Employees) */}
        <AnimatePresence>
          {isExpanded && totalChildCount > 0 && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex justify-center relative pt-2"
            >
              {allChildren.map((child, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === totalChildCount - 1;
                const isSingle = totalChildCount === 1;

                return (
                  <div key={child.id || `child-${idx}`} className="flex flex-col items-center px-4 relative">
                    {/* Horizontal Crossbar */}
                    {!isSingle && (
                      <div className="absolute top-0 left-0 right-0 h-[2px]">
                        {!isFirst && (
                          <div className="absolute top-0 left-0 w-1/2 h-[2px]" style={{ backgroundColor: branchColor }} />
                        )}
                        {!isLast && (
                          <div className="absolute top-0 right-0 w-1/2 h-[2px]" style={{ backgroundColor: branchColor }} />
                        )}
                      </div>
                    )}

                    {/* Vertical Connector Down to Child */}
                    <div className="w-[2px] h-6 shrink-0" style={{ backgroundColor: branchColor }} />
                    
                    {/* Junction Dot */}
                    <div 
                      className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-slate-900 shadow-xs z-20" 
                      style={{ backgroundColor: branchColor }}
                    />

                    <OrgChartNode 
                      node={child} 
                      parentColor={branchColor} 
                      searchQuery={searchQuery}
                      onSelectNode={onSelectNode}
                      selectedNodeId={selectedNodeId}
                      autoExpandAll={autoExpandAll}
                      visitedNodeIds={nextVisited}
                    />
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────
  // 2. Employee Node
  // ──────────────────────────────────────────────────────────
  if (node.type === 'employee') {
    const reports = node.directReports || [];
    const reportCount = reports.length;

    return (
      <div className="flex flex-col items-center relative select-none">
        <motion.div 
          layout
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleCardClick}
          className={cn(
            "relative bg-white dark:bg-slate-900 rounded-2xl shadow-sm border-2 w-64 p-3.5 z-10 transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 cursor-pointer text-left",
            isDirectMatch 
              ? "border-amber-400 ring-4 ring-amber-400/30 bg-amber-50/20 dark:bg-amber-950/20" 
              : isSelected
              ? "border-primary-500 ring-4 ring-primary-500/20 shadow-md"
              : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
          )}
          style={{ borderTopColor: branchColor, borderTopWidth: '3px' }}
        >
          <div className="flex items-start gap-3">
            {/* Constrained Safe Avatar */}
            <div className="relative shrink-0">
              <SafeAvatar 
                src={node.avatarUrl}
                name={node.fullName}
                size={40}
                accentColor={branchColor}
                shape="circle"
              />
              <span 
                className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" 
                title="Active" 
              />
            </div>

            {/* Employee Details */}
            <div className="flex-1 min-w-0">
              <h4 className="font-extrabold text-slate-900 dark:text-white text-sm truncate tracking-tight leading-snug" title={node.fullName}>
                {node.fullName}
              </h4>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight truncate">
                {node.role || 'Staff'}
              </p>
              {node.employeeId && (
                <span className="inline-block text-[10px] font-mono font-medium text-slate-400 dark:text-slate-500 mt-0.5">
                  {node.employeeId}
                </span>
              )}
            </div>

            {/* Report Toggle Button */}
            {reportCount > 0 && (
              <button 
                type="button"
                onClick={toggleExpand}
                title={isExpanded ? "Collapse Direct Reports" : "Expand Direct Reports"}
                className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors shrink-0 cursor-pointer"
              >
                <span>{reportCount}</span>
                {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </button>
            )}
          </div>
        </motion.div>

        {/* Vertical connector line down from employee node */}
        {isExpanded && reportCount > 0 && (
          <div className="w-[2px] h-6 shrink-0" style={{ backgroundColor: branchColor }} />
        )}

        {/* Direct Reports */}
        <AnimatePresence>
          {isExpanded && reportCount > 0 && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex justify-center relative pt-2"
            >
              {reports.map((report, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === reportCount - 1;
                const isSingle = reportCount === 1;

                return (
                  <div key={report.id || `report-${idx}`} className="flex flex-col items-center px-4 relative">
                    {/* Horizontal Connector Line */}
                    {!isSingle && (
                      <div className="absolute top-0 left-0 right-0 h-[2px]">
                        {!isFirst && (
                          <div className="absolute top-0 left-0 w-1/2 h-[2px]" style={{ backgroundColor: branchColor }} />
                        )}
                        {!isLast && (
                          <div className="absolute top-0 right-0 w-1/2 h-[2px]" style={{ backgroundColor: branchColor }} />
                        )}
                      </div>
                    )}

                    {/* Vertical Connector Down to Report */}
                    <div className="w-[2px] h-6 shrink-0" style={{ backgroundColor: branchColor }} />
                    
                    {/* Junction Dot */}
                    <div 
                      className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-slate-900 shadow-xs z-20" 
                      style={{ backgroundColor: branchColor }}
                    />

                    <OrgChartNode 
                      node={report} 
                      parentColor={branchColor} 
                      searchQuery={searchQuery}
                      onSelectNode={onSelectNode}
                      selectedNodeId={selectedNodeId}
                      autoExpandAll={autoExpandAll}
                      visitedNodeIds={nextVisited}
                    />
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return null;
};

// ============================================================
// Details Drawer / Inspector Modal
// ============================================================
const OrgChartDetailsDrawer = ({ node, onClose, onSelectNode }) => {
  const navigate = useNavigate();

  // Handle escape key to dismiss
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!node) return null;

  const isDept = node.type === 'department';
  const branchColor = node.color || node.departmentColor || '#4f46e5';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[160] flex justify-end text-left">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs cursor-pointer"
        />

        {/* Drawer Panel */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 z-10 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-800/40">
            <div className="flex items-center gap-4">
              {isDept ? (
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-md font-bold shrink-0"
                  style={{ backgroundColor: branchColor }}
                >
                  <Building2 size={26} />
                </div>
              ) : (
                <SafeAvatar 
                  src={node.avatarUrl}
                  name={node.fullName}
                  size={56}
                  accentColor={branchColor}
                  shape="rounded"
                />
              )}

              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 inline-block mb-1">
                  {isDept ? 'Department' : (node.role || 'Staff')}
                </span>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white truncate">
                  {isDept ? node.name : node.fullName}
                </h2>
                {isDept && node.code && (
                  <p className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                    Code: {node.code}
                  </p>
                )}
                {!isDept && node.employeeId && (
                  <p className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                    ID: {node.employeeId}
                  </p>
                )}
              </div>
            </div>

            <button 
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* DEPARTMENT VIEW */}
            {isDept ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                      Total Members
                    </p>
                    <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
                      {node.employeeCount || (node.allMembers?.length || 0)}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                      Status
                    </p>
                    <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-extrabold uppercase bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800">
                      {node.status || 'Active'}
                    </span>
                  </div>
                </div>

                {node.head && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Department Head
                    </label>
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                        {node.head[0]?.toUpperCase()}
                      </div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                        {node.head}
                      </span>
                    </div>
                  </div>
                )}

                {node.description && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Department Mission & Scope
                    </label>
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
                      {node.description}
                    </p>
                  </div>
                )}

                {/* All Department Members List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Assigned Members ({node.allMembers?.length || 0})
                    </label>
                  </div>
                  {node.allMembers && node.allMembers.length > 0 ? (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {node.allMembers.map((member) => (
                        <div 
                          key={member.id}
                          onClick={() => onSelectNode(member)}
                          className="p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <SafeAvatar 
                              src={member.avatarUrl}
                              name={member.fullName}
                              size={32}
                              accentColor={branchColor}
                              shape="circle"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {member.fullName}
                              </p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                {member.role || 'Staff'} {member.employeeId ? `• ${member.employeeId}` : ''}
                              </p>
                            </div>
                          </div>
                          <ChevronRight size={15} className="text-slate-400 shrink-0" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 dark:text-slate-500 italic p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                      No employees assigned to this department yet.
                    </p>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => navigate('/admin/departments')}
                    className="btn-secondary w-full text-xs"
                  >
                    <Building2 size={14} />
                    <span>Open Departments Manager</span>
                  </button>
                </div>
              </>
            ) : (
              /* EMPLOYEE VIEW */
              <>
                <div className="space-y-4">
                  {/* Basic Info Rows */}
                  <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs">
                    {node.email && (
                      <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                        <Mail size={15} className="text-slate-400 shrink-0" />
                        <span className="font-semibold truncate">{node.email}</span>
                      </div>
                    )}
                    {node.phone && (
                      <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                        <Phone size={15} className="text-slate-400 shrink-0" />
                        <span className="font-semibold">{node.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                      <Briefcase size={15} className="text-slate-400 shrink-0" />
                      <span className="font-semibold">{node.employmentType || 'Full-time'}</span>
                    </div>
                    {node.departmentName && (
                      <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                        <Building2 size={15} className="text-slate-400 shrink-0" />
                        <span className="font-semibold">{node.departmentName}</span>
                      </div>
                    )}
                    {node.joiningDate && (
                      <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                        <Calendar size={15} className="text-slate-400 shrink-0" />
                        <span className="font-semibold">
                          Joined {new Date(node.joiningDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {node.address && (
                      <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                        <MapPin size={15} className="text-slate-400 shrink-0" />
                        <span className="font-medium truncate">{node.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Bio / Scope */}
                  {node.bio && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        Bio & Professional Summary
                      </label>
                      <p className="text-xs text-slate-600 dark:text-slate-300 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                        {node.bio}
                      </p>
                    </div>
                  )}

                  {/* Manager Info */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Reporting Manager
                    </label>
                    {node.managerName ? (
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <SafeAvatar 
                            src={node.managerAvatar}
                            name={node.managerName}
                            size={36}
                            accentColor="#4f46e5"
                            shape="circle"
                          />
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              {node.managerName}
                            </p>
                            <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                              {node.managerRole || 'Manager'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs font-medium text-slate-400 dark:text-slate-500 italic p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                        No direct manager assigned (Top Level in Department)
                      </p>
                    )}
                  </div>

                  {/* Direct Reports */}
                  {node.directReports && node.directReports.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        Direct Reports ({node.directReports.length})
                      </label>
                      <div className="space-y-2 max-h-56 overflow-y-auto">
                        {node.directReports.map((report) => (
                          <div 
                            key={report.id}
                            onClick={() => onSelectNode(report)}
                            className="p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <SafeAvatar 
                                src={report.avatarUrl}
                                name={report.fullName}
                                size={30}
                                accentColor={branchColor}
                                shape="circle"
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                  {report.fullName}
                                </p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                  {report.role || 'Staff'} {report.employeeId ? `• ${report.employeeId}` : ''}
                                </p>
                              </div>
                            </div>
                            <ChevronRight size={14} className="text-slate-400 shrink-0" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => navigate('/admin/users')}
                      className="btn-secondary w-full text-xs"
                    >
                      <UserCheck size={14} />
                      <span>Manage in Employee Directory</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// ============================================================
// Main Org Chart Page Component
// ============================================================
const OrgChart = () => {
  const { orgChartData, fetchOrgChart, loading } = useAdmin();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 30 });
  const [isDragging, setIsDragging] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [autoExpandAll, setAutoExpandAll] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [hasAutoFitted, setHasAutoFitted] = useState(false);

  const canvasRef = useRef(null);
  const treeContainerRef = useRef(null);
  const lastTouchRef = useRef({ x: 0, y: 0 });
  const initialTouchDistanceRef = useRef(null);
  const initialScaleRef = useRef(1);

  // Load organization chart data
  const loadData = useCallback(async (deptId = null, isUserAction = false) => {
    setApiError(null);
    try {
      await fetchOrgChart(deptId || null, isUserAction);
    } catch (err) {
      setApiError(err.message || 'Failed to load organization chart data');
    }
  }, [fetchOrgChart]);

  // Initial fetch and global update listener
  useEffect(() => {
    loadData(selectedDeptId || null, false);

    const handleOrgUpdate = () => {
      loadData(selectedDeptId || null, false);
    };

    window.addEventListener('department_updated', handleOrgUpdate);
    window.addEventListener('user_updated', handleOrgUpdate);
    window.addEventListener('employee_updated', handleOrgUpdate);

    return () => {
      window.removeEventListener('department_updated', handleOrgUpdate);
      window.removeEventListener('user_updated', handleOrgUpdate);
      window.removeEventListener('employee_updated', handleOrgUpdate);
    };
  }, [loadData, selectedDeptId]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadData(selectedDeptId || null, true);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Zoom Controls
  const zoomIn = () => setScale(s => Math.min(2.0, Number((s + 0.15).toFixed(2))));
  const zoomOut = () => setScale(s => Math.max(0.3, Number((s - 0.15).toFixed(2))));
  const resetView = () => {
    setScale(1);
    setPosition({ x: 0, y: 30 });
  };

  // Fit to screen: centers and scales the tree within canvas viewport
  const fitToScreen = useCallback(() => {
    if (!canvasRef.current || !treeContainerRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const treeRect = treeContainerRef.current.getBoundingClientRect();

    if (treeRect.width === 0 || treeRect.height === 0) return;

    // Current unscaled dimensions of tree
    const rawWidth = treeRect.width / scale;
    const rawHeight = treeRect.height / scale;

    const availableWidth = Math.max(200, canvasRect.width - 60);
    const availableHeight = Math.max(200, canvasRect.height - 100);

    const scaleX = availableWidth / rawWidth;
    const scaleY = availableHeight / rawHeight;
    const newScale = Math.min(Math.max(0.35, Math.min(scaleX, scaleY)), 1.05);

    setScale(Number(newScale.toFixed(2)));
    setPosition({ x: 0, y: 30 });
  }, [scale]);

  // Auto-fit to screen on initial successful data load
  useEffect(() => {
    if (!hasAutoFitted && orgChartData?.tree?.length > 0) {
      const timer = setTimeout(() => {
        fitToScreen();
        setHasAutoFitted(true);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [orgChartData, hasAutoFitted, fitToScreen]);

  // Keyboard Shortcuts for Zooming
  useEffect(() => {
    const handleKeydown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;

      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        zoomIn();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        zoomOut();
      } else if (e.key === '0') {
        e.preventDefault();
        resetView();
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, []);

  // Native wheel event for canvas pan and pinch/ctrl zoom
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    const handleWheelNative = (e) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        // Zoom
        const delta = e.deltaY * -0.0015;
        setScale(s => Math.min(Math.max(0.25, s + delta), 2.2));
      } else {
        // Pan
        setPosition(prev => ({
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY
        }));
      }
    };

    el.addEventListener('wheel', handleWheelNative, { passive: false });
    return () => el.removeEventListener('wheel', handleWheelNative);
  }, [loading, orgChartData]);

  // Mouse Drag Handlers
  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // Left click only
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition(prev => ({
      x: prev.x + e.movementX,
      y: prev.y + e.movementY
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch Handlers for Mobile Pan & Pinch Zoom
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      lastTouchRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
      initialTouchDistanceRef.current = null;
    } else if (e.touches.length === 2) {
      // Pinch to zoom
      setIsDragging(false);
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      initialTouchDistanceRef.current = Math.hypot(dx, dy);
      initialScaleRef.current = scale;
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 1 && isDragging) {
      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const deltaX = currentX - lastTouchRef.current.x;
      const deltaY = currentY - lastTouchRef.current.y;

      setPosition(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));

      lastTouchRef.current = { x: currentX, y: currentY };
    } else if (e.touches.length === 2 && initialTouchDistanceRef.current) {
      // Pinching
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const currentDistance = Math.hypot(dx, dy);
      const factor = currentDistance / initialTouchDistanceRef.current;
      const newScale = Math.min(Math.max(0.3, initialScaleRef.current * factor), 2.0);
      setScale(Number(newScale.toFixed(2)));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    initialTouchDistanceRef.current = null;
  };

  // Count search matches
  const matchCount = useMemo(() => {
    if (!searchQuery.trim() || !orgChartData?.tree) return 0;
    let count = 0;
    const countMatches = (nodes) => {
      for (const node of nodes) {
        const isMatch = (
          (node.name && node.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (node.fullName && node.fullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (node.role && node.role.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (node.code && node.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (node.email && node.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (node.employeeId && node.employeeId.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (node.head && node.head.toLowerCase().includes(searchQuery.toLowerCase()))
        );
        if (isMatch) count++;
        if (node.children) countMatches(node.children);
        if (node.employees) countMatches(node.employees);
        if (node.directReports) countMatches(node.directReports);
      }
    };
    countMatches(orgChartData.tree);
    return count;
  }, [searchQuery, orgChartData]);

  const hasDepartments = orgChartData?.stats?.totalDepartments > 0;
  const hasEmployees = orgChartData?.stats?.totalEmployees > 0;

  return (
    <div className="h-[calc(100vh-140px)] min-h-[580px] flex flex-col bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-soft select-none text-left">
      {/* Top Header & Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col gap-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur shrink-0 z-20">
        <PageHeader
          title="Organization Chart"
          description="Visualize organizational hierarchy, departments, and reporting relationships"
          icon={Building2}
          actions={
            orgChartData?.stats && (
              <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 shrink-0">
                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  {orgChartData.stats.totalDepartments} Departments
                </span>
                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  {orgChartData.stats.totalEmployees} Employees
                </span>
              </div>
            )
          }
        />

        {/* Action Controls Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
          {/* Left: Search & Filter */}
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input 
                type="text"
                placeholder="Search people, roles, departments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-9 pr-8 py-1 text-xs h-9 w-full sm:w-60 md:w-68"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {searchQuery && (
              <span className="text-[11px] font-bold px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-lg">
                {matchCount} {matchCount === 1 ? 'match' : 'matches'}
              </span>
            )}

            <div className="relative">
              <select
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value)}
                className="select-field h-9 text-xs font-semibold py-0 pr-7 cursor-pointer max-w-[180px]"
              >
                <option value="">All Departments</option>
                {orgChartData?.tree?.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Right: Expand/Collapse & Zoom Controls */}
          <div className="flex items-center gap-2 shrink-0 self-end lg:self-auto">
            <button
              type="button"
              onClick={() => setAutoExpandAll(prev => !prev)}
              className="btn-secondary text-xs px-3 py-1.5 h-9 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              title={autoExpandAll ? "Collapse Branches" : "Expand All Branches"}
            >
              <Layers size={14} />
              <span className="hidden sm:inline">{autoExpandAll ? 'Collapse' : 'Expand All'}</span>
            </button>

            {/* Zoom Controls */}
            <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5 border border-slate-200 dark:border-slate-700 h-9">
              <button 
                type="button"
                onClick={zoomOut}
                title="Zoom Out (-)"
                className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                <Minus size={15} />
              </button>
              <button 
                type="button"
                onClick={resetView}
                title="Reset Zoom (0)"
                className="px-2 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors min-w-[48px] text-center cursor-pointer"
              >
                {Math.round(scale * 100)}%
              </button>
              <button 
                type="button"
                onClick={zoomIn}
                title="Zoom In (+)"
                className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                <Plus size={15} />
              </button>
              <button 
                type="button"
                onClick={fitToScreen}
                title="Fit to Screen"
                className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors border-l border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                <Compass size={15} />
              </button>
            </div>

            {/* Refresh Button */}
            <button 
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing || loading}
              title="Refresh Org Chart"
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 bg-slate-100 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors h-9 w-9 flex items-center justify-center cursor-pointer"
            >
              <RefreshCw size={15} className={cn((isRefreshing || loading) && "animate-spin text-indigo-500")} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div 
        ref={canvasRef}
        className={cn(
          "flex-1 overflow-hidden relative cursor-grab bg-slate-50/70 dark:bg-slate-950/80 bg-[radial-gradient(#cbd5e1_1.5px,transparent_1.5px)] dark:bg-[radial-gradient(#334155_1.5px,transparent_1.5px)] [background-size:24px_24px] touch-none",
          isDragging && "cursor-grabbing"
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        {/* Loading Overlay */}
        {loading && !orgChartData && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 dark:bg-slate-900/70 backdrop-blur-xs z-30">
            <RefreshCw className="animate-spin text-primary-600 mb-3" size={32} />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Loading organization hierarchy...</p>
          </div>
        )}

        {/* API Error State */}
        {apiError && !loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 z-30">
            <div className="card p-8 max-w-md text-center bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-900/40 shadow-soft">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3">
                <AlertCircle size={26} />
              </div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                Failed to Load Org Chart
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 mb-5">
                {apiError}
              </p>
              <button
                type="button"
                onClick={() => loadData(selectedDeptId, true)}
                className="btn-primary btn-compact"
              >
                <RefreshCw size={14} />
                <span>Retry Connection</span>
              </button>
            </div>
          </div>
        )}

        {/* Tree Render Container */}
        <div 
          ref={treeContainerRef}
          className="absolute origin-top transition-transform duration-75 ease-out flex justify-center w-full pt-12 pb-32 min-w-max px-20"
          style={{ 
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          }}
        >
          {orgChartData?.tree?.length > 0 ? (
            <div className="flex gap-14 items-start justify-center">
              {orgChartData.tree.map((rootNode) => (
                <OrgChartNode 
                  key={rootNode.id} 
                  node={rootNode} 
                  isRoot={true} 
                  searchQuery={searchQuery}
                  onSelectNode={(node) => setSelectedNode(node)}
                  selectedNodeId={selectedNode?.id}
                  autoExpandAll={autoExpandAll}
                />
              ))}
            </div>
          ) : (
            !loading && !apiError && (
              <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 mt-20 p-8 bg-white/90 dark:bg-slate-900/90 backdrop-blur rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-md text-center">
                <Building2 size={44} className="mb-3 text-slate-300 dark:text-slate-600" />
                <p className="font-extrabold text-slate-800 dark:text-slate-200 text-base">
                  {!hasDepartments ? 'No Departments Configured' : !hasEmployees ? 'No Employees in Organization' : 'No Organization Hierarchy'}
                </p>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1.5 mb-5">
                  {!hasDepartments 
                    ? 'Get started by creating departments in the Departments module to build your company structure.'
                    : !hasEmployees
                    ? 'Add employees to your organization and assign them to departments to generate the hierarchy.'
                    : 'Add departments and assign reporting lines to team members to automatically construct the live chart.'}
                </p>
                {!hasDepartments ? (
                  <button 
                    type="button" 
                    onClick={() => navigate('/admin/departments')}
                    className="btn-primary btn-compact"
                  >
                    <Plus size={14} />
                    <span>Create Department</span>
                  </button>
                ) : !hasEmployees ? (
                  <button 
                    type="button" 
                    onClick={() => navigate('/admin/users')}
                    className="btn-primary btn-compact"
                  >
                    <Plus size={14} />
                    <span>Add Employee</span>
                  </button>
                ) : null}
              </div>
            )
          )}
        </div>
        
        {/* Canvas Legend */}
        <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 flex flex-col sm:flex-row gap-2 pointer-events-none z-20 scale-80 sm:scale-95 origin-bottom-left">
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-sm border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-md bg-indigo-600 shadow-xs" />
            <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300">Department</span>
          </div>
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-sm border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-800 shadow-xs" />
            <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300">Employee</span>
          </div>
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-sm border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 flex items-center gap-2.5">
            <div className="w-3.5 h-[2px] bg-indigo-500 rounded-full" />
            <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300">Reporting Line</span>
          </div>
        </div>
        
        {/* Navigation Tip Pill */}
        <div className="hidden xl:block absolute bottom-6 right-6 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pointer-events-none bg-white/90 dark:bg-slate-900/90 backdrop-blur-md py-2 px-3.5 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800">
          Scroll / Drag to pan &bull; Ctrl + Scroll to zoom &bull; Click card to view details
        </div>
      </div>

      {/* Node Details Inspector Drawer */}
      <OrgChartDetailsDrawer 
        node={selectedNode}
        onClose={() => setSelectedNode(null)}
        onSelectNode={(node) => setSelectedNode(node)}
      />
    </div>
  );
};

export default OrgChart;
