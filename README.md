# HCM Enterprise Platform

Comprehensive Human Capital Management (HCM) platform built with modern full-stack web and AI technologies.

---

## 🏗 Repository Architecture

This monorepo contains the following components:

- **`hcm_frontend/`**: Vite + React single-page application providing a responsive HR dashboard, employee self-service, leave management, payroll, analytics, and admin panels.
- **`hcm-backend/`**: Express.js REST API service powered by Prisma ORM and MySQL, managing authentication, multi-tenant organizations, workflows, payroll processing, and document management.
- **`ai-server-hrm/`**: Microservice handling AI integrations, Pinecone vector indexing, document analysis, and conversational assistant capabilities.
- **`hcm_db (2).sql`**: MySQL database dump containing initial schemas, roles, permissions, and demo datasets.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18 or v20 LTS recommended
- **MySQL**: 8.0+ or XAMPP MySQL running on port 3306
- **Git**

---

### Setup Instructions

#### 1. Database Setup
1. Create a MySQL database named `hcm_db`.
2. Import `hcm_db (2).sql` into your database.

#### 2. Backend Setup
```bash
cd hcm-backend
npm install
cp .env.example .env
# Edit .env with your database URL and credentials
npx prisma generate
npm run dev
```

#### 3. AI Server Setup
```bash
cd ai-server-hrm
npm install
cp .env.example .env
# Edit .env with your OpenAI and Pinecone API keys
npm run dev
```

#### 4. Frontend Setup
```bash
cd hcm_frontend
npm install
cp .env.example .env
# Verify VITE_API_URL points to your backend (default: http://localhost:5001/api)
npm run dev
```

---

## 🔒 Security Notice

All `.env` environment files and runtime upload files are excluded from version control via `.gitignore`. Always use `.env.example` templates to set up local environment variables securely.
