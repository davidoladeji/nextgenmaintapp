'use client';
// @ts-nocheck

import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Eye, Save, Upload, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRiskSettings } from '@/lib/stores/riskSettingsStore';

interface SetupTabProps {
  projectId: string;
}

// Color helpers (supports named or hex)
const namedColors: Record<string, string> = {
  green: '#22c55e',
  yellow: '#eab308',
  orange: '#f97316',
  red: '#ef4444',
  blue: '#3b82f6',
  gray: '#9ca3af',
};

const chipBg = (color: string) => (color?.startsWith('#') ? color : (namedColors[color] ?? namedColors.gray));

// Chip component for colored badges
function Chip({ color, label }: { color: string; label: string }) {
  const bg = chipBg(color);
  return (
    <span
      className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs text-white"
      style={{ backgroundColor: bg }}
    >
      <span className="h-2 w-2 rounded-full bg-white/90" />
      {label}
    </span>
  );
}

interface Threshold {
  id: number;
  label: string;
  min: number;
  max: number;
  color: string;
}

type PresetType = 'SAE J1739' | '5x5' | '6x6' | '10x10' | 'Custom';
type ScaleType = '1-10' | '1-5';

export default function SetupTab({ projectId }: SetupTabProps) {
  // Use global risk settings store
  const {
    matrixSize,
    scaleType,
    thresholds,
    setMatrixSize: setGlobalMatrixSize,
    setScaleType: setGlobalScaleType,
    setThresholds: setGlobalThresholds,
  } = useRiskSettings();

  // Structural layer
  const [preset, setPreset] = useState<PresetType>('SAE J1739');
  const [detBaseline, setDetBaseline] = useState(5); // preview multiplier

  // Semantic layer
  const [sevDesc, setSevDesc] = useState('SEV=10 Catastrophic, safety-critical failure');
  const [occDesc, setOccDesc] = useState('OCC=10 Very frequent; OCC=1 Rare');
  const [detDesc, setDetDesc] = useState('DET=10 Not detectable; DET=1 Easily detected');

  // Standards / templates - now supports multiple selection
  const [standards, setStandards] = useState<string[]>(['SAE J1739']);
  const [applyWorkspaceDefault, setApplyWorkspaceDefault] = useState(true);

  // Import/export JSON
  const [jsonEditor, setJsonEditor] = useState<null | string>(null);

  // Wrapper functions to update both local and global state
  const setMatrixSize = (size: number) => {
    setGlobalMatrixSize(size);
  };

  const setScaleType = (type: ScaleType) => {
    setGlobalScaleType(type);
  };

  const setThresholds = (newThresholds: Threshold[]) => {
    setGlobalThresholds(newThresholds);
  };

  // Apply preset configuration
  const applyPreset = (p: PresetType) => {
    setPreset(p);
    if (p === 'SAE J1739') {
      setMatrixSize(10);
      setScaleType('1-10');
      setStandards(['SAE J1739']);
      setThresholds([
        { id: 1, label: 'Low', min: 1, max: 69, color: 'green' },
        { id: 2, label: 'Medium', min: 70, max: 99, color: 'yellow' },
        { id: 3, label: 'High', min: 100, max: 150, color: 'orange' },
        { id: 4, label: 'Critical', min: 151, max: 1000, color: 'red' },
      ]);
    } else if (p === '5x5') {
      setMatrixSize(5);
      setScaleType('1-5');
      setThresholds([
        { id: 1, label: 'Low', min: 1, max: 50, color: '#22c55e' },
        { id: 2, label: 'Medium', min: 51, max: 75, color: '#eab308' },
        { id: 3, label: 'High', min: 76, max: 100, color: '#f97316' },
        { id: 4, label: 'Critical', min: 101, max: 250, color: '#ef4444' },
      ]);
    } else if (p === '6x6') {
      setMatrixSize(6);
      setScaleType('1-10');
      setThresholds([
        { id: 1, label: 'Low', min: 1, max: 72, color: '#22c55e' },
        { id: 2, label: 'Medium', min: 73, max: 108, color: '#eab308' },
        { id: 3, label: 'High', min: 109, max: 144, color: '#f97316' },
        { id: 4, label: 'Critical', min: 145, max: 360, color: '#ef4444' },
      ]);
    } else if (p === '10x10') {
      setMatrixSize(10);
      setScaleType('1-10');
    }
  };

  // Legends
  const sevLegend = useMemo(() => Array.from({ length: matrixSize }, (_, i) => i + 1), [matrixSize]);
  const occLegend = useMemo(() => Array.from({ length: matrixSize }, (_, i) => i + 1), [matrixSize]);

  // Preview sample rows
  const sample = [
    { mode: 'Seal failure – ingress', sev: Math.min(6, matrixSize), occ: Math.min(5, matrixSize), det: detBaseline },
    { mode: 'Electrical insulation breakdown', sev: Math.min(9, matrixSize), occ: Math.min(3, matrixSize), det: detBaseline },
    { mode: 'Mechanical wear or fatigue', sev: Math.min(7, matrixSize), occ: Math.min(6, matrixSize), det: detBaseline },
  ].map((r) => ({ ...r, rpn: r.sev * r.occ * r.det }));

  const bandFor = (value: number) => thresholds.find((t) => value >= t.min && value <= t.max) || thresholds[thresholds.length - 1];

  const updateThreshold = (id: number, key: keyof Omit<Threshold, 'id'>, value: any) => {
    setThresholds((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [key]: key === 'min' || key === 'max' ? Number(value) : value } : t))
    );
  };

  // Validation: overlaps + coverage
  const rpnMax = matrixSize * matrixSize * 10; // worst case (DET up to 10)
  const validation = useMemo(() => {
    const issues: string[] = [];
    const sorted = [...thresholds].sort((a, b) => a.min - b.min);

    for (let i = 0; i < sorted.length; i++) {
      const t = sorted[i];
      if (t.min > t.max) issues.push(`${t.label}: min cannot be greater than max`);
      if (i > 0) {
        const prev = sorted[i - 1];
        if (t.min <= prev.max) issues.push(`${t.label}: overlaps with ${prev.label}`);
        if (t.min > prev.max + 1) issues.push(`${t.label}: gap after ${prev.label}`);
      }
    }

    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    if (!first || first.min > 1) issues.push('Coverage should start at 1');
    if (last && last.max < rpnMax) issues.push(`Coverage should reach at least ${rpnMax} (current max ${last.max})`);

    return { issues };
  }, [thresholds, matrixSize]);

  // Import/export helpers
  const exportJSON = () => {
    const payload = {
      preset, matrixSize, detBaseline, scaleType, standards, thresholds,
      descriptions: { sevDesc, occDesc, detDesc },
    };
    setJsonEditor(JSON.stringify(payload, null, 2));
  };

  const importJSON = () => {
    try {
      if (!jsonEditor) return;
      const obj = JSON.parse(jsonEditor);
      setPreset(obj.preset ?? 'Custom');
      setMatrixSize(obj.matrixSize ?? 10);
      setDetBaseline(obj.detBaseline ?? 5);
      setScaleType(obj.scaleType ?? '1-10');
      setStandards(obj.standards ?? (obj.standard ? [obj.standard] : ['SAE J1739'])); // Support legacy single standard
      if (obj.thresholds) setThresholds(obj.thresholds);
      if (obj.descriptions) {
        setSevDesc(obj.descriptions.sevDesc ?? sevDesc);
        setOccDesc(obj.descriptions.occDesc ?? occDesc);
        setDetDesc(obj.descriptions.detDesc ?? detDesc);
      }
      toast.success('Preset imported successfully!');
      setJsonEditor(null);
    } catch (e) {
      toast.error('Invalid JSON. Please check and try again.');
    }
  };

  // AI prioritization preview
  const bandPriority = ['Critical', 'High', 'Medium', 'Low'];
  const prioritized = useMemo(() => {
    const withBand = sample.map((r) => ({ ...r, band: bandFor(r.rpn) }));
    return withBand.sort((a, b) => {
      const ai = bandPriority.indexOf(a.band.label);
      const bi = bandPriority.indexOf(b.band.label);
      if (ai !== bi) return ai - bi;
      return b.rpn - a.rpn;
    });
  }, [sample, thresholds]);

  const handleSaveSettings = () => {
    const settings = {
      preset, matrixSize, detBaseline, scaleType, standards, thresholds,
      descriptions: { sevDesc, occDesc, detDesc },
      applyWorkspaceDefault
    };
    localStorage.setItem(`fmea-settings-${projectId}`, JSON.stringify(settings));
    toast.success('Settings saved successfully!');
  };

  return (
    <div className="min-h-screen w-full bg-white dark:bg-slate-900 p-6 md:p-10">
      <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Config */}
        <div className="lg:col-span-7 space-y-6">
          {/* Presets & Matrix Size */}
          <Card className="shadow-sm border-gray-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-slate-100">Presets & Matrix Size</CardTitle>
              <div className="text-xs text-gray-500 dark:text-slate-400">
                Defines the <b>structure</b> of your site risk matrix (grid + baseline template). Matrix Size controls SEV × OCC grid. DET can remain 1–10.
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Preset</label>
                  <Select value={preset} onValueChange={(v: PresetType) => applyPreset(v)}>
                    <SelectTrigger className="h-9 bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SAE J1739">SAE J1739 (Default)</SelectItem>
                      <SelectItem value="5x5">Site 5 × 5</SelectItem>
                      <SelectItem value="6x6">Site 6 × 6</SelectItem>
                      <SelectItem value="10x10">Site 10 × 10</SelectItem>
                      <SelectItem value="Custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Matrix Size (N×N)</label>
                  <Input
                    type="number"
                    min={3}
                    max={12}
                    value={matrixSize}
                    onChange={(e) => setMatrixSize(Math.max(3, Math.min(12, Number(e.target.value))))}
                    className="h-9 bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Preview DET baseline</label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={detBaseline}
                    onChange={(e) => setDetBaseline(Math.max(1, Math.min(10, Number(e.target.value))))}
                    className="h-9 bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Import / Export */}
              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={exportJSON} size="sm" className="w-full sm:w-auto">
                  <Download className="h-4 w-4 mr-2" />Export Preset (JSON)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={() => setJsonEditor(jsonEditor ?? `{
  "preset": "Custom",
  "matrixSize": 5,
  "detBaseline": 5,
  "scaleType": "1-5",
  "standard": "SAE J1739",
  "thresholds": [
    { "id": 1, "label": "Low", "min": 1, "max": 50, "color": "#22c55e" },
    { "id": 2, "label": "Medium", "min": 51, "max": 75, "color": "#eab308" },
    { "id": 3, "label": "High", "min": 76, "max": 100, "color": "#f97316" },
    { "id": 4, "label": "Critical", "min": 101, "max": 250, "color": "#ef4444" }
  ],
  "descriptions": {
    "sevDesc": "...",
    "occDesc": "...",
    "detDesc": "..."
  }
}`)}
                >
                  <Upload className="h-4 w-4 mr-2" />Import Preset
                </Button>
              </div>

              {jsonEditor !== null && (
                <div className="space-y-2">
                  <Textarea
                    rows={8}
                    value={jsonEditor}
                    onChange={(e) => setJsonEditor(e.target.value)}
                    className="font-mono text-xs bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600"
                  />
                  <div className="flex gap-2">
                    <Button onClick={importJSON} size="sm">Apply JSON</Button>
                    <Button variant="outline" size="sm" onClick={() => setJsonEditor(null)}>Close</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Custom Risk Scales */}
          <Card className="shadow-sm border-gray-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-slate-100">Custom Risk Scales</CardTitle>
              <div className="text-xs text-gray-500 dark:text-slate-400">
                Defines the <b>meaning</b> of each rating (interpret SEV/OCC/DET levels).
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Scale Type</label>
                  <Select value={scaleType} onValueChange={(v: ScaleType) => setScaleType(v)}>
                    <SelectTrigger className="h-9 bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-10">1 – 10</SelectItem>
                      <SelectItem value="1-5">1 – 5</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-1 sm:col-span-2 text-xs text-gray-500 dark:text-slate-400 flex items-center">RPN = SEV × OCC × DET</div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Severity description</label>
                  <Textarea
                    value={sevDesc}
                    onChange={(e) => setSevDesc(e.target.value)}
                    rows={3}
                    className="bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Occurrence description</label>
                  <Textarea
                    value={occDesc}
                    onChange={(e) => setOccDesc(e.target.value)}
                    rows={3}
                    className="bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Detection description</label>
                  <Textarea
                    value={detDesc}
                    onChange={(e) => setDetDesc(e.target.value)}
                    rows={3}
                    className="bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Criticality Thresholds */}
          <Card className="shadow-sm border-gray-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-slate-100">Criticality Thresholds</CardTitle>
              <div className="text-xs text-gray-500 dark:text-slate-400">
                Manage RPN bands used for colors, dashboards, and AI focus.
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {thresholds.map((t) => (
                <div key={t.id} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2 items-center">
                  <div className="sm:col-span-1 lg:col-span-3">
                    <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1 lg:hidden">Label</label>
                    <Input
                      value={t.label}
                      onChange={(e) => updateThreshold(t.id, 'label', e.target.value)}
                      className="h-9 bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100"
                    />
                  </div>
                  <div className="sm:col-span-1 lg:col-span-3 flex items-center gap-2">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1 lg:hidden">Color</label>
                      <Select value={t.color} onValueChange={(v) => updateThreshold(t.id, 'color', v)}>
                        <SelectTrigger className="h-9 bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(namedColors).map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <input
                      type="color"
                      value={chipBg(String(t.color))}
                      onChange={(e) => updateThreshold(t.id, 'color', e.target.value)}
                      className="h-9 w-9 rounded-md border border-gray-300 dark:border-slate-600 flex-shrink-0"
                    />
                  </div>
                  <div className="sm:col-span-1 lg:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1 lg:hidden">Min RPN</label>
                    <Input
                      type="number"
                      value={t.min}
                      onChange={(e) => updateThreshold(t.id, 'min', e.target.value)}
                      className="h-9 bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100"
                    />
                  </div>
                  <div className="sm:col-span-1 lg:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1 lg:hidden">Max RPN</label>
                    <Input
                      type="number"
                      value={t.max}
                      onChange={(e) => updateThreshold(t.id, 'max', e.target.value)}
                      className="h-9 bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100"
                    />
                  </div>
                  <div className="sm:col-span-2 lg:col-span-2 flex items-center">
                    <Chip color={String(t.color)} label={`${t.label} (${t.min}–${t.max})`} />
                  </div>
                </div>
              ))}

              {validation.issues.length > 0 ? (
                <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3 mt-2">
                  <div className="font-medium text-sm text-red-700 dark:text-red-400 mb-1">Validation issues</div>
                  <ul className="list-disc ml-5 space-y-1">
                    {validation.issues.map((msg, i) => (
                      <li key={i} className="text-xs text-red-700 dark:text-red-400">{msg}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-xs text-emerald-600 dark:text-emerald-400">
                  ✓ Thresholds look good: no overlaps and coverage is continuous to {rpnMax}.
                </div>
              )}

              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={() => setThresholds((prev) => [...prev, {
                    id: Date.now(),
                    label: 'Very High',
                    min: rpnMax + 1,
                    max: rpnMax + 100,
                    color: '#3b82f6'
                  }])}
                >
                  + Add Class
                </Button>
                <Button onClick={handleSaveSettings} size="sm" className="w-full sm:w-auto">
                  <Save className="mr-2 h-4 w-4" />Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Standards & Templates */}
          <Card className="shadow-sm border-gray-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-slate-100">Standards & Templates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 block">
                    Select standards (multiple allowed)
                  </label>
                  <div className="space-y-2">
                    {['SAE J1739', 'IEC 60812 (FMEA)', 'ISO 9001', 'AS/NZS 31000'].map((std) => (
                      <label key={std} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={standards.includes(std)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setStandards([...standards, std]);
                            } else {
                              setStandards(standards.filter(s => s !== std));
                            }
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
                        />
                        <span className="text-sm text-gray-700 dark:text-slate-300">{std}</span>
                      </label>
                    ))}
                  </div>
                  {standards.length > 0 && (
                    <div className="mt-2 text-xs text-gray-500 dark:text-slate-400">
                      Selected: {standards.join(', ')}
                    </div>
                  )}
                </div>
                <div className="flex items-end justify-between">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Workspace default</label>
                    <div className="text-xs text-gray-500 dark:text-slate-400">Apply to new projects automatically</div>
                  </div>
                  <Switch checked={applyWorkspaceDefault} onCheckedChange={setApplyWorkspaceDefault} />
                </div>
              </div>
              <div className="text-xs text-gray-500 dark:text-slate-400">
                AI suggestions adapt to your scales/bands. Changing presets updates the preview immediately.
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Previews */}
        <div className="lg:col-span-5 space-y-6">
          {/* Preview Mode */}
          <Card className="shadow-sm border-gray-200 dark:border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base text-gray-900 dark:text-slate-100">Preview Mode</CardTitle>
              <Badge variant="secondary" className="text-xs">
                <Eye className="mr-1 h-3 w-3" />Live
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Legends */}
              <div>
                <div className="text-xs uppercase text-gray-500 dark:text-slate-400">SEV Legend (1..{matrixSize})</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {sevLegend.map((n) => (
                    <Badge key={`s${n}`} variant="outline" className="text-xs">{n}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase text-gray-500 dark:text-slate-400">OCC Legend (1..{matrixSize})</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {occLegend.map((n) => (
                    <Badge key={`o${n}`} variant="outline" className="text-xs">{n}</Badge>
                  ))}
                </div>
              </div>
              <div className="text-xs text-gray-500 dark:text-slate-400">
                Heatmap uses RPN = SEV × OCC × DET (DET baseline {detBaseline}).
              </div>

              {/* Heatmap Grid */}
              <div className="overflow-x-auto">
                <div className="grid" style={{ gridTemplateColumns: `repeat(${matrixSize + 1}, minmax(0, 1fr))` }}>
                  <div className="p-2 text-xs text-gray-500 dark:text-slate-400">SEV↓ / OCC→</div>
                  {occLegend.map((n) => (
                    <div key={`h-occ-${n}`} className="p-2 text-center text-xs font-medium text-gray-600 dark:text-slate-300">{n}</div>
                  ))}
                  {sevLegend.map((s) => (
                    <React.Fragment key={`row-${s}`}>
                      <div className="p-2 text-xs text-gray-600 dark:text-slate-300 font-medium">{s}</div>
                      {occLegend.map((o) => {
                        const value = s * o * detBaseline;
                        const band = bandFor(value);
                        return (
                          <div
                            key={`cell-${s}-${o}`}
                            className="h-8 border border-gray-300 dark:border-slate-600 flex items-center justify-center text-[10px] text-gray-900 dark:text-slate-100"
                            style={{ backgroundColor: chipBg(String(band.color)), opacity: 0.6 }}
                          >
                            {value}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Sample Table */}
              <div className="rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-slate-800">
                    <tr className="text-left">
                      <th className="p-3 text-gray-700 dark:text-slate-300">Failure Mode</th>
                      <th className="p-3 text-gray-700 dark:text-slate-300">SEV</th>
                      <th className="p-3 text-gray-700 dark:text-slate-300">OCC</th>
                      <th className="p-3 text-gray-700 dark:text-slate-300">DET</th>
                      <th className="p-3 text-gray-700 dark:text-slate-300">RPN</th>
                      <th className="p-3 text-gray-700 dark:text-slate-300">Band</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sample.map((r, i) => {
                      const band = bandFor(r.rpn);
                      return (
                        <tr key={i} className="border-t border-gray-200 dark:border-slate-700">
                          <td className="p-3 text-gray-900 dark:text-slate-100">{r.mode}</td>
                          <td className="p-3 text-gray-900 dark:text-slate-100">{r.sev}</td>
                          <td className="p-3 text-gray-900 dark:text-slate-100">{r.occ}</td>
                          <td className="p-3 text-gray-900 dark:text-slate-100">{r.det}</td>
                          <td className="p-3 font-medium text-gray-900 dark:text-slate-100">{r.rpn}</td>
                          <td className="p-3">
                            <Chip color={String(band.color)} label={band.label} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* AI Prioritization Preview */}
          <Card className="shadow-sm border-gray-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-slate-100">AI Prioritization Preview</CardTitle>
              <div className="text-xs text-gray-500 dark:text-slate-400">
                Order = Critical → High → Medium → Low, then by highest RPN.
              </div>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal ml-5 space-y-1 text-sm text-gray-900 dark:text-slate-100">
                {prioritized.map((r, i) => (
                  <li key={i}>
                    <span className="font-medium">{r.mode}</span> — RPN {r.rpn} (
                    <Chip color={String(bandFor(r.rpn).color)} label={bandFor(r.rpn).label} />)
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
