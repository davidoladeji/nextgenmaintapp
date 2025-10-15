# AI-Assisted FMEA Builder - Project Task Plan

## Project Overview
Build a locally-running AI-Assisted FMEA Builder MVP for M4 Pro Mac using Next.js, SQLite, and Anthropic Claude API.

## Phase 1: Project Setup & Foundation (High Priority)

### Task 1.1: Initialize Next.js Project Structure
- **Agent**: NextJS-Project-Bootstrapper
- **Dependencies**: None
- **Effort**: M
- **Deliverables**: 
  - Next.js 14+ project with App Router
  - TypeScript configuration
  - Tailwind CSS setup
  - Folder structure (/components, /app, /lib, /types)
- **Success Criteria**: `npm run dev` starts localhost:3000

### Task 1.2: Database Setup with SQLite
- **Agent**: Backend-API-Architect
- **Dependencies**: Next.js structure
- **Effort**: M
- **Deliverables**:
  - better-sqlite3 integration
  - Database schema for FMEA data
  - Migration scripts
- **Success Criteria**: Local SQLite database creates and connects

### Task 1.3: Environment Configuration
- **Agent**: DevOps-Automator
- **Dependencies**: Project structure
- **Effort**: S
- **Deliverables**:
  - .env.local template
  - Local setup scripts
  - M4 Mac optimization configs
- **Success Criteria**: Environment variables load correctly

## Phase 2: Backend API Development (High Priority)

### Task 2.1: Core API Routes
- **Agent**: Backend-API-Architect
- **Dependencies**: Database setup
- **Effort**: L
- **Deliverables**:
  - FMEA CRUD endpoints
  - User authentication (local JWT)
  - Project management APIs
  - Risk calculation logic
- **Success Criteria**: All API endpoints respond correctly

### Task 2.2: AI Integration Proxy
- **Agent**: AI-Engineer
- **Dependencies**: Core APIs
- **Effort**: M
- **Deliverables**:
  - Anthropic Claude API integration
  - Structured prompts for FMEA suggestions
  - AI assistance levels (Limited/Medium/Full)
- **Success Criteria**: AI suggestions generate and insert correctly

## Phase 3: Frontend UI Development (High Priority)

### Task 3.1: Core UI Components
- **Agent**: Frontend-Designer & UI-Designer
- **Dependencies**: Next.js setup
- **Effort**: L
- **Deliverables**:
  - Smart Table component (ag-grid-react)
  - Collapsible Card views
  - Responsive toolbar with tooltips
  - AI Copilot panel (chat interface)
- **Success Criteria**: All components render and interact properly

### Task 3.2: FMEA Builder Interface
- **Agent**: Frontend-Designer
- **Dependencies**: UI components
- **Effort**: L
- **Deliverables**:
  - Inline editing functionality
  - RPN auto-calculation
  - Expandable failure mode details
  - Context-aware AI suggestions
- **Success Criteria**: Full FMEA workflow functions locally

### Task 3.3: Asset Setup Wizard
- **Agent**: UI-Designer
- **Dependencies**: Core UI
- **Effort**: M
- **Deliverables**:
  - Step-by-step asset configuration
  - Metadata input forms
  - Standards/templates selection
- **Success Criteria**: Asset setup saves to local database

## Phase 4: Dashboard & Visualization (Medium Priority)

### Task 4.1: Dashboard Charts
- **Agent**: Frontend-Designer
- **Dependencies**: FMEA data structure
- **Effort**: M
- **Deliverables**:
  - RPN Heatmap (Recharts)
  - Top 10 Risks bar chart
  - Risk distribution charts
  - Interactive filtering
- **Success Criteria**: Charts render with real FMEA data

### Task 4.2: Summary & Analytics
- **Agent**: Frontend-Designer
- **Dependencies**: Dashboard charts
- **Effort**: M
- **Deliverables**:
  - Summary tab with key metrics
  - Validation flags
  - Export preview
- **Success Criteria**: Summary accurately reflects FMEA status

## Phase 5: Export & Integration (Medium Priority)

### Task 5.1: PDF Export
- **Agent**: Backend-API-Architect
- **Dependencies**: FMEA data structure
- **Effort**: M
- **Deliverables**:
  - jsPDF integration
  - Hierarchical PDF layout
  - Charts and metadata inclusion
- **Success Criteria**: PDF exports with full hierarchy

### Task 5.2: Excel Export
- **Agent**: Backend-API-Architect
- **Dependencies**: PDF export
- **Effort**: M
- **Deliverables**:
  - xlsx library integration
  - Multi-sheet exports
  - Data/actions/summary sheets
- **Success Criteria**: Excel files open correctly with data

## Phase 6: Testing & Quality Assurance (Medium Priority)

### Task 6.1: Unit Testing
- **Agent**: QA-Test-Engineer
- **Dependencies**: Core functionality
- **Effort**: M
- **Deliverables**:
  - Jest test suite
  - Component testing
  - API endpoint testing
- **Success Criteria**: 80%+ test coverage

### Task 6.2: Integration Testing
- **Agent**: API-Tester
- **Dependencies**: Unit tests
- **Effort**: M
- **Deliverables**:
  - End-to-end workflows
  - AI integration testing
  - Export functionality testing
- **Success Criteria**: All workflows complete successfully

### Task 6.3: Security Audit
- **Agent**: Security-Auditor
- **Dependencies**: Complete application
- **Effort**: S
- **Deliverables**:
  - Security vulnerability assessment
  - API key protection audit
  - Local data security review
- **Success Criteria**: No critical security issues

## Phase 7: Documentation & Deployment (High Priority)

### Task 7.1: User Documentation
- **Agent**: Content-Writer
- **Dependencies**: Complete application
- **Effort**: M
- **Deliverables**:
  - README.md with setup instructions
  - In-app help text and tooltips
  - M4 Mac specific guidance
- **Success Criteria**: User can set up and run app from README

### Task 7.2: Code Quality & Refactoring
- **Agent**: Code-Refactorer
- **Dependencies**: All features complete
- **Effort**: M
- **Deliverables**:
  - Clean, commented code
  - Performance optimizations
  - M4 Mac ARM64 compatibility
- **Success Criteria**: Code is maintainable and performant

### Task 7.3: Final Packaging
- **Agent**: Project-Shipper
- **Dependencies**: Documentation complete
- **Effort**: S
- **Deliverables**:
  - Complete project package
  - Installation verification
  - Deployment checklist
- **Success Criteria**: Application runs out-of-the-box locally

## Critical Path Dependencies
1. Next.js Setup → Database Setup → API Development
2. UI Components → FMEA Interface → Dashboard
3. AI Integration → FMEA Suggestions → Testing
4. Core Features → Exports → Documentation → Final Package

## Local Development Priorities
- SQLite for zero-config database
- localhost:3000 development server
- .env.local for API key storage
- Local file exports (no cloud storage)
- M4 Mac ARM64 native performance
- No external service dependencies

## Success Metrics
- Application starts with `npm run dev`
- FMEA data persists locally
- AI suggestions generate correctly
- Exports create valid PDF/Excel files
- Responsive UI works on different screen sizes
- Performance handles 50+ failure modes smoothly