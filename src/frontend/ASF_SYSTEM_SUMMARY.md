# 🏢 ASF Consult Engineering Management System - Complete Overview

## 🌟 Introduction

**ASF Consult** is a comprehensive **React-based web application** for managing engineering projects, employees, attendance, and organizational workflows in a consultancy environment.

---

## 🎯 What Does the System Do?

### **Core Purpose:**
Streamline and manage all aspects of engineering project operations from submission to completion, including team management, resource allocation, and performance tracking.

---

## 👥 User Roles

| Role | Arabic Name | Access Level |
|------|-------------|--------------|
| **Engineer** | مهندس | Create/submit projects, view personal stats |
| **Admin** | أدمن | Full system access & control |
| **Supervisor** | مشرف | Approve/reject projects, manage workflows |
| **Office Manager** | مدير المكتب | Office-specific management |

---

## 🗺️ System Structure

### **Geographic Organization:**

```
ASF Consult
├── Branch: الرياض (Riyadh)
│   ├── خريص (Khurais)
│   ├── الشمال (North)
│   ├── الشرق (East)
│   ├── الجنوب (South)
│   └── الدرعية (Diriyah)
│
└── Branch: حائل (Hail)
    ├── الحاءل (Hail)
    ├── بقعاء (Baqaa)
    ├── الغزاله (Al Ghazalah)
    ├── الحليفه (Al Hulayfah)
    ├── موقق (Moqaq)
    ├── الشملي (Al Shumli)
    ├── الشنان (Al Shanan)
    └── القاعد (Al Qaed)
```

---

## 📊 Project Types & Workflow

### **5 Project Categories:**
1. 🏗️ **الإنشاءات** (Construction)
2. 🚨 **الطوارئ** (Emergency)
3. 🔧 **الصيانة** (Maintenance)
4. 🔨 **أعمال التأهيل** (Rehabilitation)
5. ⭐ **المشاريع الخاصة** (Special/Private)

### **Project Lifecycle:**
```
┌─────────────┐
│ Create      │ Engineer creates new project
└──────┬──────┘
       ↓
┌─────────────┐
│ Submit      │ Submit for approval
└──────┬──────┘
       ↓
┌─────────────┐
│ Review      │ Admin/Supervisor reviews
└──────┬──────┘
       ↓
┌─────────────┐
│ Approved    │ OR Rejected
└──────┬──────┘
       ↓
┌─────────────┐
│ Track       │ Monitor progress & status
└──────┬──────┘
       ↓
┌─────────────┐
│ Complete    │ Issue certificate, invoice, payment
└─────────────┘
```

---

## 🎨 Key Features

### **1. Dashboard & Analytics** 📈
- **Real-time statistics** with interactive charts (20+ types)
- **Branch performance** tracking
- **Financial metrics** (actual vs estimated values)
- **Efficiency calculations**
- **Risk assessments**

### **2. Request Management** ✅
- Submit project requests with photos/documents
- Approval/rejection workflow
- Bulk operations
- Change tracking
- Delete request approvals

### **3. Employee Management** 👷
- **Directory**: Add/edit/delete employees
- **Profiles**: Photos, national ID, contact info
- **Employment**: Salary, dates, positions
- **Documents**: CV, licenses, residence

### **4. Attendance Tracking** ⏰ **[NEW!]**
- **Calendar-based view**
- **Monthly reports**
- **Filter by**:
  - Branch
  - Office
  - Date range
  - Employee
- **Statistics**: Present/Absent/Late counts
- **Excel export**
- **Search functionality**

### **5. Directory Management** 📋
- **Branches**: Multiple locations
- **Offices**: 13 total offices
- **Districts**: Geographic areas
- **Consultants**: External resources

### **6. Account Management** 🔐
- **Users**: CRUD operations
- **Roles**: Permission assignment
- **Status**: Enable/disable accounts
- **Security**: Password reset, token management

### **7. Notifications** 🔔
- **Real-time alerts**
- **Project updates**
- **System announcements**

### **8. Vacation Management** 🏖️
- **Request submission**
- **Approval workflow**
- **Holiday calendar**
- **Leave tracking**

### **9. Custodies** 📦
- **Equipment management**
- **Inventory tracking**
- **Assignment records**

---

## 🔐 Security Features

- ✅ **JWT Authentication** - Secure token-based login
- ✅ **Cookie Sessions** - 12-hour expiry
- ✅ **RBAC** - Role-based access control
- ✅ **Protected Routes** - Auto-redirect unauthorized
- ✅ **Secure API** - HTTPS communication
- ✅ **Geolocation** - Login tracking

---

## 📱 User Interfaces

### **Engineer Interface:**
- 🏠 Main dashboard with projects
- 📝 Submit application forms
- 📊 Personal statistics
- 🔔 Notifications
- 👤 Profile management
- 🤖 AI Assistant (Boot Info)

### **Admin Interface:**
- 📈 **Dashboard**: Charts & metrics
- 👥 **Users**: Manage accounts
- 🏢 **Branches**: Location management
- 🏛️ **Offices**: Office management
- 👷 **Employees**: Staff directory
- ✅ **Requests**: Approval queue
- 📊 **Projects**: All projects view
- ⏰ **Attendance**: Employee tracking **[NEW!]**
- 🔔 **Notifications**: System alerts
- 📅 **Vacations**: Leave management

---

## 📊 Data Visualization

### **Chart Types:**
1. 📊 Bar Charts
2. 🥧 Pie Charts
3. 📈 Line Charts
4. 📊 Area Charts
5. ⚪ Scatter Plots
6. 📚 Stacked Bars
7. 📅 Monthly Trends
8. 🏗️ Project Types
9. 🕯️ Candlestick
10. 📦 Box Plot
11. 📊 Histogram
12. 🎯 Radial
13. 🧭 Polar
14. 🔥 Heatmap
15. 🌳 Treemap
16. 🌊 Sankey
17. ⏱️ Gauge
18. 🔻 Funnel
19. 💧 Waterfall
20. 🫧 Bubble

---

## 🔌 API Integration

### **Authentication:**
- `POST /api/Account/login`
- `GET /api/Account/get-count-engineers-per-branch`
- `GET /api/Account/get-count-projects-per-branch`

### **Projects:**
- `POST /api/Construction/{type}/...`
- `GET /api/Search/search-by-orderidWithType`
- `GET /api/Search/{id}/changes`

### **Admin:**
- `GET /api/Admin/situation-counts`
- `GET /api/Admin/statistics-orders`
- `PUT /api/Construction/approveProject`
- `PUT /api/Construction/approveAllProjects`

### **Attendance:**
- `GET /api/Attendance`
- `POST /api/Attendance`
- `PUT /api/Attendance/{id}`

---

## 🛠️ Technology Stack

### **Frontend:**
- ⚛️ React 18.3.1
- 🎯 TanStack Query 5.66.11
- 🎨 Material-UI 6.1.7
- 🎭 Bootstrap 5.3.3
- 🎨 Tailwind CSS 3.4.14
- 📊 Victory Charts
- 🗺️ Leaflet Maps
- ⚡ Framer Motion
- 📄 SweetAlert2

### **Backend Integration:**
- 🌐 Axios HTTP client
- 🔒 JWT authentication
- 🍪 Cookie sessions
- 🔄 Real-time updates

---

## 🗂️ File Organization

```
asf/
├── public/                 # Static assets
├── src/
│   ├── api/               # API configuration
│   ├── Component/         # Reusable components
│   │   ├── Sidebar/       # Navigation
│   │   ├── Header/        # Top header
│   │   ├── CheckAttendanceAdmin/ # Attendance UI **[NEW!]**
│   │   └── ...
│   ├── Pages/             # Page components
│   │   ├── Login/         # Authentication
│   │   ├── Dashoard/      # Admin dashboard
│   │   ├── CheckAttendanceAdmin/ # Attendance page **[NEW!]**
│   │   └── ...
│   ├── hooks/             # Custom hooks
│   ├── util/              # Utilities
│   ├── function/          # API functions
│   └── assets/            # Images, styles, fonts
└── package.json           # Dependencies
```

---

## 🚀 Recent Updates

### **Attendance System Added:**
✅ New `/check-attendance` route  
✅ Employee attendance tracking  
✅ Calendar view with monthly filter  
✅ Statistics dashboard  
✅ Search & filter functionality  
✅ Excel export capability  
✅ Branch/office filtering  
✅ Present/Absent/Late tracking  

---

## 📖 How to Use

### **For Engineers:**
1. Login at `/`
2. Access main page
3. Submit project applications
4. Track project status
5. View personal statistics

### **For Admins:**
1. Login to admin dashboard
2. Review pending requests
3. Approve/reject projects
4. Manage employees & branches
5. View analytics
6. Track attendance **[NEW!]**
7. Export reports

---

## 🎯 Business Value

### **Efficiency Gains:**
- ⚡ **Automated workflows** reduce manual work
- 📊 **Data-driven decisions** with real-time analytics
- 🎯 **Centralized management** improves coordination
- 📱 **Mobile-friendly** access anywhere
- 📈 **Performance tracking** for continuous improvement

### **Key Benefits:**
- ✅ Streamlined project approval
- ✅ Enhanced visibility
- ✅ Better resource allocation
- ✅ Improved accountability
- ✅ Automated reporting

---

## 🔮 Future Roadmap

- [ ] Mobile app development
- [ ] WebSocket real-time notifications
- [ ] Advanced AI insights
- [ ] Automated workflow triggers
- [ ] Enhanced reporting suite
- [ ] Multi-language support

---

## 📞 Contact & Support

- **System**: ASF Consult Engineering Management
- **Platform**: Web Application (React)
- **Support**: Engineering Department
- **Version**: 1.0.0

---

**Last Updated**: January 2025
**Status**: ✅ Production Ready

