# 🚀 Quick Start Guide

## Your AI-Assisted FMEA Builder is Ready!

### ✅ Status: RUNNING on http://localhost:3030

The application is now running successfully on port 3030 as requested.

### 🔑 Login Credentials
- **Email**: `admin@fmea.local`
- **Password**: `admin123`

### 📋 What's Available Now

1. **User Authentication** - Local login system
2. **Project Management** - Create and manage FMEA projects
3. **Asset Setup** - Guided wizard for asset configuration
4. **FMEA Builder** - Interactive table and detailed card views
5. **AI Assistant** - Context-aware suggestions (requires API key)
6. **Risk Calculations** - Automatic RPN calculations
7. **Responsive UI** - Modern interface optimized for reliability engineering

### 🤖 AI Features (Optional)

To enable AI suggestions:
1. Get an API key from [anthropic.com](https://anthropic.com)
2. Add it to `.env.local`:
   ```
   ANTHROPIC_API_KEY=your_api_key_here
   ```
3. Restart the server: `npm run dev`

AI features will work with fallback responses if no API key is provided.

### 💾 Data Storage

- **Database**: JSON file at `./data/fmea-data.json`
- **Type**: Local-only (no cloud sync)
- **Backup**: Simply copy the data folder

### 🔧 Available Commands

- `npm run dev` - Development server (port 3030)
- `npm run build` - Production build
- `npm run start` - Production server (port 3030)
- `npm run db:setup` - Reset database and create admin user

### 🎯 Getting Started

1. **Visit**: http://localhost:3030
2. **Login** with the admin credentials above
3. **Create** your first project using the guided wizard
4. **Add** failure modes with AI assistance
5. **Analyze** risks with automatic RPN calculations
6. **Export** your analysis when complete

### 🔄 Already Running

The application is currently running in the background. You can:
- Access it at http://localhost:3030
- Stop it with `Ctrl+C` if needed
- Restart with `npm run dev`

---

**🎉 Your locally-running FMEA Builder is ready for reliability engineering!**