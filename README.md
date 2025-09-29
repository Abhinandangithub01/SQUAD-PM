# 🚀 Project Management System

A comprehensive full-stack project management application with real-time collaboration, audio/video calling, and screen sharing capabilities.

## ✨ Features

- **📊 Dashboard**: Activity stream, notifications, quick actions
- **📋 Task Management**: Projects, Kanban boards, List view with drag-and-drop
- **💬 Real-time Chat**: Channels and direct messages with live updates
- **📞 Audio/Video Calls**: WebRTC-based calling with screen sharing
- **📁 File Management**: Upload, organize, and link files to tasks
- **📈 Analytics**: Project insights and performance metrics
- **👥 Team Collaboration**: Role-based permissions and user management
- **🎯 Marketing & Sales**: Dedicated Kanban boards for different teams

## Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Socket.io Client** - Real-time communication
- **WebRTC** - Peer-to-peer audio/video calls
- **Heroicons** - Beautiful SVG icons
- **React Query** - Server state management
- **React Hook Form** - Form handling

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **Socket.io** - Real-time WebSocket communication
- **WebRTC Signaling** - Call setup and management
- **JWT Authentication** - Secure user authentication
- **Multer** - File upload handling

## Quick Start

1. **Install dependencies**:
   ```bash
   npm run install-all
   ```

2. **Set up PostgreSQL database**:
   - Create a database named `project_management`
   - Update database credentials in `server/.env`

3. **Run the application**:
   ```bash
   npm run dev
   ```

4. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom hooks
│   │   ├── utils/         # Utility functions
│   │   └── styles/        # CSS files
├── server/                # Node.js backend
│   ├── controllers/       # Route controllers
│   ├── models/           # Database models
│   ├── middleware/       # Custom middleware
│   ├── routes/           # API routes
│   └── utils/            # Utility functions
└── database/             # Database schema and seeds
```

## 📞 Audio/Video Calling Features

### Call Capabilities
- **Audio Calls** - High-quality peer-to-peer audio communication
- **Video Calls** - Enable/disable camera during calls
- **Screen Sharing** - Share your screen with call participants
- **Call Controls** - Mute, video toggle, screen share, end call
- **Direct Messages** - Call any team member directly
- **Channel Calls** - Start calls from any project channel

### How to Use Calls
1. **Direct Calls**: Go to Chat → DMs tab → Click phone icon next to any user
2. **Channel Calls**: In any channel, click the phone icon in the header
3. **During Calls**: Use controls to mute, enable video, or share screen
4. **Accept/Reject**: Answer incoming calls with green/red buttons

### Technical Implementation
- **WebRTC** - Direct peer-to-peer connections (no external servers)
- **Socket.io Signaling** - Call setup and management
- **Zero Cost** - No API fees or usage limits
- **Self-Hosted** - Complete control over your communication

## 🔐 Default Users

- **Admin**: admin@example.com / password123
- **Manager**: manager@example.com / password123
- **Member**: member@example.com / password123

## 🌍 Environment Variables

Create `.env` files in both `server/` and `client/` directories with the required environment variables (see `.env.example` files).

## 🚀 Deployment

This application can be deployed to:
- **AWS Amplify** (Frontend) + Lambda (Backend)
- **Vercel/Netlify** (Frontend) + Any Node.js hosting (Backend)
- **Docker** containers for full-stack deployment
- **Traditional VPS** with Node.js and PostgreSQL

## 📝 License

This project is open source and available under the MIT License.
