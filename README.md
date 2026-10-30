# CivicLens - AI-Powered Smart Civic Issue Management Platform

A modern, professional civic issue reporting and management platform for Indian cities.

## 🎯 Project Overview

CivicLens is a comprehensive platform that enables citizens to report civic issues and allows municipal authorities to manage and resolve them efficiently. The platform features AI-powered issue detection, smart priority scoring, and real-time tracking.

## ✨ Key Features

### For Citizens:
- **Easy Issue Reporting**: Multi-step form with image upload and AI analysis
- **Real-time Tracking**: Monitor complaint status with pizza-tracker style progress
- **Interactive Map**: Explore civic issues in your area
- **Smart Notifications**: Get updates on your complaints
- **Duplicate Detection**: System automatically merges similar reports

### For Municipal Authorities:
- **Centralized Dashboard**: Overview of all complaints and statistics
- **Priority Queue**: AI-powered prioritization based on severity, location, and impact
- **Department Management**: Assign issues to relevant departments
- **Analytics**: Insights on resolution times, hotspots, and performance
- **Worker Management**: Track team performance and assignments

### AI-Powered Features (Demo):
- Automatic issue classification from images
- Severity prediction
- Duplicate complaint detection
- Smart priority scoring
- Hotspot identification

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📂 Project Structure

```
civiclens/
├── src/
│   ├── components/          # Reusable components
│   │   └── Sidebar.jsx
│   ├── pages/               # Page components
│   │   ├── citizen/         # Citizen portal pages
│   │   │   ├── Dashboard.jsx
│   │   │   ├── ReportIssue.jsx
│   │   │   ├── MyComplaints.jsx
│   │   │   ├── ComplaintDetails.jsx
│   │   │   └── ExploreMap.jsx
│   │   ├── admin/           # Admin portal pages
│   │   │   ├── Dashboard.jsx
│   │   │   ├── AllComplaints.jsx
│   │   │   └── PriorityQueue.jsx
│   │   ├── LandingPage.jsx
│   │   ├── LoginPage.jsx
│   │   └── RegisterPage.jsx
│   ├── lib/                 # Utility functions
│   │   └── utils.js
│   ├── App.jsx              # Main app with routing
│   ├── main.jsx             # Entry point
│   └── index.css            # Global styles
├── tailwind.config.js       # Tailwind configuration
└── package.json
```

## 🎨 Design System

### Color Palette
- **Primary (Deep Navy)**: #142B4A - Headers, text, navigation
- **Secondary (Blue)**: #2563EB - Primary actions, links
- **Accent (Teal)**: #14B8A6 - Highlights, success states
- **Background**: #F8FAFC - Page background
- **White**: Cards and content areas

### Typography
- **Font Family**: Inter, Plus Jakarta Sans
- **Headings**: Bold, 600-800 weight
- **Body**: Regular, 400 weight

### Components
- Rounded cards with subtle shadows
- Smooth transitions and hover effects
- Status badges with appropriate colors
- Clean, modern button styles

## 🔐 Authentication (Demo)

The current version uses mock authentication:

**Citizen Login:**
- Select "Citizen"
- Enter any email and password
- Redirects to Citizen Dashboard

**Authority Login:**
- Select "Authority"
- Enter any email and password
- Redirects to Admin Dashboard

## 📱 Responsive Design

The platform is fully responsive and works on:
- Desktop (1920px+)
- Laptop (1024px - 1919px)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## 🛣️ Routes

### Public Routes
- `/` - Landing page
- `/login` - Login page
- `/register` - Registration page
- `/explore` - Public map view

### Citizen Routes (Protected)
- `/dashboard` - Citizen dashboard
- `/report` - Report new issue
- `/my-complaints` - View your complaints
- `/complaint/:id` - Complaint details

### Admin Routes (Protected)
- `/admin` - Admin dashboard
- `/admin/complaints` - All complaints
- `/admin/priority-queue` - Priority queue
- `/admin/map` - Issue map
- `/admin/departments` - Department management

## 🔧 Technology Stack

- **Frontend**: React 18 + Vite
- **Routing**: React Router DOM
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Maps**: React Leaflet
- **Charts**: Recharts
- **Animations**: Framer Motion
- **State Management**: React Hooks (useState, useEffect)

## 🎯 Key Hackathon Demo Points

1. **Landing Page**: Professional hero section with clear value proposition
2. **Citizen Reporting Flow**: 3-step wizard with AI analysis preview
3. **AI Analysis Demo**: Simulated confidence scores and severity detection
4. **Priority System**: Smart scoring based on multiple factors
5. **Status Tracking**: Visual progress timeline for each complaint
6. **Admin Dashboard**: Comprehensive overview with statistics
7. **Responsive Design**: Works perfectly on all devices

## 📝 Demo Flow

1. **User Registration**: Sign up as a citizen
2. **Report Issue**: Upload photo, get AI analysis, provide details
3. **View Dashboard**: See all your complaints with status
4. **Track Progress**: Click on complaint to see detailed timeline
5. **Admin View**: Switch to admin login to see management interface
6. **Priority Queue**: View issues sorted by AI-calculated priority

## 🚧 Future Enhancements

- Real backend API integration (FastAPI recommended)
- Actual AI/ML models for image classification
- Real-time notifications with WebSockets
- Mobile app (React Native)
- Before/after image comparison with OpenCV
- Advanced analytics with more charts
- Department performance metrics
- Citizen reputation system
- Gamification elements

## 📄 License

This project is built for hackathon demonstration purposes.

## 👥 Credits

Built with modern web technologies and best practices for civic technology.

---

**Note**: This is a frontend prototype. The AI analysis, duplicate detection, and priority scoring are currently simulated for demonstration purposes. In production, these would connect to actual backend services and ML models.
