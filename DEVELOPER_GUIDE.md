# Developer Guide: Running LifeLine on Fedora (MySQL Edition)

This guide explains how to manage your MySQL server and run the application.

## 1. Managing MySQL on Fedora

On Fedora, the service is named `mysqld`. You can start it only when you need it and keep it disabled from starting automatically on reboot.

### Start the Server (Run this when you start developing)
```bash
sudo systemctl start mysqld
```

### Stop the Server (Run this when you are finished)
```bash
sudo systemctl stop mysqld
```

### Ensure it DOES NOT start on reboot
To make sure MySQL stays off when you restart your PC, run this once:
```bash
sudo systemctl disable mysqld
```

### Check if it's running
```bash
systemctl status mysqld
```

---

## 2. Database Setup (First Time Only)

1.  **Start the server** (see Step 1).
2.  **Log in to MySQL** as root:
    ```bash
    sudo mysql -u root
    ```
3.  **Create the database** for the project:
    ```sql
    CREATE DATABASE lifeline_db;
    EXIT;
    ```

---

## 3. Connecting via DBeaver

1.  **Start the MySQL service** (`sudo systemctl start mysqld`).
2.  Open **DBeaver**.
3.  Click **New Database Connection** (Plug icon).
4.  Select **MySQL**.
5.  **Settings:**
    *   **Server Host:** `localhost`
    *   **Port:** `3306`
    *   **Database:** `lifeline_db`
    *   **Username:** `root`
    *   **Password:** (The password you set for MySQL root, or leave empty if none).
6.  Click **Test Connection** (it may ask to download drivers, click Yes).

---

## 4. How to Run the Application

### Backend (Spring Boot)
1.  Open a terminal in `LifeLine_Project/lifeline-backend`.
2.  Run:
    ```bash
    ./mvnw spring-boot:run
    ```
    *   **URL:** `http://localhost:8080`

### Frontend (React + Vite)
1.  Open a terminal in `LifeLine_Project/lifeline-frontend`.
2.  Install dependencies (first time only): `npm install`.
3.  Run:
    ```bash
    npm run dev
    ```
    *   **URL:** `http://localhost:5173`

---

## 5. Local Host URLs & Credentials
| Component | URL |
| :--- | :--- |
| **Frontend (UI)** | [http://localhost:5173](http://localhost:5173) |
| **Backend (API)** | [http://localhost:8080](http://localhost:8080) |
| **Database** | `localhost:3306` |

**Admin Credentials:**
*   **Email:** `admin@lifeline.com`
*   **Password:** `admin123`
