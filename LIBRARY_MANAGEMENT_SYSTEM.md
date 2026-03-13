# Library Management System Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Database Design](#database-design)
4. [Application Architecture](#application-architecture)
5. [Features and Functionality](#features-and-functionality)
6. [Security Implementation](#security-implementation)
7. [User Roles and Permissions](#user-roles-and-permissions)
8. [API Endpoints](#api-endpoints)
9. [Deployment Guide](#deployment-guide)

## System Overview

The Library Management System is a comprehensive solution designed to manage multiple libraries across different institutions. It provides a robust platform for book management, user administration, and library operations with multi-tenant support and role-based access control.

### Key Features
- Multi-institution support
- Role-based access control
- Book management system
- User management
- Fine calculation and management
- Reservation system
- Reporting and analytics

## Technology Stack

### Frontend
- **Framework**: React with TypeScript
- **UI Library**: Tailwind CSS
- **State Management**: React Query
- **Routing**: React Router
- **Component Library**: Custom UI components
- **Notifications**: Toast notifications

### Backend
- **Database**: PostgreSQL
- **Backend Service**: Supabase
- **Authentication**: Supabase Auth
- **API**: RESTful API

## Database Design

### Core Tables

#### 1. Institutions Table
```sql
CREATE TABLE institutions (
    id UUID PRIMARY KEY,
    name VARCHAR(255),
    address TEXT,
    admin_name VARCHAR(255),
    admin_email VARCHAR(255),
    admin_password VARCHAR(255),
    contact_phone VARCHAR(50),
    reserve_duration_days INTEGER,
    loan_duration_days INTEGER,
    late_fine_per_day DECIMAL(10,2),
    organization_structure JSONB,
    rules TEXT,
    open_time VARCHAR(5),
    close_time VARCHAR(5),
    off_days TEXT[],
    created_at TIMESTAMP WITH TIME ZONE,
    created_by UUID
)
```

#### 2. Roles and Permissions
```sql
CREATE TABLE roles (
    id UUID PRIMARY KEY,
    name VARCHAR(255),
    access_level INTEGER,
    description TEXT,
    institution_id UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    created_by UUID
)

CREATE TABLE permissions (
    id UUID PRIMARY KEY,
    name VARCHAR(255),
    description TEXT,
    access_level INTEGER,
    created_at TIMESTAMP WITH TIME ZONE
)

CREATE TABLE role_permissions (
    role_id UUID,
    permission_id UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    created_by UUID,
    PRIMARY KEY (role_id, permission_id)
)
```

## Application Architecture

### Directory Structure
```
src/
├── app/           # Core application logic
├── components/    # Reusable UI components
├── contexts/      # React contexts
├── db/           # Database related code
├── hooks/        # Custom React hooks
├── integrations/ # Third-party integrations
├── lib/          # Utility functions
├── pages/        # Page components
└── main.tsx      # Application entry point
```

### Core Components

#### Authentication Components
- `AuthContext`: Manages authentication state
- `ProtectedRoute`: Route protection wrapper
- `LibrarianRoute`: Librarian-specific route protection
- `AdminRoute`: Admin-specific route protection
- `SuperAdminRoute`: Super admin route protection

#### UI Components
- Toast notifications
- Tooltips
- Form components
- Data tables
- Navigation components

## Features and Functionality

### 1. Authentication System
- User registration and login
- Password reset functionality
- Session management
- Role-based access control

### 2. Book Management
- Book cataloging
- Book search and filtering
- Book borrowing system
- Return management
- Fine calculation
- Reservation system

### 3. User Management
- User registration
- Role assignment
- Profile management
- User activity tracking

### 4. Institution Management
- Institution creation and configuration
- Library management
- User management
- Settings configuration

### 5. Reporting System
- Borrowing statistics
- Fine collection reports
- User activity reports
- Library usage analytics

## Security Implementation

### 1. Row Level Security (RLS)
- Institution-level data isolation
- Role-based access control
- Permission-based authorization

### 2. Authentication Security
- Secure password handling
- Session management
- Token-based authentication

### 3. Data Protection
- Data encryption
- Secure API endpoints
- Input validation

## User Roles and Permissions

### Access Levels
1. **SUPER_ADMIN (Level 1)**
   - Full system access
   - Institution management
   - System configuration

2. **INSTITUTION_ADMIN (Level 2)**
   - Institution management
   - Library management
   - User management

3. **LIBRARY_MANAGER (Level 3)**
   - Library operations
   - Book management
   - User management

4. **USER (Level 4)**
   - Book borrowing
   - Reservation
   - Profile management

### Default Limits per Role
- **SUPER_ADMIN**
  - Max books: 10
  - Max days: 30
  - Max reservations: 5

- **INSTITUTION_ADMIN**
  - Max books: 8
  - Max days: 21
  - Max reservations: 4

- **LIBRARY_MANAGER**
  - Max books: 6
  - Max days: 14
  - Max reservations: 3

- **USER**
  - Max books: 3
  - Max days: 7
  - Max reservations: 2

## API Endpoints

### Authentication
- POST /auth/login
- POST /auth/register
- POST /auth/reset-password
- POST /auth/logout

### Books
- GET /books
- POST /books
- PUT /books/:id
- DELETE /books/:id
- POST /books/:id/borrow
- POST /books/:id/return
- POST /books/:id/reserve

### Users
- GET /users
- POST /users
- PUT /users/:id
- DELETE /users/:id
- GET /users/:id/borrowed-books
- GET /users/:id/fines

### Institutions
- GET /institutions
- POST /institutions
- PUT /institutions/:id
- DELETE /institutions/:id

## Deployment Guide

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- Supabase account

### Installation Steps
1. Clone the repository
2. Install dependencies
3. Configure environment variables
4. Set up database
5. Run migrations
6. Start the application

### Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=your_api_url
```

### Database Setup
1. Create database
2. Run SQL migrations
3. Configure RLS policies
4. Set up initial roles and permissions

### Deployment
1. Build the application
2. Configure production environment
3. Deploy to hosting platform
4. Set up SSL certificates
5. Configure domain

## Maintenance and Support

### Regular Maintenance
- Database backups
- Security updates
- Performance monitoring
- Error logging

### Support
- User documentation
- Admin documentation
- Technical support
- Bug reporting system

## Future Enhancements

### Planned Features
1. Mobile application
2. Advanced analytics
3. Integration with external systems
4. Enhanced reporting capabilities
5. Automated notifications

### Scalability
- Horizontal scaling
- Load balancing
- Caching implementation
- Database optimization

---

This documentation provides a comprehensive overview of the Library Management System. For specific implementation details or additional information, please refer to the respective sections or contact the development team. 