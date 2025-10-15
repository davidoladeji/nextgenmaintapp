'use client';

import { useState } from 'react';
import { Settings, Save, RotateCcw } from 'lucide-react';

interface RiskThreshold {
  name: string;
  color: string;
  minRPN: number;
  maxRPN: number;
}

interface SetupTabProps {
  projectId: string;
}

export default function SetupTab({ projectId }: SetupTabProps) {
  const [thresholds, setThresholds] = useState<RiskThreshold[]>([
    { name: 'Low Risk', color: 'green', minRPN: 0, maxRPN: 69 },
    { name: 'Medium Risk', color: 'yellow', minRPN: 70, maxRPN: 99 },
    { name: 'High Risk', color: 'orange', minRPN: 100, maxRPN: 150 },
    { name: 'Critical Risk', color: 'red', minRPN: 151, maxRPN: 1000 },
  ]);

  const [severityScale, setSeverityScale] = useState({
    min: 1,
    max: 10,
    description: 'Rate the severity of the effect on the customer',
  });

  const [occurrenceScale, setOccurrenceScale] = useState({
    min: 1,
    max: 10,
    description: 'Rate the likelihood of the cause occurring',
  });

  const [detectionScale, setDetectionScale] = useState({
    min: 1,
    max: 10,
    description: 'Rate the likelihood of detecting the failure before it reaches the customer',
  });

  const [hasChanges, setHasChanges] = useState(false);

  const handleThresholdChange = (index: number, field: keyof RiskThreshold, value: string | number) => {
    const newThresholds = [...thresholds];
    newThresholds[index] = { ...newThresholds[index], [field]: value };
    setThresholds(newThresholds);
    setHasChanges(true);
  };

  const handleSaveSettings = () => {
    // Save to localStorage or API
    localStorage.setItem(`fmea-settings-${projectId}`, JSON.stringify({
      thresholds,
      severityScale,
      occurrenceScale,
      detectionScale,
    }));
    setHasChanges(false);
    alert('Settings saved successfully!');
  };

  const handleResetDefaults = () => {
    setThresholds([
      { name: 'Low Risk', color: 'green', minRPN: 0, maxRPN: 69 },
      { name: 'Medium Risk', color: 'yellow', minRPN: 70, maxRPN: 99 },
      { name: 'High Risk', color: 'orange', minRPN: 100, maxRPN: 150 },
      { name: 'Critical Risk', color: 'red', minRPN: 151, maxRPN: 1000 },
    ]);
    setSeverityScale({ min: 1, max: 10, description: 'Rate the severity of the effect on the customer' });
    setOccurrenceScale({ min: 1, max: 10, description: 'Rate the likelihood of the cause occurring' });
    setDetectionScale({ min: 1, max: 10, description: 'Rate the likelihood of detecting the failure before it reaches the customer' });
    setHasChanges(true);
  };

  const getColorClass = (color: string) => {
    const colorMap: { [key: string]: string } = {
      green: 'bg-green-500',
      yellow: 'bg-yellow-500',
      orange: 'bg-orange-500',
      red: 'bg-red-500',
    };
    return colorMap[color] || 'bg-gray-500';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-monday-purple to-monday-softPurple px-6 py-4 rounded-t-lg shadow-lg">
        <div className="flex items-center space-x-3">
          <Settings className="w-6 h-6 text-white" />
          <div>
            <h2 className="text-xl font-bold text-white">FMEA Setup & Configuration</h2>
            <p className="text-sm text-white/90">Customize risk thresholds and rating scales for your project</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* RPN Risk Thresholds Section */}
        <section>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">RPN Risk Thresholds</h3>
            <p className="text-sm text-gray-600">Define the RPN ranges for each risk level. These thresholds determine color coding throughout the application.</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="space-y-3">
              {thresholds.map((threshold, index) => (
                <div key={index} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    {/* Risk Level Name */}
                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-1 block">Risk Level</label>
                      <input
                        type="text"
                        value={threshold.name}
                        onChange={(e) => handleThresholdChange(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Color Indicator */}
                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-1 block">Color</label>
                      <div className="flex items-center space-x-2">
                        <div className={`w-8 h-8 rounded ${getColorClass(threshold.color)} border-2 border-gray-300`}></div>
                        <select
                          value={threshold.color}
                          onChange={(e) => handleThresholdChange(index, 'color', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="green">Green</option>
                          <option value="yellow">Yellow</option>
                          <option value="orange">Orange</option>
                          <option value="red">Red</option>
                        </select>
                      </div>
                    </div>

                    {/* Min RPN */}
                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-1 block">Min RPN</label>
                      <input
                        type="number"
                        value={threshold.minRPN}
                        onChange={(e) => handleThresholdChange(index, 'minRPN', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Max RPN */}
                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-1 block">Max RPN</label>
                      <input
                        type="number"
                        value={threshold.maxRPN}
                        onChange={(e) => handleThresholdChange(index, 'maxRPN', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* RPN Range Display */}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">RPN Range:</span>
                      <span className="font-semibold text-gray-900">{threshold.minRPN} - {threshold.maxRPN}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Rating Scales Section */}
        <section>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Rating Scales (SEV, OCC, DET)</h3>
            <p className="text-sm text-gray-600">Configure the rating scales for Severity, Occurrence, and Detection. Standard FMEA uses 1-10.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Severity Scale */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3">Severity (SEV)</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Min Value</label>
                  <input
                    type="number"
                    value={severityScale.min}
                    onChange={(e) => {
                      setSeverityScale({ ...severityScale, min: parseInt(e.target.value) || 1 });
                      setHasChanges(true);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Max Value</label>
                  <input
                    type="number"
                    value={severityScale.max}
                    onChange={(e) => {
                      setSeverityScale({ ...severityScale, max: parseInt(e.target.value) || 10 });
                      setHasChanges(true);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Description</label>
                  <textarea
                    value={severityScale.description}
                    onChange={(e) => {
                      setSeverityScale({ ...severityScale, description: e.target.value });
                      setHasChanges(true);
                    }}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Occurrence Scale */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3">Occurrence (OCC)</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Min Value</label>
                  <input
                    type="number"
                    value={occurrenceScale.min}
                    onChange={(e) => {
                      setOccurrenceScale({ ...occurrenceScale, min: parseInt(e.target.value) || 1 });
                      setHasChanges(true);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Max Value</label>
                  <input
                    type="number"
                    value={occurrenceScale.max}
                    onChange={(e) => {
                      setOccurrenceScale({ ...occurrenceScale, max: parseInt(e.target.value) || 10 });
                      setHasChanges(true);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Description</label>
                  <textarea
                    value={occurrenceScale.description}
                    onChange={(e) => {
                      setOccurrenceScale({ ...occurrenceScale, description: e.target.value });
                      setHasChanges(true);
                    }}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Detection Scale */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3">Detection (DET)</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Min Value</label>
                  <input
                    type="number"
                    value={detectionScale.min}
                    onChange={(e) => {
                      setDetectionScale({ ...detectionScale, min: parseInt(e.target.value) || 1 });
                      setHasChanges(true);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Max Value</label>
                  <input
                    type="number"
                    value={detectionScale.max}
                    onChange={(e) => {
                      setDetectionScale({ ...detectionScale, max: parseInt(e.target.value) || 10 });
                      setHasChanges(true);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Description</label>
                  <textarea
                    value={detectionScale.description}
                    onChange={(e) => {
                      setDetectionScale({ ...detectionScale, description: e.target.value });
                      setHasChanges(true);
                    }}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Info Box */}
        <div className="bg-gradient-to-br from-monday-paleBlue to-monday-lightPurple border border-monday-purple/30 rounded-lg p-4 shadow-sm">
          <div className="flex items-start space-x-3">
            <div className="text-monday-purple text-xl mt-0.5">ℹ️</div>
            <div className="flex-1">
              <h4 className="font-semibold text-monday-darkNavy mb-1">About RPN Calculation</h4>
              <p className="text-sm text-gray-700">
                Risk Priority Number (RPN) is calculated as: <strong className="text-monday-purple">RPN = Severity × Occurrence × Detection</strong>
              </p>
              <p className="text-sm text-gray-700 mt-2">
                With standard 1-10 scales, RPN ranges from 1 to 1000. Higher RPN values indicate higher risk priority.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <button
            onClick={handleResetDefaults}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset to Defaults</span>
          </button>

          <button
            onClick={handleSaveSettings}
            disabled={!hasChanges}
            className={`flex items-center space-x-2 px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
              hasChanges
                ? 'bg-gradient-to-r from-monday-purple to-monday-softPurple text-white hover:shadow-lg hover:scale-105 active:scale-95'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}
