# 🚀 SQUAD PM - Project Management System

A modern, production-ready project management application built with React and AWS Amplify.

> Latest update: Backend deployed with Milestone model support

## ✨ Features

- **📊 Dashboard**: Real-time activity stream and notifications
- **📋 Task Management**: Kanban boards, List view with drag-and-drop
- **💬 Team Collaboration**: Real-time chat and messaging
- **📁 File Management**: Secure file uploads with S3
- **📈 Analytics**: Project insights and performance metrics
- **👥 User Management**: Role-based permissions (Admin, Manager, Member, Viewer)
- **🎯 Project Tracking**: Milestones, subtasks, and progress monitoring

## 🏗️ Tech Stack

### Frontend
- **React 18** with Hooks
- **Tailwind CSS** for styling
- **React Router** for navigation
- **React Query** for data fetching
- **AWS Amplify** for backend integration
- **Heroicons** for icons

### Backend (AWS)
- **AWS Cognito** - User authentication
- **AWS AppSync** - GraphQL API
- **Amazon DynamoDB** - NoSQL database
- **Amazon S3** - File storage
- **AWS Amplify Hosting** - Frontend deployment

## 🚀 Live Demo

**Production URL:** https://main.d8tv3j2hk2i9r.amplifyapp.com

## 📦 Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Abhinandangithub01/SQUAD-PM.git
   cd SQUAD-PM
   ```

2. **Install dependencies**:
   ```bash
   cd client
   npm install
   ```

3. **Configure AWS Amplify** (if running locally):
   ```bash
   npx ampx sandbox
   ```

4. **Start development server**:
   ```bash
   npm start
   ```

## 📁 Project Structure

```
SQUAD-PM/
├── client/                    # React frontend
│   ├── amplify/              # AWS Amplify backend configuration
│   │   ├── auth/            # Cognito authentication setup
│   │   ├── data/            # DynamoDB schema & GraphQL API
│   │   └── storage/         # S3 file storage config
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts (Auth, Theme, etc.)
│   │   ├── services/       # API services
│   │   └── utils/          # Helper functions
│   └── amplify_outputs.json # AWS backend configuration
└── server/                   # Legacy Express backend (optional)
```

## 🚀 Deployment

**Production:** Deployed on AWS Amplify
- **Frontend:** https://main.d8tv3j2hk2i9r.amplifyapp.com
- **Backend:** AWS AppSync GraphQL API
- **Auth:** AWS Cognito
- **Database:** Amazon DynamoDB
- **Storage:** Amazon S3

### Deploy Your Own

1. Fork this repository
2. Connect to AWS Amplify
3. Deploy backend: `npx ampx sandbox`
4. Push to GitHub - auto-deploys!

## 📄 License

MIT License - feel free to use this project for your own purposes.

## 👨‍💻 Author

**Abhinandan**
- GitHub: [@Abhinandangithub01](https://github.com/Abhinandangithub01)

---

**Built with ❤️ using React and AWS Amplify**
