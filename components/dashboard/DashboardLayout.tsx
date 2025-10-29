'use client';

import { useUI } from '@/lib/store';
import Sidebar from './Sidebar';
import Header from './Header';
import AIPanel from '../ai/AIPanel';
import OnboardingGuide from '../onboarding/OnboardingGuide';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useUI();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex">
      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-80'} transition-all duration-300 flex-shrink-0 sticky top-0 h-screen overflow-y-auto`}>
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="flex-1">
          {children}
        </main>

        {/* Floating AI Chat Widget */}
        <AIPanel />

        {/* Onboarding Guide */}
        <OnboardingGuide />
      </div>
    </div>
  );
}
