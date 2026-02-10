# SIMVEX 🔬

**Engineering Simulation Collaboration Platform**

A STEM-focused simulation web application that enables real-time collaboration, similar to a Canva-like experience for Blender-style workflows.

## ✨ Key Features

- **Real-time Collaboration**: Multi-user simultaneous editing based on Socket.io.
- **Canvas Editor**: Create and edit simulation objects.
- **Version History**: Automatic and manual version saving/restoration.
- **Team Management**: Email/link invites and permission management (Owner/Editor/Viewer).
- **Asset Management**: Upload images, 3D models, and data files.
- **Project Categories**: Chemistry, Engineering, Biology, Medicine, and Earth Science.

## 🛠 Tech Stack

### Backend
- Node.js + Express.js
- Socket.io (Real-time communication)
- MongoDB + Mongoose
- Passport.js (OAuth)
- AWS S3 (File storage)
- JWT Authentication

### Frontend
- HTML5 + CSS3 + JavaScript
- Canvas API
- Socket.io Client

## 📦 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd simvex
```

### 2. Server Configuration
```bash
cd server
npm install
cp .env.example .env
# Fill in the actual values in the .env file
```

### 3. Run the Server
```bash
npm run dev   # Development mode
npm start     # Production mode
```

### 4. Run the Client
```bash
cd client
# Run using Live Server or any other static file server
npx serve . -l 5500
```

## 📁 Project Structure

```
simvex/
├── server/
│   ├── config/         # DB, Passport, Socket settings
│   ├── models/         # MongoDB schemas
│   ├── routes/         # API routes
│   ├── middleware/     # Auth, Permission middleware
│   ├── services/       # Email, Storage, Collaboration services
│   └── server.js       # Entry point
├── client/
│   ├── css/            # Stylesheets
│   ├── js/             # Client scripts
│   ├── dashboard.html  # Dashboard
│   └── workspace.html  # Collaborative workspace
└── README.md
```

## 🔐 Environment Variables

Set the following values in your `.env` file:

| Variable | Description |
|------|------|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | JWT signing secret |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Secret |
| `AWS_ACCESS_KEY_ID` | AWS Access Key |
| `AWS_SECRET_ACCESS_KEY` | AWS Secret Access Key |
| `AWS_S3_BUCKET` | S3 Bucket Name |
| `SMTP_*` | Email configuration |

## 🚀 API Endpoints

### Authentication
- `POST /api/auth/register` - Sign up
- `POST /api/auth/login` - Login
- `GET /api/auth/google` - Google Login

### Projects
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Collaboration
- `POST /api/projects/:id/invite` - Invite member
- `GET /api/invitations/:token` - Invitation details
- `POST /api/invitations/:token/accept` - Accept invitation

### Socket.io Events
- `join-project` - Join project
- `canvas-update` - Canvas changes
- `cursor-move` - Cursor movement
- `chat-message` - Chat messages

## 👥 Permissions

| Role | Description |
|------|------|
| **Owner** | Project deletion, member management, full permissions |
| **Editor** | Canvas editing, asset upload, version creation |
| **Viewer** | Read-only, chat participation |

## 📄 License

MIT License

---

Made with ❤️ for Engineers
