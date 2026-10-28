// ============================================================
// CandidateContext.jsx - Real API Integration & Demo Fallback
// ============================================================
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { candidateAPI, notificationAPI } from '../utils/apiService';
import { useCurrency } from '../hooks/useCurrency';
import { useDateFormat } from '../hooks/useDateFormat';

export const CandidateContext = createContext();

export const useCandidate = () => {
  const { formatCurrency, getSymbol, getIcon, masterCurrency } = useCurrency();

  const context = useContext(CandidateContext);
  if (!context) throw new Error('useCandidate must be used within a CandidateProvider');
  return context;
};

export const CandidateProvider = ({ children }) => {
  const { getSymbol } = useCurrency();
  const { formatDate } = useDateFormat();
  const [candidate, setCandidate] = useState({});
  const [offers, setOffers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const showToast = (message, type = 'success') => {
    window.dispatchEvent(new CustomEvent('app_toast', { detail: { message, type } }));
  };

  // --- FETCH FUNCTIONS ---
  const fetchProfile = useCallback(async () => {
    try {
      const res = await candidateAPI.getCandidateProfile();
      if (res.data?.success && res.data.data) {
        setCandidate(prev => {
          const profile = prev.profile || {};
          const profileData = res.data.data;
          const email = profileData.user?.email || profile.email || '';
          const fullName = profileData.fullName || email.split('@')[0] || profile.fullName || 'Alex Rivera';

          // Parse skills from database comma-separated string to array
          const skills = profileData.skills
            ? profileData.skills.split(',').map(s => s.trim()).filter(Boolean)
            : (Array.isArray(profile.skills) ? profile.skills : []);

          // Build documents array from DB URLs
          const documents = [];
          if (profileData.identityProofUrl) {
            documents.push({ id: 'doc-identity', name: 'Identity Proof', type: 'Identification', url: profileData.identityProofUrl, date: formatDate(new Date()) });
          }
          if (profileData.educationProofUrl) {
            documents.push({ id: 'doc-education', name: 'Education Proof', type: 'Education', url: profileData.educationProofUrl, date: formatDate(new Date()) });
          }

          // Safely parse resumeData if it exists
          let fetchedResume = prev.resume;
          if (profileData.resumeData) {
            try {
              fetchedResume = JSON.parse(profileData.resumeData);
            } catch (e) {
              console.warn("Failed to parse resumeData from DB", e);
            }
          }

          // Parse saved jobs from database
          let savedIndices = prev.jobs?.savedIndices || [];
          if (profileData.savedJobsList && Array.isArray(profileData.savedJobsList)) {
            savedIndices = profileData.savedJobsList;
          } else if (profileData.savedJobs) {
            try {
              const parsed = typeof profileData.savedJobs === 'string' ? JSON.parse(profileData.savedJobs) : profileData.savedJobs;
              if (Array.isArray(parsed)) savedIndices = parsed;
            } catch (e) {
              savedIndices = profileData.savedJobs.split(',').map(s => s.trim()).filter(Boolean);
            }
          }

          return {
            ...prev,
            jobs: {
              ...(prev.jobs || {}),
              savedIndices
            },
            profile: {
              ...profile,
              ...profileData,
              fullName,
              email,
              skills,
              avatar: profileData.avatarUrl || profile.avatar,
              resumeUrl: profileData.resumeUrl || profile.resumeUrl,
              documents: documents.length > 0 ? documents : (profile.documents || []),
            },
            resume: fetchedResume
          };
        });
      }
    } catch (err) {
      console.error(err);
    }
  }, [formatDate]);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await candidateAPI.getDashboardStats();
      if (res.data?.success && res.data.data) {
        setDashboardStats(res.data.data);
      }
    } catch (err) {
      console.error('[CandidateContext] Failed to fetch dashboard stats:', err);
    }
  }, []);

  const fetchJobs = useCallback(async () => {
    try {
      const res = await candidateAPI.getAvailableJobs();
      const rawJobs = res.data.data || [];
      const mapped = rawJobs.map(job => {
        const diffMs = new Date() - new Date(job.createdAt);
        const diffDays = Math.floor(diffMs / 86400000);
        const posted = diffDays <= 0 ? 'Today' : diffDays === 1 ? 'Yesterday' : `${diffDays}d ago`;

        // Parse requirements: if short/comma-separated treat as list, otherwise as single block
        let requirements = [];
        if (job.requirements && job.requirements.trim()) {
          const raw = job.requirements.trim();
          // If it has commas and is short (likely a list), split by comma
          if (raw.includes(',') && raw.length < 300) {
            requirements = raw.split(',').map(r => r.trim()).filter(Boolean);
          } else if (raw.includes('\n')) {
            // Split by newlines for bullet-point style
            requirements = raw.split('\n').map(r => r.replace(/^[•\-*\d.]+\s*/, '').trim()).filter(Boolean);
          } else {
            // Long paragraph - show as single item
            requirements = [raw];
          }
        }

        const companyName = job.company || job.organization?.name || (job.department ? `${job.department} Team` : 'HCM Network');

        return {
          id: job.id,
          title: job.title || 'Job Position',
          company: companyName,
          companyLogo: job.organization?.logoUrl || '',
          posted,
          createdAt: job.createdAt,
          location: job.location || 'Remote',
          salary: job.salaryRange || 'Competitive',
          type: job.jobType || 'Full-time',
          experience: job.experience || '',
          openings: job.openings || 1,
          department: job.department || 'General',
          desc: job.description || 'Exciting opportunity to join our growing team.',
          requirements,
          benefits: Array.isArray(job.benefits) && job.benefits.length > 0 ? job.benefits : [],
          hiringManager: job.hiringManager || null,
          organization: job.organization || null
        };
      });
      setCandidate(prev => ({ ...prev, jobs: { ...prev.jobs, allJobs: mapped } }));
    } catch (err) {
      console.error(err);
    }
  }, [formatDate]);

  const fetchApplications = useCallback(async () => {
    try {
      const res = await candidateAPI.getMyApplications();
      if (res.data?.success && res.data.data) {
        const allInterviews = [];
        const mapped = res.data.data.map(app => {
          const appDate = app.submittedAt ? formatDate(app.submittedAt) : formatDate(new Date());

          const displayStatus = app.status === 'APPLIED' ? 'Applied' :
            app.status === 'SCREENING' ? 'Under Review' :
              app.status === 'SHORTLISTED' ? 'Shortlisted' :
                app.status === 'INTERVIEWING' ? 'Interview' :
                  app.status === 'OFFERED' ? 'Offer' : 
                    app.status === 'HIRED' ? 'Offer Accepted' : 'Rejected';

          // Map backend interviews if present
          if (app.interviews && app.interviews.length > 0) {
            const now = new Date();
            app.interviews.forEach((iv, index) => {
              const ivDate = new Date(iv.dateTime);

              let interviewStatus = iv.status || 'Scheduled';
              if (displayStatus === 'Rejected') {
                interviewStatus = 'Cancelled';
              } else if (iv.status === 'Cancelled') {
                interviewStatus = 'Cancelled';
              } else if (ivDate < now) {
                interviewStatus = 'Completed';
              } else {
                interviewStatus = 'Scheduled';
              }

              allInterviews.push({
                id: iv.id || `${app.id}-iv-${index}`,
                appId: app.id,
                appStatus: displayStatus,
                rawDateTime: iv.dateTime,
                role: app.jobPost?.title || 'Unknown Role',
                company: app.jobPost?.organization?.name || 'GlobalTech Solutions',
                round: iv.round || `Interview Round ${index + 1}`,
                date: formatDate(ivDate),
                time: ivDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                timezone: 'PST',
                interviewer: iv.interviewer?.fullName || 'HR Team',
                interviewerRole: 'Recruiting Panel',
                link: iv.meetingLink || null,
                status: interviewStatus,
                type: iv.type || 'Video Call',
                feedback: iv.feedback || null,
                rating: iv.rating || null,
              });
            });
          }

          const timelineOrder = ['Applied', 'Under Review', 'Shortlisted', 'Interview', 'Offer'];
          const isRejected = displayStatus === 'Rejected';
          const isHired = displayStatus === 'Offer Accepted';
          const currentIndex = timelineOrder.indexOf(isRejected ? 'Applied' : (isHired ? 'Offer' : displayStatus));

          const generatedTimeline = [];
          for (let i = 0; i <= (currentIndex >= 0 ? currentIndex : 0); i++) {
            let stepDate = appDate;
            if (timelineOrder[i] === 'Interview' && app.interviews && app.interviews.length > 0) {
              stepDate = formatDate(new Date(app.interviews[0].dateTime));
            }
            generatedTimeline.push({ status: timelineOrder[i], date: stepDate });
          }

          if (isHired) {
            generatedTimeline.push({ status: 'Offer Accepted', date: formatDate(app.updatedAt || new Date()) });
          } else if (isRejected) {
            generatedTimeline.push({ status: 'Rejected', date: formatDate(app.updatedAt || new Date()) });
          }

          const companyName = app.jobPost?.organization?.name || 'GlobalTech Solutions';
          return {
            id: app.id,
            jobId: app.jobId,
            date: appDate,
            submittedAt: app.submittedAt,
            rawDate: app.submittedAt,
            status: displayStatus,
            company: companyName,
            companyLogo: app.jobPost?.organization?.logoUrl || null,
            role: app.jobPost?.title || 'Unknown Role',
            jobPost: app.jobPost || null,
            feedback: app.feedback || app.notes || null,
            timeline: generatedTimeline
          };
        });

        setCandidate(prev => ({
          ...prev,
          applications: mapped,
          interviews: allInterviews
        }));
      }
    } catch (err) {
      console.error(err);
    }
  }, [formatDate]);



  const updateProfile = async (newData) => {
    try {
      // Format skills as comma-separated string for database
      const payload = {
        ...newData,
        skills: Array.isArray(newData.skills) ? newData.skills.join(', ') : newData.skills
      };
      const res = await candidateAPI.updateCandidateProfile(payload);

      // Parse returned database profile skills string back into array
      const returnedData = res.data.data;
      const skills = returnedData.skills
        ? returnedData.skills.split(',').map(s => s.trim()).filter(Boolean)
        : [];

      await fetchProfile(); // Refresh to get the latest DB documents array & URLs mapped
      await fetchDashboard(); // Refresh dashboard stats (profile completion may have changed)
      showToast('Profile updated successfully!');
    } catch (err) {
      console.error(err);
      showToast('Failed to update profile', 'error');
    }
  };

  const updateResumeStep = (step, data) => {
    setCandidate(prev => ({
      ...prev,
      resume: { ...prev.resume, [step]: data }
    }));
  };

  const syncResumeToBackend = async (fullResumeData) => {
    try {
      const personal = fullResumeData?.personal || {};
      const fullName = [personal.firstName, personal.lastName].filter(Boolean).join(' ');
      const skillsString = Array.isArray(fullResumeData?.skills)
        ? fullResumeData.skills.map(s => typeof s === 'string' ? s : s.name).filter(Boolean).join(', ')
        : undefined;

      const payload = {
        resumeData: fullResumeData,
        fullName: fullName || undefined,
        role: personal.title || undefined,
        phone: personal.phone || undefined,
        location: personal.city || personal.address || undefined,
        city: personal.city || undefined,
        bio: personal.summary || undefined,
        avatarUrl: personal.avatar || undefined,
        linkedin: personal.linkedin || undefined,
        portfolio: personal.portfolio || undefined,
        skills: skillsString || undefined,
      };

      await candidateAPI.updateCandidateProfile(payload);
      
      setCandidate(prev => ({
        ...prev,
        resume: fullResumeData,
        profile: {
          ...(prev.profile || {}),
          fullName: fullName || prev.profile?.fullName,
          role: personal.title || prev.profile?.role,
          phone: personal.phone || prev.profile?.phone,
          location: personal.city || prev.profile?.location,
          city: personal.city || prev.profile?.city,
          bio: personal.summary || prev.profile?.bio,
          avatar: personal.avatar || prev.profile?.avatar,
          linkedin: personal.linkedin || prev.profile?.linkedin,
          portfolio: personal.portfolio || prev.profile?.portfolio,
          skills: Array.isArray(fullResumeData?.skills) 
            ? fullResumeData.skills.map(s => typeof s === 'string' ? s : s.name).filter(Boolean)
            : (prev.profile?.skills || [])
        }
      }));

      await fetchDashboard();
      showToast('Resume securely synced to database!');
      return { success: true };
    } catch (err) {
      console.error('[CandidateContext] Failed to sync resume:', err);
      showToast(err.response?.data?.error?.message || 'Failed to sync resume to database', 'error');
      return { success: false, error: err };
    }
  };

  const applyForJob = async (jobId, details) => {
    try {
      const res = await candidateAPI.applyToJob(jobId, details);
      await fetchApplications();
      await fetchProfile();
      await fetchDashboard();
      showToast('Application successfully dispatched!');
      return { success: true, data: res.data?.data };
    } catch (err) {
      console.error('[applyForJob error]:', err);
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to submit application';
      showToast(msg, 'error');
      return { success: false, message: msg };
    }
  };

  const saveJob = async (jobId) => {
    let prevSaved = [];
    setCandidate(prev => {
      const currentSaved = prev.jobs?.savedIndices || [];
      prevSaved = currentSaved;
      const exists = currentSaved.includes(jobId);
      const updated = exists ? currentSaved.filter(id => id !== jobId) : [...currentSaved, jobId];
      return { ...prev, jobs: { ...(prev.jobs || {}), savedIndices: updated } };
    });

    try {
      const res = await candidateAPI.toggleSaveJob(jobId);
      if (res.data?.success && res.data.data?.savedJobs) {
        setCandidate(prev => ({
          ...prev,
          jobs: { ...(prev.jobs || {}), savedIndices: res.data.data.savedJobs }
        }));
      }
    } catch (err) {
      console.error('Failed to toggle save job:', err);
      setCandidate(prev => ({
        ...prev,
        jobs: { ...(prev.jobs || {}), savedIndices: prevSaved }
      }));
      showToast('Failed to sync bookmark to server', 'error');
    }
  };

  const withdrawApplication = async (appId) => {
    try {
      await candidateAPI.withdrawApplication(appId);
      await fetchApplications();
      await fetchDashboard();
      showToast('Application successfully withdrawn');
    } catch (err) {
      console.error(err);
      showToast('Failed to withdraw application', 'error');
    }
  };

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await notificationAPI.getNotifications();
      if (res.data?.success) {
        const mapped = res.data.data.map(n => {
          let category = 'system';
          const linkLower = n.link ? n.link.toLowerCase() : '';
          const titleLower = n.title ? n.title.toLowerCase() : '';
          const msgLower = n.message ? n.message.toLowerCase() : '';

          if (linkLower.includes('job') || linkLower.includes('application') || titleLower.includes('application') || titleLower.includes('job') || msgLower.includes('application') || msgLower.includes('job') || msgLower.includes('resume')) {
            category = 'jobs';
          } else if (linkLower.includes('interview') || titleLower.includes('interview') || msgLower.includes('interview')) {
            category = 'interviews';
          } else if (linkLower.includes('offer') || titleLower.includes('offer') || msgLower.includes('offer')) {
            category = 'offers';
          }

          let timeDisplay = formatDate(n.createdAt);
          try {
            const diffMs = new Date() - new Date(n.createdAt);
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);
            if (diffMins < 1) timeDisplay = 'Just now';
            else if (diffMins < 60) timeDisplay = `${diffMins}m ago`;
            else if (diffHours < 24) timeDisplay = `${diffHours}h ago`;
            else timeDisplay = `${diffDays}d ago`;
          } catch (e) { }

          return {
            id: n.id,
            type: category,
            rawType: n.type,
            title: n.title,
            message: n.message,
            link: n.link,
            metadata: n.metadata,
            time: timeDisplay,
            createdAt: n.createdAt,
            isUnread: !n.isRead,
            action: 'View Details'
          };
        });
        setNotifications(mapped);
      }
    } catch (err) {
      console.error(err);
    }
  }, [formatDate]);

  const markAsRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await notificationAPI.deleteNotification(id);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const clearAllNotifications = async () => {
    try {
      await notificationAPI.clearAllNotifications();
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const addDocument = (doc) => {
    setCandidate(prev => ({
      ...prev,
      documents: [{ id: Date.now(), ...doc }, ...prev.documents]
    }));
  };

  const deleteDocument = (id) => {
    setCandidate(prev => ({
      ...prev,
      documents: prev.documents.filter(d => d.id !== id)
    }));
  };

  const fetchOffers = useCallback(async () => {
    try {
      const res = await candidateAPI.getOffers();
      if (res.data?.success && res.data.data) {
        setOffers(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch candidate offers:', err);
    }
  }, []);

  const respondToOffer = async (id, status) => {
    try {
      const res = await candidateAPI.respondToOffer(id, { status });
      if (res.data?.success) {
        showToast(`Offer successfully ${status.toLowerCase()}ed!`);
        await fetchOffers();
        await fetchApplications();
        await fetchDashboard();
      }
    } catch (err) {
      console.error('Failed to respond to offer:', err);
      showToast(err.response?.data?.error?.message || 'Failed to update offer status', 'error');
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        await Promise.all([
          fetchProfile(),
          fetchJobs(),
          fetchApplications(),
          fetchNotifications(),
          fetchOffers(),
          fetchDashboard(),
        ]);
      } catch (err) {
        console.error('[CandidateContext] Initial data load failed:', err);
        setError('Failed to load candidate data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    initializeData();
  }, [fetchProfile, fetchJobs, fetchApplications, fetchNotifications, fetchOffers, fetchDashboard]);

  // No localStorage sync needed anymore

  const value = {
    profile: candidate.profile || {},
    resume: candidate.resume || {},
    jobs: candidate.jobs || { savedIndices: [], allJobs: [] },
    applications: candidate.applications || [],
    interviews: candidate.interviews || [],
    notifications: notifications || [],
    offers,
    dashboardStats,
    isLoading,
    error,
    respondToOffer,
    updateProfile,
    updateResumeStep,
    syncResumeToBackend,
    applyForJob,
    saveJob,
    withdrawApplication,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    addDocument,
    deleteDocument,
    showToast,
    refetch: { fetchProfile, fetchJobs, fetchApplications, fetchOffers, fetchDashboard, fetchNotifications }
  };

  return (
    <CandidateContext.Provider value={value}>
      {children}
    </CandidateContext.Provider>
  );
};
