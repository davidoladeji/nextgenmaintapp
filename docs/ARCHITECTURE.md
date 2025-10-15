# AI-Assisted FMEA Builder - System Architecture Documentation

## Executive Summary

The AI-Assisted FMEA Builder is a locally-deployed Next.js application designed for reliability engineering professionals to perform Failure Mode and Effects Analysis (FMEA) with AI assistance from Anthropic Claude. The system runs entirely on the user's machine (optimized for M4 Pro Mac) with local data storage and secure AI API integration.

**Key Features Currently Implemented:**
- Local JSON-based database storage
- AI-powered FMEA suggestions via Claude API
- Interactive dashboard with project management
- Real-time risk calculations (RPN scoring)
- Authentication and user session management
- Responsive web interface with modern UI components

## System Overview

### Technology Stack

**Frontend:**
- Next.js 14 (App Router architecture)
- React 18 with TypeScript
- Tailwind CSS for styling
- Zustand for state management
- AG Grid for data tables
- Recharts for data visualization
- Framer Motion for animations

**Backend:**
- Next.js API routes
- JSON file-based database (development/fallback)
- JWT authentication
- Node.js filesystem operations

**AI Integration:**
- Anthropic Claude API (claude-sonnet-4-20250514)
- Structured prompt engineering
- Fallback mechanisms for offline operation

**Development Tools:**
- TypeScript for type safety
- Jest for testing
- ESLint for code quality
- pnpm for package management

## Application Architecture

### Project Structure
```
nextmint-app/
├── app/                    # Next.js App Router
│   ├── api/               # Backend API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── ai/            # AI service endpoints
│   │   ├── projects/      # Project management APIs
│   │   └── failure-modes/ # FMEA data operations
│   ├── globals.css        # Global styling
│   ├── layout.tsx         # Root application layout
│   └── page.tsx           # Main application entry
├── components/            # React components
│   ├── auth/              # Login/register forms
│   ├── dashboard/         # Main dashboard UI
│   ├── fmea/              # FMEA builder components
│   ├── project/           # Project management UI
│   ├── ai/                # AI assistant panel
│   └── onboarding/        # User onboarding flow
├── lib/                   # Core services and utilities
│   ├── database-simple.ts # JSON file database layer
│   ├── ai.ts              # Claude API integration
│   ├── auth.ts            # Authentication service
│   └── store.ts           # Zustand state management
├── types/                 # TypeScript type definitions
└── data/                  # Local data storage directory
```

## Data Architecture

### Database Implementation

The application uses a simple JSON file-based database for development and fallback scenarios:

**Location:** `/data/fmea-data.json`

**Structure:**
```json
{
  "users": [],
  "sessions": [],
  "projects": [],
  "assets": [],
  "failureModes": [],
  "causes": [],
  "effects": [],
  "controls": [],
  "actions": []
}
```

### Core Data Models

**Project Entity:**
```typescript
interface Project {
  id: string;
  name: string;
  description: string | null;
  assetId: string;
  userId: string;
  status: 'active' | 'archived' | 'template';
  createdAt: Date;
  updatedAt: Date;
}
```

**Failure Mode Entity:**
```typescript
interface FailureMode {
  id: string;
  project_id: string;
  process_step: string;
  failure_mode: string;
  status: 'active' | 'closed' | 'on-hold';
  created_at: string;
  updated_at: string;
}
```

**Risk Calculation:**
- **RPN (Risk Priority Number)** = Severity × Occurrence × Detection
- Scale: 1-10 for each factor
- RPN Range: 1-1000

## Component Architecture

### Main Application Flow

1. **Authentication Layer** (`/components/auth/`)
   - LoginForm component handles user authentication
   - JWT token storage in localStorage
   - Session validation on app initialization

2. **Dashboard Layout** (`/components/dashboard/`)
   - Header with user info and navigation
   - Collapsible sidebar for project navigation
   - Main content area for FMEA builder
   - Floating AI assistant panel

3. **Project Management** (`/components/project/`)
   - ProjectSelector for choosing active projects
   - CreateProjectModal for new project setup
   - Asset configuration wizard

4. **FMEA Builder** (`/components/fmea/`)
   - Interactive table for failure mode data
   - Expandable cards for detailed views
   - Real-time RPN calculations
   - AI-powered suggestion integration

### State Management (Zustand)

**Auth Store:**
```typescript
interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
}
```

**Project Store:**
```typescript
interface ProjectState {
  currentProject: Project | null;
  projects: Project[];
  failureModes: FailureMode[];
}
```

**UI Store:**
```typescript
interface UIState {
  sidebarCollapsed: boolean;
  aiChatMinimized: boolean;
  selectedFailureModeId: string | null;
  aiConfig: AIConfig;
}
```

## API Architecture

### Authentication Endpoints

- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - Session termination
- `GET /api/auth/validate` - Token validation

### Project Management APIs

- `GET /api/projects` - List user projects
- `POST /api/projects` - Create new project
- `GET /api/projects/[id]` - Get project details
- `GET /api/projects/[id]/metrics` - Dashboard metrics

### FMEA Data Operations

- `GET /api/projects/[id]/failure-modes` - List failure modes
- `POST /api/projects/[id]/failure-modes` - Create failure mode
- `POST /api/failure-modes/[id]/causes` - Add causes
- `POST /api/failure-modes/[id]/effects` - Add effects
- `POST /api/failure-modes/[id]/controls` - Add controls
- `POST /api/failure-modes/[id]/actions` - Add actions

### AI Service Endpoints

- `POST /api/ai/suggest` - Get AI suggestions for FMEA elements
- `POST /api/ai/explain` - Get risk explanations
- `GET /api/ai/status` - Check AI service availability
- `POST /api/ai/chat` - Interactive AI chat

## AI Integration Architecture

### Claude API Integration

**Service Class:** `AIService` in `/lib/ai.ts`

**Key Methods:**
- `suggestFailureModes()` - Generate failure mode suggestions
- `suggestCauses()` - Analyze potential causes
- `suggestEffects()` - Identify failure effects
- `suggestControls()` - Recommend control measures
- `explainRisk()` - Provide risk assessment explanations

**Prompt Engineering:**
```typescript
interface AIPromptContext {
  asset: Asset;
  failureMode?: Partial<FailureMode>;
  cause?: Partial<Cause>;
  effect?: Partial<Effect>;
  existingData?: {
    failureModes: FailureMode[];
    causes: Cause[];
    effects: Effect[];
  };
}
```

**Fallback Mechanisms:**
- Local suggestion fallbacks when AI is unavailable
- Graceful degradation with default risk scores
- Error handling with user-friendly messages

### AI Configuration

**Assistance Levels:**
- **Limited:** Explanations and guidance only
- **Medium:** Suggestions with user confirmation (default)
- **Full:** Auto-suggestions with editing capability

## Security Architecture

### Authentication System

**JWT Implementation:**
- Local token storage in localStorage
- Server-side token validation
- Session expiration handling
- Automatic token refresh

**API Security:**
- Bearer token authentication
- Request validation middleware
- CORS configuration
- Environment variable protection

### Data Security

**Local Data Storage:**
- All FMEA data stored locally in JSON files
- No cloud data transmission for sensitive information
- API keys secured in environment variables
- User password hashing with bcrypt

## Performance Architecture

### Optimization Strategies

**Frontend Performance:**
- Component lazy loading
- Efficient state updates with Zustand
- Memoized computations for RPN calculations
- Virtualized tables for large datasets

**Backend Performance:**
- In-memory JSON data operations
- Efficient file I/O with Node.js fs module
- Cached AI responses where appropriate
- Optimized database queries

### M4 Mac Optimizations

**Configuration in `next.config.js`:**
```javascript
const nextConfig = {
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  }
}
```

## Export and Integration

### Current Export Capabilities

**PDF Generation:**
- jsPDF library integration
- Hierarchical report structure
- Chart and metadata inclusion
- Custom styling and branding

**Excel Export:**
- xlsx library integration
- Multi-sheet workbook structure
- Data, actions, and summary sheets
- Formatted tables and charts

**Export Configuration:**
```typescript
interface ExportConfig {
  includeMetadata: boolean;
  includeCharts: boolean;
  includeSummary: boolean;
  filterBy: {
    rpnThreshold?: number;
    status?: string[];
    owner?: string[];
  };
}
```

## Development and Deployment

### Local Development Setup

**Prerequisites:**
- Node.js 18+ (ARM64 support for M4 Pro)
- pnpm package manager
- Anthropic API key

**Installation Process:**
```bash
cd nextmint-app
pnpm install
cp .env.local.example .env.local
pnpm run dev
```

**Development Server:**
- Runs on `http://localhost:3030`
- Hot reload enabled
- TypeScript compilation
- Tailwind CSS processing

### Environment Configuration

**Required Environment Variables:**
```env
ANTHROPIC_API_KEY=your_api_key_here
JWT_SECRET=your_random_jwt_secret_here
```

**Database Initialization:**
- Automatic JSON file creation
- Schema validation on startup
- Default admin user creation

## Testing Architecture

### Testing Framework

**Unit Testing:**
- Jest test runner
- React Testing Library for component tests
- API endpoint testing with supertest
- TypeScript type checking

**Test Coverage:**
- Component rendering tests
- API endpoint functionality
- Database operations
- AI service integration
- Authentication flows

### Quality Assurance

**Code Quality Tools:**
- ESLint for code standards
- TypeScript for type safety
- Prettier for code formatting
- Pre-commit hooks for validation

## Monitoring and Logging

### Application Monitoring

**Development Logging:**
- Console logging for API requests
- Database operation tracking
- AI service call monitoring
- Error tracking and reporting

**Performance Monitoring:**
- Component render timing
- API response times
- Memory usage tracking
- File I/O performance

## Future Scalability Considerations

### Database Migration Path

**Current JSON File System:**
- Simple file-based storage
- Suitable for small to medium datasets
- Easy backup and restoration

**Potential SQLite Migration:**
- Better-sqlite3 integration prepared
- Structured schema design
- ACID compliance for data integrity
- Query optimization capabilities

### Component Scalability

**Modular Architecture:**
- Loosely coupled components
- Reusable UI elements
- Extensible data models
- Plugin-ready AI integration

## Conclusion

The AI-Assisted FMEA Builder represents a sophisticated yet accessible solution for reliability engineering professionals. By combining modern web technologies with AI assistance and local deployment, it provides a secure, efficient, and user-friendly platform for conducting comprehensive failure mode and effects analysis.

The architecture prioritizes local operation, data security, and professional-grade functionality while maintaining the flexibility to scale and adapt to evolving requirements. The integration with Anthropic Claude AI enhances the traditional FMEA process with intelligent suggestions and explanations, making it more efficient and comprehensive for reliability engineers.