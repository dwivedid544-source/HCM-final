# HCM System — UI Consistency Fix Plan
**Phase 12: Targeted Fix Implementation & Token Alignment**

---

## 1. Prioritized Fix Registry (P1 → P4)

| ID | Priority | Scope / Role | Component | Initial Defect / Inconsistency | Canonical Design Token Fix | Verification Status |
| :--- | :---: | :--- | :--- | :--- | :--- | :---: |
| **FIX-01** | **P2** | Candidate | `ApplicationForm.jsx` | `h-14 bg-primary-600 rounded-xl text-sm font-bold uppercase "DISPATCH PAYLOAD"` | `btn-primary h-12 text-sm font-bold rounded-xl` `"Submit Application"` | **VERIFIED** |
| **FIX-02** | **P2** | Candidate | `ApplicationForm.jsx` | `h-14 btn-secondary text-[10px] "Buffer Draft"` | `btn-secondary h-12 text-sm font-bold rounded-xl` `"Save Draft"` | **VERIFIED** |
| **FIX-03** | **P2** | Candidate | `InterviewSchedule.jsx` | `py-4 sm:py-5 bg-primary-600 rounded-2xl text-[10px]` | `btn-primary h-11 text-xs sm:text-sm font-bold rounded-xl` | **VERIFIED** |
| **FIX-04** | **P2** | Candidate | `CandidateSettings.jsx` | `py-5 shadow-xl` Sign Out button | `btn-danger flex-1 h-11 text-sm font-bold` | **VERIFIED** |
| **FIX-05** | **P2** | Candidate | `ResumeBuilder.jsx` | `h-12 sm:h-14` Save & Sync, Preview, Download actions | `h-11 px-4/px-6 font-bold rounded-xl` | **VERIFIED** |
| **FIX-06** | **P2** | Employee | `EmployeeLeave.jsx` | `py-3.5 sm:py-4 bg-slate-900 rounded-2xl` | `btn-secondary flex-1 h-11` and `btn-primary flex-1 sm:flex-2 h-11` | **VERIFIED** |
| **FIX-07** | **P2** | Employee | `EmployeeDocuments.jsx` | `py-4 bg-slate-900 rounded-2xl "Commit to Vault"` | `btn-primary flex-[2] h-11 font-bold` `"Upload Document"` | **VERIFIED** |
| **FIX-08** | **P2** | Employee | `EmployeeHelpDesk.jsx` | `py-4 bg-slate-900 rounded-2xl` Ticket submit | `btn-primary flex-[2] h-11 font-bold rounded-xl` | **VERIFIED** |
| **FIX-09** | **P2** | Employee | `EmployeePerformance.jsx`| `py-4 bg-slate-900 rounded-2xl text-[10px]` update & goal | `btn-secondary h-11` and `btn-primary h-11 font-bold` | **VERIFIED** |
| **FIX-10** | **P2** | Employee | `EmployeeBenefits.jsx` | `py-5 text-[10px] rounded-2xl` advisor connect & claim | `btn-primary h-11 font-bold rounded-xl` | **VERIFIED** |
| **FIX-11** | **P2** | Manager | `Tasks.jsx` | `py-4 bg-primary-600 rounded-2xl` task deployment | `btn-primary w-full h-11 font-bold rounded-xl` | **VERIFIED** |
| **FIX-12** | **P2** | Manager | `ManagerDashboard.jsx` | `py-4 font-bold shadow-xl` quick assign task | `btn-primary w-full h-11 text-sm font-bold` | **VERIFIED** |
| **FIX-13** | **P2** | Manager | `ManagerDashboard.jsx` | `py-4 uppercase text-xs` Leave approve/reject buttons | `btn-danger flex-1 h-11` and `btn-success flex-1 h-11` | **VERIFIED** |
| **FIX-14** | **P2** | Manager | `Reports.jsx` | `py-5 "Activate Secure Loop"` and `py-4 "Kill Schedule"` | `btn-primary w-full h-11 "Activate Schedule"` and `h-9 text-xs "Terminate Schedule"` | **VERIFIED** |
| **FIX-15** | **P2** | Manager | `ManagerSettings.jsx` | `px-6 py-3 rounded-2xl` header actions | `btn-secondary h-11 px-5` and `btn-primary h-11 px-6` | **VERIFIED** |
| **FIX-16** | **P2** | Admin | `Settings.jsx` | `px-6 py-3 rounded-2xl` header buttons | `btn-secondary h-11 px-5` and `btn-primary h-11 px-6` | **VERIFIED** |
| **FIX-17** | **P2** | Admin | `ApplicationSettings.jsx`| `px-6 py-3 rounded-2xl` header buttons | `btn-secondary h-11 px-5` and `btn-primary h-11 px-6` | **VERIFIED** |
| **FIX-18** | **P2** | Admin | `AdminReimbursements.jsx`| `py-4 bg-slate-900 rounded-2xl` record payment | `btn-secondary flex-1 h-11` and `btn-primary flex-2 h-11` | **VERIFIED** |
| **FIX-19** | **P2** | Admin Modals | `AuditFilterModal.jsx` | `py-3.5 bg-slate-900 rounded-2xl` | `btn-secondary flex-1 h-11` and `btn-primary flex-1 h-11` | **VERIFIED** |
| **FIX-20** | **P2** | Admin Modals | `ExportAuditModal.jsx` | `py-3.5 rounded-2xl font-bold` | `btn-secondary flex-1 h-11` and `btn-primary flex-1 h-11` | **VERIFIED** |
| **FIX-21** | **P2** | Admin Modals | `UpgradePlanModal.jsx` | `py-3 sm:py-3.5 bg-slate-900 rounded-2xl` | `btn-secondary h-11 px-5` and `btn-primary h-11 px-6` | **VERIFIED** |
| **FIX-22** | **P2** | Admin Modals | `IntegrationModal.jsx` | `py-4 bg-slate-900 rounded-2xl` | `btn-secondary flex-1 h-11` and `btn-primary flex-1 h-11` | **VERIFIED** |
| **FIX-23** | **P2** | Admin Modals | `ComplianceModal.jsx` | `py-4 rounded-2xl font-bold` | `btn-secondary flex-1 h-11` and `btn-primary flex-1 h-11` | **VERIFIED** |
| **FIX-24** | **P2** | Admin Modals | `SecurityScanModal.jsx`| `py-4 bg-slate-900 rounded-2xl` | `btn-primary w-full h-11 font-bold rounded-xl` | **VERIFIED** |
| **FIX-25** | **P2** | Admin Modals | `ReportSchedulerModal.jsx`| `py-3.5 rounded-2xl font-bold` | `btn-secondary flex-1 h-11` and `btn-primary flex-1 h-11` | **VERIFIED** |
| **FIX-26** | **P2** | Admin Modals | `ExportHistoryModal.jsx`| `py-3.5 rounded-2xl font-bold` | `btn-secondary flex-1 h-11` and `btn-primary flex-1 h-11` | **VERIFIED** |
| **FIX-27** | **P2** | Admin Modals | `ManageAddonsModal.jsx` | `py-2.5 sm:py-3.5 rounded-2xl font-bold` | `btn-secondary h-11 px-5` and `btn-primary h-11 px-6` | **VERIFIED** |
| **FIX-28** | **P2** | Admin Modals | `AIModuleModal.jsx` | `py-4 rounded-2xl font-bold` | `btn-secondary flex-1 h-11` and `btn-primary flex-1 h-11` | **VERIFIED** |
| **FIX-29** | **P2** | Admin Modals | `ReportBuilderWizard.jsx`| `py-3.5 bg-slate-900 rounded-2xl` wizard navigation | `btn-secondary h-11 px-5` and `btn-primary h-11 px-6` | **VERIFIED** |
| **FIX-30** | **P2** | SuperAdmin | `BenefitsConfig.jsx` | `text-xs px-2` empty state action buttons | `btn-primary/secondary h-11 px-5 font-bold` | **VERIFIED** |
| **FIX-31** | **P3** | Admin | `Users.jsx` | `btn-secondary px-6 py-3` drawer action without label | `btn-secondary h-11 px-4` with `aria-label="More options"` | **VERIFIED** |
| **FIX-32** | **P3** | Admin | `AuditLogDrawer.jsx` | Drawer close button without `aria-label` | Added `aria-label="Close drawer" title="Close"` | **VERIFIED** |
| **FIX-33** | **P3** | Admin | `TaxRulesModal.jsx` | Edit and Delete tax rule icon buttons missing labels | Added `aria-label="Edit tax rule"` and `aria-label="Delete tax rule"` | **VERIFIED** |
| **FIX-34** | **P3** | Employee | `EmployeeHelpDesk.jsx` | Message icon button missing `aria-label` | Added `aria-label="Open Ticket Discussion"` | **VERIFIED** |

---

## 2. Guardrails & Non-Destructive Principles

1. **Zero Logic Modifications**: No changes were made to backend controllers, API endpoints, Prisma database schemas, authentication middleware, or user roles.
2. **Event Handler Integrity**: All `onClick`, `onSubmit`, `type="button"`, `type="submit"`, `disabled`, and `isSubmitting` state hooks remain intact.
3. **Design System Token Purity**: All components utilize canonical classes (`btn-primary`, `btn-secondary`, `btn-danger`, `btn-success`, `h-9`, `h-11`, `h-12`, `rounded-xl`, `w-8 h-8 rounded-lg`) defined in `src/index.css` and `src/shared/components/ui/`.
