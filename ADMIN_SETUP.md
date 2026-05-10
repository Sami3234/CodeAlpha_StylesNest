# Admin Panel Setup Guide

## Initial Setup

### 1. Initialize Database Tables

First, make sure the database tables are initialized (including the new admin table):

```bash
# Start your development server
npm run dev

# In another terminal, initialize the database
curl http://localhost:3000/api/init-db
```

### 2. Create Admin Account

After initializing the database, create your first admin account:

```bash
curl -X POST http://localhost:3000/api/admin/setup \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"yourpassword123"}'
```

**Note:** 
- Password must be at least 6 characters long
- This endpoint can only be called once (when no admin exists)
- After creating the admin account, use the login page to sign in

### 3. Access Admin Panel

1. Navigate to `/admin/login` in your browser
2. Enter your email and password
3. You'll be redirected to the admin dashboard

## Features

### Login Page
- Located at `/admin/login`
- Email and password authentication
- No signup functionality (admin account must be created via API)

### Profile Page
- Access via sidebar → Profile tab
- View current email
- Update email address
- Change password (requires current password)
- Logout functionality

### Protected Routes
- All admin routes (`/admin/*`) are protected
- Unauthenticated users are redirected to `/admin/login`
- Session is stored in HTTP-only cookies

## API Endpoints

### POST `/api/admin/setup`
Create initial admin account (only works if no admin exists)

### POST `/api/admin/login`
Login and create session

### GET `/api/admin/auth`
Check authentication status

### POST `/api/admin/logout`
Logout and clear session

### GET `/api/admin/profile`
Get admin profile information

### PUT `/api/admin/profile`
Update admin profile (email and/or password)

## Security Notes

- Passwords are hashed using SHA-256 (consider upgrading to bcrypt for production)
- Sessions are stored in HTTP-only cookies
- Admin routes are protected by authentication middleware
- Only one admin account can exist (can be extended for multiple admins)
