'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Trash2, ArrowLeft, ShieldAlert, UserX, Database, Timer, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

interface DeletionResult {
  success: boolean;
  deletedCount: number;
  errors: string[];
  executionTime: number;
}

export default function DeleteUsersPage() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [confirmations, setConfirmations] = useState({
    understanding: false,
    testingOnly: false,
    irreversible: false,
    backupTaken: false,
    deleteCommand: ''
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletionResult, setDeletionResult] = useState<DeletionResult | null>(null);

  const requiredDeleteCommand = 'DELETE ALL USER DATA';

  const allConfirmationsValid = () => {
    return confirmations.understanding &&
           confirmations.testingOnly &&
           confirmations.irreversible &&
           confirmations.backupTaken &&
           confirmations.deleteCommand === requiredDeleteCommand;
  };

  const handleDeleteUsers = async () => {
    if (!allConfirmationsValid()) {
      toast({
        variant: "destructive",
        title: "Confirmation Required",
        description: "Please complete all confirmations before proceeding.",
      });
      return;
    }

    setIsDeleting(true);
    const startTime = Date.now();

    try {
      const response = await fetch('/api/admin/users/delete-all', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confirmations: confirmations,
          timestamp: new Date().toISOString()
        })
      });

      const data = await response.json();
      const executionTime = Date.now() - startTime;

      if (response.ok) {
        setDeletionResult({
          success: true,
          deletedCount: data.deletedCount || 0,
          errors: data.errors || [],
          executionTime
        });
        setCurrentStep(3);
        toast({
          title: "User Data Deleted",
          description: `Successfully deleted ${data.deletedCount || 0} user records.`,
        });
      } else {
        throw new Error(data.error || 'Failed to delete user data');
      }
    } catch (error) {
      const executionTime = Date.now() - startTime;
      setDeletionResult({
        success: false,
        deletedCount: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        executionTime
      });
      setCurrentStep(3);
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setConfirmations({
      understanding: false,
      testingOnly: false,
      irreversible: false,
      backupTaken: false,
      deleteCommand: ''
    });
    setDeletionResult(null);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="outline" asChild>
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <h1 className="text-3xl font-bold text-red-700 dark:text-red-400">User Data Deletion</h1>
            <Badge variant="destructive" className="text-xs">TESTING ONLY</Badge>
          </div>
        </div>
        <p className="text-muted-foreground">
          Permanently delete user data from the database. This tool is intended for testing environments only.
        </p>
      </div>

      {/* Critical Warning */}
      <Alert className="mb-8 border-red-300 bg-red-50 dark:bg-red-950/30">
        <ShieldAlert className="h-5 w-5 text-red-600" />
        <AlertDescription className="text-red-800 dark:text-red-200">
          <div className="space-y-2">
            <div className="font-bold text-lg">⚠️ CRITICAL WARNING ⚠️</div>
            <div>This action will PERMANENTLY DELETE all user data from the database.</div>
            <div>• This operation is IRREVERSIBLE</div>
            <div>• All user accounts, profiles, and associated data will be lost</div>
            <div>• This should ONLY be used in testing environments</div>
            <div>• Ensure you have a backup before proceeding</div>
          </div>
        </AlertDescription>
      </Alert>

      {/* Step 1: Warnings and Initial Confirmations */}
      {currentStep === 1 && (
        <Card className="border-red-200">
          <CardHeader className="bg-red-50 dark:bg-red-950/20">
            <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              Step 1: Read Warnings & Confirm Understanding
            </CardTitle>
            <CardDescription>
              Please read all warnings carefully and confirm your understanding.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-4">
              <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800 dark:text-orange-200">
                  <div className="font-semibold mb-2">Data Loss Warning:</div>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>All user accounts will be permanently deleted</li>
                    <li>User profiles, preferences, and settings will be lost</li>
                    <li>Any user-generated content or comments will be removed</li>
                    <li>User authentication records will be purged</li>
                    <li>This operation cannot be undone</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <Alert className="border-red-200 bg-red-50 dark:bg-red-950/20">
                <Database className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800 dark:text-red-200">
                  <div className="font-semibold mb-2">Database Impact:</div>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Direct modification of production database tables</li>
                    <li>Potential impact on referential integrity</li>
                    <li>May affect event registrations and associations</li>
                    <li>Could impact reporting and analytics data</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>

            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="understanding"
                  checked={confirmations.understanding}
                  onCheckedChange={(checked) => 
                    setConfirmations(prev => ({ ...prev, understanding: checked as boolean }))
                  }
                />
                <Label htmlFor="understanding" className="text-sm font-medium">
                  I understand that this action will permanently delete all user data from the database
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="testingOnly"
                  checked={confirmations.testingOnly}
                  onCheckedChange={(checked) => 
                    setConfirmations(prev => ({ ...prev, testingOnly: checked as boolean }))
                  }
                />
                <Label htmlFor="testingOnly" className="text-sm font-medium">
                  I confirm this is being used in a testing environment only
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="irreversible"
                  checked={confirmations.irreversible}
                  onCheckedChange={(checked) => 
                    setConfirmations(prev => ({ ...prev, irreversible: checked as boolean }))
                  }
                />
                <Label htmlFor="irreversible" className="text-sm font-medium">
                  I understand this operation is irreversible and cannot be undone
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="backupTaken"
                  checked={confirmations.backupTaken}
                  onCheckedChange={(checked) => 
                    setConfirmations(prev => ({ ...prev, backupTaken: checked as boolean }))
                  }
                />
                <Label htmlFor="backupTaken" className="text-sm font-medium">
                  I have taken a backup of the database before proceeding
                </Label>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => setCurrentStep(2)}
                disabled={!confirmations.understanding || !confirmations.testingOnly || !confirmations.irreversible || !confirmations.backupTaken}
                className="bg-red-600 hover:bg-red-700"
              >
                Continue to Final Confirmation
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Final Confirmation */}
      {currentStep === 2 && (
        <Card className="border-red-300">
          <CardHeader className="bg-red-100 dark:bg-red-950/30">
            <CardTitle className="flex items-center gap-2 text-red-800 dark:text-red-300">
              <UserX className="h-5 w-5" />
              Step 2: Final Confirmation
            </CardTitle>
            <CardDescription>
              Type the required command to proceed with user data deletion.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <Alert className="border-red-400 bg-red-100 dark:bg-red-950/40">
              <ShieldAlert className="h-4 w-4 text-red-700" />
              <AlertDescription className="text-red-900 dark:text-red-200">
                <div className="font-bold text-lg mb-2">FINAL WARNING</div>
                <div>You are about to permanently delete ALL user data from the database.</div>
                <div>This action will execute immediately and cannot be stopped once started.</div>
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div>
                <Label htmlFor="deleteCommand" className="text-sm font-medium text-red-700 dark:text-red-400">
                  Type "{requiredDeleteCommand}" to confirm deletion:
                </Label>
                <Input
                  id="deleteCommand"
                  value={confirmations.deleteCommand}
                  onChange={(e) => setConfirmations(prev => ({ ...prev, deleteCommand: e.target.value }))}
                  placeholder={requiredDeleteCommand}
                  className="mt-2 border-red-300"
                />
              </div>

              {confirmations.deleteCommand && confirmations.deleteCommand !== requiredDeleteCommand && (
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">
                    Command does not match. Please type exactly: "{requiredDeleteCommand}"
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleDeleteUsers}
                disabled={!allConfirmationsValid() || isDeleting}
                className="bg-red-700 hover:bg-red-800"
              >
                {isDeleting ? (
                  <>
                    <Timer className="h-4 w-4 mr-2 animate-spin" />
                    Deleting Users...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    DELETE ALL USER DATA
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Results */}
      {currentStep === 3 && deletionResult && (
        <Card className={`border-2 ${deletionResult.success ? 'border-green-300' : 'border-red-300'}`}>
          <CardHeader className={`${deletionResult.success ? 'bg-green-50 dark:bg-green-950/20' : 'bg-red-50 dark:bg-red-950/20'}`}>
            <CardTitle className={`flex items-center gap-2 ${deletionResult.success ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
              {deletionResult.success ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <AlertTriangle className="h-5 w-5" />
              )}
              Deletion {deletionResult.success ? 'Completed' : 'Failed'}
            </CardTitle>
            <CardDescription>
              Operation completed in {deletionResult.executionTime}ms
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {deletionResult.success ? (
              <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  <div className="space-y-2">
                    <div className="font-semibold">User data successfully deleted:</div>
                    <div>• {deletionResult.deletedCount} user records removed</div>
                    <div>• Database cleanup completed</div>
                    <div>• Operation executed in {deletionResult.executionTime}ms</div>
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-red-200 bg-red-50 dark:bg-red-950/20">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800 dark:text-red-200">
                  <div className="space-y-2">
                    <div className="font-semibold">Deletion failed:</div>
                    {deletionResult.errors.map((error, index) => (
                      <div key={index}>• {error}</div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-between">
              <Button variant="outline" asChild>
                <Link href="/admin">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Return to Admin
                </Link>
              </Button>
              <Button onClick={resetForm} variant="outline">
                Reset Form
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
