# UPLOAD ROOT CAUSE AUDIT REPORT

**Project:** HCM Management System  
**Audit Date:** August 21, 2026

---

## 1. Executive Summary

A complete full-stack audit was performed on the file upload system of the HCM Management System. The audit traced every upload boundary from UI element events, file validators, Axios interceptors, backend routes, multer middlewares, cloud storage streams, database transactions, to frontend state updates.

---

## 2. Root Cause Analysis

### A. Axios Default Header Interference
* **Failure Point:** Axios/API Service layer (`src/utils/apiService.js`).
* **Symptom:** Selected files were not uploaded; backend received empty `req.file` or `400 Bad Request`.
* **Root Cause:** The default Axios `API` instance was created with `headers: { 'Content-Type': 'application/json' }`. In Axios 1.x, passing config parameters like `{ headers: { 'Content-Type': undefined } }` or `'multipart/form-data'` on individual requests does not override the default headers defined during `axios.create()`. Thus, all upload payloads were sent with JSON headers, preventing the browser from automatically generating the `multipart/form-data` boundary. Multer failed to parse the boundary-less body, leaving `req.file` as `undefined`.
* **Required Fix:** Initialized a dedicated `UploadAPI` Axios instance with the same authentication interceptors but without any default `Content-Type` header. Routed all `FormData` endpoints through this instance.

### B. HTTP 304 Caching
* **Failure Point:** Express backend route level (`app.js`).
* **Symptom:** Files uploaded successfully but did not render in the UI until hard reloads.
* **Root Cause:** Backend Express route returned ETag header hashes, which allowed the browser to serve stale cached `304 Not Modified` responses for GET requests.
* **Required Fix:** Disabled etags globally for `/api` endpoints and attached no-cache headers to the responses. Added cache-busting timestamp parameters (`_t=Date.now()`) to the frontend fetching APIs.

### C. UI Dropzone Click Interception
* **Failure Point:** File selection triggers (`EmployeeDocuments.jsx`).
* **Symptom:** Selecting a file did not trigger the file picker or caused form submission reloads.
* **Root Cause:** The dropzone `div` used `document.getElementById('vault-file-input').click()`. Clicking the trigger button bubbled up to the parent div and triggered double clicks, while `e.preventDefault()` on the div suppressed the file picker in some browsers.
* **Required Fix:** Replaced element select selectors with React `vaultFileInputRef` and used `e.stopPropagation()` on button triggers.

---

## 3. Upload Flow Inventory Mapping

| # | Portal/Role | Component | Frontend File Input | Event Handler | API Call | Backend Route | Multer Field | Controller | Storage |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Candidate | `ApplicationForm.jsx` | `id="resume-upload"` | `onChange` | `uploadAPI.uploadDocument` | `/api/upload/document` | `file` | `uploadDocument` | ImageKit / Local |
| 2 | Candidate | `CandidateProfile.jsx` | `ref={fileInputRef}` | `handleAvatarUpload` | `uploadAPI.uploadImage` | `/api/upload/image` | `file` | `uploadImage` | Cloudinary / Local |
| 3 | Candidate | `CandidateProfile.jsx` | `type="file"` | `handleResumeUpload` | `uploadAPI.uploadDocument` | `/api/upload/document` | `file` | `uploadDocument` | ImageKit / Local |
| 4 | Candidate | `CandidateProfile.jsx` | `type="file"` | `handleDocumentUpload` | `uploadAPI.uploadDocument` | `/api/upload/document` | `file` | `uploadDocument` | ImageKit / Local |
| 5 | Employee | `EmployeeDocuments.jsx` | `ref={vaultFileInputRef}` | `handleFileChange` | `employeeAPI.uploadDocumentFile` | `/api/employee/documents` | `file` | `uploadDocument` | ImageKit / Local |
| 6 | Employee | `EmployeeProfile.jsx` | `type="file"` | `handleAvatarChange` | `uploadAPI.uploadImage` | `/api/upload/image` | `file` | `uploadImage` | Cloudinary / Local |
| 7 | Employee | `EmployeeProfile.jsx` | `type="file"` | `handleFileChange` | `employeeAPI.uploadDocumentFile` | `/api/employee/documents` | `file` | `uploadDocument` | ImageKit / Local |
| 8 | Employee | `EmployeeLeave.jsx` | `ref={leaveFileInputRef}` | `handleFileChange` | `uploadAPI.uploadDocument` | `/api/upload/document` | `file` | `uploadDocument` | ImageKit / Local |
| 9 | Employee | `EmployeeBenefits.jsx` | `type="file"` | `onChange` | `uploadAPI.uploadDocument` | `/api/upload/document` | `file` | `uploadDocument` | ImageKit / Local |
| 10 | Employee | `EmployeeHelpDesk.jsx` | `ref={createFileInputRef}` | `handleCreateFileSelect` | `uploadAPI.uploadAuto` | `/api/upload/auto` | `file` | `smartUpload` | ImageKit / Local |
| 11 | Employee | `EmployeeHelpDesk.jsx` | `ref={fileInputRef}` | `handleFileSelect` | `uploadAPI.uploadAuto` | `/api/upload/auto` | `file` | `smartUpload` | ImageKit / Local |
| 12 | HR | `HRProfile.jsx` | `ref={fileInputRef}` | `handleAvatarUpload` | `uploadAPI.uploadImage` | `/api/upload/image` | `file` | `uploadImage` | Cloudinary / Local |
| 13 | HR | `HRProfile.jsx` | `ref={documentInputRef}` | `handleDocumentUpload` | `uploadAPI.uploadDocument` | `/api/upload/document` | `file` | `uploadDocument` | ImageKit / Local |
| 14 | HR | `Messages.jsx` | `ref={fileInputRef}` | `handleFileChange` | `uploadAPI.uploadAuto` | `/api/upload/auto` | `file` | `smartUpload` | ImageKit / Local |
| 15 | HR | `OfferManagement.jsx` | `type="file"` | `onChange` | `uploadAPI.uploadDocument` | `/api/upload/document` | `file` | `uploadDocument` | ImageKit / Local |
| 16 | Manager | `ManagerProfile.jsx` | `ref={fileInputRef}` | `handleAvatarUpload` | `uploadAPI.uploadImage` | `/api/upload/image` | `file` | `uploadImage` | Cloudinary / Local |
| 17 | Manager | `ManagerProfile.jsx` | `ref={docInputRef}` | `handleDocUpload` | `uploadAPI.uploadDocument` | `/api/upload/document` | `file` | `uploadDocument` | ImageKit / Local |
| 18 | Admin | `AdminProfile.jsx` | `ref={fileInputRef}` | `handleAvatarUpload` | `uploadAPI.uploadImage` | `/api/upload/image` | `file` | `uploadImage` | Cloudinary / Local |
| 19 | Admin | `OrgSetup.jsx` | `ref={fileInputRef}` | `handleLogoUpload` | `adminAPI.uploadOrganizationLogo` | `/api/admin/organization/logo` | `logo` | `updateOrganizationLogo` | Cloudinary / Local |
| 20 | Admin | `UserModal.jsx` (Shared) | `ref={fileInputRef}` | `handlePhotoUpload` | `uploadAPI.uploadImage` | `/api/upload/image` | `file` | `uploadImage` | Cloudinary / Local |
| 21 | Admin | `OpenTicketModal.jsx` | `type="file"` | `handleFileChange` | `uploadAPI.uploadAuto` | `/api/upload/auto` | `file` | `smartUpload` | ImageKit / Local |
| 22 | Admin | `ComplianceModal.jsx` | `type="file"` | `handleFileChange` | `uploadAPI.uploadDocument` | `/api/upload/document` | `file` | `uploadDocument` | ImageKit / Local |
| 23 | SuperAdmin | `SuperAdminProfile.jsx` | `ref={fileInputRef}` | `handleAvatarUpload` | `uploadAPI.uploadImage` | `/api/upload/image` | `file` | `uploadImage` | Cloudinary / Local |
| 24 | SuperAdmin | `ImportModal.jsx` | `type="file"` | `onChange` | `UploadAPI.post` | `/api/import/preview` | `file` | `previewImport` | Memory Ingestion |
