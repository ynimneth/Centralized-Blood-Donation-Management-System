# LifeLine

LifeLine is a full-stack blood donation and blood bank management platform built to connect donors, hospitals, laboratory staff, and administrators in a single centralized system. The project helps digitize the blood donation workflow from donor registration and appointment booking to blood stock monitoring, emergency response, hospital request handling, and lab-based safety validation.

## Project Overview

Managing blood donations across multiple stakeholders can be slow, manual, and difficult to coordinate during urgent situations. LifeLine addresses this by providing a web-based platform that improves visibility, reduces delays, and supports better decision-making around blood collection, storage, and distribution.

The platform is designed to:

- streamline donor registration and appointment scheduling
- maintain real-time blood inventory records
- support emergency blood request workflows
- allow hospitals to submit and track blood requests
- record donor health history and eligibility information
- help admin and lab staff manage testing, dispatching, and operational activities

## Key Features

### Donor Features

- donor registration and secure session-based login
- donor dashboard with personalized access
- appointment booking and appointment history
- blood camp discovery and participation
- donor eligibility and health questionnaire handling
- emergency alert visibility

### Admin and Staff Features

- centralized dashboard for operational management
- blood inventory monitoring by blood group and status
- credential and user management
- activity logging for important actions
- lab workflow support for blood safety and test results
- transport and dispatch-related management flows

### Hospital Features

- hospital account support
- hospital blood request submission
- request tracking and dispatch updates
- emergency blood request coordination

### Public and Awareness Features

- public information pages
- service and awareness sections for blood donors
- chatbot integration for user assistance

## Tech Stack

### Frontend

- React 18
- Vite
- React Router
- Axios
- CSS

### Backend

- Java 21
- Spring Boot 3
- Spring Web
- Spring Data JPA
- Hibernate
- Lombok

### Database

- MySQL

### Testing and Tooling

- Vitest
- Testing Library
- ESLint
- Maven

## System Architecture

```text
Donors / Hospitals / Admin / Lab Staff
                |
                v
        React + Vite Frontend
                |
        REST API over HTTP/JSON
                |
                v
      Spring Boot Backend Services
                |
                v
         MySQL Relational Database
```

## Core Modules

- Authentication and registration
- Donor management
- Appointment scheduling
- Blood camp management
- Inventory and stock control
- Emergency request management
- Hospital blood request processing
- Health history and eligibility evaluation
- Laboratory and test result management
- Activity and credential management

## Project Structure

```text
LifeLine_Project/
|-- lifeline-backend/     # Spring Boot REST API and business logic
|-- lifeline-frontend/    # React + Vite user interface
|-- README.md
`-- DEVELOPER_GUIDE.md
```

## Backend Structure

Important backend packages inside `lifeline-backend/src/main/java/com/lifeline`:

- `controller` - REST API endpoints
- `service` - business logic and workflow handling
- `repository` - database access with Spring Data JPA
- `model` - entity definitions
- `dto` - request and response transfer objects
- `config` - CORS, data loading, and migration helpers

## Frontend Structure

Important frontend areas inside `lifeline-frontend/src`:

- `pages` - main application screens
- `components` - reusable UI components
- `context` - authentication state management
- `services` - API integration
- `constants` - shared configuration and static data
- `assets` - images and UI media

## Main User Roles

- `DONOR` - registers, logs in, views dashboard, books appointments, and interacts with donor services
- `ADMIN` - manages operations, inventory, hospitals, credentials, and broader workflows
- `LAB` - supports testing and blood issue workflows
- `HOSPITAL` - submits hospital blood requests and participates in emergency workflows

## Default Demo Credentials

The backend seeds initial demo data on first run through `DataLoader`.

| Role | NIC No | Password |
|------|--------|----------|
| Admin | `900000000V` | `admin123` |
| Hospital | `900000001V` | `hospital123` |
| Lab | `900000002V` | `lab123` |
| Donor | `901234567V` | `pass123` |

## Prerequisites

Before running the project, make sure you have:

- Java JDK 21 or later
- Node.js 16 or later
- npm
- MySQL Server running locally
- IntelliJ IDEA or another Java IDE for the backend

## Installation and Setup

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd LifeLine_Project
```

### 2. Configure the Database

Create a MySQL database named `lifeline_db`:

```sql
CREATE DATABASE lifeline_db;
```

Update the backend database configuration in `lifeline-backend/src/main/resources/application.properties` if needed:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/lifeline_db?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=your_mysql_password
```

Note: the current local configuration file contains a machine-specific password value. Replace it with your own local MySQL password before running the project on another machine.

### 3. Run the Backend

From IntelliJ:

1. Open the `lifeline-backend` Maven project.
2. Locate `LifeLineApplication.java`.
3. Run the Spring Boot application.

Or from the terminal:

```bash
cd lifeline-backend
mvn spring-boot:run
```

The backend runs by default at:

```text
http://localhost:8080
```

### 4. Run the Frontend

```bash
cd lifeline-frontend
npm install
npm run dev
```

The frontend runs by default at:

```text
http://localhost:5173
```

## Frontend Routes

Some main routes available in the application:

- `/` - public landing/details page
- `/login` - login
- `/register` - donor registration
- `/dashboard` - protected dashboard
- `/donors` - donor dashboard
- `/appointments` - appointment list
- `/appointments/book` - book appointment
- `/camps` - blood camp page
- `/inventory` - admin/lab inventory dashboard
- `/lab` - admin/lab dashboard
- `/emergency` - admin/hospital emergency requests
- `/hospitals` - admin hospital management
- `/credentials` - admin credential management

## API Overview

The backend exposes REST endpoints under `/api`.

Examples of available modules:

- `/api/auth` - login, register, logout, current session
- `/api/appointments` - appointment operations
- `/api/donors` - donor data management
- `/api/inventory` - blood stock handling
- `/api/emergency` - emergency requests
- `/api/hospital-requests` - hospital blood request workflows
- `/api/hospitals` - hospital data
- `/api/camps` - blood donation camps
- `/api/activity` - activity logs

## Seeded Data

On initial startup, the backend seeds:

- default users for admin, hospital, lab, and donors
- baseline inventory for all major blood groups
- sample camps
- sample hospitals

This makes the project easier to test and demonstrate without manual data entry.

## Development Notes

- frontend API requests use `http://localhost:8080` as the base URL
- CORS is configured for `http://localhost:5173`
- authentication is session-based
- database schema updates are handled with JPA `ddl-auto=update`

## Available Scripts

### Frontend

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run test
```

### Backend

```bash
mvn spring-boot:run
mvn test
```

## Troubleshooting

### Database Connection Issues

- make sure MySQL is running
- confirm the username and password in `application.properties`
- verify that the `lifeline_db` database exists

### CORS Errors

- access the frontend through `http://localhost:5173`
- make sure the backend is running on `http://localhost:8080`

### Port Conflicts

- stop any service already using port `8080` or `5173`
- update the port configuration if necessary

### Login Problems

- use one of the seeded NIC/password combinations listed above
- ensure the backend has started successfully and seeded data on first launch

## Future Improvements

- password hashing and stronger authentication security
- role-based authorization hardening
- deployment configuration for production environments
- notifications for emergency blood shortages
- analytics and reporting dashboards
- integration with maps, messaging, or hospital systems

## Project Summary

LifeLine is a modern healthcare-oriented web application that improves coordination across blood donation operations by centralizing donor management, hospital requests, blood inventory, emergency workflows, and lab processes in one platform. It demonstrates full-stack development using React, Spring Boot, and MySQL while solving a meaningful real-world healthcare logistics problem.
