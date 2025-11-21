'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CommitteeNomination } from '@/types/committee-nomination';
import { Users2, CheckCircle, XCircle, Clock, FileText, AlertCircle, Edit, Trash2, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface CommitteeNominationStatusProps {
  clubId: string;
  onNominateCommittee: () => void;
  onEditNomination?: (nominationId: string) => void;
}

export function CommitteeNominationStatus({ clubId, onNominateCommittee, onEditNomination }: CommitteeNominationStatusProps) {
  const [nomination, setNomination] = useState<CommitteeNomination | null>(null);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);

  const fetchAvailableYears = useCallback(async () => {
    if (!clubId) return;
    
    try {
      const response = await fetch(`/api/committee-nominations?clubId=${clubId}&years=true`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch available years');
      }

      const years: number[] = await response.json();
      setAvailableYears(years);
      
      // Set selected year to the most recent year, or current year if no nominations exist
      if (years.length > 0) {
        setSelectedYear(years[0]);
      } else {
        setSelectedYear(new Date().getFullYear());
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching available years:', error);
      setSelectedYear(new Date().getFullYear());
      setLoading(false);
    }
  }, [clubId]);

  const fetchNominationForYear = useCallback(async (year: number) => {
    if (!clubId) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/committee-nominations?clubId=${clubId}&year=${year}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch committee nomination');
      }

      const data = await response.json();
      setNomination(data);
    } catch (error) {
      console.error('Error fetching committee nomination:', error);
      setError('Failed to load committee nomination status');
    } finally {
      setLoading(false);
    }
  }, [clubId]);

  useEffect(() => {
    fetchAvailableYears();
  }, [fetchAvailableYears]);

  useEffect(() => {
    if (selectedYear !== null) {
      fetchNominationForYear(selectedYear);
    }
  }, [selectedYear, fetchNominationForYear]);

  const handleWithdraw = async () => {
    if (!nomination?.id || !confirm('Are you sure you want to withdraw this nomination? This action cannot be undone.')) {
      return;
    }

    setWithdrawing(true);
    try {
      const response = await fetch(`/api/committee-nominations/${nomination.id}/withdraw`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to withdraw nomination');
      }

      // Refresh the nomination data
      await fetchNominationForYear(selectedYear!);
      await fetchAvailableYears();
    } catch (error) {
      console.error('Error withdrawing nomination:', error);
      alert(error instanceof Error ? error.message : 'Failed to withdraw nomination');
    } finally {
      setWithdrawing(false);
    }
  };

  const handleEdit = () => {
    if (nomination?.id && onEditNomination) {
      onEditNomination(nomination.id);
    }
  };

  const handleYearChange = (year: string) => {
    setSelectedYear(parseInt(year, 10));
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users2 className="h-5 w-5" />
            Committee Nomination
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users2 className="h-5 w-5" />
            Committee Nomination
          </CardTitle>
          <CardDescription>
            Submit your club's committee after the Annual General Meeting
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            After your AGM, nominate your committee members including District Commissioner, Secretary, and Treasurer.
          </p>
          <Button onClick={onNominateCommittee} className="w-full" size="lg">
            <FileText className="h-4 w-4 mr-2" />
            Nominate Committee
          </Button>
        </CardContent>
      </Card>
    );
  }

  // No nomination exists yet
  if (!nomination) {
    return (
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users2 className="h-5 w-5" />
                Committee Nomination {selectedYear}
              </CardTitle>
              <CardDescription>
                Submit your club's committee after the Annual General Meeting
              </CardDescription>
            </div>
            {availableYears.length > 0 && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Select value={selectedYear?.toString() || ''} onValueChange={handleYearChange}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                    {!availableYears.includes(new Date().getFullYear()) && (
                      <SelectItem value={new Date().getFullYear().toString()}>
                        {new Date().getFullYear()}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              After your AGM, nominate your committee members including District Commissioner, Secretary, and Treasurer.
            </p>
            <Button onClick={onNominateCommittee} className="w-full" size="lg">
              <FileText className="h-4 w-4 mr-2" />
              Nominate Committee for {selectedYear}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Nomination exists - show status
  const getStatusBadge = () => {
    // Check nomination status first (for withdrawn)
    if (nomination.status === 'withdrawn') {
      return (
        <Badge className="bg-gray-100 text-gray-800 border-gray-300">
          <XCircle className="h-3 w-3 mr-1" />
          Withdrawn
        </Badge>
      );
    }
    
    if (nomination.districtCommissioner.approvalStatus === 'approved') {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-300">
          <CheckCircle className="h-3 w-3 mr-1" />
          Approved
        </Badge>
      );
    } else if (nomination.districtCommissioner.approvalStatus === 'rejected') {
      return (
        <Badge className="bg-red-100 text-red-800 border-red-300">
          <XCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
          <Clock className="h-3 w-3 mr-1" />
          Pending Approval
        </Badge>
      );
    }
  };

  const getStatusColor = () => {
    if (nomination.status === 'withdrawn') return 'border-l-gray-500';
    if (nomination.districtCommissioner.approvalStatus === 'approved') return 'border-l-green-500';
    if (nomination.districtCommissioner.approvalStatus === 'rejected') return 'border-l-red-500';
    return 'border-l-yellow-500';
  };

  return (
    <Card className={`border-l-4 ${getStatusColor()}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <Users2 className="h-5 w-5 flex-shrink-0" />
            <CardTitle className="text-lg sm:text-xl">
              Committee Nomination {nomination.year}
            </CardTitle>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {availableYears.length > 0 && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Select value={selectedYear?.toString() || ''} onValueChange={handleYearChange}>
                  <SelectTrigger className="w-28">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                    {!availableYears.includes(new Date().getFullYear()) && (
                      <SelectItem value={new Date().getFullYear().toString()}>
                        {new Date().getFullYear()}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
            {getStatusBadge()}
          </div>
        </div>
        <CardDescription className="mt-2">
          Submitted {formatDistanceToNow(new Date(nomination.submittedAt), { addSuffix: true })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* District Commissioner */}
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">District Commissioner</p>
            <p className="text-sm text-muted-foreground">{nomination.districtCommissioner.name}</p>
            <p className="text-xs text-muted-foreground">{nomination.districtCommissioner.email}</p>
          </div>

          {/* Secretary */}
          {nomination.secretary && (
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Secretary</p>
              <p className="text-sm text-muted-foreground">{nomination.secretary.name}</p>
            </div>
          )}

          {/* Treasurer */}
          {nomination.treasurer && (
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Treasurer</p>
              <p className="text-sm text-muted-foreground">{nomination.treasurer.name}</p>
            </div>
          )}

          {/* Additional Members Count */}
          {(nomination as any).additionalCommittee && (nomination as any).additionalCommittee.length > 0 && (
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Additional Members</p>
              <p className="text-sm text-muted-foreground">
                {(nomination as any).additionalCommittee.length} member{(nomination as any).additionalCommittee.length > 1 ? 's' : ''}
              </p>
            </div>
          )}

          {/* Rejection Reason */}
          {nomination.districtCommissioner.approvalStatus === 'rejected' && nomination.districtCommissioner.rejectionReason && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Rejection Reason:</strong><br />
                {nomination.districtCommissioner.rejectionReason}
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          {nomination.status === 'withdrawn' && (
            <>
              <p className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-md p-3">
                <XCircle className="h-4 w-4 inline mr-1" />
                Nomination withdrawn
              </p>
              <Button onClick={onNominateCommittee} className="w-full" variant="default">
                <FileText className="h-4 w-4 mr-2" />
                Submit New Nomination
              </Button>
            </>
          )}

          {nomination.status !== 'withdrawn' && nomination.districtCommissioner.approvalStatus === 'pending' && (
            <>
              <p className="text-sm text-muted-foreground bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <Clock className="h-4 w-4 inline mr-1" />
                Awaiting approval from Zone Representative
              </p>
              <div className="flex gap-2">
                <Button onClick={handleEdit} variant="outline" className="flex-1" disabled={withdrawing}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Nomination
                </Button>
                <Button onClick={handleWithdraw} variant="destructive" className="flex-1" disabled={withdrawing}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {withdrawing ? 'Withdrawing...' : 'Withdraw'}
                </Button>
              </div>
            </>
          )}

          {nomination.status !== 'withdrawn' && nomination.districtCommissioner.approvalStatus === 'rejected' && (
            <>
              <Button onClick={handleEdit} className="w-full bg-green-600 hover:bg-green-700" variant="default">
                <Edit className="h-4 w-4 mr-2" />
                Edit & Resubmit Nomination
              </Button>
            </>
          )}

          {nomination.status !== 'withdrawn' && nomination.districtCommissioner.approvalStatus === 'approved' && (
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md p-3">
              <CheckCircle className="h-4 w-4 inline mr-1" />
              Committee approved
            </p>
          )}

          {/* AGM Date */}
          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground">
              AGM Date: {new Date(nomination.agmDate).toLocaleDateString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
