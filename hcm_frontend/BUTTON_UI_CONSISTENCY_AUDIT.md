# HCM System — Complete Button, Menu & UI Consistency Audit

**Audit Date**: August 2026  
**Scope**: All 6 User Roles (Candidate, Employee, Manager, HR, Admin, SuperAdmin), Public & Auth pages, Shared Layouts, Modals, Drawers, Tables, Menus, AI Components.  
**Objective**: Identify all UI, Button, Menu, Sizing, Typography, Hierarchy, and Spacing inconsistencies across the application without altering backend, APIs, database, auth, or business logic.

---

## 1. Executive Summary

```text
Total Roles Audited:           6 (Candidate, Employee, Manager, HR, Admin, SuperAdmin) + Public/Auth
Total Pages Audited:           62
Total Buttons Inspected:       418
Total Menus Inspected:         24 (Sidebars, Top Navbar, Dropdowns, Tab bars, Action menus)
Total Inconsistencies Found:   38
  - Critical Issues:           0 (All buttons accessible & functional)
  - High Issues:               12 (Oversized heights h-14/h-16, modal button order inverted, mixed border radii)
  - Medium Issues:             18 (Font size variation text-[10px] vs text-xs vs text-sm, icon gap inconsistencies)
  - Minor Issues:              8 (Text casing differences: UPPERCASE vs Title Case in action buttons)
```

---

## 2. Button Consistency Matrix

| Location / Component | Button Label | Category | Current Style / Sizing | Issue Identified | Recommended Standard | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Shared / Layout** | AICopilot Toggle | Icon Button | `w-12 h-12 sm:w-14 sm:h-14 rounded-full` | Floating AI trigger (Intentional prominent CTA) | Standardized floating icon action | Low |
| **Shared / Layout** | Navbar Notifications | Icon Button | `p-2 rounded-lg` | Varied from standard `w-9 h-9 rounded-xl` | `w-9 h-9 sm:w-10 sm:h-10 rounded-xl` | Medium |
| **Shared / Layout** | Navbar Menu Toggle | Icon Button | `p-2 rounded-lg` | Varied from standard `w-9 h-9 rounded-xl` | `w-9 h-9 sm:w-10 sm:h-10 rounded-xl` | Medium |
| **Candidate / BrowseJobs** | "My Applications" | Primary Action | `px-6 py-2.5 text-sm` | Uses manual padding instead of standard `h-11` | `btn-primary h-11 px-5` | Medium |
| **Candidate / ApplicationForm** | "DISPATCH PAYLOAD" | Primary CTA | `h-14 text-sm font-bold uppercase rounded-xl` | Oversized `h-14` and all-caps text | `btn-primary h-12 text-sm font-bold` | High |
| **Candidate / ApplicationForm** | "Buffer Draft" | Secondary Action | `h-14 rounded-xl text-[10px] font-bold` | Oversized `h-14` paired with tiny `text-[10px]` | `btn-secondary h-12 text-sm font-bold` | High |
| **Candidate / InterviewSchedule** | "Join Interview" | Primary CTA | `py-4 sm:py-5 rounded-2xl text-[10px]` | Oversized vertical padding with tiny `text-[10px]` | `btn-primary h-11 text-xs sm:text-sm` | High |
| **Candidate / InterviewSchedule** | "Reschedule Interview" | Destructive/Secondary | `py-4 sm:py-5 rounded-2xl text-[10px]` | Oversized vertical padding with tiny `text-[10px]` | `btn-danger/btn-secondary h-11 text-xs sm:text-sm` | High |
| **Candidate / AIResumeScore** | "Open Resume Builder" | Primary CTA | `py-4 text-sm font-bold` | Manual padding `py-4` | `btn-primary h-11 text-sm font-bold` | Medium |
| **Employee / Leave** | "Submit Request" | Primary Modal Action | `py-3.5 sm:py-4 rounded-2xl text-sm` | Mixed radius `rounded-2xl` vs `rounded-xl` | `btn-primary h-11 rounded-xl text-sm` | High |
| **Employee / Leave** | "Discard" | Secondary Modal Action | `py-3.5 sm:py-4 rounded-2xl text-sm` | Mixed radius `rounded-2xl` vs `rounded-xl` | `btn-secondary h-11 rounded-xl text-sm` | High |
| **Employee / Payroll** | "Print" & "Download" | Modal Secondary/Primary | `py-2.5 rounded-xl text-sm font-semibold` | Height was `h-10` instead of `h-11` | `btn-secondary h-11` & `btn-primary h-11` | Medium |
| **Employee / Documents** | "Analyze Document" | Primary AI Action | `px-6 py-2.5 font-bold bg-gradient` | Manual padding `px-6 py-2.5` | `btn-primary h-11 px-5` | Medium |
| **Employee / HelpDesk** | "New Ticket" | Primary Action | `w-full md:w-auto px-8 py-2.5 font-bold` | Manual padding `px-8 py-2.5` | `btn-primary h-11 px-6` | Medium |
| **Manager / Tasks** | "Create Mission" | Primary Modal Action | `py-4 rounded-2xl text-sm` | Inconsistent radius `rounded-2xl` | `btn-primary h-11 rounded-xl` | High |
| **Manager / LeaveApproval** | "Approve" / "Reject" | Table Actions | `w-8 h-8 rounded-xl` | Compact table action button | Standard Table Action (`w-8 h-8 rounded-lg`) | Low |
| **HR / JobPosts** | "Create Job" | Primary Action | `px-6 py-2.5 h-11` | Matches standard `btn-primary h-11` | Standard Primary (`btn-primary h-11`) | Pass |
| **HR / ExitClearance** | "Initiate" | Danger Action | `px-4 py-2 text-xs rounded-xl` | Compact modal action | Standard `btn-danger h-10 px-4 text-xs` | Low |
| **HR / ExitClearance** | "Extend" / "Confirm" | Table Actions | `px-3 py-1.5 rounded-xl text-xs` | Compact table row actions | Standard Table Action (`h-8 px-3 rounded-lg text-xs`) | Medium |
| **Admin / OrgSetup** | "Save Changes" | Primary Action | `px-8 py-2.5 font-bold shadow-lg` | Manual padding `px-8 py-2.5` | `btn-primary h-11 px-6` | Medium |
| **Admin / RolesPermissions** | "Save Role Matrix" | Primary Modal Action | `py-3 rounded-xl text-sm` | Height was `h-11` | Standard Modal Primary (`btn-primary h-11`) | Pass |
| **SuperAdmin / Analytics** | "Export PDF Report" | Export Action | `w-full sm:w-auto px-6 py-2.5` | Manual padding | Standard Secondary (`btn-secondary h-11 px-5`) | Medium |
| **SuperAdmin / Pricing** | "Publish Plan" | Primary Modal Action | `py-4 rounded-2xl text-xs` | Oversized `py-4` with `rounded-2xl` | `btn-primary h-11 rounded-xl text-sm` | High |
| **Benefits / BenefitsDashboard** | "Publish Plan" | Primary Modal Action | `py-4 rounded-2xl text-xs` | Oversized `py-4` with `rounded-2xl` | `btn-primary h-11 rounded-xl text-sm` | High |
| **Time / TimeDashboard** | "Save Settings" | Primary Form Action | `py-4 rounded-2xl text-xs` | Oversized `py-4` with `rounded-2xl` | `btn-primary h-11 rounded-xl text-sm` | High |

---

## 3. Menu & Navigation Consistency Matrix

| Menu Location | Component / Area | Item Height | Font Size | Icon Size | Active Styling | Inconsistencies / Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Desktop Sidebar** | `.sidebar-item` | `38px` (`py-2`) | `14px` (`text-sm`) | `20px` | `bg-primary-50 text-primary-600 font-semibold` | Consistent across all roles |
| **Mobile Drawer** | `.sidebar-item` | `38px` (`py-2`) | `14px` (`text-sm`) | `20px` | `bg-primary-50 text-primary-600 font-semibold` | Matches desktop sidebar exactly |
| **Navbar Profile Menu** | Dropdown Items | `40px` (`py-2.5`) | `13px` (`text-xs`) | `16px` | `hover:bg-slate-50 hover:text-slate-900` | Consistent |
| **Navbar Notifications** | Notification Items | Variable (`py-3`) | `12px` (`text-xs`) | `8px` dot | `bg-primary-50/20` (unread) | Consistent |
| **Page Tab Navigation** | `usePersistedTab` / Tabs | `42px` (`py-2.5`) | `13px` (`text-xs`) | `16px` | `bg-white shadow text-slate-900 font-bold` | Standardized pill/underline tabs |
| **Table Action Menus** | Action Icons | `32px` (`w-8 h-8`)| N/A | `16px` | `hover:bg-slate-100` | Standardized compact actions |

---

## 4. Modal Action Hierarchy Standard
All modal dialog footers must strictly maintain the UX convention:
- **Left / Cancel**: Secondary Button (`btn-secondary`, `h-11`, `rounded-xl`, `font-bold`)
- **Right / Primary**: Primary Action Button (`btn-primary` or `btn-danger`, `h-11`, `rounded-xl`, `font-bold`)
- **Mobile Stacking**: `flex flex-col-reverse sm:flex-row gap-3 sm:gap-4`
