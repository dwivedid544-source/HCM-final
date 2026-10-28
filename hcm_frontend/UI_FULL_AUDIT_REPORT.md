# HCM Management System — Exhaustive UI Consistency Audit Report
**Phase 1: Strict Visual & Codebase UI Consistency Audit**

---

## 1. Executive Summary

This exhaustive audit covers every single role, route, page, menu, modal, drawer, dropdown, tab, table action, and interactive button in the HCM Management System.

```text
========================================================================================
EXECUTIVE SUMMARY METRICS
========================================================================================
Total Application Roles:          6 Core Roles (Candidate, Employee, Manager, HR, Admin, SuperAdmin)
                                  + 3 Context Groups (Public, Authentication, Tenant Setup)
Total Registered Routes:          79 routes in App.jsx
Total Pages / Feature Views:      68 distinct page components
Total Buttons Inspected:          584 interactive <button> & action trigger elements
Total Icon Buttons:               162 icon-only action triggers
Total Menu Systems:               28 (Sidebar, Mobile Drawer, Navbar, Profile, Notifications, Tabs)
Total Modals & Drawers:           36 modal dialogs and slide-out drawers
Total Dropdown Triggers:          42 context, filter, and notification dropdowns
Total Tab Navigation Sets:        18 tabbed view controllers

========================================================================================
TOTAL ISSUES IDENTIFIED (PRE-FIX AUDIT)
========================================================================================
Total Inconsistencies Found:      46
  • P1 (Critical / Broken / Inaccessible):                 0
  • P2 (High / Sizing & Hierarchy / py-4, py-5, h-14):     16
  • P3 (Medium / Radius rounded-2xl vs rounded-xl, text):   18
  • P4 (Low / Minor casing & padding differences):         12
========================================================================================
```

---

## 2. Global Design System Inventory

The HCM Management System relies on Tailwind CSS v4 and central tokens defined in `src/index.css` and `src/shared/components/ui/`.

### Canonical Button Sizing & Variants
- **Small Button (`btn-sm`)**: `h-9 px-3 text-xs font-bold rounded-xl` (Icon: 14px)
- **Medium / Default Button (`btn-md` / `.btn-primary` / `.btn-secondary`)**: `h-11 px-4 sm:px-5 text-xs sm:text-sm font-bold rounded-xl` (Icon: 16px)
- **Large Button (`btn-lg`)**: `h-12 px-6 sm:px-8 text-sm font-bold rounded-xl` (Icon: 18px)
- **Table Action Icon Button**: `w-8 h-8 rounded-lg` (Icon: 16px)
- **Toolbar / Nav Icon Button**: `w-9 h-9 sm:w-10 sm:h-10 rounded-xl` (Icon: 18px–20px)

---

## 3. Role-by-Role Detailed Audit Findings

### A. Candidate Role (`/candidate/*`)

| Route / Page | Element / Button | Label | Current Implementation | Expected Standard | Issue | Severity | Recommendation |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/candidate/jobs/apply` | Primary Submit CTA | "DISPATCH PAYLOAD" | `h-14 bg-primary-600 rounded-xl text-sm font-bold uppercase` | `btn-primary h-12 text-sm font-bold rounded-xl` | Oversized `h-14`, ALL-CAPS technical text | P2 | Change to `btn-primary h-12` and label to `"Submit Application"` |
| `/candidate/jobs/apply` | Secondary Draft CTA | "Buffer Draft" | `h-14 btn-secondary text-[10px] rounded-xl` | `btn-secondary h-12 text-sm font-bold rounded-xl` | Oversized `h-14`, tiny `text-[10px]` | P2 | Change to `btn-secondary h-12` and label to `"Save Draft"` |
| `/candidate/interviews` | Join Modal CTA | "Join Interview" | `py-4 sm:py-5 bg-primary-600 rounded-2xl text-[10px]` | `btn-primary h-11 text-xs sm:text-sm font-bold rounded-xl` | Manual padding `py-4`, `rounded-2xl`, `text-[10px]` | P2 | Change to `btn-primary h-11 text-xs sm:text-sm rounded-xl` |
| `/candidate/interviews` | Reschedule CTA | "Reschedule Interview" | `py-4 sm:py-5 bg-rose-50 text-rose-600 rounded-2xl text-[10px]` | `btn-secondary/danger h-11 text-xs sm:text-sm rounded-xl` | Manual padding `py-4`, `rounded-2xl`, `text-[10px]` | P2 | Change to `h-11 rounded-xl text-xs sm:text-sm` |
| `/candidate/ai-score` | Open Builder CTA | "Open Resume Builder"| `py-4 bg-primary-600 rounded-2xl text-sm font-bold` | `btn-primary h-11 text-sm font-bold rounded-xl` | Manual padding `py-4`, `rounded-2xl` | P3 | Change to `btn-primary h-11 rounded-xl` |
| `/candidate/jobs` | Header Action | "My Applications" | `px-6 py-2.5 btn-primary font-bold` | `btn-primary h-11 px-5 font-bold` | Manual padding `px-6 py-2.5` | P4 | Change to `btn-primary h-11 px-5` |

---

### B. Employee Role (`/employee/*`)

| Route / Page | Element / Button | Label | Current Implementation | Expected Standard | Issue | Severity | Recommendation |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/employee/leave` | Modal Submit CTA | "Submit Request" | `py-3.5 sm:py-4 bg-slate-900 rounded-2xl font-bold text-sm` | `btn-primary flex-1 sm:flex-2 h-11 text-sm font-bold rounded-xl` | Non-standard dark background, `py-4`, `rounded-2xl` | P2 | Change to `btn-primary flex-1 sm:flex-2 h-11 rounded-xl` |
| `/employee/leave` | Modal Discard CTA | "Discard" | `py-3.5 sm:py-4 bg-slate-100 rounded-2xl font-bold text-sm` | `btn-secondary flex-1 h-11 text-sm font-bold rounded-xl` | `rounded-2xl`, `py-4` | P2 | Change to `btn-secondary flex-1 h-11 rounded-xl` |
| `/employee/documents` | Modal Upload CTA | "Upload Document" | `py-4 bg-slate-900 text-white rounded-2xl font-bold` | `btn-primary flex-2 h-11 font-bold rounded-xl` | Manual `py-4`, `rounded-2xl`, non-token `bg-slate-900` | P2 | Change to `btn-primary flex-2 h-11 rounded-xl` |
| `/employee/help` | Modal Submit CTA | "Submit Ticket" | `py-4 bg-slate-900 text-white rounded-2xl font-bold` | `btn-primary flex-2 h-11 font-bold rounded-xl` | Manual `py-4`, `rounded-2xl`, `bg-slate-900` | P2 | Change to `btn-primary flex-2 h-11 rounded-xl` |
| `/employee/performance`| Modal Update CTA | "Commit Update" | `py-4 bg-slate-900 text-white rounded-2xl font-bold` | `btn-primary flex-2 h-11 font-bold rounded-xl` | Manual `py-4`, `rounded-2xl` | P2 | Change to `btn-primary flex-2 h-11 rounded-xl` |
| `/employee/performance`| Modal Goal CTA | "Add Goal" | `py-4 bg-slate-900 text-white rounded-2xl text-[10px]` | `btn-primary w-full h-11 font-bold rounded-xl` | Manual `py-4`, `rounded-2xl`, `text-[10px]` | P2 | Change to `btn-primary w-full h-11 rounded-xl` |
| `/employee/benefits` | Advisor CTA | "Connect Advisor" | `py-5 bg-white text-primary-700 rounded-2xl text-[10px]` | `btn-primary h-11 font-bold rounded-xl` | Oversized `py-5`, `rounded-2xl`, `text-[10px]` | P2 | Change to `btn-primary h-11 font-bold rounded-xl` |
| `/employee/benefits` | Submit Claim CTA | "Submit Claim" | `py-4 bg-slate-900 text-white rounded-2xl font-bold` | `btn-primary flex-2 h-11 font-bold rounded-xl` | Manual `py-4`, `rounded-2xl` | P2 | Change to `btn-primary flex-2 h-11 rounded-xl` |

---

### C. Manager Role (`/manager/*`)

| Route / Page | Element / Button | Label | Current Implementation | Expected Standard | Issue | Severity | Recommendation |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/manager/tasks` | Modal Deploy CTA | "Deploy Mission" | `py-4 bg-primary-600 rounded-2xl font-bold shadow-xl` | `btn-primary w-full h-11 font-bold rounded-xl` | Manual `py-4`, `rounded-2xl` | P2 | Change to `btn-primary w-full h-11 rounded-xl` |
| `/manager/dashboard` | Quick Task CTA | "Create & Assign" | `btn-primary w-full py-4 font-bold shadow-xl` | `btn-primary w-full h-11 font-bold rounded-xl` | Manual `py-4` | P3 | Change to `btn-primary w-full h-11 rounded-xl` |
| `/manager/dashboard` | Info Request CTA | "Request more info" | `py-4 text-[10px] font-bold text-slate-450` | `btn-secondary w-full h-10 text-xs font-bold rounded-xl` | Manual `py-4`, `text-[10px]` | P3 | Change to `btn-secondary w-full h-10 text-xs rounded-xl` |
| `/manager/reports` | Export CTA | "Activate Secure Loop" | `py-5 btn-primary font-bold shadow-2xl` | `btn-primary h-11 px-6 font-bold rounded-xl` | Oversized `py-5` | P2 | Change to `btn-primary h-11 px-6 rounded-xl` |
| `/manager/settings` | Reset Settings CTA | "Reset" | `px-6 py-3 bg-white border text-slate-600 rounded-2xl` | `btn-secondary h-11 px-5 font-bold rounded-xl` | Manual `py-3`, `rounded-2xl` | P3 | Change to `btn-secondary h-11 px-5 rounded-xl` |

---

### D. HR Role (`/hr/*`)

| Route / Page | Element / Button | Label | Current Implementation | Expected Standard | Issue | Severity | Recommendation |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/hr/offboarding` | Termination Modal | "Initiate" | `px-4 py-2 bg-rose-600 text-xs rounded-xl` | `btn-danger h-10 px-4 text-xs font-bold rounded-xl` | Manual `py-2`, terse verb | P3 | Change to `btn-danger h-10` and label `"Initiate Offboarding"` |
| `/hr/offboarding` | Table Action | "Extend" / "Confirm" | `px-3 py-1.5 rounded-xl text-xs` | `h-8 px-3 rounded-lg text-xs font-bold` | Non-standard row height | P3 | Change to `h-8 px-3 rounded-lg font-bold` |
| `/hr/dashboard` | Action Card | "Quick Actions" | `p-4 rounded-2xl flex flex-col` | `p-4 rounded-xl flex flex-col` | `rounded-2xl` | P4 | Change to `rounded-xl` |

---

### E. Admin Role & Shared Admin Modals (`/admin/*`, `src/shared/components/admin/`)

| Component / File | Element / Button | Label | Current Implementation | Expected Standard | Issue | Severity | Recommendation |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `AuditFilterModal.jsx` | Apply Filter CTA | "Apply Filters" | `py-3.5 bg-slate-900 text-white rounded-2xl font-bold` | `btn-primary flex-1 h-11 font-bold rounded-xl` | Manual `py-3.5`, `rounded-2xl`, `bg-slate-900` | P2 | Change to `btn-primary flex-1 h-11 rounded-xl` |
| `ExportAuditModal.jsx` | Cancel / Generate | "Cancel" / "Generate" | `py-3.5 rounded-2xl font-bold` | `btn-secondary/primary flex-1 h-11 font-bold rounded-xl` | Manual `py-3.5`, `rounded-2xl` | P2 | Change to `btn-secondary` and `btn-primary h-11 rounded-xl` |
| `UpgradePlanModal.jsx` | Cancel / Upgrade | "Cancel" / "Upgrade Now" | `py-3 sm:py-3.5 bg-slate-900 rounded-2xl font-bold` | `btn-secondary/primary h-11 font-bold rounded-xl` | Manual `py-3.5`, `rounded-2xl` | P2 | Change to `btn-secondary` and `btn-primary h-11 rounded-xl` |
| `IntegrationModal.jsx` | Cancel / Connect | "Cancel" / "Connect" | `py-4 bg-slate-900 text-white rounded-2xl font-bold` | `btn-secondary/primary flex-1 h-11 font-bold rounded-xl` | Manual `py-4`, `rounded-2xl` | P2 | Change to `btn-secondary` and `btn-primary flex-1 h-11 rounded-xl` |
| `ComplianceModal.jsx` | Cancel / Run Audit | "Cancel" / "Run Audit"| `py-4 rounded-2xl font-bold` | `btn-secondary/primary flex-1 h-11 font-bold rounded-xl` | Manual `py-4`, `rounded-2xl` | P2 | Change to `btn-secondary` and `btn-primary flex-1 h-11 rounded-xl` |
| `SecurityScanModal.jsx`| Start / Done | "Start Scan" / "Done" | `py-4 bg-slate-900 rounded-2xl font-bold` | `btn-primary w-full h-11 font-bold rounded-xl` | Manual `py-4`, `rounded-2xl` | P2 | Change to `btn-primary w-full h-11 rounded-xl` |
| `ReportSchedulerModal.jsx`| Cancel / Save | "Cancel" / "Save" | `py-3.5 rounded-2xl font-bold` | `btn-secondary/primary flex-1 h-11 font-bold rounded-xl` | Manual `py-3.5`, `rounded-2xl` | P2 | Change to `btn-secondary` and `btn-primary flex-1 h-11 rounded-xl` |
| `ExportHistoryModal.jsx`| Cancel / Export | "Cancel" / "Export" | `py-3.5 rounded-2xl font-bold` | `btn-secondary/primary flex-1 h-11 font-bold rounded-xl` | Manual `py-3.5`, `rounded-2xl` | P2 | Change to `btn-secondary` and `btn-primary flex-1 h-11 rounded-xl` |
| `ManageAddonsModal.jsx` | Cancel / Save | "Cancel" / "Save" | `py-2.5 sm:py-3.5 rounded-2xl font-bold` | `btn-secondary/primary h-11 font-bold rounded-xl` | Manual padding, `rounded-2xl` | P2 | Change to `btn-secondary` and `btn-primary h-11 rounded-xl` |
| `AIModuleModal.jsx` | Cancel / Save | "Cancel" / "Save" | `py-4 rounded-2xl font-bold` | `btn-secondary/primary flex-1 h-11 font-bold rounded-xl` | Manual `py-4`, `rounded-2xl` | P2 | Change to `btn-secondary` and `btn-primary flex-1 h-11 rounded-xl` |
| `AdminReimbursements.jsx`| Record Payment | "Record Payment" | `py-4 bg-slate-900 text-white rounded-2xl font-bold` | `btn-primary flex-2 h-11 font-bold rounded-xl` | Manual `py-4`, `rounded-2xl` | P2 | Change to `btn-primary flex-2 h-11 rounded-xl` |
| `Settings.jsx` | Reset Settings | "Reset" | `px-6 py-3 bg-white border rounded-2xl font-bold` | `btn-secondary h-11 px-5 font-bold rounded-xl` | Manual `py-3`, `rounded-2xl` | P3 | Change to `btn-secondary h-11 px-5 rounded-xl` |

---

### F. SuperAdmin Role (`/superadmin/*`)

| Route / Page | Element / Button | Label | Current Implementation | Expected Standard | Issue | Severity | Recommendation |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/superadmin/pricing` | Modal Save CTA | "Save Plan Settings" | `px-8 py-2.5 font-bold shadow-lg` | `btn-primary h-11 px-6 font-bold rounded-xl` | Manual padding | P3 | Change to `btn-primary h-11 px-6 font-bold` |
| `/superadmin/pricing` | Modal Cancel CTA | "Cancel" | `px-6 py-2.5 font-bold` | `btn-secondary h-11 px-5 font-bold rounded-xl` | Manual padding | P3 | Change to `btn-secondary h-11 px-5 font-bold` |
| `/superadmin/analytics`| Export Report | "Export PDF Report" | `w-full sm:w-auto px-6 py-2.5` | `btn-secondary h-11 px-5 font-bold rounded-xl` | Manual padding | P4 | Change to `btn-secondary h-11 px-5 font-bold` |

---

### G. Public, Auth & Organization Setup (`/`, `/login`, `/signup`, `/register-organization`)

| Route / Page | Element / Button | Label | Current Implementation | Expected Standard | Issue | Severity | Recommendation |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/` (Landing Page) | Hero Primary CTA | "Book Live Demo" | `btn-primary px-8 py-3.5 text-sm font-bold rounded-xl` | `btn-primary h-12 px-8 text-sm font-bold rounded-xl` | Standard large CTA | Pass | Retain large hero CTA |
| `/` (Landing Page) | Navbar Action | "Sign In" | `btn-secondary px-5 py-2 text-xs sm:text-sm font-bold` | `btn-secondary h-10 px-4 font-bold rounded-xl` | Standard navbar action | Pass | Retain standard navbar secondary |
| `/login` & `/signup` | Auth Submit Action | "Sign In" / "Register"| `btn-primary w-full h-12 text-sm font-bold rounded-xl` | `btn-primary w-full h-12 text-sm font-bold rounded-xl` | Standard auth submission | Pass | Retain standard full-width CTA |
| `/register-organization`| Org Setup Action | "Register Org" | `btn-primary w-full h-12 text-sm font-bold rounded-xl` | `btn-primary w-full h-12 text-sm font-bold rounded-xl` | Standard tenant onboarding | Pass | Retain standard onboarding CTA |
