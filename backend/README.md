# CivicLens Backend API

Node.js + Express + MongoDB backend for the CivicLens platform.

## 🚀 Features

- **RESTful API** with Express.js
- **MongoDB Atlas** database integration
- **JWT Authentication** with bcrypt password hashing
- **File Upload** support for images (Multer)
- **Geospatial Queries** for finding nearby complaints
- **Role-Based Access Control** (Citizen, Admin, Worker)
- **Input Validation** with express-validator
- **CORS** enabled for frontend integration

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB Atlas account (or local MongoDB)
- npm or yarn

## 🛠️ Installation

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (copy from `.env.example`):
```bash
# Copy example env file
copy .env.example .env
```

4. Update `.env` with your MongoDB Atlas connection string:
```
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/civiclens?retryWrites=true&w=majority
```

## 🔐 MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account / Sign in
3. Create a new cluster (Free M0 tier)
4. Create a database user:
   - Database Access → Add New Database User
   - Username: `civiclens_admin`
   - Password: (generate secure password)
   - Database User Privileges: Read and write to any database

5. Whitelist your IP:
   - Network Access → Add IP Address
   - Allow Access from Anywhere: `0.0.0.0/0` (for development)

6. Get connection string:
   - Clusters → Connect → Connect your application
   - Copy connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `civiclens`

7. Update `.env` with your connection string

## 🚀 Running the Server

### Development Mode (with auto-reload):
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

The server will start on `http://localhost:5000`

## 📚 API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| GET | `/api/auth/me` | Get current user | Yes |

### Complaints (`/api/complaints`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/complaints` | Get all complaints (with filters) | No |
| GET | `/api/complaints/:id` | Get single complaint | No |
| POST | `/api/complaints` | Create new complaint | Yes |
| POST | `/api/complaints/:id/upvote` | Upvote complaint | Yes |
| GET | `/api/complaints/search/nearby` | Get nearby complaints | No |

### Users (`/api/users`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/users/profile` | Get user profile | Yes |
| PUT | `/api/users/profile` | Update user profile | Yes |
| GET | `/api/users/complaints` | Get user's complaints | Yes |

### Admin (`/api/admin`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| PUT | `/api/admin/complaints/:id/status` | Update complaint status | Admin/Worker |
| PUT | `/api/admin/complaints/:id/assign` | Assign complaint | Admin |
| POST | `/api/admin/complaints/:id/after-images` | Upload resolution images | Admin/Worker |
| GET | `/api/admin/complaints/priority-queue` | Get priority queue | Admin |
| GET | `/api/admin/users` | Get all users | Admin |

### Statistics (`/api/stats`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/stats/overview` | Get general statistics | No |
| GET | `/api/stats/by-category` | Get stats by category | No |
| GET | `/api/stats/by-status` | Get stats by status | No |
| GET | `/api/stats/trends` | Get complaint trends | No |

## 📝 API Usage Examples

### Register User
```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+91 9876543210",
  "address": "Delhi"
}
```

### Login
```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### Create Complaint (with file upload)
```bash
POST http://localhost:5000/api/complaints
Authorization: Bearer <your_jwt_token>
Content-Type: multipart/form-data

{
  "title": "Pothole on Main Road",
  "description": "Large pothole causing accidents",
  "category": "Potholes",
  "location": {
    "coordinates": [77.2090, 28.6139],
    "address": "Main Road, New Delhi"
  },
  "severity": "High",
  "images": [file]
}
```

### Get Nearby Complaints
```bash
GET http://localhost:5000/api/complaints/search/nearby?lat=28.6139&lng=77.2090&maxDistance=5000
```

## 🔑 Authentication

The API uses JWT (JSON Web Tokens) for authentication.

1. Register or login to get a token
2. Include token in Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## 📊 Database Models

### User Model
- name, email, password (hashed)
- phone, address
- role (citizen/admin/worker)
- department, designation
- complaintsReported, complaintsResolved

### Complaint Model
- complaintId (auto-generated)
- title, description, category
- location (GeoJSON Point with coordinates)
- images[], afterImages[]
- severity, priority (auto-calculated)
- status (Submitted → Under Review → Assigned → In Progress → Resolved)
- reportedBy (User reference)
- assignedTo (department, worker)
- duplicates, upvotes
- nearSchool, nearHospital flags
- aiAnalysis (optional)
- updates[] (status history)

## 🌍 Geospatial Features

The API supports geospatial queries using MongoDB's 2dsphere index:

- Find complaints within a radius
- Store precise GPS coordinates
- Efficient location-based searches

## 🔒 Security Features

- Password hashing with bcrypt
- JWT token authentication
- Input validation and sanitization
- CORS protection
- File upload restrictions (type and size)
- Role-based access control

## 📁 Project Structure

```
backend/
├── models/
│   ├── User.js
│   └── Complaint.js
├── routes/
│   ├── auth.js
│   ├── users.js
│   ├── complaints.js
│   ├── admin.js
│   └── stats.js
├── middleware/
│   ├── auth.js
│   └── upload.js
├── uploads/           # Uploaded files
├── .env               # Environment variables
├── .env.example       # Example env file
├── server.js          # Entry point
└── package.json
```

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Check your connection string in `.env`
- Verify network access in MongoDB Atlas
- Ensure database user credentials are correct

### CORS Errors
- Update `FRONTEND_URL` in `.env` to match your frontend URL

### File Upload Issues
- Check `uploads/` directory exists and has write permissions
- Verify file size is under 5MB
- Only image files (jpeg, jpg, png, gif) are allowed

## 🚀 Deployment

### Deploy to Heroku:
```bash
# Install Heroku CLI
heroku login
heroku create civiclens-api
git push heroku main
```

### Environment Variables for Production:
```
NODE_ENV=production
MONGODB_URI=<production_mongodb_uri>
JWT_SECRET=<strong_random_secret>
FRONTEND_URL=<production_frontend_url>
```

## 📄 License

ISC

## 🤝 Contributing

This is a hackathon project. Contributions welcome!
