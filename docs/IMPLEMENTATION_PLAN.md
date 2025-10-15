# NextGenMaint - SaaS Transformation Implementation Plan

**Document Version:** 1.0
**Last Updated:** 2025-10-13
**Status:** Active Development Plan

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current Implementation Status](#current-implementation-status)
3. [Gap Analysis](#gap-analysis)
4. [Architecture Changes](#architecture-changes)
5. [Implementation Phases](#implementation-phases)
6. [Technical Specifications](#technical-specifications)
7. [Success Criteria](#success-criteria)

---

## 🎯 Executive Summary

This document outlines the transformation of NextGenMaint from a single-user FMEA tool into an enterprise-ready, multi-tenant SaaS platform with advanced collaboration features.

**Primary Objectives:**
1. Implement multi-tenancy with organization-level data isolation
2. Build comprehensive RBAC system with 6 role levels including superadmin
3. Enable team collaboration through invitations and project sharing
4. Create context-aware UI that adapts based on user state

**Core Principles:**
- Preserve all existing features that work well. Only add genuinely missing SaaS capabilities.
- **One project, one organization:** Each project belongs to exactly ONE organization (enforced via `organization_id` field)
- Projects can be shared with multiple users via `project_members`, but the project itself remains in one organization

---

## ✅ Current Implementation Status

### **Fully Implemented & Working**

#### **1. Smart Table (Component → Failure Mode → Effects)**
- ✅ 3-level hierarchical structure
- ✅ Context-aware Quick Add buttons (+Component, +Failure Mode when component selected, +Cause/+Effect when FM selected)
- ✅ All 16 columns in Effects Table
- ✅ Color-coded RPN cells (Red >150, Orange 100-150, Yellow 70-99, Green <70)
- ✅ Inline editing
- ✅ Collapsible sections with smooth animations
- ✅ Auto-calculation of RPNs
- **Location:** `components/fmea/SmartTable.tsx`

#### **2. Dashboard with Complete Chart Suite**
- ✅ Metrics Toolbar (8 metrics: Total RPN, Components Analyzed, Mitigations Closed %, Open Actions, Failure Modes Assessed, High-Risk Items, Avg RPN Reduction, Highest RPN)
- ✅ Interactive Filters (Component multi-select, Risk Level)
- ✅ Heat Map Chart (components with FM tiles)
- ✅ Risks Bubble Chart (sized by RPN)
- ✅ Pareto Chart (80/20 analysis)
- ✅ Top 10 Risks Bar Chart
- ✅ Risk Breakdown (3 donuts for SEV/OCC/DET)
- ✅ Top-Performing Mitigations (ΔRPN bar chart)
- ✅ Effects Without Control Table
- ✅ Cross-filtering (click any chart element filters all views)
- ✅ Active filters banner with "Clear All" button
- **Location:** `components/dashboard/DashboardOverview.tsx` + individual chart components

#### **3. Setup & Summary Tabs**
- ✅ Setup Tab: Custom RPN thresholds, SEV/OCC/DET scale configuration, color coding
- ✅ Summary Tab: Executive summary, top 5 risks, key metrics, project metadata, recommendations
- **Locations:** `components/fmea/SetupTab.tsx`, `components/fmea/SummaryTab.tsx`

#### **4. AI Features**
- ✅ AI Copilot Panel (right side, collapsible, context-aware chat)
- ✅ AI Suggestions Modal (bulk suggestions for failure modes/causes/effects)
- ✅ AI-powered explanations
- ✅ Quick-insert buttons from AI suggestions
- **Locations:** `components/ai/AIPanel.tsx`, `components/ai/AISuggestionsModal.tsx`

#### **5. Visual Design**
- ✅ Monday.com-inspired color palette (purple #6161FF, pink #FF5AC4, teal #00CCC7)
- ✅ Vibrant gradients throughout
- ✅ Professional, modern UI
- ✅ Smooth transitions and hover effects
- **Locations:** `tailwind.config.js`, `app/globals.css`

#### **6. Basic Authentication**
- ✅ Email/password login
- ✅ User registration
- ✅ Session management
- ✅ Token-based auth
- ✅ Basic roles: 'standard' | 'admin'
- **Locations:** `app/api/auth/**`, `components/auth/LoginForm.tsx`

#### **7. Project Management**
- ✅ Create projects
- ✅ Project selector
- ✅ Save/load projects
- ✅ Project-scoped data
- **Locations:** `components/project/`, `app/api/projects/**`

---

## ❌ Gap Analysis - Truly Missing Features

### **1. MULTI-TENANCY & ORGANIZATION MANAGEMENT** 🏢

**Status:** **NOT IMPLEMENTED**
**Priority:** **CRITICAL** (Blocker for SaaS)
**User Requirement:** "This project is going to be an eventual SaaS for organisations"

#### Current State:
```
Users → Projects (flat structure)
❌ No organization concept
❌ No data isolation between companies
❌ All users see all projects
```

#### Required State:
```
Superadmin (platform-wide)
  └─ Organizations (Company A, Company B, etc.)
      ├─ Organization Members (users with roles)
      ├─ Projects (org-scoped)
      │   └─ Project Members (shared access)
      └─ Templates & Settings (org-scoped)
```

#### Missing Components:

**Database Entities:**
- `Organization` - Core tenant entity
- `OrganizationMember` - User membership with roles
- `OrganizationSettings` - Org-level configurations
- `OrganizationInvitation` - Pending invites

**Type Definitions Needed:**
```typescript
interface Organization {
  id: string;
  name: string;
  slug: string; // URL-friendly identifier
  logo_url?: string;
  plan: 'free' | 'starter' | 'professional' | 'enterprise';
  max_users: number;
  max_projects: number;
  created_at: string;
  updated_at: string;
}

interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'org_admin' | 'project_manager' | 'editor' | 'viewer';
  invited_by: string;
  joined_at: string;
  last_active_at: string;
}

interface OrganizationSettings {
  default_rpn_thresholds: RiskConfig;
  allowed_standards: string[];
  branding: {
    primary_color: string;
    logo_url: string;
  };
}
```

**UI Components Needed:**
1. `components/organization/OrganizationSwitcher.tsx` - Dropdown to switch between orgs
2. `components/organization/CreateOrganizationModal.tsx` - Create new org
3. `components/organization/OrganizationSettingsPage.tsx` - Manage org settings
4. `components/organization/TeamMembersPage.tsx` - View/manage team

**API Endpoints Needed:**
- `GET /api/organizations` - List user's organizations
- `POST /api/organizations` - Create organization
- `GET /api/organizations/[id]` - Get org details
- `PATCH /api/organizations/[id]` - Update org
- `GET /api/organizations/[id]/members` - List members
- `POST /api/organizations/[id]/members` - Add member
- `DELETE /api/organizations/[id]/members/[userId]` - Remove member

**Data Migration:**
- Existing projects must be assigned to organizations
- Create default organization for existing users

---

### **2. ADVANCED RBAC WITH SUPERADMIN** 👑

**Status:** **PARTIALLY IMPLEMENTED** (only 'standard' | 'admin')
**Priority:** **CRITICAL**
**User Requirement:** "There should be roles and priviliges per organisation and there should be a superadmin"

#### Current State:
```typescript
// types/index.ts line 124
role: 'standard' | 'admin'  // Only 2 roles, no granularity
```

#### Required State - 6-Tier Role System:

**1. SUPERADMIN** (Platform-Wide)
- Full access to all organizations
- Manage all users across all orgs
- Platform configuration
- Billing & subscription management
- Analytics across all organizations
- **Scope:** Global

**2. ORG_ADMIN** (Organization-Level)
- Manage organization settings
- Invite/remove team members
- Assign roles within org
- View all org projects
- Manage org billing
- **Scope:** Single organization

**3. PROJECT_MANAGER** (Organization-Level)
- Create new projects
- Delete projects they own
- Invite team members to projects
- Assign project-level roles
- Cannot manage organization settings
- **Scope:** Organization (subset of projects)

**4. EDITOR** (Project-Level)
- Full edit access to assigned projects
- Add/edit/delete failure modes, causes, effects, controls, actions
- Cannot delete projects
- Cannot manage team access
- **Scope:** Specific projects only

**5. VIEWER** (Project-Level)
- Read-only access to assigned projects
- View dashboards and exports
- Cannot edit any FMEA data
- Can add comments (Phase 2)
- **Scope:** Specific projects only

**6. GUEST** (Temporary Project Access)
- Limited-time access via invite link
- View-only with expiration
- Cannot be added as permanent member
- Ideal for external consultants/auditors
- **Scope:** Single project, time-limited

#### Permission Matrix:

| Action | Superadmin | Org Admin | Proj Manager | Editor | Viewer | Guest |
|--------|------------|-----------|--------------|--------|--------|-------|
| Manage all organizations | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Create organization | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Manage org settings | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Invite org members | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Remove org members | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create projects | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Delete projects | ✅ | ✅ | ✅ (own) | ❌ | ❌ | ❌ |
| Share project | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Edit FMEA data | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| View FMEA data | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (limited) |
| Export reports | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Add comments | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |

#### Implementation Requirements:

**Type Updates Needed:**
```typescript
// Update User interface
interface User {
  id: string;
  email: string;
  name: string;
  is_superadmin: boolean; // Global flag
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

// Organization-level role
interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'org_admin' | 'project_manager' | 'editor' | 'viewer';
  // ... other fields
}

// Project-level role (for sharing)
interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: 'owner' | 'editor' | 'viewer';
  access_granted_by: string;
  access_granted_at: string;
}

// Guest access (temporary)
interface ProjectGuestAccess {
  id: string;
  project_id: string;
  email: string;
  token: string;
  expires_at: string;
  created_by: string;
  created_at: string;
}
```

**Permission Utility Functions:**
```typescript
// lib/permissions.ts (NEW FILE)

// Platform-level checks
export function isSuperAdmin(user: User): boolean;

// Organization-level checks
export function canManageOrganization(user: User, orgId: string): boolean;
export function canInviteToOrganization(user: User, orgId: string): boolean;
export function canCreateProjects(user: User, orgId: string): boolean;

// Project-level checks
export function canViewProject(user: User, projectId: string): boolean;
export function canEditProject(user: User, projectId: string): boolean;
export function canDeleteProject(user: User, projectId: string): boolean;
export function canShareProject(user: User, projectId: string): boolean;

// Get effective role
export function getUserRoleInProject(userId: string, projectId: string): Role;
export function getUserRoleInOrganization(userId: string, orgId: string): Role;
```

**Middleware for API Routes:**
```typescript
// lib/rbac-middleware.ts (NEW FILE)

export function requireSuperAdmin(handler);
export function requireOrganizationAccess(handler, minRole);
export function requireProjectAccess(handler, minRole);

// Usage in API routes:
export const GET = requireProjectAccess(async (req, context) => {
  // Handler logic
}, 'viewer'); // Minimum role required
```

---

### **3. TEAM COLLABORATION & INVITATIONS** 📧

**Status:** **NOT IMPLEMENTED**
**Priority:** **CRITICAL**
**User Requirement:** "Users should be able to invite team mates and collaborate on projects"

#### Missing Features:

**A. Organization-Level Invitations**

Purpose: Add new team members to the organization

**Workflow:**
1. Org Admin clicks "Invite Team Member"
2. Enters email + selects role (Org Admin / Project Manager / Editor / Viewer)
3. System sends email with invitation link
4. Recipient clicks link → creates account or logs in → auto-joins organization
5. New member appears in team list

**UI Components Needed:**
- `components/organization/InviteMemberModal.tsx`
  - Email input field
  - Role selector dropdown
  - Custom welcome message (optional)
  - "Send Invitation" button

- `components/organization/TeamMembersPage.tsx`
  - Table of all organization members
  - Columns: Name, Email, Role, Joined Date, Last Active
  - Actions: Change Role, Remove Member
  - "Pending Invitations" section (sent but not accepted)

- `components/invitation/AcceptInvitationPage.tsx`
  - Shows organization name and inviter
  - "Create Account" form if new user
  - "Join Organization" button if existing user
  - Auto-redirect to dashboard after acceptance

**Database Entity:**
```typescript
interface OrganizationInvitation {
  id: string;
  organization_id: string;
  email: string;
  role: 'org_admin' | 'project_manager' | 'editor' | 'viewer';
  invited_by: string; // User ID
  invitation_token: string; // Unique token for link
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  expires_at: string; // 7 days from creation
  accepted_at?: string;
  created_at: string;
}
```

**API Endpoints:**
- `POST /api/organizations/[id]/invitations` - Send invitation
- `GET /api/organizations/[id]/invitations` - List pending invitations
- `DELETE /api/organizations/[id]/invitations/[invitationId]` - Cancel invitation
- `GET /api/invitations/[token]` - Validate invitation token
- `POST /api/invitations/[token]/accept` - Accept invitation

**Email Template:**
```
Subject: You've been invited to join [Organization Name] on NextGenMaint

Hi,

[Inviter Name] has invited you to join [Organization Name] as a [Role].

NextGenMaint is an AI-powered reliability engineering toolkit for FMEA analysis.

[Accept Invitation Button]

This invitation expires in 7 days.
```

---

**B. Project-Level Sharing**

Purpose: Share specific projects with team members (with different roles)

**Workflow:**
1. User opens project → clicks "Share"
2. Modal shows:
   - Current project members (list with roles)
   - "Add Member" section
     - Dropdown: Select from organization members
     - Role selector: Owner / Editor / Viewer
   - Generate shareable link (for guests)
3. Added members get notification
4. Members see project in their project list

**UI Components Needed:**
- `components/project/ShareProjectModal.tsx`
  - Current members list with role badges
  - Member selector (dropdown of org members)
  - Role assignment
  - Remove member button
  - "Generate Guest Link" section (expiring link)

- `components/project/ProjectMembersList.tsx`
  - Reusable component showing project members
  - Mini avatars in project cards

**Database Entity:**
```typescript
interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: 'owner' | 'editor' | 'viewer';
  added_by: string;
  added_at: string;
  last_accessed_at?: string;
}

interface ProjectGuestLink {
  id: string;
  project_id: string;
  token: string;
  created_by: string;
  expires_at: string;
  max_uses?: number;
  current_uses: number;
  created_at: string;
}
```

**API Endpoints:**
- `GET /api/projects/[id]/members` - List project members
- `POST /api/projects/[id]/members` - Add member to project
- `PATCH /api/projects/[id]/members/[userId]` - Change member role
- `DELETE /api/projects/[id]/members/[userId]` - Remove member
- `POST /api/projects/[id]/guest-links` - Generate guest link
- `GET /api/guest/[token]` - Validate and access project via guest link

---

**C. Activity Feed & Collaboration Indicators**

Purpose: Show who's doing what in shared projects

**UI Components:**
- `components/project/ActivityFeed.tsx` (Phase 2)
  - Recent changes to project
  - "John added failure mode: Seal Leakage"
  - "Mary updated RPN for Bearing Overheat"
  - Filter by user, date, action type

- Real-time presence indicators (Phase 2)
  - Show who's currently viewing project
  - Colored dots next to avatars

**Database Entity:**
```typescript
interface ProjectActivity {
  id: string;
  project_id: string;
  user_id: string;
  action_type: 'created' | 'updated' | 'deleted' | 'commented';
  entity_type: 'component' | 'failure_mode' | 'cause' | 'effect' | 'control' | 'action';
  entity_id: string;
  description: string; // "Added failure mode: Seal Leakage"
  metadata: any; // JSON with before/after values
  created_at: string;
}
```

---

### **4. SIDEBAR CONTEXT SWITCHING** 📱

**Status:** **PARTIALLY IMPLEMENTED**
**Priority:** **HIGH**
**User Requirement:** "The sidebar when not in a project needs to be different from when a project is opened"

#### Current State:
```typescript
// components/dashboard/Sidebar.tsx
// Shows same content regardless of project selection
// Has conditional "Back to Projects" button (lines 128-138)
// But rest of sidebar is identical
```

#### Required Changes:

**When NO Project Selected (Organization Dashboard):**
```tsx
<Sidebar>
  {/* Organization Context */}
  <OrganizationSwitcher /> {/* Dropdown to switch between orgs */}

  {/* Quick Actions */}
  <Section title="Quick Actions">
    <Button icon={Plus}>New Project</Button>
    <Button icon={Upload}>Import from Excel</Button>
    <Button icon={FileText}>Browse Templates</Button>
  </Section>

  {/* Recent Projects */}
  <Section title="Recent Projects" collapsible>
    <ProjectList items={recentProjects} limit={5} />
    <Link>View All Projects →</Link>
  </Section>

  {/* Organization Stats */}
  <Section title="Organization Overview">
    <Stat label="Total Projects" value={12} />
    <Stat label="Team Members" value={8} />
    <Stat label="Open FMEAs" value={5} />
  </Section>

  {/* Admin Section (if org_admin or superadmin) */}
  {canManageOrganization && (
    <Section title="Organization">
      <Button icon={Users}>Team Members</Button>
      <Button icon={Settings}>Organization Settings</Button>
      <Button icon={CreditCard}>Billing</Button>
    </Section>
  )}

  {/* Superadmin Section (if superadmin) */}
  {isSuperAdmin && (
    <Section title="Platform Admin">
      <Button icon={Building}>All Organizations</Button>
      <Button icon={Users}>All Users</Button>
      <Button icon={BarChart}>Platform Analytics</Button>
    </Section>
  )}
</Sidebar>
```

**When Project IS Selected (Project Workspace):**
```tsx
<Sidebar>
  {/* Project Context */}
  <ProjectHeader project={currentProject} />
  <Button icon={ArrowLeft} onClick={backToProjects}>Back to Projects</Button>

  {/* Quick Add (Context-Aware) */}
  <Section title="Quick Add">
    <Button icon={Plus} always>Add Component</Button>
    <Button icon={Plus} disabled={!selectedComponent}>Add Failure Mode</Button>
    <Button icon={Plus} disabled={!selectedFailureMode}>Add Cause</Button>
    <Button icon={Plus} disabled={!selectedFailureMode}>Add Effect</Button>
    <Button icon={Plus} disabled={!selectedFailureMode}>Add Control</Button>
  </Section>

  {/* AI Actions */}
  <Section title="AI Actions">
    {/* Existing AI buttons */}
  </Section>

  {/* Navigation & Filtering */}
  <Section title="Navigation">
    {/* Existing search and filters */}
  </Section>

  {/* Project Actions */}
  <Section title="Project">
    <Button icon={Share}>Share Project</Button>
    <Button icon={Download}>Export</Button>
    <Button icon={Settings}>Project Settings</Button>
  </Section>
</Sidebar>
```

**Implementation:**
- Update `components/dashboard/Sidebar.tsx` with conditional rendering
- Create `components/organization/OrganizationSwitcher.tsx`
- Create `components/project/RecentProjectsList.tsx`
- Add organization context to sidebar via `useOrganization()` hook

---

### **5. ASSET SETUP WIZARD** 🧙‍♂️

**Status:** **NOT IMPLEMENTED**
**Priority:** **MEDIUM** (PRD MVP requirement)
**PRD Reference:** Section 2.6

#### Current State:
```typescript
// components/project/CreateProjectModal.tsx
// Simple form with basic fields
// No wizard flow, no standards selection, no AI preview
```

#### PRD Specification:

**Multi-Step Wizard Flow:**

**Step 1: Asset Basic Information**
```tsx
<WizardStep number={1} title="Asset Information">
  <Input label="Asset Name" required />
  <Input label="Asset ID / Tag Number" />
  <Select label="Equipment Type" options={[
    'Pump', 'Motor', 'Compressor', 'Conveyor', 'Gearbox',
    'Bearing', 'Valve', 'Heat Exchanger', 'Custom'
  ]} />
  <RadioGroup label="Criticality Level">
    <Radio value="low">Low - Non-critical to operations</Radio>
    <Radio value="medium">Medium - Important but not critical</Radio>
    <Radio value="high">High - Critical to operations</Radio>
    <Radio value="critical">Critical - Safety/environmental impact</Radio>
  </RadioGroup>
</WizardStep>
```

**Step 2: Operational Context**
```tsx
<WizardStep number={2} title="Operational Context">
  <Select label="Industry" options={[
    'Mining', 'Oil & Gas', 'Utilities', 'Manufacturing',
    'Water Treatment', 'Power Generation', 'Other'
  ]} />

  <Select label="Environment" options={[
    'Indoor - Controlled', 'Outdoor - Moderate', 'Harsh - Corrosive',
    'Clean Room', 'Explosive Atmosphere', 'Subsea', 'Other'
  ]} />

  <Textarea
    label="Additional Context (Free-text)"
    placeholder="Enter any relevant information:
    - Past failure history
    - Maintenance history
    - Installation location details
    - Manufacturing configuration
    - Known issues or concerns"
    rows={8}
  />
</WizardStep>
```

**Step 3: Standards & Templates**
```tsx
<WizardStep number={3} title="Standards & Templates">
  <MultiSelect label="Applicable Standards">
    <Option value="iso-31000">ISO 31000 - Risk Management</Option>
    <Option value="iec-60812">IEC 60812 - FMEA & FMECA</Option>
    <Option value="sae-j1739">SAE J1739 - FMEA Automotive</Option>
    <Option value="as-nzs-4024">AS/NZS 4024 - Safety of Machinery</Option>
    <Option value="mil-std-1629">MIL-STD-1629 - FMEA Procedures</Option>
    <Option value="custom">Custom / Internal Standard</Option>
  </MultiSelect>

  <Select label="Template (Optional)" hint="Start with pre-built FMEA">
    <Option value="">Blank FMEA</Option>
    <Option value="centrifugal-pump">Centrifugal Pump (Generic)</Option>
    <Option value="electric-motor">Electric Motor (Generic)</Option>
    <Option value="gearbox">Gearbox (Generic)</Option>
  </Select>
</WizardStep>
```

**Step 4: Summary & AI Preview**
```tsx
<WizardStep number={4} title="Review & Create">
  <SummaryCard>
    <Item label="Asset Name" value={assetName} />
    <Item label="Type" value={equipmentType} />
    <Item label="Criticality" value={criticality} />
    <Item label="Industry" value={industry} />
    <Item label="Standards" value={standards.join(', ')} />
  </SummaryCard>

  <AIPreviewCard>
    <Icon>🤖</Icon>
    <Title>AI is ready to assist</Title>
    <Description>
      Based on your asset configuration, I can suggest:
      - 12-15 common failure modes for {equipmentType}
      - Typical causes and effects
      - Industry-standard controls
    </Description>
  </AIPreviewCard>

  <Actions>
    <Button variant="secondary" onClick={back}>Back</Button>
    <Button variant="primary" onClick={createProject}>
      Create Project & Start FMEA
    </Button>
  </Actions>
</WizardStep>
```

**New Component:**
- `components/project/AssetSetupWizard.tsx`

**Update Existing:**
- `components/project/CreateProjectModal.tsx` - Replace simple form with wizard
- `types/index.ts` - Expand Asset interface with new fields

---

### **6. EXCEL IMPORT FUNCTIONALITY** 📊

**Status:** **NOT IMPLEMENTED**
**Priority:** **HIGH** (PRD Phase 1)
**PRD Reference:** Section 2.8 "Import Existing FMEAs"

#### PRD Justification:
> "Engineers rely on legacy Excel FMEAs. Feature lowers adoption barriers. Don't force them to start from scratch — meet them where they are."

#### Required Workflow:

**Step 1: Upload**
```tsx
<ImportWizardStep title="Upload FMEA File">
  <DropZone accept=".xlsx,.csv">
    Drag & drop Excel file here, or click to browse
  </DropZone>
  <SupportedFormats>
    Supports: .xlsx (Excel 2007+), .csv (Comma-separated)
  </SupportedFormats>
</ImportWizardStep>
```

**Step 2: Column Mapping**
```tsx
<ImportWizardStep title="Map Columns">
  <Instructions>
    Match your Excel columns to FMEA fields. We've auto-detected some mappings.
  </Instructions>

  <MappingTable>
    <MappingRow>
      <ExcelColumn>Process Step</ExcelColumn>
      <Arrow>→</Arrow>
      <TargetField>
        <Select options={fmeaFields} value="process_step" />
      </TargetField>
      <Status>✅ Matched</Status>
    </MappingRow>

    <MappingRow>
      <ExcelColumn>Failure Mode Description</ExcelColumn>
      <Arrow>→</Arrow>
      <TargetField>
        <Select options={fmeaFields} value="failure_mode" />
      </TargetField>
      <Status>✅ Matched</Status>
    </MappingRow>

    <MappingRow>
      <ExcelColumn>Root Cause</ExcelColumn>
      <Arrow>→</Arrow>
      <TargetField>
        <Select options={fmeaFields} value="cause_description" />
      </TargetField>
      <Status>⚠️ Multiple causes per FM not detected</Status>
    </MappingRow>

    {/* Map all fields: Component, FM, Cause, Effect, SEV, OCC, DET, Controls, Actions */}
  </MappingTable>

  <Actions>
    <Button onClick={saveMapping}>Save as Template</Button>
    <Button onClick={loadMapping}>Load Saved Mapping</Button>
  </Actions>
</ImportWizardStep>
```

**Step 3: Preview & Validate**
```tsx
<ImportWizardStep title="Preview & Validate">
  <ValidationSummary>
    <Success>✅ 45 failure modes found</Success>
    <Success>✅ 89 causes identified</Success>
    <Success>✅ 134 effects mapped</Success>
    <Warning>⚠️ 12 rows missing SEV/OCC/DET values</Warning>
    <Warning>⚠️ 5 effects have no controls assigned</Warning>
    <Error>❌ 3 rows have invalid RPN calculations</Error>
  </ValidationSummary>

  <PreviewTable>
    {/* Show first 10 rows of parsed data */}
  </PreviewTable>

  <AIAssistance>
    <Title>AI can help fix issues</Title>
    <Button>Suggest missing SEV/OCC/DET values</Button>
    <Button>Suggest controls for unprotected effects</Button>
  </AIAssistance>
</ImportWizardStep>
```

**Step 4: Import**
```tsx
<ImportWizardStep title="Import Complete">
  <SuccessAnimation />
  <Summary>
    Successfully imported:
    - 45 Failure Modes
    - 89 Causes
    - 134 Effects
    - 67 Controls
    - 23 Actions
  </Summary>

  <Actions>
    <Button onClick={goToSmartTable}>Open Smart Table</Button>
    <Button onClick={goToDashboard}>View Dashboard</Button>
  </Actions>
</ImportWizardStep>
```

**New Components:**
- `components/import/ExcelImportWizard.tsx`
- `components/import/ColumnMappingTable.tsx`
- `components/import/ImportValidationResults.tsx`

**New Utility:**
- `lib/excel-parser.ts` - Parse .xlsx/.csv files using `xlsx` library

**API Endpoint:**
- `POST /api/projects/[id]/import` - Upload and parse Excel file

**npm Package Needed:**
```bash
pnpm add xlsx
pnpm add -D @types/xlsx
```

---

### **7. STANDARDS INTEGRATION UI** 📜

**Status:** **PARTIALLY IMPLEMENTED** (Data structure exists, no UI)
**Priority:** **MEDIUM**

#### Current State:
```typescript
// types/index.ts line 112
export interface Asset {
  // ...
  standards: string[]; // Field exists!
  // ...
}

// But no UI to select standards during project creation
```

#### Missing UI Components:

**A. Standards Selector**
```tsx
// components/setup/StandardsSelector.tsx

<StandardsSelector value={selectedStandards} onChange={setSelectedStandards}>
  <StandardOption
    value="iso-31000"
    title="ISO 31000:2018"
    description="Risk Management - Guidelines"
    category="Risk Management"
    region="International"
  />

  <StandardOption
    value="iec-60812"
    title="IEC 60812:2018"
    description="Failure Modes and Effects Analysis (FMEA and FMECA)"
    category="FMEA"
    region="International"
  />

  <StandardOption
    value="sae-j1739"
    title="SAE J1739:2021"
    description="Potential Failure Mode and Effects Analysis in Design (Design FMEA)"
    category="Automotive"
    region="North America"
  />

  <StandardOption
    value="as-nzs-4024"
    title="AS/NZS 4024:2019"
    description="Safety of Machinery"
    category="Safety"
    region="Australia/New Zealand"
  />

  {/* More standards... */}

  <CustomStandardInput placeholder="Enter custom or internal standard" />
</StandardsSelector>
```

**B. Template Library (Phase 1)**
```tsx
// components/templates/TemplateLibrary.tsx

<TemplateLibrary>
  <TemplateCard
    title="Centrifugal Pump - Generic"
    description="Common failure modes for centrifugal pumps based on ISO 31000"
    standards={['iso-31000', 'iec-60812']}
    failureModes={12}
    preview={<PreviewImage />}
    onApply={applyTemplate}
  />

  <TemplateCard
    title="Electric Motor - Industrial"
    description="FMEA template for industrial electric motors"
    standards={['iec-60812']}
    failureModes={15}
  />

  {/* More templates... */}
</TemplateLibrary>
```

**Integration Points:**
1. Integrate `StandardsSelector` into `AssetSetupWizard` (Step 3)
2. Show template library after wizard completion ("Start with template or blank?")
3. Display selected standards in Setup Tab
4. AI uses selected standards to tailor suggestions

---

### **8. EXPORT VALIDATION & PREVIEW** 📄

**Status:** **BASIC EXPORT EXISTS** (needs validation layer)
**Priority:** **MEDIUM**
**PRD Reference:** Section 2.11 "Summary Tab - Export Preview & Controls"

#### Current State:
```typescript
// components/export/ExportModal.tsx exists
// But lacks validation and preview
```

#### PRD Requirements:

**A. Pre-Export Validation**

Check for common issues before allowing export:

```tsx
<ValidationChecklist>
  <ValidationItem status="error" count={3}>
    ❌ 3 Effects missing SEV/OCC/DET values
    <Action>Fix in Smart Table</Action>
  </ValidationItem>

  <ValidationItem status="warning" count={5}>
    ⚠️ 5 Effects without controls assigned
    <Action>Review & Add Controls</Action>
  </ValidationItem>

  <ValidationItem status="warning" count={8}>
    ⚠️ 8 Open actions without owner assigned
    <Action>Assign Owners</Action>
  </ValidationItem>

  <ValidationItem status="warning" count={2}>
    ⚠️ 2 Actions without due dates
    <Action>Set Due Dates</Action>
  </ValidationItem>

  <ValidationItem status="success">
    ✅ All failure modes have at least one cause
  </ValidationItem>

  <ValidationItem status="success">
    ✅ RPN calculations are valid
  </ValidationItem>
</ValidationChecklist>
```

**B. Export Controls** (enhance existing modal)

```tsx
<ExportControls>
  <Section title="Format">
    <RadioGroup>
      <Radio value="pdf">PDF (Audit/Management)</Radio>
      <Radio value="excel">Excel (Engineering Use)</Radio>
    </RadioGroup>
  </Section>

  <Section title="Include in Export">
    <Checkbox checked>FMEA Data (Components, FMs, Causes, Effects)</Checkbox>
    <Checkbox checked>Dashboard Charts</Checkbox>
    <Checkbox checked>Action Items List</Checkbox>
    <Checkbox>Compliance References (Standards)</Checkbox>
    <Checkbox disabled>AI Reasoning Notes (Phase 2)</Checkbox>
  </Section>

  <Section title="Filter Data">
    <RadioGroup>
      <Radio value="all">Export All Items</Radio>
      <Radio value="high-risk">Only High Risk (RPN > 150)</Radio>
      <Radio value="custom">Custom RPN Threshold</Radio>
    </RadioGroup>
    {filterBy === 'custom' && (
      <Input type="number" label="Minimum RPN" />
    )}
  </Section>

  <Section title="Preview">
    <Button onClick={refreshPreview}>Refresh Preview</Button>
    <PreviewPane>
      {/* Live PDF/Excel preview */}
    </PreviewPane>
  </Section>
</ExportControls>
```

**C. Validation Logic**

```typescript
// lib/export-validator.ts (NEW FILE)

interface ValidationResult {
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  canExport: boolean; // false if critical errors exist
}

export function validateFMEABeforeExport(project: Project): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  // Check for missing SEV/OCC/DET
  project.failureModes.forEach(fm => {
    fm.effects?.forEach(effect => {
      if (!effect.severity) {
        errors.push({
          type: 'missing_severity',
          entity: 'effect',
          entityId: effect.id,
          message: `Effect "${effect.description}" missing severity rating`,
          fixAction: 'Go to Smart Table and add SEV value'
        });
      }
    });

    fm.causes?.forEach(cause => {
      if (!cause.occurrence) {
        errors.push({
          type: 'missing_occurrence',
          entity: 'cause',
          entityId: cause.id,
          message: `Cause "${cause.description}" missing occurrence rating`,
        });
      }
    });
  });

  // Check for effects without controls
  project.failureModes.forEach(fm => {
    if (!fm.controls || fm.controls.length === 0) {
      warnings.push({
        type: 'no_controls',
        entity: 'failure_mode',
        entityId: fm.id,
        message: `Failure mode "${fm.failure_mode}" has no controls`,
        fixAction: 'Add prevention or detection controls'
      });
    }
  });

  // Check for actions without owners
  // Check for actions without due dates
  // etc.

  return {
    errors,
    warnings,
    canExport: errors.length === 0
  };
}
```

**Update Summary Tab:**
- Add validation section at top
- Add export controls section
- Add live preview pane (Phase 2 - complex)

---

## 🏗️ Architecture Changes Required

### **1. Database Schema Evolution**

**NEW TABLES:**

```typescript
// organizations
{
  id: string (PK)
  name: string
  slug: string (unique)
  logo_url: string?
  plan: 'free' | 'starter' | 'professional' | 'enterprise'
  max_users: number
  max_projects: number
  settings: JSON // OrganizationSettings
  created_at: timestamp
  updated_at: timestamp
}

// organization_members
{
  id: string (PK)
  organization_id: string (FK)
  user_id: string (FK)
  role: 'org_admin' | 'project_manager' | 'editor' | 'viewer'
  invited_by: string (FK to users)
  joined_at: timestamp
  last_active_at: timestamp
}

// organization_invitations
{
  id: string (PK)
  organization_id: string (FK)
  email: string
  role: string
  invited_by: string (FK)
  invitation_token: string (unique)
  status: 'pending' | 'accepted' | 'expired' | 'cancelled'
  expires_at: timestamp
  accepted_at: timestamp?
  created_at: timestamp
}

// project_members
{
  id: string (PK)
  project_id: string (FK)
  user_id: string (FK)
  role: 'owner' | 'editor' | 'viewer'
  added_by: string (FK)
  added_at: timestamp
  last_accessed_at: timestamp?
}

// project_guest_links
{
  id: string (PK)
  project_id: string (FK)
  token: string (unique)
  created_by: string (FK)
  expires_at: timestamp
  max_uses: number?
  current_uses: number
  created_at: timestamp
}

// project_activity (Phase 2)
{
  id: string (PK)
  project_id: string (FK)
  user_id: string (FK)
  action_type: string
  entity_type: string
  entity_id: string
  description: string
  metadata: JSON
  created_at: timestamp
}
```

**UPDATED TABLES:**

```typescript
// users - ADD COLUMN
{
  // ... existing fields
  is_superadmin: boolean (default false)
  avatar_url: string?
}

// projects - ADD COLUMN
{
  // ... existing fields
  organization_id: string (FK) // CRITICAL - org scoping
  created_by: string (FK)      // Track project owner
}
```

---

### **2. Context Providers Hierarchy**

```tsx
// app/layout.tsx or providers.tsx

<AuthProvider>           {/* User authentication */}
  <OrganizationProvider> {/* Current organization context */}
    <ProjectProvider>    {/* Current project context */}
      <UIProvider>       {/* UI state (sidebar collapsed, etc.) */}
        {children}
      </UIProvider>
    </ProjectProvider>
  </OrganizationProvider>
</AuthProvider>
```

**New Context:**
```typescript
// lib/organization-context.tsx (NEW FILE)

interface OrganizationContextValue {
  currentOrganization: Organization | null;
  organizations: Organization[];
  members: OrganizationMember[];
  isOrgAdmin: boolean;
  isProjectManager: boolean;
  switchOrganization: (orgId: string) => void;
  inviteMember: (email: string, role: string) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  loadOrganizations: () => Promise<void>;
}

export function useOrganization(): OrganizationContextValue;
```

---

## 📦 Implementation Phases

### **PHASE 1: Multi-Tenancy Foundation** (Days 1-2)

**Goal:** Transform from single-user to multi-tenant SaaS

#### Tasks:

**Day 1 Morning - Database & Types**
1. ✅ Update `types/index.ts`
   - Add Organization, OrganizationMember, OrganizationInvitation interfaces
   - Add ProjectMember, ProjectGuestLink interfaces
   - Update User interface (add is_superadmin)
   - Update Project interface (add organization_id)

2. ✅ Update `lib/database-simple.ts`
   - Add organizations array
   - Add organization_members array
   - Add organization_invitations array
   - Add project_members array
   - Add project_guest_links array

3. ✅ Create `lib/permissions.ts`
   - isSuperAdmin(user)
   - canManageOrganization(user, orgId)
   - canInviteToOrganization(user, orgId)
   - canCreateProjects(user, orgId)
   - canViewProject(user, projectId)
   - canEditProject(user, projectId)
   - canShareProject(user, projectId)

**Day 1 Afternoon - Core API Endpoints**
4. ✅ Create `app/api/organizations/route.ts`
   - GET - List user's organizations
   - POST - Create organization (anyone can create, becomes org_admin)

5. ✅ Create `app/api/organizations/[id]/route.ts`
   - GET - Get organization details
   - PATCH - Update organization (requires org_admin)
   - DELETE - Delete organization (requires org_admin + confirmation)

6. ✅ Create `app/api/organizations/[id]/members/route.ts`
   - GET - List organization members
   - POST - Add member (move existing invitation logic here)
   - PATCH - Update member role
   - DELETE - Remove member

7. ✅ Update `app/api/projects/route.ts`
   - Add organization_id to project creation
   - Filter projects by user's current organization
   - Check organization membership before access

**Day 2 Morning - Invitation System**
8. ✅ Create `app/api/organizations/[id]/invitations/route.ts`
   - POST - Send invitation email
   - GET - List pending invitations
   - DELETE - Cancel invitation

9. ✅ Create `app/api/invitations/[token]/route.ts`
   - GET - Validate invitation token
   - Display org name, inviter, role

10. ✅ Create `app/api/invitations/[token]/accept/route.ts`
    - POST - Accept invitation
    - Create user account if new email
    - Add user to organization_members
    - Mark invitation as accepted

**Day 2 Afternoon - Project Sharing**
11. ✅ Create `app/api/projects/[id]/members/route.ts`
    - GET - List project members
    - POST - Add member to project (with role)
    - PATCH - Update member role
    - DELETE - Remove member access

---

### **PHASE 2: Organization UI & Context Switching** (Day 3)

**Goal:** Build UI for organization management and make sidebar context-aware

#### Tasks:

**Day 3 Morning - Organization Components**
1. ✅ Create `components/organization/OrganizationSwitcher.tsx`
   - Dropdown showing all user's organizations
   - Current org indicator
   - Switch organization action
   - "Create New Organization" option
   - Position: Top of sidebar

2. ✅ Create `components/organization/CreateOrganizationModal.tsx`
   - Organization name input
   - Slug (auto-generated from name, editable)
   - Plan selector (Free/Starter/Pro/Enterprise)
   - Logo upload (optional)
   - Create button

3. ✅ Create `lib/organization-store.ts` or update `lib/store.ts`
   - Add useOrganization hook
   - Store current organization
   - Store user's organizations list
   - switchOrganization function
   - Persist current org in localStorage

**Day 3 Afternoon - Sidebar Context Switching**
4. ✅ Update `components/dashboard/Sidebar.tsx`
   - Add conditional rendering based on `currentProject`
   - Render "Organization Dashboard Sidebar" when no project
   - Render "Project Workspace Sidebar" when project selected

**No Project Selected:**
```tsx
<Sidebar>
  <OrganizationSwitcher />
  <QuickActions>
    + New Project
    + Import FMEA
    + Browse Templates
  </QuickActions>
  <RecentProjects limit={5} />
  <OrganizationStats />
  {isOrgAdmin && <AdminSection />}
  {isSuperAdmin && <PlatformAdminSection />}
</Sidebar>
```

**Project Selected:**
```tsx
<Sidebar>
  <BackButton />
  <QuickAdd contextAware />  {/* KEEP EXISTING */}
  <AIActions />              {/* KEEP EXISTING */}
  <Navigation />             {/* KEEP EXISTING */}
  <ProjectActions>
    Share Project
    Export
    Settings
  </ProjectActions>
</Sidebar>
```

5. ✅ Create `components/project/RecentProjectsList.tsx`
   - Shows last 5 accessed projects
   - Project cards with quick stats
   - Click to open project

---

### **PHASE 3: Team Collaboration UI** (Day 4)

**Goal:** Enable team invitations and project sharing

#### Tasks:

**Day 4 Morning - Team Management**
1. ✅ Create `components/organization/TeamMembersPage.tsx`
   - Table of all organization members
   - Columns: Avatar, Name, Email, Role, Joined Date, Last Active
   - Actions per row: Edit Role, Remove Member
   - "Invite Team Member" button at top
   - Pending invitations section

2. ✅ Create `components/organization/InviteMemberModal.tsx`
   - Email input (with validation)
   - Role selector (Org Admin / Project Manager / Editor / Viewer)
   - Custom message textarea (optional)
   - Send Invitation button
   - Show success: "Invitation sent to john@example.com"

3. ✅ Create `components/invitation/AcceptInvitationPage.tsx`
   - Show organization details
   - Show inviter name and role being assigned
   - If existing user: "Join [Organization]" button
   - If new user: Registration form + auto-join
   - Error states: Expired, Already Accepted, Invalid Token

**Day 4 Afternoon - Project Sharing**
4. ✅ Create `components/project/ShareProjectModal.tsx`
   - Current members list (with role badges)
   - "Add Member" section:
     - Dropdown: Select from organization members
     - Role selector: Owner / Editor / Viewer
     - Add button
   - Remove member button (with confirmation)
   - "Generate Guest Link" section:
     - Generate temporary link
     - Set expiration (1 day, 7 days, 30 days, never)
     - Copy link button
     - Revoke link button

5. ✅ Add "Share" button to project header
   - Only visible to project owners and org admins
   - Opens ShareProjectModal

---

### **PHASE 4: Asset Setup Wizard** (Day 5)

**Goal:** Better onboarding with step-by-step asset configuration

#### Tasks:

1. ✅ Create `components/project/AssetSetupWizard.tsx`
   - Multi-step wizard component
   - Progress indicator (1/4, 2/4, etc.)
   - Back/Next navigation
   - All 4 steps as specified above

2. ✅ Create `components/setup/StandardsSelector.tsx`
   - Searchable standards list
   - Multi-select with chips
   - Standard descriptions on hover
   - Integrate into wizard Step 3

3. ✅ Update `components/project/CreateProjectModal.tsx`
   - Replace simple form with AssetSetupWizard
   - Maintain backward compatibility

---

### **PHASE 5: Excel Import** (Day 6)

**Goal:** Allow importing legacy Excel FMEAs

#### Tasks:

1. ✅ Install dependencies
   ```bash
   pnpm add xlsx
   pnpm add -D @types/xlsx
   ```

2. ✅ Create `lib/excel-parser.ts`
   - parseExcelFile(file: File)
   - detectColumns(headers: string[])
   - validateImportData(data: any[])

3. ✅ Create `components/import/ExcelImportWizard.tsx`
   - All 4 steps (Upload, Map, Preview, Import)
   - Integration with excel-parser.ts

4. ✅ Create `app/api/projects/[id]/import/route.ts`
   - POST - Handle Excel upload
   - Parse and validate
   - Create Component/FM/Cause/Effect records
   - Return summary

5. ✅ Add "Import from Excel" button
   - In organization sidebar (no project selected)
   - Opens import wizard

---

### **PHASE 6: Export Validation & Polish** (Day 6)

**Goal:** Ensure audit-ready exports with validation

#### Tasks:

1. ✅ Create `lib/export-validator.ts`
   - Validation functions
   - Issue detection logic

2. ✅ Update `components/fmea/SummaryTab.tsx`
   - Add validation warnings section at top
   - Add export controls section
   - Integrate with existing export modal

3. ✅ Update `components/export/ExportModal.tsx`
   - Add validation checks
   - Add format-specific options
   - Add filter controls

---

## 🔧 Technical Specifications

### **File Structure**

```
/Users/macbook/Development/nextmint-app/
├── docs/
│   └── IMPLEMENTATION_PLAN.md ← THIS FILE
├── types/
│   ├── index.ts (UPDATE - add Organization types)
│   ├── organization.ts (NEW - org-specific types)
│   └── collaboration.ts (NEW - invitation/sharing types)
├── lib/
│   ├── permissions.ts (NEW - permission checking)
│   ├── rbac-middleware.ts (NEW - API middleware)
│   ├── organization-store.ts (NEW - org context)
│   ├── excel-parser.ts (NEW - Excel import)
│   ├── export-validator.ts (NEW - validation)
│   └── database-simple.ts (UPDATE - add new tables)
├── components/
│   ├── organization/ (NEW FOLDER)
│   │   ├── OrganizationSwitcher.tsx
│   │   ├── CreateOrganizationModal.tsx
│   │   ├── TeamMembersPage.tsx
│   │   ├── InviteMemberModal.tsx
│   │   └── OrganizationSettingsPage.tsx
│   ├── invitation/ (NEW FOLDER)
│   │   ├── AcceptInvitationPage.tsx
│   │   └── PendingInvitationsList.tsx
│   ├── import/ (NEW FOLDER)
│   │   ├── ExcelImportWizard.tsx
│   │   ├── ColumnMappingTable.tsx
│   │   └── ImportValidationResults.tsx
│   ├── setup/ (NEW FOLDER)
│   │   └── StandardsSelector.tsx
│   ├── templates/ (NEW FOLDER)
│   │   └── TemplateLibrary.tsx
│   ├── project/
│   │   ├── AssetSetupWizard.tsx (NEW)
│   │   ├── ShareProjectModal.tsx (NEW)
│   │   ├── RecentProjectsList.tsx (NEW)
│   │   └── CreateProjectModal.tsx (UPDATE)
│   ├── dashboard/
│   │   └── Sidebar.tsx (UPDATE - context switching)
│   ├── fmea/
│   │   └── SummaryTab.tsx (UPDATE - add validation)
│   └── export/
│       └── ExportModal.tsx (UPDATE - add controls)
├── app/api/
│   ├── organizations/ (NEW FOLDER)
│   │   ├── route.ts
│   │   └── [id]/
│   │       ├── route.ts
│   │       ├── members/route.ts
│   │       └── invitations/route.ts
│   ├── invitations/ (NEW FOLDER)
│   │   └── [token]/
│   │       ├── route.ts
│   │       └── accept/route.ts
│   ├── projects/
│   │   └── [id]/
│   │       ├── members/route.ts (NEW)
│   │       ├── import/route.ts (NEW)
│   │       └── route.ts (UPDATE - add org scoping)
│   └── admin/ (NEW FOLDER - superadmin endpoints)
│       ├── organizations/route.ts
│       └── users/route.ts
```

---

## 🎯 Success Criteria

### **Phase 1 Complete:**
- [ ] Users can create organizations
- [ ] Organizations have isolated data (User A in Org 1 cannot see Org 2 projects)
- [ ] Superadmin can view/manage all organizations
- [ ] All API endpoints enforce organization scoping

### **Phase 2 Complete:**
- [ ] Sidebar shows different content when no project selected
- [ ] Organization switcher works smoothly
- [ ] Organization dashboard shows relevant stats

### **Phase 3 Complete:**
- [ ] Users can invite team members via email
- [ ] Invitations can be accepted, creating accounts automatically
- [ ] Projects can be shared with specific team members
- [ ] Role-based UI rendering works (buttons hidden for viewers, etc.)

### **Phase 4-6 Complete:**
- [ ] Asset setup wizard guides new project creation
- [ ] Excel files can be imported with column mapping
- [ ] Export validation warns about data quality issues
- [ ] Standards can be selected with descriptions

---

## 📝 Notes for Implementation

### **What NOT to Change:**

**CRITICAL - PRESERVE ALL EXISTING FEATURES:**
- ✅ SmartTable 3-level hierarchy - PERFECT AS IS
- ✅ Dashboard with all charts - PERFECT AS IS
- ✅ Cross-filtering functionality - PERFECT AS IS
- ✅ AI Copilot Panel - PERFECT AS IS
- ✅ Setup Tab - PERFECT AS IS
- ✅ Summary Tab - PERFECT AS IS (just enhance with validation)
- ✅ Monday.com color scheme - PERFECT AS IS
- ✅ All visual design - PERFECT AS IS

**Principle:** Only add features that are genuinely missing. Don't rebuild what works.

### **Development Guidelines:**

1. **Always reference this document** before implementing each phase
2. **Test each phase** before moving to next
3. **Update this document** if requirements change
4. **Keep backward compatibility** - existing users should still work
5. **Follow Monday.com design language** for new components

### **Migration Strategy:**

For existing data:
1. Create default organization for existing users
2. Assign all existing projects to default org
3. Make existing users "org_admin" of their default org
4. Maintain all existing project data intact

---

## 🚀 Quick Reference - Priority Order

**MUST IMPLEMENT (Blocker for SaaS):**
1. ✅ Multi-tenancy (Organizations)
2. ✅ Superadmin + 6-tier RBAC
3. ✅ Team invitations
4. ✅ Sidebar context switching

**SHOULD IMPLEMENT (High Value):**
5. Asset setup wizard
6. Excel import
7. Export validation

**NICE TO HAVE (Polish):**
8. Standards UI
9. Template library
10. Activity feed

---

**End of Implementation Plan**

*This document will be referenced throughout development. Any changes to requirements or architecture should be reflected here.*
