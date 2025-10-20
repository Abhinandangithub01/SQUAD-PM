# 🚀 SQUAD PM - Next.js Project Management System

A modern, production-ready project management application built with **Next.js 14**, **AWS Amplify Gen 2**, and **TypeScript**.

> **Latest Update:** Migrated to Next.js with multi-tenant architecture

## ✨ Features

- **🔐 Multi-Tenant Architecture**: Organization-based isolation with AWS Cognito
- **📊 Dashboard**: Real-time activity stream and notifications
- **📋 Task Management**: Kanban boards, List view with drag-and-drop
- **💬 Team Collaboration**: Real-time chat and messaging
- **📁 File Management**: Secure file uploads with S3
- **📈 Analytics**: Project insights and performance metrics
- **👥 User Management**: Role-based permissions (Owner, Admin, Manager, Member, Viewer)
- **🎯 Project Tracking**: Milestones, subtasks, and progress monitoring
- **🌙 Theme Support**: Light and dark mode with customizable themes

## 🏗️ Tech Stack

### Frontend
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **React Query** for data fetching
- **AWS Amplify** for backend integration
- **Zustand** for state management
- **Heroicons** & **Lucide React** for icons

### Backend (AWS)
- **AWS Cognito** - User authentication with MFA support
- **AWS AppSync** - GraphQL API
- **Amazon DynamoDB** - NoSQL database with multi-tenant support
- **Amazon S3** - File storage with organization-based access
- **AWS Lambda** - Serverless functions
- **AWS Amplify Hosting** - Frontend deployment

## 📦 Local Development

1. **Clone the repository**:
   ```bash
   git clone https://git-codecommit.ap-south-1.amazonaws.com/v1/repos/SQUAD-PM
   cd SQUAD-PM
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment**:
   ```bash
   cp .env.local.example .env.local
   # Update with your AWS configuration
   ```

4. **Start Amplify sandbox** (in a separate terminal):
   ```bash
   npx ampx sandbox
   ```

5. **Start development server**:
   ```bash
   npm run dev
   ```

6. **Open your browser**:
   ```
   http://localhost:3000
   ```

## 📁 Project Structure

```
SQUAD-PM/
├── amplify/                  # AWS Amplify backend configuration
│   ├── auth/                # Cognito authentication
│   ├── data/                # DynamoDB schema & GraphQL API
│   ├── storage/             # S3 file storage config
│   └── backend.ts           # Backend definition
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── auth/           # Authentication pages
│   │   ├── dashboard/      # Dashboard pages
│   │   └── layout.tsx      # Root layout
│   ├── components/          # Reusable UI components
│   ├── contexts/            # React contexts (Auth, Theme)
│   ├── lib/                 # Utility libraries
│   ├── services/            # API services
│   └── utils/               # Helper functions
├── public/                  # Static assets
├── amplify_outputs.json     # AWS backend configuration
├── next.config.js           # Next.js configuration
├── tailwind.config.ts       # Tailwind CSS configuration
└── tsconfig.json            # TypeScript configuration
```

## 🚀 Deployment

### Deploy to AWS Amplify

1. **Push to AWS CodeCommit**:
   ```bash
   git remote add origin https://git-codecommit.ap-south-1.amazonaws.com/v1/repos/SQUAD-PM
   git push -u origin main
   ```

2. **Connect to AWS Amplify Console**:
   - Go to AWS Amplify Console
   - Select "Host web app"
   - Choose "AWS CodeCommit"
   - Select your repository
   - Configure build settings (auto-detected)
   - Deploy!

3. **Configure environment variables** in Amplify Console if needed

### Build Commands

```bash
# Development
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Deploy backend sandbox
npm run sandbox
```

## 🔧 Configuration

### Multi-Tenant Setup

The application supports multi-tenant architecture with organization-based isolation:

1. **Organizations**: Each company/team has its own organization
2. **Members**: Users can belong to multiple organizations
3. **Projects**: Projects are scoped to organizations
4. **Data Isolation**: DynamoDB queries are filtered by organizationId

### AWS Services Configuration

- **Cognito**: Email-based authentication with optional MFA
- **DynamoDB**: Multi-tenant data model with GSI for efficient queries
- **S3**: Organization-scoped file storage with access controls
- **Lambda**: Custom business logic and integrations

## 📄 License

MIT License - feel free to use this project for your own purposes.

## 👨‍💻 Author

**Abhinandan**
- GitHub: [@Abhinandangithub01](https://github.com/Abhinandangithub01)

---

**Built with ❤️ using Next.js and AWS Amplify Gen 2**
