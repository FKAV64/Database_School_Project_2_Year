# TestBankasi - Advanced Online Examination System 🎓

## 📖 Overview
TestBankasi is a robust, full-stack online examination and student performance tracking system. Built with **React**, **ASP.NET Core Web API**, and **SQL Server**, this project goes beyond standard CRUD applications by enforcing complex business logic directly at the database level and implementing a professional, multi-layered security architecture.

## 🚀 What Makes This Project Different?
While many junior projects rely entirely on the backend code to enforce rules, **this project leverages the full power of the Relational Database Management System (RDBMS).**

* **Strict Data Integrity (Superkeys):** Uses Composite Unique Constraints to prevent "Orphaned Logic". For example, the database physically prevents a user from submitting an Answer Option ID that belongs to a different Question, or selecting a Topic that doesn't belong to the chosen Lesson.
* **High-Performance SQL (Dapper & Indexes):** Uses **Filtered Indexes** to ignore soft-deleted data, and **Covering Indexes** (using the `INCLUDE` clause) so the automated grading engine can calculate scores instantly by reading only the index tree, without touching the heavy data tables.
* **Fair Exam Distribution Algorithm:** The database dynamically generates exams using `ROW_NUMBER() OVER (PARTITION BY...)` to ensure a balanced quota of difficulties (40% Easy, 40% Med, 20% Hard) while evenly distributing questions across various topics.
* **Ripple Effect Auto-Regrading:** If a teacher updates a question's correct answer, a dedicated Stored Procedure automatically hunts down all past student exams that included that question and recalculates their scores.
* **Soft Deletes:** Core data uses a `SilinmeTarihi` (Archived Date) column. Questions are never hard-deleted, ensuring historical exam records and statistics never break.

---

## 🛡️ Professional Security Architecture
Security is implemented strictly across all three layers of the application to prevent tampering, privilege escalation, and unauthorized access.

### 1. Database Layer (The Vault)
* **Least Privilege Identity:** The API connects to the database using a restricted custom user (`AppUser`).
* **Lockdown via Roles:** The user is assigned to an `App_Executor_Role` which is only granted `EXECUTE` permissions on specific Stored Procedures and `SELECT` on specific Views. **Direct table access (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) is completely denied.**
* **Trigger-Based Time Locks:** A SQL Trigger (`trg_SinavZamanKilidi`) intercepts `INSERT/UPDATE` commands on student answers. If the exam's end-time (`BitirZaman`) has already been recorded, the transaction is forcefully rolled back, preventing delayed submissions or URL-tampering.
* **Anti-IDOR Procedures:** Stored procedures like `sp_OturumSahibiKontrol` ensure a user can only submit answers or view results for an `OturumID` (Session ID) that belongs to them.

### 2. Backend API Layer (.NET Core)
* **JWT Authentication:** Issues secure JSON Web Tokens containing hashed Claims (UserID, Role, Education Level).
* **Secure Password Storage:** Uses `BCrypt.Net` to salt and hash passwords before they are sent to the database. Plaintext passwords are never stored.
* **Data Transfer Objects (DTOs):** Prevents over-posting attacks. Crucially, the `ExamQuestionDTO` explicitly omits the `DogruMu` (IsCorrect) flag, guaranteeing that the correct answers are *never* sent to the client's browser during an active exam.

### 3. Frontend Layer (React)
* **Axios Interceptors:** A custom network interceptor automatically staples the JWT `Bearer` token to all outgoing API requests. It also globally monitors for `401 Unauthorized` responses to instantly destroy dead sessions and redirect users to the login page.
* **Client-Side JWT Decoding:** The frontend decodes the token payload to enact Role-Based UI Routing, seamlessly directing users to either the `StudentDashboard` or `TeacherDashboard` while hiding unauthorized routes.

---

## 🛠️ Tech Stack

**Frontend**
* React 19 (Vite)
* React Router DOM (Client-side routing)
* Axios (HTTP client with Interceptors)
* Vanilla CSS-in-JS (Component-scoped styling)

**Backend**
* ASP.NET Core Web API (C#)
* Dapper (Micro-ORM for maximum execution speed)
* BCrypt.Net (Cryptography)
* System.IdentityModel.Tokens.Jwt (Authentication)

**Database**
* Microsoft SQL Server
* Advanced T-SQL (CTEs, Window Functions, JSON parsing via `OPENJSON`)

---

## 📂 Project Structure Overview

### Database
* **DDL & DML:** Complete schema setup with normalized tables (Level 0 Lookups to Level 6 Transactional data).
* **Stored Procedures:** Handles everything from cascading dropdown data fetching, atomic JSON-based question creation, to real-time exam grading.
* **Views:** Pre-calculated, aggregated data endpoints feeding the Teacher's statistical dashboards.

### Backend (API)
* **Controllers:** `AuthController`, `ExamController`, `QuestionController`, `StatsController`.
* **DataAccess (Repository Pattern):** Decouples SQL execution from HTTP logic. Includes multi-mapping Dapper queries to construct complex nested JSON responses (e.g., matching 1 Question to 4 Options).

### Frontend
* **Student Flow:** Register -> Login -> Dashboard -> Configure Exam -> Take Exam (with timer) -> Instant Results -> Detailed Review.
* **Teacher Flow:** Dashboard -> Question Bank CRUD -> View Advanced Class Analytics (Success rates, top topics, student GPA rankings).

---

## ⚙️ Setup & Installation

### 1. Database Setup
1. Open SQL Server Management Studio (SSMS).
2. Execute the SQL scripts in the following order:
   - `DDL_QUERY.sql` (Creates DB, Tables, Constraints, and Indexes)
   - `Creating_Login.sql` (Sets up the secure `AppUser`)
   - `Sql_views.sql` (Creates analytical views)
   - `Store_Procedures.sql` (Creates all executable logic)
   - `Trigger.sql` (Applies the exam time-lock)
   - `DML_QUERY.sql` (Seeds the database with test data)

### 2. Backend Setup
1. Open the `.sln` file in Visual Studio.
2. Ensure the `DefaultConnection` in `appsettings.json` points to your local SQL Server instance.
3. Run the project (Runs on `https://localhost:7125`). Swagger UI will be available for endpoint testing.

### 3. Frontend Setup
1. Navigate to the `Frontend/TestBankasi.Frontend` directory.
2. Run `npm install` to install dependencies.
3. Run `npm run dev` to start the Vite development server.
4. The application will be accessible at `https://localhost:5173`.

---
*Developed by FOMA VALERIO*