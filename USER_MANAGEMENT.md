# User Management & Authentication System

This document outlines the user management and authentication system for the PonyClub Event Manager application.

## Overview

The system provides role-based access control with three user types:
- **Standard User**: Access to their own Pony Club only
- **Zone Representative**: Access to all clubs in their zone + zone admin functions  
- **Super User**: Full access to all clubs, zones, and admin functions

## Components

### 1. User Model (`src/lib/types.ts`)

The `User` interface includes:
- `ponyClubId`: Unique identifier (e.g., PC123456)
- `mobileNumber`: Australian mobile number (normalized to +61 format)
- `role`: 'standard' | 'zone_rep' | 'super_user'
- `clubId` & `zoneId`: Associated club and zone
- Personal information (firstName, lastName, email)
- Audit fields (createdAt, updatedAt, lastLoginAt, isActive)

### 2. Validation (`src/lib/user-validation.ts`)

Comprehensive validation using Zod schemas:
- **Pony Club ID**: Format validation (PC123456 pattern)
- **Mobile Number**: Australian format validation with normalization
- **Role Mapping**: Flexible role name conversion for imports
- **Email**: Standard email validation
- **Batch Validation**: Process multiple rows with detailed error reporting

### 3. Database Service (`src/lib/user-service.ts`)

Core CRUD operations and business logic:
- `getUserByCredentials()`: Authentication lookup
- `createUser()`, `updateUser()`, `deleteUser()`: User management
- `importUsers()`: Bulk import from spreadsheet data
- `ponyClubIdExists()`: Duplicate checking
- Club/Zone resolution for imports

### 4. Spreadsheet Parser (`src/lib/spreadsheet-parser.ts`)

Excel/CSV import functionality:
- Supports .xlsx, .xls, and .csv formats
- Flexible header mapping (case-insensitive)
- Template generation for standardized imports
- Detailed error reporting for failed rows

## API Endpoints

### Authentication (`/api/auth`)

#### POST - Login
```typescript
// Request
{
  "ponyClubId": "PC123456",
  "mobileNumber": "+61412345678"
}

// Response
{
  "success": true,
  "user": { /* user object */ },
  "token": "jwt_token_here"
}
```

#### GET - Verify Token
```typescript
// Headers: Authorization: Bearer <token>
// Response
{
  "success": true,
  "user": { /* user object */ },
  "tokenPayload": { /* jwt payload */ }
}
```

### User Management (`/api/admin/users`)

#### GET - List Users
Query parameters: `clubId`, `zoneId`, `role`, `isActive`, `limit`

#### POST - Create User
#### PUT - Update User (requires `?id=userId`)
#### DELETE - Soft Delete User (requires `?id=userId`)

### User Import (`/api/admin/users/import`)

#### POST - Import Users
- Upload Excel/CSV file via FormData
- Returns detailed import results with success/failure counts

#### GET - Download Template
- Returns CSV template with correct headers

## User Interface

### Login Page (`/app/login/page.tsx`)
- Simple form with Pony Club ID and mobile number
- Role-based redirection after successful login
- JWT token storage in localStorage

### User Management (`/app/admin/users/page.tsx`)
- Tabbed interface for viewing users and importing
- User table with role badges and status indicators
- File upload for bulk import
- Template download functionality
- Real-time import progress and error reporting

## Usage Examples

### 1. User Import Spreadsheet Format

Required columns:
```csv
Pony Club ID,Mobile Number,Club Name,Zone Name,Role,First Name,Last Name,Email
PC123456,0412345678,Sample Pony Club,Sample Zone,Standard,John,Smith,john@example.com
PC789012,0498765432,Another Club,Sample Zone,Zone Rep,Jane,Doe,jane@example.com
```

### 2. Authentication Flow

```typescript
// Login
const response = await fetch('/api/auth', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ponyClubId: 'PC123456',
    mobileNumber: '0412345678'
  })
});

// Use token for authenticated requests
const token = response.data.token;
const userResponse = await fetch('/api/admin/users', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### 3. Programmatic User Creation

```typescript
const newUser = await UserService.createUser({
  ponyClubId: 'PC123456',
  mobileNumber: '+61412345678',
  role: 'standard',
  clubId: 'club-id-here',
  zoneId: 'zone-id-here',
  firstName: 'John',
  lastName: 'Smith',
  email: 'john@example.com',
  isActive: true
});
```

## Security Features

1. **Input Validation**: All user input validated using Zod schemas
2. **JWT Authentication**: Secure token-based authentication
3. **Role-Based Access**: Users can only access appropriate resources
4. **Soft Deletes**: Users are deactivated rather than permanently deleted
5. **Audit Trail**: Creation, update, and login timestamps tracked
6. **Duplicate Prevention**: Pony Club ID uniqueness enforced

## Error Handling

The system provides comprehensive error handling:
- **Validation Errors**: Field-specific error messages
- **Import Errors**: Row-by-row error reporting with details
- **Database Errors**: Graceful fallbacks with user-friendly messages
- **Authentication Errors**: Clear feedback on invalid credentials

## Future Enhancements

Planned improvements:
1. **2FA Support**: SMS or email-based two-factor authentication
2. **Password Option**: Optional password-based login
3. **Session Management**: Advanced session handling and refresh tokens
4. **External API Sync**: Integration with external Pony Club systems
5. **Advanced Permissions**: Granular permissions beyond role-based access
6. **User Self-Service**: Profile updates and password resets
7. **Audit Logging**: Comprehensive activity logging
8. **Rate Limiting**: API rate limiting for security

## Environment Variables

Add to `.env.local`:
```bash
JWT_SECRET=your-super-secret-jwt-key-change-in-production-make-it-long-and-random
```

## Database Collections

The system uses these Firestore collections:
- `users`: User accounts and profiles
- `clubs`: Club information (existing)
- `zones`: Zone information (existing)

## Getting Started

1. **Set up authentication**: Add JWT_SECRET to environment variables
2. **Create initial users**: Use the admin interface at `/admin/users`
3. **Import bulk users**: Upload a CSV/Excel file with user data
4. **Test login**: Use the login page at `/login`
5. **Verify access**: Check role-based redirection works correctly

The system is designed to be modular and extensible, making it easy to add new features and integrate with external systems as requirements evolve.
