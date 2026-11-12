# Employee Onboarding & HR Document Collection Management System

An enterprise-grade Employee Onboarding and Document Collection platform built with a high-performance **Python Flask** backend, **PostgreSQL** relational database, and a modern **React 19 + TypeScript + Vite + Tailwind CSS** frontend.

---

## 🌟 Key Features

### 1. HR Admin Portal (Authentication & Management)
- **Secure Authentication**: HR login using JWT tokens and bcrypt password hashing.
- **Onboarding Link Generation**:
  - Cryptographically secure, expiring URL tokens generated per candidate.
  - Link revocation, expiry management, and direct email sharing options.
  - Quick 1-click clipboard copy of employee links.
- **Real-Time HR Dashboard**:
  - Live counts: Total Generated Links, Total Registered, Pending, Completed, Approved, and Rejected.
  - Recent candidate registration links with active/submitted/revoked status badges.
- **Comprehensive Candidate Dossier Review**:
  - Multi-tab detailed dossier: Personal, Educational, Employment History, Bank Details (encrypted at rest), Statutory/Nominees/Emergency contacts, Uploaded Documents, and full Audit Trail.
  - Actions: **Approve Candidate**, **Reject Submission**, **Request Correction**, and **Export Dossier as JSON**.
- **Correction Workflow**:
  - HR can submit remarks/clarifications to the candidate.
  - Link is unlocked for the candidate to update specific requested details.
- **Central Document Vault**:
  - Securely browse and download candidate documents (PDF, JPG, PNG).

### 2. Candidate Onboarding Portal (Unauthenticated Token Access)
- **Zero-Password Secure Token Flow**: Access via unique link with no login barrier.
- **Professional 7-Step Interactive Wizard**:
  - **Step 1: Personal Details** (Full name, parents' names, DOB, gender, mobile, alternate phone, address, PAN, Aadhaar).
  - **Step 2: Educational Details** (Dynamic rows for multiple qualifications: Degree, institution, university, year, CGPA).
  - **Step 3: Employment Details** (Previous companies, roles, tenures, reference contacts).
  - **Step 4: Bank Details** (Account holder, bank name, account number confirmation, IFSC, branch).
  - **Step 5: Statutory & Compliance** (UAN, PF number, ESI, blood group, multiple nominees with % share, emergency contacts).
  - **Step 6: Document Upload** (Resume, Photograph, PAN Card, Aadhaar, Educational Certificate, Relieving letter, Bank Cheque/Passbook).
  - **Step 7: Declaration & Final Submission** (Full review summary, legal declaration checkbox, lock on submission with unique Reference ID).

---

## 🏗️ Architecture & Database Design

### Normalized PostgreSQL Schema (12 Tables)
- `hr_users`: HR administrative accounts with hashed credentials and roles.
- `employee_registration_links`: Unique cryptographically random tokens with expiry dates.
- `employee_submissions`: Core submission entity with lifecycle states (`Draft`, `Submitted`, `Under Review`, `Correction Required`, `Approved`, `Rejected`).
- `employee_personal_details`: Candidate identity and contact records.
- `employee_education`: Academic degrees and institutions.
- `employee_employment_history`: Prior employment records.
- `employee_bank_details`: Encrypted banking coordinates for payroll.
- `employee_statutory_details`: Compliance information (PF, UAN, ESI, blood group).
- `employee_nominees`: Gratuity and PF nominees with share allocations.
- `employee_emergency_contacts`: Emergency reach points.
- `employee_documents`: File metadata and filesystem reference paths.
- `employee_submission_history`: Immutable audit trail for all workflow actions.

---

## 🐳 Running with Docker (Recommended)

The entire full-stack application (PostgreSQL + Python Flask Backend + Nginx/React Frontend) is containerized and managed via `docker-compose.yml`.

### Start the Multi-Container Stack:
```bash
docker compose up -d --build
```

### Stop the Containers:
```bash
docker compose down
```

### Container Endpoints:
- **Web App (Frontend + API Gateway):** [http://localhost:3000](http://localhost:3000)
- **Direct Backend API:** [http://localhost:5000](http://localhost:5000)
- **PostgreSQL Database:** `localhost:5436` (Credentials: `postgres / postgrespassword`)

---

## 🚀 Running Locally Without Docker

### Prerequisites
- Python 3.10+
- Node.js 18+ & npm
- PostgreSQL 15+

### 1. Database Setup
Ensure PostgreSQL is running. The application defaults to:
```bash
Host: 127.0.0.1
Port: 5434 (or 5432)
Database: onboarding_db
User: postgres
```
Tables are auto-created by Flask on first startup, and a default admin is seeded.

### 2. Backend (Flask)
```bash
cd backend
python -m pip install -r requirements.txt
python app.py
```
*Backend runs on `http://localhost:5000`*

### 3. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`*

---

## 🔑 Default Credentials
- **HR Admin Username:** `admin`
- **HR Admin Password:** `Admin@123`
- **HR Portal URL:** `http://localhost:5173/admin/login`
- **Employee Portal URL:** `http://localhost:5173/register/<TOKEN>`

