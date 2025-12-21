# Team DAB

## Members:

- Emilija Marija Dailydžionytė
- Ramunė Riaubaitė
- Jurgita Skersytė
- Benas Gross
- Matas Andraitis

---

## Order Management System (Documented by Žalia Žolė Žydi Developed by DAB)

### Overview
A modular order and reservation management system for small and medium businesses in catering and beauty sectors.  
This project is built with **ASP.NET Core (C#)** for the backend and **Vite + TypeScript** for the frontend.

#### 1. Prerequisites
- [.NET 8 SDK](https://dotnet.microsoft.com/download)
- [Node.js (v18+)](https://nodejs.org/)
- [PostgreSQL](https://www.postgresql.org/)

#### 2. Database Setup
1. Start PostgreSQL locally and create a database named `oms`.
2. Check the connection string in backend/appsettings.json:
```json
"ConnectionStrings": {
  "DefaultConnection": "Host=localhost;Port=5432;Database=oms;Username=postgres;Password=postgres"
}
```
2. Apply migrations and seed data:
```bash
cd backend
dotnet ef database update
dotnet run
```
The backend will automatically create a test user:
- Email: test@temp.com
- Password: test123

#### 3. Backend Setup
```bash
cd backend
dotnet restore
dotnet run
```
The API will run at http://localhost:7035
 by default.
Swagger is available at: http://localhost:7035/swagger

#### 4. Frontend Setup
Run the frontend:
```bash
cd frontend
npm install
npm run dev
```
The app runs at http://localhost:5173
 by default.

#### 5. Debug
- 1 Merchant (Test Merchant)
- 1 Employee user linked to that Merchant (test@temp.com/ test123)
- 1 Product (Test Product)
- 1 Service (Test Service)
- Each item is only inserted if it does not already exist, so running the seeder multiple times is safe.
- /debug is temporary and will be removed once real pages (Product List, Service List, Employee List) are implemented.
- No production impact — this only runs in the dev environment.

---

## Access to project-related documents:

### Team Agreement

https://docs.google.com/document/d/1y9MGumKtNmUBonl7jRDzTfgCaIwaRQizRJxI4M2puZw/edit?fbclid=IwY2xjawM6CglleHRuA2FlbQIxMQABHm7GT6E2WpwJK9TmhrJtM-GpMJ5Ib2WMxMV8tvwdCdgs41wPtmGI0c6GmOtl_aem__EfP_R1GMkN0LWCE6USxIA&tab=t.0


### Changes we made during the development
Here is a link to a Google Drive file that documents main changes we made during the development of this project, including the evaluation of the documentation we received.
https://docs.google.com/document/d/1dC7oYD014BluLbxDHf-FF2NaTevsqTgHll7BtvEuFE0/edit?usp=sharing