'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { 
  Factory, 
  ArrowLeft, 
  Settings, 
  Calendar, 
  CheckCircle, 
  AlertTriangle, 
  Loader2,
  Play,
  Download,
  Eye,
  Zap,
  Database,
  Clock,
  FileText,
  Users,
  MapPin,
  Shuffle,
  BarChart3,
  Target
} from 'lucide-react';
import Link from 'next/link';
import type { Zone, Club } from '@/lib/types';

interface GenerationProgress {
  stage: string;
  percentage: number;
  details: string;
  logs: string[];
}

interface GenerationConfig {
  years: number;
  eventsPerWeek: number;
  selectedZones: string[];
  selectedClubs: string[];
  includeSchedules: boolean;
  scheduleProbability: number;
  approvalDistribution: {
    approved: number;
    pending: number;
    rejected: number;
  };
  seasonalVariation: boolean;
  weekendBias: boolean;
  dryRun: boolean;
  outputFormat: 'zip' | 'preview';
}

interface GenerationResult {
  success: boolean;
  totalEvents: number;
  eventsPerYear: { [year: string]: number };
  eventsByType: { [type: string]: number };
  eventsByZone: { [zone: string]: number };
  scheduleFiles: number;
  downloadUrl?: string;
  previewData?: any;
  errors: string[];
  generationTime: number;
}

interface GenerationSummary {
  totalEvents: number;
  dateRange: { start: string; end: string };
  zonesUsed: number;
  clubsUsed: number;
  eventTypes: string[];
  weekendPercentage: number;
  scheduleCoverage: number;
  approvalBreakdown: { approved: number; pending: number; rejected: number };
}

export default function GenerateTestDataPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress | null>(null);
  const [generationConfig, setGenerationConfig] = useState<GenerationConfig>({
    years: 2,
    eventsPerWeek: 5,
    selectedZones: [],
    selectedClubs: [],
    includeSchedules: true,
    scheduleProbability: 70,
    approvalDistribution: { approved: 80, pending: 15, rejected: 5 },
    seasonalVariation: true,
    weekendBias: true,
    dryRun: false,
    outputFormat: 'zip'
  });
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);
  const [generationSummary, setGenerationSummary] = useState<GenerationSummary | null>(null);
  const [availableZones, setAvailableZones] = useState<Zone[]>([]);
  const [availableClubs, setAvailableClubs] = useState<Club[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load zones and clubs on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [zonesResponse, clubsResponse] = await Promise.all([
          fetch('/api/zones'),
          fetch('/api/clubs')
        ]);

        if (zonesResponse.ok) {
          const zonesData = await zonesResponse.json();
          setAvailableZones(zonesData.zones || []);
        }

        if (clubsResponse.ok) {
          const clubsData = await clubsResponse.json();
          setAvailableClubs(clubsData.clubs || []);
        }
      } catch (error) {
        console.error('Error loading zones and clubs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Update summary when generation results are available
  useEffect(() => {
    if (generationResult && generationResult.success) {
      setGenerationSummary(prevSummary => {
        if (!prevSummary) return null;
        
        return {
          ...prevSummary,
          totalEvents: generationResult.totalEvents,
          zonesUsed: generationResult.previewData?.actualZonesUsed || 
                     Object.keys(generationResult.eventsByZone || {}).length ||
                     prevSummary.zonesUsed,
          clubsUsed: generationResult.previewData?.actualClubsUsed || 
                     prevSummary.clubsUsed
        };
      });
    }
  }, [generationResult]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerationResult(null);
    setGenerationSummary(null);

    try {
      setGenerationProgress({
        stage: 'Initializing',
        percentage: 5,
        details: 'Setting up generation parameters...',
        logs: [`[${new Date().toLocaleTimeString()}] Starting test data generation...`]
      });

      // Call generation API
      const response = await fetch('/api/admin/generate-test-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(generationConfig)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Generation failed');
      }

      setGenerationProgress(prev => ({
        stage: 'Generating Events',
        percentage: 30,
        details: 'Creating event data with realistic patterns...',
        logs: [...prev?.logs || [], `[${new Date().toLocaleTimeString()}] Generating ${generationConfig.eventsPerWeek} events per week over ${generationConfig.years} years...`]
      }));

      setGenerationProgress(prev => ({
        stage: 'Creating Schedules',
        percentage: 60,
        details: 'Generating realistic schedule documents...',
        logs: [...prev?.logs || [], `[${new Date().toLocaleTimeString()}] Creating ${generationConfig.scheduleProbability}% schedule coverage...`]
      }));

      setGenerationProgress(prev => ({
        stage: 'Building Archive',
        percentage: 85,
        details: 'Creating ZIP archive with manifest...',
        logs: [...prev?.logs || [], `[${new Date().toLocaleTimeString()}] Packaging data in export-compatible format...`]
      }));

      // For dry run, parse JSON response
      if (generationConfig.dryRun) {
        const result = await response.json();
        
        setGenerationProgress(prev => ({
          stage: 'Complete',
          percentage: 100,
          details: 'Preview generation completed successfully',
          logs: [...prev?.logs || [], `[${new Date().toLocaleTimeString()}] Preview: ${result.result.totalEvents} events would be generated`]
        }));

        setGenerationResult(result.result);
      } else {
        // For actual generation, handle file download
        const generationResultHeader = response.headers.get('X-Generation-Result');
        const result = generationResultHeader ? JSON.parse(generationResultHeader) : {
          success: true,
          totalEvents: 0,
          eventsPerYear: {},
          eventsByType: {},
          eventsByZone: {},
          scheduleFiles: 0,
          errors: [],
          generationTime: 0
        };

        setGenerationProgress(prev => ({
          stage: 'Complete',
          percentage: 100,
          details: 'Test data generation completed successfully',
          logs: [...prev?.logs || [], `[${new Date().toLocaleTimeString()}] Generated ${result.totalEvents} events in ${result.generationTime}ms`]
        }));

        // Download the file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        
        // Extract filename from Content-Disposition header
        const contentDisposition = response.headers.get('Content-Disposition');
        const timestamp = new Date().toISOString().split('T')[0];
        const fallbackFilename = `PonyClub-TestData-${generationConfig.years}yr-${generationConfig.eventsPerWeek}perweek-${timestamp}.zip`;
        const filename = contentDisposition 
          ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
          : fallbackFilename;
        
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        setGenerationResult({ ...result, downloadUrl: url });
      }

      // Generate summary
      setGenerationSummary({
        totalEvents: generationConfig.years * generationConfig.eventsPerWeek * 52,
        dateRange: {
          start: new Date(Date.now() - generationConfig.years * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          end: new Date().toISOString().split('T')[0]
        },
        zonesUsed: generationConfig.selectedZones.length || availableZones.length,
        clubsUsed: generationConfig.selectedClubs.length > 0 
          ? generationConfig.selectedClubs.length 
          : generationConfig.selectedZones.length > 0
            ? availableClubs.filter(club => generationConfig.selectedZones.includes(club.zoneId)).length
            : availableClubs.length,
        eventTypes: ['Rally', 'ODE', 'Show Jumping', 'Dressage', 'Cross Country'],
        weekendPercentage: generationConfig.weekendBias ? 60 : 50,
        scheduleCoverage: generationConfig.scheduleProbability,
        approvalBreakdown: generationConfig.approvalDistribution
      });

    } catch (error) {
      setGenerationResult({
        success: false,
        totalEvents: 0,
        eventsPerYear: {},
        eventsByType: {},
        eventsByZone: {},
        scheduleFiles: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        generationTime: 0
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const updateConfig = (key: keyof GenerationConfig, value: any) => {
    setGenerationConfig(prev => ({ ...prev, [key]: value }));
  };

  const updateApprovalDistribution = (key: string, value: number) => {
    setGenerationConfig(prev => ({
      ...prev,
      approvalDistribution: { ...prev.approvalDistribution, [key]: value }
    }));
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Factory className="h-8 w-8 text-purple-600" />
            Test Data Generator
          </h1>
          <p className="text-muted-foreground mt-1">
            Generate realistic synthetic event data for testing and development
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Generation Configuration
            </CardTitle>
            <CardDescription>
              Configure parameters for realistic test data generation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span className="text-muted-foreground">Loading zones and clubs...</span>
              </div>
            ) : (
              <>
                {/* Basic Parameters */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Time Range & Volume
                  </h4>
              
              <div className="space-y-2">
                <Label className="text-sm">Years to Generate</Label>
                <Slider
                  value={[generationConfig.years]}
                  onValueChange={([value]) => updateConfig('years', value)}
                  max={5}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1 year</span>
                  <span className="font-medium">{generationConfig.years} year{generationConfig.years !== 1 ? 's' : ''}</span>
                  <span>5 years</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Average Events per Week</Label>
                <Slider
                  value={[generationConfig.eventsPerWeek]}
                  onValueChange={([value]) => updateConfig('eventsPerWeek', value)}
                  max={20}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1/week</span>
                  <span className="font-medium">{generationConfig.eventsPerWeek}/week</span>
                  <span>20/week</span>
                </div>
              </div>
            </div>

            {/* Filtering Options */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Target className="h-4 w-4" />
                Data Filtering
              </h4>
              
              <div className="space-y-2">
                <Label className="text-sm">Zones (leave empty for all)</Label>
                <Select onValueChange={(value) => {
                  if (value === 'all') {
                    updateConfig('selectedZones', []);
                  } else {
                    updateConfig('selectedZones', [value]);
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select zones..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Zones</SelectItem>
                    {availableZones.map(zone => (
                      <SelectItem key={zone.id} value={zone.id}>{zone.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Clubs (leave empty for all in selected zones)</Label>
                <Select 
                  onValueChange={(value) => {
                    if (value === 'all') {
                      updateConfig('selectedClubs', []);
                    } else {
                      updateConfig('selectedClubs', [value]);
                    }
                  }}
                  disabled={generationConfig.selectedZones.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select clubs..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Clubs</SelectItem>
                    {availableClubs
                      .filter(club => 
                        generationConfig.selectedZones.length === 0 || 
                        generationConfig.selectedZones.includes(club.zoneId)
                      )
                      .map(club => (
                        <SelectItem key={club.id} value={club.id}>{club.name}</SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Realism Settings */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Shuffle className="h-4 w-4" />
                Realism Options
              </h4>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="seasonal-variation"
                    checked={generationConfig.seasonalVariation}
                    onCheckedChange={(checked) => updateConfig('seasonalVariation', !!checked)}
                  />
                  <Label htmlFor="seasonal-variation" className="text-sm">
                    Seasonal variation (more events in spring/summer)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="weekend-bias"
                    checked={generationConfig.weekendBias}
                    onCheckedChange={(checked) => updateConfig('weekendBias', !!checked)}
                  />
                  <Label htmlFor="weekend-bias" className="text-sm">
                    Weekend bias (60% weekend events)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-schedules"
                    checked={generationConfig.includeSchedules}
                    onCheckedChange={(checked) => updateConfig('includeSchedules', !!checked)}
                  />
                  <Label htmlFor="include-schedules" className="text-sm">
                    Generate schedule files
                  </Label>
                </div>
              </div>

              {generationConfig.includeSchedules && (
                <div className="space-y-2">
                  <Label className="text-sm">Schedule Coverage (%)</Label>
                  <Slider
                    value={[generationConfig.scheduleProbability]}
                    onValueChange={([value]) => updateConfig('scheduleProbability', value)}
                    max={100}
                    min={0}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span className="font-medium">{generationConfig.scheduleProbability}%</span>
                    <span>100%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Generation Options */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="dry-run"
                  checked={generationConfig.dryRun}
                  onCheckedChange={(checked) => updateConfig('dryRun', !!checked)}
                />
                <Label htmlFor="dry-run" className="text-sm">
                  Preview mode (show summary without creating files)
                </Label>
              </div>
            </div>
            </>
            )}

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating || isLoading}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    {generationConfig.dryRun ? (
                      <Eye className="h-4 w-4 mr-2" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    {generationConfig.dryRun ? 'Preview Generation' : 'Generate Test Data'}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Progress & Results Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Generation Progress & Results
            </CardTitle>
            <CardDescription>
              Real-time progress and detailed generation statistics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!generationProgress && !generationSummary && !generationResult && (
              <div className="text-center py-8 text-muted-foreground">
                <Factory className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Configure options and click "Generate Test Data" to begin</p>
              </div>
            )}

            {generationProgress && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{generationProgress.stage}</span>
                    <span className="text-sm text-muted-foreground">{generationProgress.percentage}%</span>
                  </div>
                  <Progress value={generationProgress.percentage} className="h-2" />
                  <p className="text-xs text-muted-foreground">{generationProgress.details}</p>
                </div>

                {/* Log Output */}
                <div className="bg-muted/30 rounded-lg p-3 max-h-40 overflow-y-auto">
                  <div className="space-y-1">
                    {generationProgress.logs.map((log, index) => (
                      <div key={index} className="text-xs font-mono text-muted-foreground">
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {generationResult && (
              <div className="space-y-4">
                {generationResult.success ? (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription>
                      <strong>Generation Completed Successfully</strong>
                      <div className="mt-2 space-y-1">
                        <div>• {generationResult.totalEvents} events generated</div>
                        <div>• {generationResult.scheduleFiles} schedule files created</div>
                        <div>• Generated in {generationResult.generationTime}ms</div>
                        {generationConfig.dryRun && <div>• Preview mode - no files created</div>}
                      </div>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription>
                      <strong>Generation Failed</strong>
                      <div className="mt-2 space-y-1">
                        {generationResult.errors.map((error, index) => (
                          <div key={index}>• {error}</div>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Generation Summary */}
      {generationSummary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Generation Summary
            </CardTitle>
            <CardDescription>
              Detailed breakdown of generated test data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold text-foreground">{generationSummary.totalEvents}</div>
                <div className="text-sm text-muted-foreground">Total Events</div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{generationSummary.zonesUsed}</div>
                <div className="text-sm text-muted-foreground">Zones Used</div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{generationSummary.clubsUsed}</div>
                <div className="text-sm text-muted-foreground">Clubs Used</div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{generationSummary.scheduleCoverage}%</div>
                <div className="text-sm text-muted-foreground">Schedule Coverage</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Date Range</h4>
                <div className="space-y-2 text-sm">
                  <div>Start: {generationSummary.dateRange.start}</div>
                  <div>End: {generationSummary.dateRange.end}</div>
                  <div>Weekend Events: {generationSummary.weekendPercentage}%</div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-3">Approval Distribution</h4>
                <div className="space-y-2 text-sm">
                  <div>Approved: {generationSummary.approvalBreakdown.approved}%</div>
                  <div>Pending: {generationSummary.approvalBreakdown.pending}%</div>
                  <div>Rejected: {generationSummary.approvalBreakdown.rejected}%</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Generator Features
          </CardTitle>
          <CardDescription>
            Comprehensive test data generation with realistic patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Realistic Patterns</h4>
                <p className="text-xs text-muted-foreground">Seasonal variation and weekend bias for authentic data</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
              <FileText className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Schedule Generation</h4>
                <p className="text-xs text-muted-foreground">Mock PDF files with realistic event schedules</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
              <Database className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Export Compatible</h4>
                <p className="text-xs text-muted-foreground">ZIP format identical to export system output</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
