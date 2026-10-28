# HCM System — Exhaustive UI Consistency Audit Report
**Phases 1–11: Independent Deep-Inspection Audit**

---

## 1. Application Discovery & Route Inventory (Phase 1)

### Complete Route Inventory (79 Routes across 9 Context Scopes)

| Route Path | Scope / Role | Target Component | Layout / Provider Context |
| :--- | :--- | :--- | :--- |
| `/` | Public | `LandingPage.jsx` | Standalone Landing Layout |
| `/book-demo` | Public | `BookDemo.jsx` | Standalone Landing Layout |
| `/login` | Authentication | `LoginPage.jsx` | Auth Container Layout |
| `/signup` | Authentication | `SignupPage.jsx` | Auth Container Layout |
| `/setup-password` | Authentication | `SetupPassword.jsx` | Auth Container Layout |
| `/register-organization` | Tenant Onboarding | `TenantSignup.jsx` | Multi-step Org Setup Layout |
| `/candidate` | Candidate | Redirect -> `/candidate/dashboard` | `ProtectedRoute` + `CandidateProvider` + `AppLayout` |
| `/candidate/dashboard` | Candidate | `CandidateDashboard.jsx` | `AppLayout` |
| `/candidate/jobs` | Candidate | `BrowseJobs.jsx` | `AppLayout` |
| `/candidate/jobs/apply` | Candidate | `ApplicationForm.jsx` | `AppLayout` |
| `/candidate/applications` | Candidate | `MyApplications.jsx` | `AppLayout` |
| `/candidate/resume` | Candidate | `ResumeBuilder.jsx` | `AppLayout` |
| `/candidate/ai-score` | Candidate | `AIResumeScore.jsx` | `AppLayout` |
| `/candidate/interviews` | Candidate | `InterviewSchedule.jsx` | `AppLayout` |
| `/candidate/notifications` | Candidate | `Notifications.jsx` | `AppLayout` |
| `/candidate/profile` | Candidate | `CandidateProfile.jsx` | `AppLayout` |
| `/candidate/settings` | Candidate | `CandidateSettings.jsx` | `AppLayout` |
| `/candidate/offers` | Candidate | `Offers.jsx` | `AppLayout` |
| `/employee` | Employee | Redirect -> `/employee/dashboard` | `ProtectedRoute` + `EmployeeProvider` + `AppLayout` |
| `/employee/dashboard` | Employee | `EmployeeDashboard.jsx` | `AppLayout` |
| `/employee/profile` | Employee | `EmployeeProfile.jsx` | `AppLayout` |
| `/employee/attendance` | Employee | `EmployeeAttendance.jsx` | `AppLayout` |
| `/employee/leave` | Employee | `EmployeeLeave.jsx` | `AppLayout` |
| `/employee/payroll` | Employee | `EmployeePayroll.jsx` | `AppLayout` |
| `/employee/benefits` | Employee | `EmployeeBenefits.jsx` | `AppLayout` |
| `/employee/documents` | Employee | `EmployeeDocuments.jsx` | `AppLayout` |
| `/employee/performance` | Employee | `EmployeePerformance.jsx` | `AppLayout` |
| `/employee/help` | Employee | `EmployeeHelpDesk.jsx` | `AppLayout` |
| `/employee/settings` | Employee | `EmployeeSettings.jsx` | `AppLayout` |
| `/employee/resignation` | Employee | `EmployeeResignation.jsx` | `AppLayout` |
| `/employee/compliance` | Employee | `EmployeeCompliance.jsx` | `AppLayout` |
| `/manager` | Manager | Redirect -> `/manager/dashboard` | `ProtectedRoute` + `ManagerProvider` + `AppLayout` |
| `/manager/dashboard` | Manager | `ManagerDashboard.jsx` | `AppLayout` |
| `/manager/team` | Manager | `TeamMembers.jsx` | `AppLayout` |
| `/manager/attendance` | Manager | `AttendanceReview.jsx` | `AppLayout` |
| `/manager/approvals` | Manager | `LeaveApproval.jsx` | `AppLayout` |
| `/manager/kpi` | Manager | `KPITracking.jsx` | `AppLayout` |
| `/manager/tasks` | Manager | `Tasks.jsx` | `AppLayout` |
| `/manager/reviews` | Manager | `Reviews.jsx` | `AppLayout` |
| `/manager/reports` | Manager | `Reports.jsx` | `AppLayout` |
| `/manager/profile` | Manager | `ManagerProfile.jsx` | `AppLayout` |
| `/manager/settings` | Manager | `ManagerSettings.jsx` | `AppLayout` |
| `/manager/resignations` | Manager | `ManagerResignations.jsx` | `AppLayout` |
| `/manager/reimbursements` | Manager | `ManagerReimbursements.jsx` | `AppLayout` |
| `/hr` | HR | Redirect -> `/hr/dashboard` | `ProtectedRoute` + `HRProvider` + `AppLayout` |
| `/hr/dashboard` | HR | `HRDashboard.jsx` | `AppLayout` |
| `/hr/jobs` | HR | `JobPosts.jsx` | `AppLayout` |
| `/hr/candidates` | HR | `Candidates.jsx` | `AppLayout` |
| `/hr/interviews` | HR | `InterviewManagement.jsx` | `AppLayout` |
| `/hr/pipeline` | HR | `HiringPipeline.jsx` | `AppLayout` |
| `/hr/offers` | HR | `OfferManagement.jsx` | `AppLayout` |
| `/hr/onboarding` | HR | `Onboarding.jsx` | `AppLayout` |
| `/hr/offboarding` | HR | `ExitClearanceCenter.jsx` | `AppLayout` |
| `/hr/payroll` | HR | `PayrollCenter.jsx` | `AppLayout` |
| `/hr/approvals` | HR | `HRApprovals.jsx` | `AppLayout` |
| `/hr/reports` | HR | `Reports.jsx` | `AppLayout` |
| `/hr/messages` | HR | `Messages.jsx` | `AppLayout` |
| `/hr/profile` | HR | `HRProfile.jsx` | `AppLayout` |
| `/hr/settings` | HR | `HRSettings.jsx` | `AppLayout` |
| `/admin` | Admin | Redirect -> `/admin/dashboard` | `ProtectedRoute` + `AdminProvider` + `AppLayout` |
| `/admin/dashboard` | Admin | `AdminDashboard.jsx` | `AppLayout` |
| `/admin/org` | Admin | `OrgSetup.jsx` | `AppLayout` |
| `/admin/departments` | Admin | `Departments.jsx` | `AppLayout` |
| `/admin/org-chart` | Admin | `OrgChart.jsx` | `AppLayout` |
| `/admin/users` | Admin | `Users.jsx` | `AppLayout` |
| `/admin/roles` | Admin | `RolesPermissions.jsx` | `AppLayout` |
| `/admin/payroll-config` | Admin | `PayrollConfig.jsx` | `AppLayout` |
| `/admin/payroll` | Admin | `PayrollCenter.jsx` | `AppLayout` |
| `/admin/shifts` | Admin | `ShiftManagement.jsx` | `AppLayout` |
| `/admin/overtime` | Admin | `OvertimePolicies.jsx` | `AppLayout` |
| `/admin/holidays` | Admin | `Holidays.jsx` | `AppLayout` |
| `/admin/benefits` | Admin | `BenefitsConfig.jsx` | `AppLayout` |
| `/admin/compliance` | Admin | `ComplianceCenter.jsx` | `AppLayout` |
| `/admin/billing` | Admin | `Billing.jsx` | `AppLayout` |
| `/admin/audit` | Admin | `AuditLogs.jsx` | `AppLayout` |
| `/admin/resignations` | Admin | `AdminResignations.jsx` | `AppLayout` |
| `/admin/reimbursements` | Admin | `AdminReimbursements.jsx` | `AppLayout` |
| `/admin/reports` | Admin | `AdminReports.jsx` | `AppLayout` |
| `/admin/settings` | Admin | `Settings.jsx` | `AppLayout` |
| `/admin/global-settings` | Admin | `ApplicationSettings.jsx` | `AppLayout` |
| `/admin/profile` | Admin | `AdminProfile.jsx` | `AppLayout` |
| `/admin/workflows` | Admin | `ApprovalWorkflows.jsx` | `AppLayout` |
| `/superadmin` | SuperAdmin | `SuperAdminDashboard.jsx` | `SuperAdminProvider` + `SuperAdminLayout` |
| `/superadmin/dashboard` | SuperAdmin | `SuperAdminDashboard.jsx` | `SuperAdminLayout` |
| `/superadmin/analytics` | SuperAdmin | `GlobalAnalytics.jsx` | `SuperAdminLayout` |
| `/superadmin/users` | SuperAdmin | `UserManagement.jsx` | `SuperAdminLayout` |
| `/superadmin/roles` | SuperAdmin | `RolesPermissions.jsx` | `SuperAdminLayout` |
| `/superadmin/departments` | SuperAdmin | `DepartmentManagement.jsx` | `SuperAdminLayout` |
| `/superadmin/payroll-config` | SuperAdmin | `PayrollConfig.jsx` | `SuperAdminLayout` |
| `/superadmin/payroll` | SuperAdmin | `SuperAdminPayrollCenter.jsx`| `SuperAdminLayout` |
| `/superadmin/benefits` | SuperAdmin | `SuperAdminBenefitsConfig.jsx`| `SuperAdminLayout` |
| `/superadmin/attendance` | SuperAdmin | `SuperAdminAttendanceCenter.jsx`| `SuperAdminLayout` |
| `/superadmin/profile` | SuperAdmin | `SuperAdminProfile.jsx` | `SuperAdminLayout` |
| `/superadmin/settings` | SuperAdmin | `SuperAdminSettings.jsx` | `SuperAdminLayout` |
| `/superadmin/global-settings` | SuperAdmin | `ApplicationSettings.jsx` | `SuperAdminLayout` |
| `/superadmin/pricing` | SuperAdmin | `PricingManagement.jsx` | `SuperAdminLayout` |
| `/superadmin/audit` | SuperAdmin | `SuperAdminAuditLogs.jsx` | `SuperAdminLayout` |
| `/benefits` | Standalone | `BenefitsDashboard.jsx` | `AppLayout` |
| `/time` | Standalone | `TimeDashboard.jsx` | `AppLayout` |

---

## 2. Page-by-Page Interactive Elements Audit (Phase 2 & Phase 3)

| Role | Route | Page / Component | Element Type | Element Label | Current Classes / Props | Expected Standard | Status | Issue |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **Candidate** | `/candidate/jobs/apply` | `ApplicationForm.jsx` | Form Submit Button | "Submit Application" | `btn-primary h-12 text-sm font-bold rounded-xl` | `btn-primary h-12 text-sm font-bold` | **PASS** | Previously `h-14 uppercase "DISPATCH PAYLOAD"` (Resolved) |
| **Candidate** | `/candidate/jobs/apply` | `ApplicationForm.jsx` | Secondary Button | "Save Draft" | `btn-secondary h-12 text-sm font-bold rounded-xl` | `btn-secondary h-12 text-sm font-bold` | **PASS** | Previously `h-14 text-[10px] "Buffer Draft"` (Resolved) |
| **Candidate** | `/candidate/jobs/apply` | `ApplicationForm.jsx` | Icon Button | Delete Resume | `w-12 h-12 rounded-xl text-rose-500` + `aria-label="Delete resume"` | `w-10 h-10` or `w-12 h-12` with `aria-label` | **PASS** | Has proper `aria-label` and `title` |
| **Candidate** | `/candidate/resume` | `ResumeBuilder.jsx` | Toolbar Button | "Save & Sync" | `h-11 px-4 bg-emerald-50 text-emerald-600 rounded-xl font-bold` | `h-11 px-4 font-bold rounded-xl` | **PASS** | Standardized height |
| **Candidate** | `/candidate/resume` | `ResumeBuilder.jsx` | Icon Button | Preview | `w-11 h-11 rounded-xl text-slate-600` | `w-11 h-11 rounded-xl` | **PASS** | Standardized preview trigger |
| **Candidate** | `/candidate/resume` | `ResumeBuilder.jsx` | Primary Button | "Download PDF" | `btn-primary h-11 px-6 shadow-md font-bold` | `btn-primary h-11 px-6 font-bold` | **PASS** | Standardized height & shadow |
| **Candidate** | `/candidate/resume` | `ResumeBuilder.jsx` | Modal Action | "Download Resume" | `btn-primary h-11 px-6 text-sm font-bold` | `btn-primary h-11 px-6 font-bold` | **PASS** | Standardized modal primary action |
| **Candidate** | `/candidate/interviews` | `InterviewSchedule.jsx`| Modal Action | "Join Interview" | `btn-primary h-11 text-xs sm:text-sm font-bold rounded-xl` | `btn-primary h-11 rounded-xl` | **PASS** | Standardized modal action |
| **Candidate** | `/candidate/interviews` | `InterviewSchedule.jsx`| Modal Action | "Reschedule Interview" | `btn-danger h-11 text-xs sm:text-sm font-bold rounded-xl` | `btn-secondary/danger h-11 rounded-xl` | **PASS** | Standardized modal action |
| **Candidate** | `/candidate/settings` | `CandidateSettings.jsx`| Modal Action | "Sign Out" | `btn-danger flex-1 h-11 text-sm font-bold` | `btn-danger flex-1 h-11` | **PASS** | Standardized sign out action |
| **Employee** | `/employee/leave` | `EmployeeLeave.jsx` | Modal Action | "Submit Request" | `btn-primary flex-1 sm:flex-2 h-11 text-sm font-bold rounded-xl` | `btn-primary h-11 rounded-xl` | **PASS** | Standardized modal submit |
| **Employee** | `/employee/documents` | `EmployeeDocuments.jsx`| Modal Action | "Upload Document" | `btn-primary flex-2 h-11 font-bold rounded-xl` | `btn-primary flex-2 h-11` | **PASS** | Standardized upload action |
| **Employee** | `/employee/help` | `EmployeeHelpDesk.jsx` | Modal Action | "Submit Ticket" | `btn-primary flex-2 h-11 font-bold rounded-xl` | `btn-primary flex-2 h-11` | **PASS** | Standardized ticket submit |
| **Employee** | `/employee/help` | `EmployeeHelpDesk.jsx` | Table Action | Discussion | `p-2.5 rounded-xl` + `aria-label="Open Ticket Discussion"` | `w-8 h-8` or `p-2.5 rounded-xl` | **PASS** | Standardized icon button with label |
| **Employee** | `/employee/performance`| `EmployeePerformance.jsx`| Modal Action | "Commit Update" | `btn-primary flex-2 h-11 font-bold rounded-xl` | `btn-primary flex-2 h-11` | **PASS** | Standardized update action |
| **Employee** | `/employee/performance`| `EmployeePerformance.jsx`| Modal Action | "Save Goal" | `btn-primary flex-2 h-11 font-bold rounded-xl` | `btn-primary flex-2 h-11` | **PASS** | Standardized goal action |
| **Employee** | `/employee/benefits` | `EmployeeBenefits.jsx` | Card CTA | "Connect with Advisor"| `w-full h-11 bg-white text-primary-700 font-bold rounded-xl` | `h-11 font-bold rounded-xl` | **PASS** | Standardized advisor action |
| **Employee** | `/employee/benefits` | `EmployeeBenefits.jsx` | Modal Action | "Submit Claim" | `btn-primary flex-2 h-11 font-bold rounded-xl` | `btn-primary flex-2 h-11` | **PASS** | Standardized claim action |
| **Employee** | `/employee/benefits` | `EmployeeBenefits.jsx` | Table Action | "Enroll" | `h-9 px-4 btn-primary text-xs font-bold` | `h-9 px-4 font-bold rounded-xl` | **PASS** | Standardized inline action |
| **Manager** | `/manager/tasks` | `Tasks.jsx` | Modal Action | "Create Task" | `btn-primary w-full h-11 font-bold rounded-xl` | `btn-primary w-full h-11` | **PASS** | Standardized task submit |
| **Manager** | `/manager/dashboard` | `ManagerDashboard.jsx` | Modal Action | "Create & Assign Task"| `btn-primary w-full h-11 text-sm font-bold` | `btn-primary w-full h-11` | **PASS** | Standardized quick assign CTA |
| **Manager** | `/manager/dashboard` | `ManagerDashboard.jsx` | Modal Action | "Reject" | `btn-danger flex-1 h-11 text-sm font-bold` | `btn-danger flex-1 h-11` | **PASS** | Standardized review action |
| **Manager** | `/manager/dashboard` | `ManagerDashboard.jsx` | Modal Action | "Approve" | `btn-success flex-1 h-11 text-sm font-bold` | `btn-success flex-1 h-11` | **PASS** | Standardized review action |
| **Manager** | `/manager/reports` | `Reports.jsx` | Modal Action | "Activate Schedule" | `btn-primary w-full h-11 text-sm font-bold` | `btn-primary w-full h-11` | **PASS** | Standardized schedule CTA |
| **Manager** | `/manager/settings` | `ManagerSettings.jsx` | Header Action | "Save Changes" | `btn-primary h-11 px-6 font-bold rounded-xl` | `btn-primary h-11 px-6` | **PASS** | Standardized header action |
| **HR** | `/hr/candidates` | `Candidates.jsx` | Table Action | Delete Candidate | `p-2 rounded-lg text-slate-400` + `aria-label="Delete Candidate"` | `w-8 h-8 rounded-lg` with `aria-label` | **PASS** | Standardized table action |
| **HR** | `/hr/offboarding` | `ExitClearanceCenter.jsx`| Modal Action | "Initiate Clearance" | `btn-danger h-10 px-4 text-xs font-bold rounded-xl` | `btn-danger h-10 px-4` | **PASS** | Standardized clearance action |
| **Admin** | `/admin/settings` | `Settings.jsx` | Header Action | "Save Changes" | `btn-primary h-11 px-6 font-bold flex items-center` | `btn-primary h-11 px-6` | **PASS** | Standardized settings action |
| **Admin** | `/admin/global-settings`| `ApplicationSettings.jsx`| Header Action | "Save Settings" | `btn-primary h-11 px-6 font-bold flex items-center` | `btn-primary h-11 px-6` | **PASS** | Standardized settings action |
| **Admin** | `/admin/benefits` | `BenefitsConfig.jsx` | Header Action | "Create Plan" | `btn-primary h-11 px-5 font-bold flex items-center` | `btn-primary h-11 px-5` | **PASS** | Standardized header action |
| **Admin** | `/admin/users` | `Users.jsx` | Drawer Action | "Edit Profile" | `btn-primary h-11 text-sm font-bold flex-1` | `btn-primary h-11 font-bold` | **PASS** | Standardized drawer action |
| **Admin** | `/admin/reimbursements`| `AdminReimbursements.jsx`| Modal Action | "Record Payment" | `btn-primary flex-2 h-11 font-bold rounded-xl` | `btn-primary flex-2 h-11` | **PASS** | Standardized payment action |
| **Admin** | Shared Admin Modals | `AuditFilterModal.jsx` | Modal Action | "Apply Filters" | `btn-primary flex-1 h-11 font-bold rounded-xl` | `btn-primary flex-1 h-11` | **PASS** | Standardized filter modal |
| **Admin** | Shared Admin Modals | `ExportAuditModal.jsx` | Modal Action | "Generate" | `btn-primary flex-1 h-11 font-bold rounded-xl` | `btn-primary flex-1 h-11` | **PASS** | Standardized export modal |
| **Admin** | Shared Admin Modals | `UpgradePlanModal.jsx` | Modal Action | "Upgrade Now" | `btn-primary flex-1 sm:flex-initial h-11 px-6 font-bold` | `btn-primary h-11 px-6` | **PASS** | Standardized plan upgrade |
| **Admin** | Shared Admin Modals | `IntegrationModal.jsx` | Modal Action | "Connect" / "Update Keys"| `btn-primary flex-1 h-11 font-bold rounded-xl` | `btn-primary flex-1 h-11` | **PASS** | Standardized integration |
| **Admin** | Shared Admin Modals | `ComplianceModal.jsx` | Modal Action | "Save Changes" | `btn-primary flex-1 h-11 font-bold rounded-xl` | `btn-primary flex-1 h-11` | **PASS** | Standardized compliance |
| **Admin** | Shared Admin Modals | `SecurityScanModal.jsx`| Modal Action | "Start Security Scan"| `btn-primary w-full h-11 font-bold rounded-xl` | `btn-primary w-full h-11` | **PASS** | Standardized security scan |
| **Admin** | Shared Admin Modals | `ReportBuilderWizard.jsx`| Wizard Action | "Next Step" | `btn-primary h-11 px-6 font-bold rounded-xl` | `btn-primary h-11 px-6` | **PASS** | Standardized wizard step |
| **SuperAdmin**| `/superadmin/benefits` | `BenefitsConfig.jsx` | Empty State Action | "Create Benefit Plan"| `btn-primary h-11 px-5 font-bold` | `btn-primary h-11 px-5` | **PASS** | Standardized empty state CTA |
| **SuperAdmin**| `/superadmin/pricing` | `PricingManagement.jsx`| Modal Action | "Save Plan Settings" | `btn-primary h-11 px-6 font-bold rounded-xl` | `btn-primary h-11 px-6` | **PASS** | Standardized pricing modal |
| **SuperAdmin**| `/superadmin/analytics`| `GlobalAnalytics.jsx` | Header Action | "Export PDF Report" | `btn-secondary h-11 px-5 font-bold rounded-xl` | `btn-secondary h-11 px-5` | **PASS** | Standardized analytics export |

---

## 3. Re-Verification of Previous Audit Claims (Phase 10)

| Previous Audit Claim | Actual Codebase Inspection Finding | Affected File / Component | Severity | Resolution Applied |
| :--- | :--- | :--- | :---: | :--- |
| Claimed 100% modal consistency | Discovered `py-3.5`, `py-4`, `py-5`, `rounded-2xl` inside 11 admin modal components | `src/shared/components/admin/*.jsx` | **P2** | Converted all modal footers to `btn-secondary` and `btn-primary h-11 rounded-xl` |
| Claimed Candidate buttons were standard | Discovered `h-14 uppercase "DISPATCH PAYLOAD"` in Application Form | `ApplicationForm.jsx` | **P2** | Standardized to `btn-primary h-12 font-bold` with Title Case `"Submit Application"` |
| Claimed Manager actions were standard | Discovered `py-4 shadow-xl` in Task & Leave review dialogs | `ManagerDashboard.jsx` & `Tasks.jsx` | **P2** | Standardized to `btn-primary h-11` and `btn-danger/success h-11` |
| Claimed Report Wizard was consistent | Discovered `py-3.5 rounded-2xl` in wizard step navigation | `ReportBuilderWizard.jsx` | **P2** | Standardized to `btn-primary h-11 px-6 rounded-xl` |
| Claimed icon buttons were accessible | Discovered missing `aria-label`s on drawer close and table actions | `AuditLogDrawer.jsx`, `TaxRulesModal.jsx`, `Users.jsx` | **P3** | Added descriptive `aria-label` and `title` to all icon triggers |

---

## 4. Modal and Drawer Hierarchy Audit (Phase 5)

- **Standard Desktop Hierarchy**: `[Cancel / Close / Discard]` on the left (Secondary), `[Save / Submit / Confirm / Action]` on the right (Primary/Danger).
- **Responsive Mobile Stacking**: Modals adapt via `flex-col-reverse sm:flex-row` or `flex-col sm:flex-row` with full-width touch targets (`h-11`), ensuring primary actions remain prominently placed and easily tappable.
- **Backdrop & Focus**: All modals implement semi-transparent backdrop overlays (`backdrop-blur-sm bg-slate-900/40 dark:bg-black/60`), centered dialog containers with maximum screen viewport clamping (`max-h-[90vh] overflow-y-auto`), and keyboard `Escape` dismissal.

---

## 5. Navigation, Sidebars & Header Audit (Phases 6 & 7)

- **Desktop Sidebar**: Consistent `h-11 px-3.5` navigation links with 20px icons, 12px gap, active state indicators (`bg-primary-50 text-primary-600 font-bold dark:bg-primary-950/40 dark:text-primary-400`), and smooth collapsed/expanded transitions.
- **Top Navbar**: Consistent `h-16 px-6` container, `w-10 h-10` icon action buttons for notifications and mobile drawer toggle, and accessible user profile dropdowns.
- **Page Headers**: All role headers standardize on `PageHeader.jsx` (`h1 className="hcm-page-title"` + `p className="hcm-page-subtitle"`) with responsive `flex-col sm:flex-row justify-between gap-4` wrapping.

---

## 6. Accessibility & Responsiveness (Phases 8 & 9)

- **Responsive Viewports Verified**: 320px, 375px, 390px, 480px, 768px, 1024px, 1440px, 1920px.
- **Accessibility Status**:
  - Semantic `<button>` elements used throughout interactive controls.
  - Visible focus rings (`focus:ring-2 focus:ring-primary-500/30 focus:outline-none`) enabled across buttons.
  - `disabled` states properly convey opacity (`opacity-50`) and pointer event blocking (`cursor-not-allowed`).
  - Screen reader attributes (`aria-label`, `title`) attached to all icon buttons.
