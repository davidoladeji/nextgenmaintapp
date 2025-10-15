# UI/UX Audit & Comprehensive Fix Plan

**Date:** 2025-10-14
**Status:** Active Implementation
**Reference:** This document tracks all UI/UX fixes for the comprehensive sweep

---

## ✅ FIXES COMPLETED

### **Fix 1.1: Organization Switch Now Clears Project** ✅
**File:** `components/organization/OrganizationSwitcher.tsx` line 52
**Change:** Added `setCurrentProject(null)` when switching organizations
**Result:** User returns to organization dashboard (project list) when switching orgs

### **Fix 1.2: Demo Credentials - All 3 Accounts Shown** ✅
**File:** `components/auth/LoginForm.tsx` lines 257-276
**Accounts displayed:**
1. Superadmin: `superadmin@nextgenmaint.com / super123`
2. OgenticAI Admin: `admin@fmea.local / admin123` (has existing project)
3. Demo Corp Admin: `john@democorp.com / demo123` (fresh org)

---

## 🔧 IN PROGRESS

### **Fix 2: Wire Up All Non-Functional Sidebar Buttons**

**Buttons to fix in `components/dashboard/Sidebar.tsx`:**

#### **Organization Dashboard View (No Project):**
1. ✅ Line 146: "New Project" → Open CreateProjectModal
2. ✅ Line 150: "Import from Excel" → Navigate to /import page
3. ✅ Line 154: "Browse Templates" → Navigate to /templates page
4. ✅ Line 237: "Team Members" → Navigate to /teams page
5. ✅ Line 241: "Settings" → Navigate to /settings page

#### **Superadmin Section:**
6. ✅ Line 215: "Admin Dashboard" → Already working (router.push('/admin'))
7. ✅ Line 221: "All Organizations" → Navigate to /admin/organizations
8. ✅ Line 225: "All Users" → Navigate to /admin/users

#### **Project Workspace View (Project Selected):**
9. ✅ Line 439: "Share Project" → Open ShareProjectModal
10. ✅ Line 443: "Project Settings" → Open ProjectSettingsModal

---

## 📄 PAGES TO CREATE

### **Core Pages:**
1. `/teams` - Team members management (reuses TeamMembersPage component)
2. `/settings` - Organization settings editor
3. `/admin/organizations` - All organizations table (superadmin)
4. `/admin/users` - All users table (superadmin)
5. `/admin/settings` - Platform configuration (superadmin)

### **Workflow Pages:**
6. `/invite/[token]` - Standalone invitation acceptance
7. `/templates` - Template library browser (Phase 1 feature)
8. `/import` - Excel import wizard (Phase 1 feature)

### **Modal Components:**
9. `components/project/ProjectSettingsModal.tsx` - Edit project details

---

## 🎨 VISUAL & UX IMPROVEMENTS

### **AI Panel Fixes:**
- Fix drag handle icon (either remove or make it the only drag target)
- Change Minimize2 icon to ChevronDown for clarity
- Add "Minimize Chat" tooltip

### **Onboarding Tour Updates:**
- Add step explaining organization concept
- Add step for organization switcher
- Update sidebar step to mention context-aware behavior
- Add step for project selection workflow

### **Button Styling:**
- Ensure all buttons have consistent hover states
- Standardize spacing between button groups
- Fix any alignment issues

---

## 📊 IMPLEMENTATION TRACKING

**Priority 1 (Critical):**
- [x] Organization switch clears project
- [x] Demo credentials show all 3 accounts
- [ ] All sidebar buttons functional

**Priority 2 (High):**
- [ ] Create /teams, /settings pages
- [ ] Create /admin/* pages
- [ ] ProjectSettingsModal

**Priority 3 (Medium):**
- [ ] /invite/[token] page
- [ ] AI Panel icon fixes
- [ ] Tour updates

**Priority 4 (Low - Phase 1):**
- [ ] /templates page
- [ ] /import page

---

**Next:** Continue wiring up sidebar buttons and creating missing pages
