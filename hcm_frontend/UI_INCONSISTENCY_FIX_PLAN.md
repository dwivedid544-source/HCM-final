# HCM System — UI Inconsistency Fix Plan

## 1. Unified Sizing System

All interactive buttons and controls across the HCM platform are consolidated into four standard tiers:

| Tier | Height | Padding | Font Size & Weight | Border Radius | Icon Size | Gap | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Small (`btn-sm`)** | `h-9` (36px) | `px-3` | `text-xs font-bold` | `rounded-xl` | 14px | `gap-1.5` | Table actions, compact toolbar actions, inline cards |
| **Default / Medium (`btn-md`)** | `h-11` (44px) | `px-4 sm:px-5` | `text-xs sm:text-sm font-bold` | `rounded-xl` | 16px | `gap-2` | Page headers, form submissions, modal footers, filters |
| **Large (`btn-lg`)** | `h-12` (48px) | `px-6 sm:px-8` | `text-sm font-bold` | `rounded-xl` | 18px | `gap-2.5` | Prominent call-to-actions, hero CTAs, main workflow submit |
| **Icon Button (`icon-btn`)** | `w-9 h-9 sm:w-10 sm:h-10` | `p-0` | `text-sm` | `rounded-xl` | 16-18px | — | Navbar icons, table row actions, quick toggles |

---

## 2. Style Variant System

1. **Primary Button (`.btn-primary`)**:
   - `bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl h-11 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50`
2. **Secondary Button (`.btn-secondary`)**:
   - `bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold rounded-xl h-11 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50`
3. **Danger / Destructive Button (`.btn-danger`)**:
   - `bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl h-11 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50`
4. **Success Button (`.btn-success`)**:
   - `bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl h-11 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50`
5. **AI Accent Button**:
   - `bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl h-11 flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-indigo-500/20`

---

## 3. Typography & Text Standards
- **Capitalization**: Title Case for all action buttons (`"Create Job"`, `"Save Changes"`, `"Submit Application"`, `"Download Report"`). Avoid mixed ALL-CAPS (`"DISPATCH PAYLOAD"` -> `"Submit Application"`).
- **Font Weight**: `font-bold` across all buttons and clickable menu items.
- **Icon Alignment**: Centered vertically with `shrink-0`.

---

## 4. Modal Footer Standardization
- Order: `[Cancel / Discard / Close]` on the left (or bottom when stacked on mobile), `[Save / Submit / Confirm]` on the right.
- Container: `flex flex-col-reverse sm:flex-row gap-3 sm:gap-4`.

---

## 5. Files Verified & Aligned
1. [ApplicationForm.jsx](file:///Users/unknown1/Desktop/HCM%20project/hcm_frontend/src/features/candidate/ApplicationForm.jsx): Submit CTA `h-12` and Title Case `"Submit Application"` / `"Save Draft"`.
2. [InterviewSchedule.jsx](file:///Users/unknown1/Desktop/HCM%20project/hcm_frontend/src/features/candidate/InterviewSchedule.jsx): Standardized modal buttons to `h-11` and `rounded-xl`.
3. [EmployeeLeave.jsx](file:///Users/unknown1/Desktop/HCM%20project/hcm_frontend/src/features/employee/EmployeeLeave.jsx): Modal footer actions to `rounded-xl` and `h-11`.
4. [BenefitsDashboard.jsx](file:///Users/unknown1/Desktop/HCM%20project/hcm_frontend/src/features/benefits/BenefitsDashboard.jsx): Modal submit actions to `h-11 rounded-xl`.
5. [Tasks.jsx](file:///Users/unknown1/Desktop/HCM%20project/hcm_frontend/src/features/manager/Tasks.jsx): Task creation submit button to `h-11 rounded-xl`.
6. [PricingManagement.jsx](file:///Users/unknown1/Desktop/HCM%20project/hcm_frontend/src/features/superadmin/PricingManagement.jsx): Modal action buttons to `btn-secondary` and `btn-primary h-11`.
