# LifeLine: Centralized Blood Donation & Management System

<<<<<<< HEAD
=======
## System Architecture

```text
       +----------+          +----------+          +----------+
       |  Admin   |          |  Donor   |          | Hospital |
       +----+-----+          +----+-----+          +----+-----+
            |                     |                     |
            +----------+----------+----------+----------+
                       | Uses Web App
                       v
            +----------------------------+
            |   Frontend - React 18      |
            |   + Vite + Axios           |
            +-------------+--------------+
                          |
                          | HTTP REST API / JSON
                          v
            +----------------------------+
            |   Backend - Spring Boot    |
            |   (Java 21 + Hibernate)    |
            +-------------+--------------+
                          |
      +---------+---------+---------+---------+---------+
      |         |         |         |         |         |
      v         v         v         v         v         v
+-----+---+ +---+-----+ +---+-----+ +---+-----+ +---+-----+ +---+-----+
|  User   | |Inventory| |Emergency| | Appoint | | Health  | |  Test   |
| Module  | | Module  | | Request | |  ment   | | History | | Results |
+-----+---+ +---+-----+ +---+-----+ +---+-----+ +---+-----+ +---+-----+
      |         |         |         |         |         |
      +---------+---------+----+----+---------+---------+
                               |
                               v
                  +----------------------------+
                  |    Spring Data JPA         |
                  +-------------+--------------+
                               |
                               v
                  +----------------------------+
                  |      MySQL Database        |
                  |     (lifeline_db)          |
                  +----------------------------+
```

>>>>>>> imasha
This guide outlines how to set up and run the LifeLine project using **IntelliJ IDEA**.

## Prerequisites

Ensure you have the following installed:
- **Java Development Kit (JDK) 21** (or at least 17)
- **Node.js** (v16 or higher)
- **MySQL Server** (Running on localhost:3306)

---

## Step 1: Clone & Open in IntelliJ

1.  Open IntelliJ IDEA.
2.  Select **Open** or **File > Open**.
3.  Navigate to the `LifeLine_Project` folder and click **OK**.
4.  IntelliJ should detect the Maven project (`lifeline-backend`) automatically.
    - If prompted "Maven build scripts found", click **Load Maven Project**.

---

## Step 2: Database Setup

1.  Open your MySQL Client (Workbench, Command Line, or IntelliJ Database Tool).
2.  Create the database:
    ```sql
    CREATE DATABASE lifeline_db;
    ```
3.  Verify the configuration in `lifeline-backend/src/main/resources/application.properties`:
    ```properties
    spring.datasource.url=jdbc:mysql://localhost:3306/lifeline_db
    spring.datasource.username=root
    spring.datasource.password=  <-- Set your MySQL password here if you have one
    ```

---

## Step 3: Run the Backend (Spring Boot)

1.  In IntelliJ Project View, navigate to:
    `lifeline-backend > src > main > java > com > lifeline > LifeLineApplication`
2.  Right-click on `LifeLineApplication.java`.
3.  Select **Run 'LifeLineApplication'**.
4.  Wait for the console to show:
    `Started LifeLineApplication in ... seconds`

> **Note:** On the first run, the `DataLoader` will automatically populate the database with dummy data (Admin user, donors, inventory).

---

## Step 4: Run the Frontend (React)

1.  Open the **Terminal** tab in IntelliJ (usually at the bottom).
2.  Navigate to the frontend directory:
    ```bash
    cd lifeline-frontend
    ```
3.  Install dependencies (first time only):
    ```bash
    npm install
    ```
4.  Start the development server:
    ```bash
    npm run dev
    ```
5.  You should see output like:
    `➜  Local:   http://localhost:5173/`

---

## Step 5: Access the Application

1.  Open your browser and go to: **[http://localhost:5173](http://localhost:5173)**
2.  **Login Credentials** (Seed Data):
    *   **Admin/Staff**: `admin@lifeline.com` / `admin123`
    *   **Donor**: `john@example.com` / `pass123`

### Key URLs
- **Donor Dashboard**: `/dashboard` (Use Donor login)
- **Inventory/Admin Dashboard**: `/inventory` (Use Admin login or just navigate directly per demo config)
- **API Documentation (Mock)**: The backend runs at `http://localhost:8080`.

---

## Project Structure

- **lifeline-backend**: Java Spring Boot API (Business Logic, Database).
- **lifeline-frontend**: React + Vite UI (User Interface).

## Troubleshooting

- **CORS Errors?**
    - The backend is configured to allow `http://localhost:5173`. Ensure you are accessing the frontend via this exact URL.
- **Database Connection Failed?**
    - Ensure MySQL is running and the credentials in `application.properties` match your local setup.
- **Port 8080 Already in Use?**
    - Stop any other process using port 8080 or change `server.port` in `application.properties`.
