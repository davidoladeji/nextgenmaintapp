'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, Rocket } from 'lucide-react';

export default function ImportPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-monday-paleBlue via-gray-50 to-monday-lightPurple">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center space-x-4">
          <button
            onClick={() => router.push('/')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Import from Excel</h1>
            <p className="text-sm text-gray-600">Import existing FMEA spreadsheets</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-8">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-monday-teal to-monday-lime rounded-full flex items-center justify-center mx-auto mb-6">
            <Upload className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Excel Import Coming Soon</h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Upload your existing Excel-based FMEAs and map columns to our structure. The import wizard
            will validate data, detect gaps, and help migrate your legacy FMEAs. This feature is part of Phase 1 development.
          </p>
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-monday-lightPurple text-monday-purple rounded-lg">
            <Rocket className="w-4 h-4" />
            <span className="text-sm font-medium">Coming in Phase 1</span>
          </div>
        </div>
      </div>
    </div>
  );
}
