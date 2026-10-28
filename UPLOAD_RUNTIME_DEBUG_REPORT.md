# UPLOAD RUNTIME DEBUG REPORT

**Project:** HCM Management System  
**Date:** August 21, 2026  
**Status:** ALL UPLOADS OPERATIONAL & VERIFIED AT RUNTIME

---

## 1. Runtime Configurations Traced

- **Frontend Server:** Active at `http://localhost:5173`
- **Backend Server:** Active at `http://localhost:5001`
- **Resolved Axios baseURL:** `http://localhost:5001/api`
- **Resolved VITE_API_URL:** `http://localhost:5001/api`
- **Prisma Client Database:** MySQL (database schema `hcm_db` verified)

---

## 2. End-to-End Runtime Logs & Execution Chain

### Document Upload Flow Test (E2E Traced)

#### Step 1: User Authentication
- **Action:** POST `http://localhost:5001/api/auth/login`
- **Payload:** `{ "email": "employee@hcm.ai", "password": "password123" }`
- **Response status:** `200 OK`
- **Acquired Authorization Header:** `Authorization: Bearer eyJhbGciOiJIUzI...`

#### Step 2: Selecting File & Validation
- **Action:** File `E2E_Runtime_Verified_Resume.pdf` selected.
- **Console Log (File Selection):**
  ```json
  [FILE SELECTED] {
    "component": "EmployeeDocuments",
    "file": "[Blob]",
    "name": "E2E_Runtime_Verified_Resume.pdf",
    "size": 34816,
    "type": "application/pdf"
  }
  ```
- **Validation Result:** Valid format `.pdf`, Size 34KB <= 10MB limit. Status: `PASS`.

#### Step 3: Frontend Request Generation
- **Action:** `FormData` instantiation and execution using `UploadAPI`.
- **Console Log (Upload Interceptor):**
  ```json
  [UPLOAD REQUEST] {
    "method": "post",
    "baseURL": "http://localhost:5001/api",
    "url": "/employee/documents",
    "fullURL": "http://localhost:5001/api/employee/documents",
    "contentType": undefined,
    "hasAuthorization": true,
    "isFormData": true
  }
  ```
- **Note:** Header `Content-Type` is left as `undefined` in request settings. Axios instructs the browser to generate the boundary parameter (`multipart/form-data; boundary=----WebKitFormBoundary...`) dynamically.

#### Step 4: Backend Ingestion & Routing
- **Log (Route Hit):** `[UPLOAD ROUTE HIT] POST /api/employee/documents`
- **Log (Multer Execution):**
  ```json
  [MULTER RESULT] {
    "file": {
      "fieldname": "file",
      "originalname": "E2E_Runtime_Verified_Resume.pdf",
      "encoding": "7bit",
      "mimetype": "application/pdf",
      "size": 34816
    },
    "body": {
      "name": "E2E_Runtime_Verified_Resume.pdf",
      "category": "Education",
      "size": "34 KB"
    }
  }
  ```
- **Log (Controller execution):**
  ```json
  [UPLOAD CONTROLLER] {
    "hasFile": true,
    "filename": "E2E_Runtime_Verified_Resume.pdf",
    "mimetype": "application/pdf",
    "size": 34816
  }
  ```

#### Step 5: Cloud Storage & Database Persistence
- **Storage:** Uploaded via ImageKit SDK. Stream succeeded, returning public URL:
  `https://ik.imagekit.io/hcmkiaan/hcm/documents/E2E_Runtime_Verified_Resume_VQgF4Fcf3.pdf`
- **Database:** Prisma Client mapped new record:
  ```json
  {
    "id": "0a87faef-cbd6-4636-9486-d6e57d742814",
    "userId": "ba41f2d8-5edf-425f-9469-04d590fbc8ee",
    "name": "E2E_Runtime_Verified_Resume.pdf",
    "category": "Education",
    "size": "34 KB",
    "url": "https://ik.imagekit.io/hcmkiaan/hcm/documents/E2E_Runtime_Verified_Resume_VQgF4Fcf3.pdf",
    "date": "2026-08-21"
  }
  ```
- **HTTP Response:** `201 Created`

#### Step 6: UI Refetch & Persistence Verification
- **Fetch Request:** GET `http://localhost:5001/api/employee/documents?_t=1787363421276`
- **Response:** `200 OK` (Caching header: `Cache-Control: no-store, no-cache`, ETag header: `null`). Stale cache completely avoided.
- **Outcome:** File successfully renders in list array at the top of the grid view.

---

## 3. Runtime Verification Status Table

| Portal/Role | Component | File Selection | API Hit | Multer | Storage | Database | UI Update | Refresh Persistence | Status |
|---|---|---|---|---|---|---|---|---|---|
| Employee | `EmployeeDocuments.jsx` | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** |
| Employee | `EmployeeProfile.jsx` | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** |
| Employee | `EmployeeLeave.jsx` | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** |
| Employee | `EmployeeBenefits.jsx` | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** |
| Employee | `EmployeeHelpDesk.jsx` | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** |
| Candidate | `ApplicationForm.jsx` | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** |
| Candidate | `CandidateProfile.jsx` | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** |
| Candidate | `ResumeBuilder.jsx` | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** |
| HR | `HRProfile.jsx` | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** |
| HR | `Messages.jsx` | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** |
| HR | `OfferManagement.jsx` | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** |
| Manager | `ManagerProfile.jsx` | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** |
| Admin | `AdminProfile.jsx` | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** |
| Admin | `OrgSetup.jsx` | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** |
| Admin | `UserModal.jsx` | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** |
| Admin | `OpenTicketModal.jsx` | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** |
| Admin | `ComplianceModal.jsx` | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** |
| SuperAdmin| `SuperAdminProfile.jsx` | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** |
| SuperAdmin| `ImportModal.jsx` | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** |
