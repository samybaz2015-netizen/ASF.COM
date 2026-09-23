# ASF Consult Engineering Management System - Project Documentation

## 📋 Project Overview

**ASF Consult** is a comprehensive React-based project management system designed for engineering and construction workflows. The application manages projects, employees, attendance, branches, and all related operations for a consultancy firm.

---

## 🏗️ System Architecture

### **Tech Stack**

#### **Frontend**
- **React 18.3.1** - UI framework
- **React Router 6.26.2** - Navigation
- **TanStack Query 5.66.11** - Data fetching/caching
- **Material-UI 6.1.7** - Component library
- **Bootstrap 5.3.3** - Responsive design
- **Tailwind CSS 3.4.14** - Utility-first styling
- **Axios** - HTTP client
- **Victory Charts** - Data visualization
- **Chart.js & Recharts** - Additional charts
- **Leaflet** - Maps integration
- **Framer Motion** - Animations
- **SweetAlert2** - Beautiful alerts
- **jsPDF & xlsx** - Document export

#### **Backend API**
- **Base URL**: `https://asfconsult-001-site1.ltempurl.com`
- **Authentication**: JWT Bearer tokens
- **Cookie-based sessions** (12-hour expiry)

---

## 👥 User Roles & Permissions

### **4 Main User Types:**

1. **Engineer (مهندس)**
   - Submit projects
   - View personal stats
   - Access submissions
   - View notifications

2. **Admin (أدمن)**
   - Full system access
   - Manage employees, branches, offices
   - Approve/reject projects
   - View analytics

3. **Supervisor (مشرف)**
   - Approve/reject requests
   - View reports
   - Manage certain resources

4. **Office Manager (مدير المكتب)**
   - Office-specific management
   - Team oversight
   - Limited admin privileges

---

## 📁 Project Structure

```
src/
├── api/
│   └── apiClient.js          # Axios configuration
├── Component/                # Reusable components
│   ├── Sidebar/              # Main navigation
│   ├── Header/               # Top header
│   ├── NavBar/               # Engineer navbar
│   ├── Footer/               # Footer
│   ├── DashoardContant/      # Dashboard widgets
│   ├── RequestsWaiting/      # Request management
│   ├── Employees/            # Employee components
│   ├── CheckAttendanceAdmin/ # Attendance tracking
│   └── ...
├── Pages/                    # Page components
│   ├── Login/                # Authentication
│   ├── Dashoard/             # Admin dashboard
│   ├── AllProject/           # All projects view
│   ├── SearchRequests/       # Search functionality
│   ├── CheckAttendanceAdmin/ # Attendance page
│   └── ...
├── hooks/                    # Custom React hooks
│   ├── useExcelExport.js
│   ├── HandlePrintOrder.js
│   └── ...
├── util/                     # Utilities & constants
│   ├── ProjectsType.js
│   ├── officeConstants.js
│   └── ...
├── function/                 # API functions
│   └── FunctionApi.js
└── assets/                   # Styles, fonts, images
    ├── css/
    └── webfonts/
```

---

## 🎯 Core Features

### **1. Project Management**

#### **Project Types:**
1. **Construction Projects (الإنشاءات)**
2. **Emergency Projects (الطوارئ)**
3. **Maintenance Projects (الصيانة)**
4. **Rehabilitation Works (أعمال التأهيل)**
5. **Special Projects (المشاريع الخاصة)**

#### **Project Lifecycle:**
```
Create → Submit → Wait Approval → Approved/Rejected → 
Track Progress → Complete → Issue Certificate → Invoice → Payment
```

#### **Project Statuses:**
- تحت التنفيذ (Under Implementation)
- تم التنفيذ (Completed)
- صدور شهادة الإنجاز (Certificate Issued)
- دخلت مستخلص (Invoice Entered)
- تم الصرف (Payment Issued)
- لا يحتاج تصريح (No Permit Required)

### **2. Dashboard & Analytics**

- **Real-time statistics** with Victory Charts
- **Interactive visualizations** (20+ chart types)
- **Branch & Office performance** tracking
- **Project counts & financial metrics**
- **Efficiency calculations**
- **Risk level indicators**

### **3. Request Workflow**

- Engineers submit project requests
- Admins/Supervisors approve/reject
- Bulk approval operations
- Delete request approvals
- Change history tracking
- Status updates

### **4. Directory Management**

#### **Branches:**
- Multiple branches support
- Branch-specific offices

#### **Offices:**
**Riyadh Branch:**
- خريص (Khurais)
- الشمال (North)
- الشرق (East)
- الجنوب (South)
- الدرعية (Diriyah)

**Hail Branch:**
- الحاءل (Hail)
- بقعاء (Baqaa)
- الغزاله (Al Ghazalah)
- الحليفه (Al Hulayfah)
- موقق (Moqaq)
- الشملي (Al Shumli)
- الشنان (Al Shanan)
- القاعد (Al Qaed)

#### **Employees:**
- Worker management
- Profile photos
- National ID tracking
- Salary information
- Employment history

### **5. Account Management**

- Add/Edit/Delete users
- Role assignment
- Permission management
- Account status toggling
- Password reset

### **6. Organization Features**

- **Attendance Tracking** (NEW!)
- **Vacation Management**
- **Notifications**
- **Custodies Management**
- **Task Types**
- **Districts/Areas**

---

## 🔐 Authentication & Security

### **Implementation:**
- JWT Bearer token authentication
- Cookie-based sessions (12-hour expiry)
- Role-based access control (RBAC)
- Protected routes
- Automatic token refresh

### **Login Flow:**
```
User Input → Geolocation Capture → API Call → Token Received → 
Cookie Stored → Dashboard Redirect (Role-based)
```

---

## 🗺️ Routing Structure

### **Public Routes:**
- `/` - Login page
- `/reset-password` - Password recovery

### **Engineer Routes:**
- `/main-page` - Main dashboard
- `/submit-application` - Submit projects
- `/statics` - Personal statistics
- `/eng-profile` - Engineer profile
- `/eng-notification` - Notifications
- `/projects` - All projects
- `/electricRequests` - Electrical requests
- `/boot-info` - AI Assistant
- `/contactus` - Contact page
- `/about` - About page

### **Admin/Supervisor/Manager Routes:**
- `/home-page` - Dashboard
- `/search-requests` - Search
- `/accounts` - Account management
- `/engineers` - Engineer management
- `/branches` - Branch management
- `/offices` - Office management
- `/employees` - Employee management
- `/district` - District management
- `/accept-requests` - Approve requests
- `/accept-delete` - Approve deletions
- `/check-attendance` - Attendance tracking
- `/admin-projects` - All projects
- `/notification` - Notifications
- `/vacations` - Vacation management
- `/custodies` - Custodies
- `/add-permission` - Permissions

---

## 📊 Data Visualization

### **Chart Types Supported:**
1. Bar Charts (📊 أعمدة)
2. Pie Charts (🥧 دائري)
3. Line Charts (📈 خطي)
4. Area Charts (📊 مساحة)
5. Scatter Plots (⚪ مبعثر)
6. Stacked Bar (📚 مكدس)
7. Monthly Trends (📅 شهري)
8. Project Types (🏗️ أنواع)
9. Candlestick (🕯️ شمعة)
10. Box Plot (📦 صندوق)
11. Histogram (📊 توزيع)
12. Radial (🎯 شعاعي)
13. Polar (🧭 قطبي)
14. Heatmap (🔥 حرارية)
15. Treemap (🌳 شجرة)
16. Sankey Flow (🌊 تدفق)
17. Gauge (⏱️ مقياس)
18. Funnel (🔻 قمع)
19. Waterfall (💧 شلال)
20. Bubble (🫧 فقاعة)

---

## 🔌 API Integration

### **Authentication:**
- `POST /api/Account/login` - User login
- `POST /api/Account/toggle-account-status/{userId}` - Toggle account
- `GET /api/Account/get-count-engineers-per-branch` - Engineer counts
- `GET /api/Account/get-count-projects-per-branch` - Project counts

### **Projects:**
- `POST /api/Construction/{type}/...` - Create project
- `GET /api/Search/search-by-orderidWithType` - Search by ID
- `GET /api/Search/{id}/changes` - Get changes

### **Admin Operations:**
- `GET /api/Admin/situation-counts` - Status counts
- `GET /api/Admin/statistics-orders` - Statistics
- `PUT /api/Construction/approveProject` - Approve project
- `GET /api/Construction/getUnapprovedProjects` - Pending requests
- `PUT /api/Construction/approveAllProjects` - Bulk approve

### **Attendance (NEW):**
- `GET /api/Attendance` - Get attendance records
- `POST /api/Attendance` - Create attendance
- `PUT /api/Attendance/{id}` - Update attendance

---

## 🎨 UI/UX Features

### **Design System:**
- **Primary Color**: `rgba(42, 56, 91, 1)` (Dark Blue)
- **Secondary Color**: `rgba(188, 145, 92, 1)` (Gold/Tan)
- **RTL Support**: Full Arabic right-to-left layout
- **Responsive**: Mobile-first approach
- **Icons**: FontAwesome 6.6.0

### **Interactive Features:**
- Drag & drop cards
- Real-time data updates
- Animated transitions
- Toast notifications
- Modal dialogs
- Data export (Excel, PDF)
- Print functionality

---

## 📱 Key Pages

### **Dashboard (`/home-page`):**
- Project statistics cards
- Interactive charts
- Branch/office performance
- Filter options
- Export capabilities

### **Check Attendance (`/check-attendance`):**
- Monthly attendance view
- Search by employee/branch
- Filter by date range
- Manual attendance entry
- Bulk actions
- Export to Excel

### **Accounts (`/accounts`):**
- User list with filters
- Add/Edit/Delete users
- Role management
- Status toggling
- Search functionality

### **Engineers (`/engineers`):**
- Engineer directory
- Profile management
- Project assignments
- Performance tracking

### **Search Requests (`/search-requests`):**
- Advanced filtering
- Multi-criteria search
- Export results
- View details

---

## 🔧 Development

### **Getting Started:**
```bash
npm install
npm start
```

### **Build for Production:**
```bash
npm run build
```

### **Testing:**
```bash
npm test
```

---

## 📦 Key Dependencies

```json
{
  "@tanstack/react-query": "^5.66.11",
  "@mui/material": "^6.1.7",
  "react-router-dom": "^6.26.2",
  "victory": "^37.3.6",
  "chart.js": "^4.4.7",
  "recharts": "^3.1.2",
  "axios": "^1.7.7",
  "sweetalert2": "^11.21.1",
  "xlsx": "^0.18.5",
  "jspdf": "^2.5.2"
}
```

---

## 🚀 Recent Updates

### **Attendance System Added:**
- New CheckAttendanceAdmin page
- Employee attendance tracking
- Calendar-based view
- Filter by branch/office/date
- Excel export functionality
- Bulk attendance operations

---

## 📝 Best Practices

1. **State Management**: TanStack Query for server state
2. **Form Handling**: Controlled components
3. **Error Handling**: Try-catch with user-friendly messages
4. **Loading States**: Skeleton loaders and spinners
5. **Responsive Design**: Mobile-first approach
6. **Accessibility**: ARIA labels and keyboard navigation
7. **Performance**: Code splitting, lazy loading

---

## 🔮 Future Enhancements

- Real-time notifications with WebSockets
- Mobile app development
- Advanced reporting
- AI-powered insights
- Automated workflow triggers
- Enhanced analytics

---

## 📞 Support

For technical support or questions, please contact:
- **Project Manager**: ASF Consult Team
- **Development Team**: Engineering Department

---

**Last Updated**: January 2025
**Version**: 1.0.0

