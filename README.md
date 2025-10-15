# AI-Assisted FMEA Builder

A locally-running reliability engineering toolkit with AI-powered FMEA (Failure Mode and Effects Analysis) capabilities. Built for M4 Pro Mac with Next.js, SQLite, and Anthropic Claude integration.

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ (native ARM64 support for M4 Pro Mac)
- **npm** 8+
- **Anthropic API Key** (get from [anthropic.com](https://anthropic.com))

### Installation

1. **Clone and Install Dependencies**
   ```bash
   cd nextmint-app
   npm install
   ```

2. **Set Up Environment**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local` and add your Anthropic API key:
   ```env
   ANTHROPIC_API_KEY=your_api_key_here
   JWT_SECRET=your_random_jwt_secret_here
   ```

3. **Initialize Database**
   ```bash
   npm run db:setup
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Access Application**
   Open [http://localhost:3030](http://localhost:3030)
   
   **Default Login:**
   - Email: `admin@fmea.local`
   - Password: `admin123`

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS with custom components
- **Database**: SQLite with better-sqlite3 (local, zero-config)
- **AI Integration**: Anthropic Claude API (Claude 3 Sonnet)
- **State Management**: Zustand
- **UI Components**: AG Grid (data tables), Recharts (visualizations)
- **Authentication**: Local JWT with SQLite sessions
- **Exports**: jsPDF (PDF), xlsx (Excel)

### Project Structure

```
nextmint-app/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx          # Main page
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── dashboard/        # Main dashboard
│   ├── fmea/            # FMEA builder components
│   ├── project/         # Project management
│   └── ai/              # AI assistant panel
├── lib/                  # Utilities and services
│   ├── database.ts      # SQLite database setup
│   ├── auth.ts          # Authentication service
│   ├── ai.ts            # AI service (Anthropic)
│   └── store.ts         # Zustand state management
├── types/               # TypeScript type definitions
├── scripts/             # Setup and utility scripts
└── data/               # SQLite database files (created automatically)
```

## 🎯 Features

### Core FMEA Builder
- **Smart Table**: Interactive failure mode table with inline editing
- **Collapsible Cards**: Detailed view of failure modes with nested data
- **Risk Calculation**: Automatic RPN (Risk Priority Number) calculation
- **AI Suggestions**: Context-aware suggestions for failure modes, causes, effects
- **Real-time Updates**: Live data synchronization

### AI Assistant
- **Failure Mode Suggestions**: AI-powered failure mode recommendations
- **Cause Analysis**: Root cause suggestions based on asset context
- **Effect Assessment**: Impact analysis with severity recommendations  
- **Risk Explanation**: Detailed risk assessment explanations
- **Contextual Help**: Chat-based AI assistant with project context

### Dashboard & Analytics
- **Risk Heatmaps**: Visual representation of risk distribution
- **Top Risk Analysis**: Identification of highest priority items
- **Action Tracking**: Monitor open and completed actions
- **Progress Metrics**: Real-time project statistics

### Asset Management
- **Asset Setup Wizard**: Guided asset configuration
- **Context-Aware Analysis**: AI tailored to specific asset types
- **Standards Integration**: Support for industry standards (ISO, API, etc.)
- **Criticality Assessment**: Risk-based asset prioritization

### Export & Reporting
- **PDF Export**: Professional reports with charts and hierarchy
- **Excel Export**: Structured data export for further analysis
- **Custom Filters**: Export specific data subsets
- **Metadata Inclusion**: Complete project context in reports

## 🤖 AI Configuration

The application integrates with Anthropic's Claude API for intelligent assistance:

### AI Assistance Levels
- **Limited**: Explanations and guidance only
- **Medium**: Suggestions with user confirmation (default)
- **Full**: Auto-suggestions with editing capability

### AI Features
- Failure mode suggestions based on asset type and context
- Root cause analysis recommendations
- Effect and severity assessments
- Risk scoring guidance
- Natural language explanations

### Setup Requirements
1. Obtain API key from [anthropic.com](https://anthropic.com)
2. Add to `.env.local` file
3. AI features activate automatically when configured

## 📊 Database Schema

Local SQLite database with the following main tables:

- **users**: User accounts and authentication
- **projects**: FMEA project containers
- **assets**: Asset information and metadata
- **failure_modes**: Core failure mode data
- **causes**: Failure causes with occurrence ratings
- **effects**: Failure effects with severity ratings
- **controls**: Preventive and detective controls
- **actions**: Corrective actions and tracking

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - TypeScript type checking
- `npm run test` - Run tests
- `npm run db:setup` - Initialize database

### Development Server

The development server runs on `http://localhost:3030` with:
- Hot reload for code changes
- TypeScript compilation
- Tailwind CSS processing
- API route handling

### Database Management

Database operations are handled through:
- **Location**: `./data/fmea.db` (created automatically)
- **Migrations**: Built-in schema initialization
- **Backup**: Copy the database file for backups
- **Reset**: Delete `data/fmea.db` and restart to reset

## 🚀 Production Deployment (Local)

For production use on your local machine:

1. **Build Application**
   ```bash
   npm run build
   ```

2. **Start Production Server**
   ```bash
   npm start
   ```

3. **Access Production App**
   Open [http://localhost:3030](http://localhost:3030)

## 🔐 Security Features

- Local JWT authentication with session management
- Password hashing with bcrypt
- SQL injection protection with prepared statements
- Environment variable protection for API keys
- CORS and security headers configured
- Local-only data storage (no cloud exposure)

## 🎨 UI/UX Features

### Design Inspiration
- **Airtable**: Smart table interactions and inline editing
- **Notion**: Clean, modern interface with collapsible sections
- **Linear**: Professional design with efficient workflows
- **Retool**: Functional layouts optimized for data management

### Responsive Design
- Desktop-optimized for reliability engineering workflows
- Collapsible sidebar for smaller screens
- Mobile-friendly authentication and basic navigation
- Tooltip help system for complex features

### Accessibility
- Keyboard navigation support
- Screen reader compatible
- High contrast color schemes
- Descriptive labeling and help text

## 🔄 Data Import/Export

### Supported Formats
- **PDF**: Complete FMEA reports with charts and metadata
- **Excel**: Multi-sheet workbooks with data, actions, and summaries
- **JSON**: Raw data export for integration

### Export Options
- Filter by RPN threshold, status, or owner
- Include/exclude charts and metadata
- Custom date ranges for actions
- Professional formatting and branding

## 🎓 Getting Started Guide

### First-Time Setup
1. Create your first project using the guided wizard
2. Configure asset information and context
3. Add initial failure modes (AI can suggest starting points)
4. Build out causes, effects, and controls
5. Review risk calculations and prioritize actions

### Best Practices
- Use descriptive failure mode names
- Leverage AI suggestions but validate with expertise
- Regular review and update of risk assessments
- Document assumptions and rationale
- Export regular backups of critical analyses

## 🐛 Troubleshooting

### Common Issues

**Database Connection Issues**
- Ensure `data/` directory exists and is writable
- Check file permissions on SQLite database
- Restart application if database locks occur

**AI Features Not Working**
- Verify Anthropic API key in `.env.local`
- Check API key validity and quota
- Review network connectivity for API calls

**Performance Issues**
- Large datasets (>100 failure modes) may require patience
- Consider archiving old projects
- Restart application periodically for optimal performance

### Support
For issues and feature requests, create issues in the project repository or contact your system administrator.

## 📄 License

Proprietary software for local use. See license terms in your agreement.

---

**Built for reliability engineers, by reliability engineers. Enhanced with AI, secured by local deployment.**