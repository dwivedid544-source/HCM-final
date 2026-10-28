// ============================================================
// EmployeeContext.jsx
// Real API Integration + Robust Document Vault Sync
// ============================================================

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import { employeeAPI } from '../utils/apiService';
import { useDateFormat } from '../hooks/useDateFormat';

const EmployeeContext = createContext(null);

const EMPTY_ATTENDANCE = {
  isClockedIn: false,
  clockInTime: null,
  status: 'Not Clocked In',
  workingDuration: 0,
  mode: 'Office',
  shift: null,
  history: [],
  summary: {
    presentDays: 0,
    lateDays: 0,
    totalWorkedHours: 0,
    overtimeLogs: 0,
  },
};

const EMPTY_LEAVES = {
  balance: {
    sick: 0,
    annual: 0,
    casual: 0,
    unpaid: 0,
  },
  requests: [],
};

const EMPTY_PAYROLL = {
  history: [],
};

const EMPTY_BENEFITS = {
  claims: [],
  enrolledPlans: [],
  availablePlans: [],
  insurance: {
    provider: 'Global Health Inc.',
  },
  dependents: [],
};

const EMPTY_PERFORMANCE = {
  goals: [],
  skills: [],
  reviews: [],
};

const safeArray = (value) => {
  return Array.isArray(value) ? value : [];
};

const getApiData = (response, fallback = null) => {
  return response?.data?.data ?? fallback;
};

const getApiErrorMessage = (
  error,
  fallback = 'Something went wrong. Please try again.'
) => {
  return (
    error?.response?.data?.error?.message ||
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
};

const parseLocalStorageArray = (key) => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

const parseLocalStorageObject = (key) => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '{}');
    return value && typeof value === 'object' ? value : {};
  } catch {
    return {};
  }
};

export const EmployeeProvider = ({ children }) => {
  const { formatDate } = useDateFormat();

  // ============================================================
  // STATE
  // ============================================================

  const [profile, setProfileState] = useState(null);
  const [attendance, setAttendance] = useState(EMPTY_ATTENDANCE);
  const [leaves, setLeaves] = useState(EMPTY_LEAVES);
  const [payroll, setPayroll] = useState(EMPTY_PAYROLL);
  const [benefits, setBenefits] = useState(EMPTY_BENEFITS);
  const [performance, setPerformance] = useState(EMPTY_PERFORMANCE);
  const [tasks, setTasks] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [documents, setDocuments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ============================================================
  // REFS
  // ============================================================

  /**
   * Prevent an older documents request from overwriting a newer one.
   *
   * Example:
   * Request A starts
   * Request B starts
   * B finishes first
   * A finishes later
   *
   * Without this ref, A could overwrite the newer B state.
   */
  const documentsFetchIdRef = useRef(0);

  const mountedRef = useRef(true);

  // ============================================================
  // MOUNT / UNMOUNT
  // ============================================================

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ============================================================
  // TOAST
  // ============================================================

  const showToast = useCallback((message, type = 'success') => {
    if (!message) return;

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('app_toast', {
          detail: {
            message,
            type,
          },
        })
      );
    }
  }, []);

  // ============================================================
  // PROFILE
  // ============================================================

  const fetchProfile = useCallback(async () => {
    try {
      const response = await employeeAPI.getProfile();

      if (!response?.data?.success && !response?.data?.data) {
        throw new Error('Profile details are empty.');
      }

      const rawProfile = getApiData(response, {});

      const localOverrides = parseLocalStorageObject(
        'hcm_employee_profile_overrides'
      );

      const merged = {
        ...rawProfile,
        ...localOverrides,
      };

      const department =
        merged.department?.name ||
        merged.department ||
        '';

      const role =
        merged.user?.role ||
        merged.role ||
        '';

      const email =
        merged.user?.email ||
        merged.email ||
        '';

      const fullName =
        merged.fullName ||
        merged.name ||
        '';

      const emergencyName =
        merged.emergencyName ||
        merged.emergencyContact?.name ||
        '';

      const emergencyPhone =
        merged.emergencyPhone ||
        merged.emergencyContact?.phone ||
        '';

      const emergencyRelation =
        merged.emergencyRelation ||
        merged.emergencyContact?.relation ||
        '';

      const mappedProfile = {
        ...merged,

        fullName,
        department,
        role,
        email,
        skills: merged.skills || [],

        address:
          merged.address ||
          'Not Provided',

        avatar:
          merged.avatarUrl ||
          merged.avatar ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(
            fullName || 'Employee'
          )}&background=4f46e5&color=fff`,

        dob: merged.dob
          ? formatDate(merged.dob)
          : '',

        bloodGroup:
          merged.bloodGroup ||
          '',

        gender:
          merged.gender ||
          '',

        phone:
          merged.phone ||
          '',

        emergencyName,
        emergencyPhone,
        emergencyRelation,

        emergencyContact: {
          name: emergencyName,
          relation: emergencyRelation,
          phone: emergencyPhone,
        },

        shift:
          merged.shift ||
          null,

        baseSalary:
          merged.compensationProfile?.baseSalary ??
          merged.baseSalary ??
          0,

        monthlyCTC:
          merged.compensationProfile?.monthlyCTC ??
          merged.monthlyCTC ??
          0,

        annualCTC:
          merged.compensationProfile?.annualCTC ??
          (
            merged.compensationProfile?.monthlyCTC
              ? merged.compensationProfile.monthlyCTC * 12
              : merged.monthlyCTC
                ? merged.monthlyCTC * 12
                : 0
          ),
      };

      if (mountedRef.current) {
        setProfileState(mappedProfile);
      }

      return mappedProfile;
    } catch (err) {
      showToast(
        getApiErrorMessage(
          err,
          'Failed to load employee profile.'
        ),
        'error'
      );

      throw err;
    }
  }, [formatDate, showToast]);

  // ============================================================
  // ATTENDANCE
  // ============================================================

  const fetchAttendance = useCallback(async (params) => {
    try {
      const [currRes, histRes] = await Promise.allSettled([
        employeeAPI.getCurrentAttendance(),
        employeeAPI.getAttendanceHistory(params)
      ]);

      const currData = currRes.status === 'fulfilled' ? (currRes.value?.data?.data || currRes.value?.data || {}) : {};
      const histPayload = histRes.status === 'fulfilled' ? (histRes.value?.data || {}) : {};
      const rawHistory = safeArray(
        histPayload.data || histPayload.logs || (Array.isArray(histPayload) ? histPayload : [])
      );
      const summaryData = histPayload.summary || null;

      const activeLog = rawHistory.find(
        (item) => !item?.clockOut
      );

      const mappedHistory = rawHistory.map((item) => {
        const inTime = item?.clockIn
          ? new Date(item.clockIn)
          : null;

        const outTime = item?.clockOut
          ? new Date(item.clockOut)
          : null;

        let formattedTotalHours = '-';

        if (
          item?.totalWorkedMin !== undefined &&
          Number(item.totalWorkedMin) > 0
        ) {
          const totalMinutes =
            Number(item.totalWorkedMin);

          const hours = Math.floor(
            totalMinutes / 60
          );

          const minutes =
            totalMinutes % 60;

          formattedTotalHours = `${hours}h ${minutes}m`;
        } else if (inTime && outTime) {
          let diffMs =
            outTime.getTime() -
            inTime.getTime();

          const breakMinutes =
            Number(item?.breakMinutes || 0);

          diffMs = Math.max(
            0,
            diffMs - breakMinutes * 60000
          );

          const hours =
            Math.floor(diffMs / 3600000);

          const minutes =
            Math.floor(
              (diffMs % 3600000) / 60000
            );

          formattedTotalHours = `${hours}h ${minutes}m`;
        }

        return {
          ...item,
          id: item?.id,
          date: inTime
            ? formatDate(inTime)
            : item?.date
              ? formatDate(item.date)
              : '-',
          rawDate:
            item?.date ||
            item?.clockIn ||
            null,
          mode:
            item?.mode ||
            'Office',
          clockIn:
            inTime
              ? inTime.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              })
              : '-',
          clockOut:
            outTime
              ? outTime.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              })
              : '-',
          status:
            item?.status ||
            'Present',
          isHalfDay:
            Boolean(item?.isHalfDay),
          formattedTotalHours,
        };
      });

      const isClockedIn = Boolean(currData.isClockedIn !== undefined ? currData.isClockedIn : activeLog);
      const clockInTime = currData.checkInTime || activeLog?.clockIn || null;
      const status = currData.status || (isClockedIn ? (activeLog?.status || 'Present') : 'Not Clocked In');
      const workingDuration = currData.workingDuration !== undefined ? currData.workingDuration : (
        isClockedIn && clockInTime ? Math.max(0, Math.floor((Date.now() - new Date(clockInTime).getTime()) / 1000)) : 0
      );

      if (mountedRef.current) {
        setAttendance({
          isClockedIn,
          clockInTime,
          status,
          mode: currData.mode || activeLog?.mode || 'Office',
          workingDuration,
          shift: currData.shift || activeLog?.shift || null,
          history: mappedHistory,
          summary: summaryData
        });
      }

      return mappedHistory;
    } catch {
      // Attendance failure should not block the whole employee portal.
      return [];
    }
  }, [formatDate]);

  // ============================================================
  // LEAVES
  // ============================================================

  const fetchLeaves = useCallback(async (params) => {
    try {
      const [leavesRes, balRes] = await Promise.allSettled([
        employeeAPI.getLeaves(params),
        employeeAPI.getLeaveBalance()
      ]);

      const rawPayload = leavesRes.status === 'fulfilled' ? leavesRes.value?.data?.data || leavesRes.value?.data : null;
      const balPayload = balRes.status === 'fulfilled' ? balRes.value?.data?.balance || balRes.value?.data?.data || balRes.value?.data : null;
      
      let rawRequests = [];
      let serverBalance = balPayload || (rawPayload?.balance || null);
      let serverPolicies = [];

      if (Array.isArray(rawPayload)) {
        rawRequests = rawPayload;
      } else if (rawPayload && typeof rawPayload === 'object') {
        rawRequests = Array.isArray(rawPayload.requests) ? rawPayload.requests : (Array.isArray(rawPayload.leaves) ? rawPayload.leaves : []);
        serverPolicies = Array.isArray(rawPayload.policies) ? rawPayload.policies : [];
      }

      const requests = rawRequests.map((leave) => ({
        ...leave,
        id: leave.id,
        type:
          leave?.leaveType ||
          leave?.type ||
          'Annual Leave',
        reason:
          leave?.reason ||
          '',
        status:
          leave?.status === 'APPROVED' || leave?.status === 'Approved'
            ? 'Approved'
            : leave?.status === 'PENDING' || leave?.status === 'Pending'
              ? 'Pending'
              : leave?.status === 'MANAGER_APPROVED'
                ? 'MANAGER_APPROVED'
                : leave?.status === 'REJECTED' || leave?.status === 'Rejected'
                  ? 'Rejected'
                  : leave?.status === 'CANCELLED' || leave?.status === 'Cancelled'
                    ? 'Cancelled'
                    : leave?.status || 'Pending',
        days:
          Number(
            leave?.totalDays ??
            leave?.days ??
            0
          ),
        startDate:
          leave?.startDate
            ? formatDate(leave.startDate)
            : '',
        endDate:
          leave?.endDate
            ? formatDate(leave.endDate)
            : '',
        rawStartDate:
          leave?.startDate,
        rawEndDate:
          leave?.endDate,
        attachmentName: leave?.attachmentName,
        attachmentUrl: leave?.attachmentUrl
      }));

      const approved = requests.filter(
        (leave) =>
          leave.status === 'Approved'
      );

      const sickUsed =
        approved
          .filter((leave) => leave.type === 'Sick Leave')
          .reduce((total, leave) => total + leave.days, 0);

      const annualUsed =
        approved
          .filter((leave) => leave.type === 'Annual Leave')
          .reduce((total, leave) => total + leave.days, 0);

      const casualUsed =
        approved
          .filter((leave) => leave.type === 'Casual Leave')
          .reduce((total, leave) => total + leave.days, 0);

      const unpaidUsed =
        approved
          .filter((leave) => leave.type === 'Unpaid Leave')
          .reduce((total, leave) => total + leave.days, 0);

      const sickTotal = serverBalance?.sickTotal ?? 12;
      const annualTotal = serverBalance?.annualTotal ?? 18;
      const casualTotal = serverBalance?.casualTotal ?? 6;

      const nextLeaves = {
        balance: {
          sick: serverBalance?.sick ?? Math.max(0, sickTotal - sickUsed),
          sickTotal,
          sickUsed: serverBalance?.sickUsed ?? sickUsed,
          annual: serverBalance?.annual ?? Math.max(0, annualTotal - annualUsed),
          annualTotal,
          annualUsed: serverBalance?.annualUsed ?? annualUsed,
          casual: serverBalance?.casual ?? Math.max(0, casualTotal - casualUsed),
          casualTotal,
          casualUsed: serverBalance?.casualUsed ?? casualUsed,
          unpaid: serverBalance?.unpaid ?? unpaidUsed,
          totalAllowance: serverBalance?.totalAllowance ?? (sickTotal + annualTotal + casualTotal),
          totalUsed: serverBalance?.totalUsed ?? (sickUsed + annualUsed + casualUsed + unpaidUsed),
          totalRemaining: serverBalance?.totalRemaining ?? Math.max(0, (sickTotal + annualTotal + casualTotal) - (sickUsed + annualUsed + casualUsed)),
          details: serverBalance?.details || []
        },
        policies: serverPolicies,
        requests,
      };

      if (mountedRef.current) {
        setLeaves(nextLeaves);
      }

      return nextLeaves;
    } catch (err) {
      showToast(
        getApiErrorMessage(
          err,
          'Failed to load leaves.'
        ),
        'error'
      );

      return EMPTY_LEAVES;
    }
  }, [formatDate, showToast]);

  // ============================================================
  // PAYSLIPS
  // ============================================================

  const fetchPayslips = useCallback(async () => {
    try {
      const response =
        await employeeAPI.getPayslips();

      const rawPayslips = safeArray(
        getApiData(response, [])
      );

      const mapped = rawPayslips.map(
        (payslip) => ({
          ...payslip,

          net:
            payslip?.netPay ??
            payslip?.net ??
            0,

          date:
            payslip?.paymentDate
              ? formatDate(
                payslip.paymentDate
              )
              : payslip?.createdAt
                ? formatDate(
                  payslip.createdAt
                )
                : '',
        })
      );

      if (mountedRef.current) {
        setPayroll({
          history: mapped,
        });
      }

      return mapped;
    } catch (err) {
      showToast(
        getApiErrorMessage(
          err,
          'Failed to load payslips.'
        ),
        'error'
      );

      return [];
    }
  }, [formatDate, showToast]);

  // ============================================================
  // PERFORMANCE
  // ============================================================

  const fetchPerformance = useCallback(async () => {
    try {
      const response =
        await employeeAPI.getPerformance();

      const data =
        getApiData(response, {}) || {};

      const localGoals =
        parseLocalStorageArray(
          'hcm_employee_custom_goals'
        );

      const backendGoals =
        safeArray(data?.goals);

      const backendGoalIds =
        new Set(
          backendGoals.map(
            (goal) => String(goal?.id)
          )
        );

      const uniqueLocalGoals =
        localGoals.filter(
          (goal) =>
            !backendGoalIds.has(
              String(goal?.id)
            )
        );

      const nextPerformance = {
        goals: [
          ...backendGoals,
          ...uniqueLocalGoals,
        ],

        skills:
          safeArray(data?.skills),

        reviews:
          safeArray(data?.reviews),
      };

      if (mountedRef.current) {
        setPerformance(nextPerformance);
      }

      return nextPerformance;
    } catch {
      const localGoals =
        parseLocalStorageArray(
          'hcm_employee_custom_goals'
        );

      if (mountedRef.current) {
        setPerformance((previous) => ({
          ...previous,

          goals:
            previous.goals?.length
              ? previous.goals
              : localGoals,
        }));
      }

      return null;
    }
  }, []);

  // ============================================================
  // BENEFITS
  // ============================================================

  const fetchBenefits = useCallback(async () => {
    try {
      const response =
        await employeeAPI.getBenefits();

      const data =
        getApiData(response, []);

      const claims =
        Array.isArray(data)
          ? data
          : safeArray(data?.claims);

      const enrolledPlans =
        Array.isArray(data)
          ? []
          : safeArray(
            data?.enrolledPlans
          );

      const availablePlans =
        Array.isArray(data)
          ? []
          : safeArray(
            data?.availablePlans
          );

      const nextBenefits = {
        claims,

        enrolledPlans,

        availablePlans,

        insurance: {
          provider:
            data?.insurance?.provider ||
            'Global Health Inc.',
        },

        dependents:
          safeArray(data?.dependents),
      };

      if (mountedRef.current) {
        setBenefits(nextBenefits);
      }

      return nextBenefits;
    } catch {
      return EMPTY_BENEFITS;
    }
  }, []);

  // ============================================================
  // TASKS
  // ============================================================

  const fetchTasks = useCallback(async () => {
    try {
      const response =
        await employeeAPI.getTasks();

      const data =
        getApiData(response, []);

      const nextTasks =
        safeArray(data);

      if (mountedRef.current) {
        setTasks(nextTasks);
      }

      return nextTasks;
    } catch {
      return [];
    }
  }, []);

  // ============================================================
  // TICKETS
  // ============================================================

  const fetchTickets = useCallback(async () => {
    try {
      const response =
        await employeeAPI.getTickets();

      const data =
        getApiData(response, []);

      const nextTickets =
        safeArray(data);

      if (mountedRef.current) {
        setTickets(nextTickets);
      }

      return nextTickets;
    } catch (err) {
      showToast(
        getApiErrorMessage(
          err,
          'Failed to load support tickets.'
        ),
        'error'
      );

      return [];
    }
  }, [showToast]);

  // ============================================================
  // ANNOUNCEMENTS
  // ============================================================

  const fetchAnnouncements = useCallback(async () => {
    try {
      const response =
        await employeeAPI.getAnnouncements();

      const nextAnnouncements =
        safeArray(
          getApiData(response, [])
        );

      if (mountedRef.current) {
        setAnnouncements(
          nextAnnouncements
        );
      }

      return nextAnnouncements;
    } catch (err) {
      showToast(
        getApiErrorMessage(
          err,
          'Failed to load announcements.'
        ),
        'error'
      );

      return [];
    }
  }, [showToast]);

  // ============================================================
  // HOLIDAYS
  // ============================================================

  const fetchHolidays = useCallback(async () => {
    try {
      const response =
        await employeeAPI.getHolidays();

      const nextHolidays =
        safeArray(
          getApiData(response, [])
        );

      if (mountedRef.current) {
        setHolidays(nextHolidays);
      }

      return nextHolidays;
    } catch (err) {
      showToast(
        getApiErrorMessage(
          err,
          'Failed to load holidays.'
        ),
        'error'
      );

      return [];
    }
  }, [showToast]);

  // ============================================================
  // DOCUMENTS
  // ============================================================

  const fetchDocuments = useCallback(async () => {
    const fetchId =
      ++documentsFetchIdRef.current;

    try {
      const response =
        await employeeAPI.getDocuments();

      if (
        fetchId !==
        documentsFetchIdRef.current
      ) {
        return [];
      }

      const rawData =
        getApiData(response, []);

      /**
       * Backend may return:
       *
       * data: []
       *
       * OR
       *
       * data: {
       *   documents: []
       * }
       *
       * Support both formats.
       */
      const nextDocuments =
        Array.isArray(rawData)
          ? rawData
          : safeArray(
            rawData?.documents
          );

      if (mountedRef.current) {
        setDocuments(
          nextDocuments
        );
      }

      return nextDocuments;
    } catch (err) {
      if (
        fetchId ===
        documentsFetchIdRef.current
      ) {
        showToast(
          getApiErrorMessage(
            err,
            'Failed to load documents.'
          ),
          'error'
        );
      }

      return [];
    }
  }, [showToast]);

  // ============================================================
  // INITIALIZE PORTAL
  // ============================================================

  const initializePortal =
    useCallback(async () => {
      if (!mountedRef.current) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        /**
         * Profile is loaded first because many pages
         * depend on employee identity.
         */
        await fetchProfile();

        /**
         * Everything else can load concurrently.
         *
         * Individual API failures do not break
         * the complete employee portal.
         */
        await Promise.allSettled([
          fetchAttendance(),
          fetchLeaves(),
          fetchPayslips(),
          fetchPerformance(),
          fetchBenefits(),
          fetchTasks(),
          fetchTickets(),
          fetchAnnouncements(),
          fetchHolidays(),
          fetchDocuments(),
        ]);
      } catch (err) {
        console.error(
          'Employee Portal Initialization Error:',
          err
        );

        if (mountedRef.current) {
          setError(
            'Failed to load employee profile data. Please verify your connection.'
          );
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    }, [
      fetchProfile,
      fetchAttendance,
      fetchLeaves,
      fetchPayslips,
      fetchPerformance,
      fetchBenefits,
      fetchTasks,
      fetchTickets,
      fetchAnnouncements,
      fetchHolidays,
      fetchDocuments,
    ]);

  useEffect(() => {
    initializePortal();
  }, [initializePortal]);

  // ============================================================
  // PROFILE ACTION
  // ============================================================

  const updateProfileAction =
    useCallback(
      async (data) => {
        try {
          const currentOverrides =
            parseLocalStorageObject(
              'hcm_employee_profile_overrides'
            );

          const updatedOverrides = {
            ...currentOverrides,
            ...data,
          };

          localStorage.setItem(
            'hcm_employee_profile_overrides',
            JSON.stringify(
              updatedOverrides
            )
          );

          await employeeAPI.updateProfile(
            data
          );

          await fetchProfile();

          showToast(
            'Profile updated successfully!'
          );
        } catch (err) {
          /**
           * Keep local fallback behavior.
           */
          const currentOverrides =
            parseLocalStorageObject(
              'hcm_employee_profile_overrides'
            );

          const updatedOverrides = {
            ...currentOverrides,
            ...data,
          };

          localStorage.setItem(
            'hcm_employee_profile_overrides',
            JSON.stringify(
              updatedOverrides
            )
          );

          await fetchProfile();

          showToast(
            'Profile saved locally. Server update failed.',
            'info'
          );
        }
      },
      [fetchProfile, showToast]
    );

  // ============================================================
  // ATTENDANCE ACTIONS
  // ============================================================

  const clockIn = useCallback(
    async (mode = 'Office') => {
      try {
        await employeeAPI.clockIn({
          mode,
        });

        await fetchAttendance();

        showToast(
          'Clocked in successfully!'
        );
      } catch (err) {
        throw err;
      }
    },
    [fetchAttendance, showToast]
  );

  const clockOut = useCallback(
    async () => {
      try {
        await employeeAPI.clockOut();

        await fetchAttendance();

        showToast(
          'Clocked out successfully!'
        );
      } catch (err) {
        throw err;
      }
    },
    [fetchAttendance, showToast]
  );

  // ============================================================
  // LEAVE ACTIONS
  // ============================================================

  const requestLeave = useCallback(
    async (request) => {
      try {
        await employeeAPI.applyLeave(
          request
        );

        await fetchLeaves();

        showToast(
          'Leave request submitted!'
        );
      } catch (err) {
        throw err;
      }
    },
    [fetchLeaves, showToast]
  );

  const cancelLeave = useCallback(
    async (id) => {
      try {
        await employeeAPI.cancelLeave(id);

        await fetchLeaves();

        showToast(
          'Leave cancelled'
        );
      } catch (err) {
        showToast(
          getApiErrorMessage(
            err,
            'Failed to cancel leave.'
          ),
          'error'
        );

        throw err;
      }
    },
    [fetchLeaves, showToast]
  );

  // ============================================================
  // BENEFIT ACTIONS
  // ============================================================

  const addBenefitClaim =
    useCallback(
      async (claim) => {
        try {
          await employeeAPI.submitBenefitClaim(
            claim
          );

          await fetchBenefits();

          showToast(
            'Benefit claim submitted!'
          );
        } catch (err) {
          showToast(
            getApiErrorMessage(
              err,
              'Failed to submit benefit claim.'
            ),
            'error'
          );

          throw err;
        }
      },
      [fetchBenefits, showToast]
    );

  const enrollInBenefit =
    useCallback(
      async (benefitPlanId) => {
        try {
          await employeeAPI.enrollBenefitPlan(
            {
              benefitPlanId,
            }
          );

          await fetchBenefits();

          showToast(
            'Enrolled in benefit plan successfully!'
          );
        } catch (err) {
          showToast(
            getApiErrorMessage(
              err,
              'Failed to enroll in benefit plan.'
            ),
            'error'
          );

          throw err;
        }
      },
      [fetchBenefits, showToast]
    );

  const unenrollFromBenefit =
    useCallback(
      async (benefitPlanId) => {
        try {
          await employeeAPI.unenrollBenefitPlan(
            {
              benefitPlanId,
            }
          );

          await fetchBenefits();

          showToast(
            'Unenrolled from benefit plan successfully!'
          );
        } catch (err) {
          showToast(
            getApiErrorMessage(
              err,
              'Failed to unenroll from benefit plan.'
            ),
            'error'
          );

          throw err;
        }
      },
      [fetchBenefits, showToast]
    );

  // ============================================================
  // TICKET ACTIONS
  // ============================================================

  const createTicket = useCallback(
    async (ticket) => {
      try {
        await employeeAPI.createTicket(
          ticket
        );

        await fetchTickets();

        showToast(
          'Support ticket created!'
        );
      } catch (err) {
        showToast(
          getApiErrorMessage(
            err,
            'Failed to create ticket.'
          ),
          'error'
        );

        throw err;
      }
    },
    [fetchTickets, showToast]
  );

  const replyTicket = useCallback(
    async (
      id,
      text,
      attachmentBase64 = null
    ) => {
      try {
        await employeeAPI.replyTicket(
          id,
          text,
          attachmentBase64
        );

        await fetchTickets();
      } catch (err) {
        showToast(
          getApiErrorMessage(
            err,
            'Failed to send reply.'
          ),
          'error'
        );

        throw err;
      }
    },
    [fetchTickets, showToast]
  );

  const deleteTicketMessage =
    useCallback(
      async (id, messageId) => {
        try {
          await employeeAPI.deleteTicketMessage(
            id,
            messageId
          );

          await fetchTickets();

          showToast(
            'Message deleted successfully'
          );
        } catch (err) {
          showToast(
            getApiErrorMessage(
              err,
              'Failed to delete message.'
            ),
            'error'
          );

          throw err;
        }
      },
      [fetchTickets, showToast]
    );

  // ============================================================
  // GOAL ACTIONS
  // ============================================================

  const updateGoalProgress =
    useCallback(
      async (id, progress) => {
        try {
          const numericProgress =
            Math.min(
              100,
              Math.max(
                0,
                Number(progress) || 0
              )
            );

          if (
            id &&
            !String(id).startsWith(
              'custom-goal-'
            )
          ) {
            await employeeAPI.updateGoalProgress(
              id,
              numericProgress
            );
          }

          const localGoals =
            parseLocalStorageArray(
              'hcm_employee_custom_goals'
            );

          const updatedLocal =
            localGoals.map(
              (goal) =>
                String(goal?.id) ===
                  String(id)
                  ? {
                    ...goal,
                    progress:
                      numericProgress,
                  }
                  : goal
            );

          localStorage.setItem(
            'hcm_employee_custom_goals',
            JSON.stringify(
              updatedLocal
            )
          );

          await fetchPerformance();

          showToast(
            'Goal progress updated successfully'
          );
        } catch (err) {
          showToast(
            getApiErrorMessage(
              err,
              'Failed to update goal progress.'
            ),
            'error'
          );

          throw err;
        }
      },
      [fetchPerformance, showToast]
    );

  const updateGoal = useCallback(
    async (goalId, updatedFields) => {
      try {
        if (goalId && !String(goalId).startsWith('custom-goal-')) {
          await employeeAPI.updateGoal(goalId, updatedFields);
        }

        const localGoals = parseLocalStorageArray('hcm_employee_custom_goals');
        const updatedLocal = localGoals.map((g) => {
          if (String(g?.id) === String(goalId)) {
            return { ...g, ...updatedFields };
          }
          return g;
        });
        localStorage.setItem('hcm_employee_custom_goals', JSON.stringify(updatedLocal));

        await fetchPerformance();
        showToast('Strategic goal updated successfully');
      } catch (err) {
        showToast(
          getApiErrorMessage(err, 'Failed to update goal.'),
          'error'
        );
        throw err;
      }
    },
    [fetchPerformance, showToast]
  );

  const addGoal = useCallback(
    async (newGoal) => {
      try {
        try {
          await employeeAPI.createGoal(
            newGoal
          );
        } catch (apiError) {
          console.warn(
            'Backend createGoal failed. Using local fallback.',
            apiError
          );

          const goal = {
            id: `custom-goal-${Date.now()}`,

            title:
              newGoal?.title ||
              'Untitled Goal',

            priority:
              newGoal?.priority ||
              'Medium',

            deadline:
              newGoal?.deadline ||
              'Q4 2026',

            progress:
              Number(
                newGoal?.progress || 0
              ),

            category:
              newGoal?.category ||
              'Strategic',

            description:
              newGoal?.description ||
              '',
          };

          const localGoals =
            parseLocalStorageArray(
              'hcm_employee_custom_goals'
            );

          localStorage.setItem(
            'hcm_employee_custom_goals',
            JSON.stringify([
              goal,
              ...localGoals,
            ])
          );
        }

        await fetchPerformance();

        showToast(
          'New Strategic Goal added successfully!'
        );
      } catch (err) {
        showToast(
          getApiErrorMessage(
            err,
            'Failed to add goal.'
          ),
          'error'
        );

        throw err;
      }
    },
    [fetchPerformance, showToast]
  );

  const deleteGoal = useCallback(
    async (goalId) => {
      try {
        if (
          goalId &&
          !String(goalId).startsWith(
            'custom-goal-'
          )
        ) {
          await employeeAPI.deleteGoal(
            goalId
          );
        }

        const localGoals =
          parseLocalStorageArray(
            'hcm_employee_custom_goals'
          );

        const updatedLocal =
          localGoals.filter(
            (goal) =>
              String(goal?.id) !==
              String(goalId)
          );

        localStorage.setItem(
          'hcm_employee_custom_goals',
          JSON.stringify(
            updatedLocal
          )
        );

        await fetchPerformance();

        showToast(
          'Strategic goal removed'
        );
      } catch (err) {
        showToast(
          getApiErrorMessage(
            err,
            'Failed to remove goal.'
          ),
          'error'
        );

        throw err;
      }
    },
    [fetchPerformance, showToast]
  );

  // ============================================================
  // SKILL ACTIONS
  // ============================================================

  const upsertSkill = useCallback(
    async (skillData) => {
      try {
        await employeeAPI.upsertSkill(
          skillData
        );

        await fetchPerformance();

        showToast(
          'Skill updated successfully'
        );
      } catch (err) {
        showToast(
          getApiErrorMessage(
            err,
            'Failed to update skill.'
          ),
          'error'
        );

        throw err;
      }
    },
    [fetchPerformance, showToast]
  );

  const deleteSkill = useCallback(
    async (id) => {
      try {
        await employeeAPI.deleteSkill(
          id
        );

        await fetchPerformance();

        showToast(
          'Skill deleted successfully'
        );
      } catch (err) {
        showToast(
          getApiErrorMessage(
            err,
            'Failed to delete skill.'
          ),
          'error'
        );

        throw err;
      }
    },
    [fetchPerformance, showToast]
  );

  // ============================================================
  // DOCUMENT UPLOAD
  // ============================================================

  const uploadDoc = useCallback(
    async (documentPayload) => {
      try {
        let response;

        const isFormData =
          typeof FormData !== 'undefined' &&
          documentPayload instanceof FormData;

        if (isFormData) {
          console.log('[UPLOAD-TRACE] Sending formData to API via uploadDocumentFile');
          response =
            await employeeAPI.uploadDocumentFile(
              documentPayload
            );
        } else {
          console.log('[UPLOAD-TRACE] Sending JSON to API via uploadDocument');
          response =
            await employeeAPI.uploadDocument(
              documentPayload
            );
        }

        console.log('[UPLOAD-TRACE] API Response received:', { status: response?.status, data: response?.data });

        const created =
          response?.data?.data ?? response?.data ?? response ?? null;
        
        console.log('[UPLOAD-TRACE] Parsed created document:', created);

        /**
         * Add newly created document immediately.
         *
         * This makes UI feel instant while the
         * server synchronization runs afterwards.
         */
        if (created && mountedRef.current) {
          setDocuments((previous) => {
            const current =
              safeArray(previous);

            const createdId =
              created?.id;

            if (!createdId) {
              return [
                created,
                ...current,
              ];
            }

            return [
              created,
              ...current.filter(
                (document) =>
                  String(document?.id) !==
                  String(createdId)
              ),
            ];
          });
        }

        /**
         * Fetch latest server state.
         *
         * Do NOT await this here. Upload success
         * should return immediately.
         */
        void fetchDocuments();

        showToast(
          'Document uploaded successfully!'
        );

        return created;
      } catch (err) {
        console.error('[UPLOAD-TRACE] Error during upload:', err);
        const message =
          getApiErrorMessage(
            err,
            'Failed to upload document.'
          );

        showToast(
          message,
          'error'
        );

        throw err;
      }
    },
    [fetchDocuments, showToast]
  );

  // ============================================================
  // DOCUMENT DELETE
  // ============================================================

  const deleteDoc = useCallback(
    async (id) => {
      try {
        if (!id) {
          throw new Error(
            'Document ID is required.'
          );
        }

        await employeeAPI.deleteDocument(
          id
        );

        /**
         * Optimistically remove from UI.
         */
        if (mountedRef.current) {
          setDocuments((previous) =>
            safeArray(previous).filter(
              (document) =>
                String(document?.id) !==
                String(id)
            )
          );
        }

        /**
         * Server remains source of truth.
         */
        await fetchDocuments();

        showToast(
          'Document deleted successfully'
        );
      } catch (err) {
        /**
         * If delete failed, restore actual
         * server state.
         */
        await fetchDocuments();

        showToast(
          getApiErrorMessage(
            err,
            'Failed to delete document.'
          ),
          'error'
        );

        throw err;
      }
    },
    [fetchDocuments, showToast]
  );

  // ============================================================
  // RESIGNATION
  // ============================================================

  const submitResignation =
    useCallback(
      async (data) => {
        try {
          await employeeAPI.submitResignation(
            data
          );

          showToast(
            'Resignation request submitted successfully'
          );

          await fetchProfile();

          return {
            success: true,
          };
        } catch (err) {
          const message =
            getApiErrorMessage(
              err,
              'Failed to submit resignation.'
            );

          showToast(
            message,
            'error'
          );

          return {
            success: false,
            message,
          };
        }
      },
      [fetchProfile, showToast]
    );

  // ============================================================
  // CROSS-ROLE SYNC
  // ============================================================

  useEffect(() => {
    const handleSync = () => {
      void fetchAttendance();
      void fetchLeaves();
    };

    window.addEventListener(
      'hcm_global_sync',
      handleSync
    );

    window.addEventListener(
      'manager_leave_updated',
      handleSync
    );

    return () => {
      window.removeEventListener(
        'hcm_global_sync',
        handleSync
      );

      window.removeEventListener(
        'manager_leave_updated',
        handleSync
      );
    };
  }, [fetchAttendance, fetchLeaves]);

  // ============================================================
  // CONTEXT VALUE
  // ============================================================

  const contextValue = {
    profile,

    setProfile:
      updateProfileAction,

    attendance,
    clockIn,
    clockOut,

    leaves,
    requestLeave,
    cancelLeave,

    payroll,

    benefits,
    addBenefitClaim,
    enrollInBenefit,
    unenrollFromBenefit,

    documents,
    uploadDoc,
    deleteDoc,

    performance,
    updateGoalProgress,
    updateGoal,
    addGoal,
    deleteGoal,
    upsertSkill,
    deleteSkill,

    tickets,
    createTicket,
    replyTicket,
    deleteTicketMessage,

    tasks,

    announcements,

    holidays,

    loading,
    error,

    showToast,

    submitResignation,

    refetch: {
      fetchProfile,
      fetchAttendance,
      fetchLeaves,
      fetchPayslips,
      fetchPerformance,
      fetchBenefits,
      fetchTasks,
      fetchTickets,
      fetchAnnouncements,
      fetchHolidays,
      fetchDocuments,
    },

    refetchAll:
      initializePortal,
  };

  return (
    <EmployeeContext.Provider
      value={contextValue}
    >
      {children}
    </EmployeeContext.Provider>
  );
};

// ============================================================
// HOOK
// ============================================================

export const useEmployee = () => {
  const context =
    useContext(EmployeeContext);

  if (!context) {
    throw new Error(
      'useEmployee must be used within an EmployeeProvider'
    );
  }

  return context;
};