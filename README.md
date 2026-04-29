# 📌 Team Workload System

A full-stack web application for managing team workload, tasks, and approvals based on effort and priority.

---

## 🛠️ Technologies

- **Backend:** ASP.NET Core Web API (.NET 8)
- **Frontend:** React + TypeScript (Vite)
- **Database:** SQL Server
- **Authentication:** JWT + BCrypt

---


## 🚀 How to Run the Project

### 1️⃣ Open the Project

Open the solution file:

```
TeamWorkload.sln
```

### 2️⃣ Run Backend

- Open the project in Visual Studio
- Right-click `TeamWorkload.API`
- Click **Set as Startup Project**
- Click the **green Run button**

Backend will run on:

```
http://localhost:5148
```

Swagger UI:

```
http://localhost:5148/swagger
```

---

### 3️⃣ Run Frontend

Open terminal inside frontend folder:

```bash
cd frontend
npm install
npm run dev
```

Frontend will run at:

```
http://localhost:5173
```

---

## 🗄️ Database Setup

The database is automatically created and seeded when the backend runs.

If needed manually:

```bash
dotnet ef database update
```

---

## 👤 Default Users

### 🔐 Admin
- Email: admin@teamworkload.local  
- Password: Admin123!

### 👨‍💼 Team Leader
- Email: leader@teamworkload.local  
- Password: Leader123!

### 👥 Members
- ali@teamworkload.local / Member123!  
- maya@teamworkload.local / Member123!  
- omar@teamworkload.local / Member123!

---

https://github.com/bilalbaddah0/Team-Workload-Project
