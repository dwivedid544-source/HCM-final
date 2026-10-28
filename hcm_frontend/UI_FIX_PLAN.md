# HCM System — UI Inconsistency Fix Plan
**Phase 2: Comprehensive Fix Plan & Migration Strategy**

---

## 1. Fix Priority Matrix (P1 → P4)

| ID | Priority | Role / Scope | Component / Page | Current Problem | Exact Recommended Fix | Risk |
| :--- | :---: | :--- | :--- | :--- | :--- | :---: |
| **FIX-01** | **P2** | Candidate | `ApplicationForm.jsx` | Oversized `h-14` CTA with ALL-CAPS `"DISPATCH PAYLOAD"`, `text-[10px]` in draft button | Convert to `btn-primary h-12 text-sm font-bold` with Title Case `"Submit Application"` and `btn-secondary h-12` `"Save Draft"` | Very Low |
| **FIX-02** | **P2** | Candidate | `InterviewSchedule.jsx` | Modal Join and Reschedule actions use `py-4 sm:py-5 rounded-2xl text-[10px]` | Convert to `btn-primary h-11 text-xs sm:text-sm font-bold rounded-xl` and `btn-secondary/danger h-11 rounded-xl` | Very Low |
| **FIX-03** | **P2** | Employee | `EmployeeLeave.jsx` | Leave request modal actions use `py-3.5 sm:py-4 bg-slate-900 rounded-2xl` | Convert to `btn-secondary flex-1 h-11 text-sm font-bold` and `btn-primary flex-1 sm:flex-2 h-11 text-sm font-bold` | Very Low |
| **FIX-04** | **P2** | Employee | `EmployeeDocuments.jsx` | Upload document modal CTA uses `py-4 bg-slate-900 text-white rounded-2xl` | Convert to `btn-primary flex-2 h-11 font-bold rounded-xl` | Very Low |
| **FIX-05** | **P2** | Employee | `EmployeeHelpDesk.jsx` | Submit ticket modal CTA uses `py-4 bg-slate-900 text-white rounded-2xl` | Convert to `btn-primary flex-2 h-11 font-bold rounded-xl` | Very Low |
| **FIX-06** | **P2** | Employee | `EmployeePerformance.jsx` | Performance update & goal modals use `py-4 bg-slate-900 rounded-2xl text-[10px]` | Convert to `btn-primary flex-2 h-11 font-bold rounded-xl` | Very Low |
| **FIX-07** | **P2** | Employee | `EmployeeBenefits.jsx` | Connect advisor & claim submit modals use `py-5 text-[10px] rounded-2xl` | Convert to `btn-primary flex-2 h-11 font-bold rounded-xl` | Very Low |
| **FIX-08** | **P2** | Manager | `Tasks.jsx` | Deploy mission modal submit button uses `py-4 rounded-2xl` | Convert to `btn-primary w-full h-11 font-bold rounded-xl` | Very Low |
| **FIX-09** | **P2** | Manager | `ManagerDashboard.jsx` | Quick task assign CTA uses `py-4 font-bold shadow-xl` | Convert to `btn-primary w-full h-11 font-bold rounded-xl` | Very Low |
| **FIX-10** | **P2** | Manager | `Reports.jsx` | Export CTA uses oversized `py-5` | Convert to `btn-primary h-11 px-6 font-bold rounded-xl` | Very Low |
| **FIX-11** | **P2** | Admin Modals | `AuditFilterModal.jsx` | Apply filters button uses `py-3.5 bg-slate-900 text-white rounded-2xl` | Convert to `btn-primary flex-1 h-11 font-bold rounded-xl` | Very Low |
| **FIX-12** | **P2** | Admin Modals | `ExportAuditModal.jsx` | Cancel and Generate buttons use `py-3.5 rounded-2xl font-bold` | Convert to `btn-secondary flex-1 h-11` and `btn-primary flex-1 h-11 rounded-xl` | Very Low |
| **FIX-13** | **P2** | Admin Modals | `UpgradePlanModal.jsx` | Upgrade and Cancel buttons use `py-3.5 bg-slate-900 rounded-2xl` | Convert to `btn-secondary h-11` and `btn-primary h-11 rounded-xl` | Very Low |
| **FIX-14** | **P2** | Admin Modals | `IntegrationModal.jsx` | Connect and Cancel buttons use `py-4 bg-slate-900 rounded-2xl` | Convert to `btn-secondary flex-1 h-11` and `btn-primary flex-1 h-11 rounded-xl` | Very Low |
| **FIX-15** | **P2** | Admin Modals | `ComplianceModal.jsx` | Run audit and Cancel buttons use `py-4 rounded-2xl` | Convert to `btn-secondary flex-1 h-11` and `btn-primary flex-1 h-11 rounded-xl` | Very Low |
| **FIX-16** | **P2** | Admin Modals | `SecurityScanModal.jsx` | Start scan and Done buttons use `py-4 bg-slate-900 rounded-2xl` | Convert to `btn-primary w-full h-11 font-bold rounded-xl` | Very Low |
| **FIX-17** | **P2** | Admin Modals | `ReportSchedulerModal.jsx` | Save schedule and Cancel buttons use `py-3.5 rounded-2xl` | Convert to `btn-secondary flex-1 h-11` and `btn-primary flex-1 h-11 rounded-xl` | Very Low |
| **FIX-18** | **P2** | Admin Modals | `ExportHistoryModal.jsx` | Export and Cancel buttons use `py-3.5 rounded-2xl` | Convert to `btn-secondary flex-1 h-11` and `btn-primary flex-1 h-11 rounded-xl` | Very Low |
| **FIX-19** | **P2** | Admin Modals | `ManageAddonsModal.jsx` | Save and Cancel buttons use `py-2.5 sm:py-3.5 rounded-2xl` | Convert to `btn-secondary h-11` and `btn-primary h-11 rounded-xl` | Very Low |
| **FIX-20** | **P2** | Admin Modals | `AIModuleModal.jsx` | Save and Cancel buttons use `py-4 rounded-2xl` | Convert to `btn-secondary flex-1 h-11` and `btn-primary flex-1 h-11 rounded-xl` | Very Low |
| **FIX-21** | **P2** | Admin | `AdminReimbursements.jsx` | Record payment button uses `py-4 bg-slate-900 rounded-2xl` | Convert to `btn-primary flex-2 h-11 font-bold rounded-xl` | Very Low |
| **FIX-22** | **P2** | SuperAdmin | `PricingManagement.jsx` | Plan creation and live preview modal buttons use manual padding | Convert to `btn-secondary h-11 px-5` and `btn-primary h-11 px-6` | Very Low |
| **FIX-23** | **P3** | Candidate | `AIResumeScore.jsx` | Open builder CTA uses `py-4` | Convert to `btn-primary h-11 rounded-xl` | Very Low |
| **FIX-24** | **P3** | HR | `ExitClearanceCenter.jsx` | Termination modal button uses `px-4 py-2 text-xs` | Convert to `btn-danger h-10 px-4 text-xs font-bold rounded-xl` | Very Low |
| **FIX-25** | **P3** | HR | `ExitClearanceCenter.jsx` | Table row action buttons use `px-3 py-1.5` | Convert to `h-8 px-3 rounded-lg text-xs font-bold` | Very Low |
| **FIX-26** | **P3** | Admin | `Settings.jsx` & `ApplicationSettings.jsx` | Reset settings buttons use `px-6 py-3 rounded-2xl` | Convert to `btn-secondary h-11 px-5 font-bold rounded-xl` | Very Low |
| **FIX-27** | **P4** | SuperAdmin | `GlobalAnalytics.jsx` | Export report button uses manual padding | Convert to `btn-secondary h-11 px-5 font-bold rounded-xl` | Very Low |

---

## 2. Grouped Fix Categories

### Category 1: Candidate Portal
- `ApplicationForm.jsx`: Submit Application & Save Draft buttons.
- `InterviewSchedule.jsx`: Join & Reschedule modal actions.
- `AIResumeScore.jsx`: Open Resume Builder CTA.

### Category 2: Employee Portal
- `EmployeeLeave.jsx`: Submit Leave Request & Discard actions.
- `EmployeeDocuments.jsx`: Upload Document modal action.
- `EmployeeHelpDesk.jsx`: Submit Ticket modal action.
- `EmployeePerformance.jsx`: Update Performance & Goal modal actions.
- `EmployeeBenefits.jsx`: Connect Advisor & Submit Claim actions.

### Category 3: Manager Portal
- `Tasks.jsx`: Deploy Mission modal action.
- `ManagerDashboard.jsx`: Quick Task Assign CTA.
- `Reports.jsx`: Export analytics CTA.
- `ManagerSettings.jsx`: Reset Settings action.

### Category 4: HR Portal
- `ExitClearanceCenter.jsx`: Termination modal & Table row actions.

### Category 5: Admin Portal & Shared Admin Modals
- `src/shared/components/admin/AuditFilterModal.jsx`
- `src/shared/components/admin/ExportAuditModal.jsx`
- `src/shared/components/admin/UpgradePlanModal.jsx`
- `src/shared/components/admin/IntegrationModal.jsx`
- `src/shared/components/admin/ComplianceModal.jsx`
- `src/shared/components/admin/SecurityScanModal.jsx`
- `src/shared/components/admin/ReportSchedulerModal.jsx`
- `src/shared/components/admin/ExportHistoryModal.jsx`
- `src/shared/components/admin/ManageAddonsModal.jsx`
- `src/shared/components/admin/AIModuleModal.jsx`
- `src/features/admin/AdminReimbursements.jsx`
- `src/features/admin/Settings.jsx`
- `src/features/admin/ApplicationSettings.jsx`

### Category 6: SuperAdmin Portal
- `PricingManagement.jsx`: Modal action buttons.
- `GlobalAnalytics.jsx`: PDF Export button.
