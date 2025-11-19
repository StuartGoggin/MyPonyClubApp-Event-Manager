'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CommitteeNomination } from '@/types/committee-nomination';
import { CheckCircle, XCircle, Clock, FileText, AlertCircle, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/auth-context';

interface ZoneCommitteeApprovalsProps {
  zoneId: string;
}

export function ZoneCommitteeApprovals({ zoneId }: ZoneCommitteeApprovalsProps) {
  const { user } = useAuth();
  const [nominations, setNominations] = useState<CommitteeNomination[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedNominationId, setExpandedNominationId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchPendingNominations();
    }
  }, [user?.id]);

  const fetchPendingNominations = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/committee-nominations/pending?zoneRepId=${user.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch pending nominations');
      }

      const data = await response.json();
      setNominations(data);
    } catch (error) {
      console.error('Error fetching pending nominations:', error);
      setError('Failed to load pending nominations');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (nomination: CommitteeNomination) => {
    if (!user || !nomination.id) return;

    setProcessing(nomination.id);

    try {
      const response = await fetch(`/api/committee-nominations/${nomination.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          zoneRepId: user.id,
          zoneRepName: `${user.firstName} ${user.lastName}`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to approve nomination');
      }

      // Refresh the list
      await fetchPendingNominations();
    } catch (error) {
      console.error('Error approving nomination:', error);
      alert(`Failed to approve: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (nomination: CommitteeNomination) => {
    if (!user || !nomination.id || !rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setProcessing(nomination.id);

    try {
      const response = await fetch(`/api/committee-nominations/${nomination.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          zoneRepName: `${user.firstName} ${user.lastName}`,
          reason: rejectionReason,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reject nomination');
      }

      // Reset state and refresh
      setRejectionReason('');
      setExpandedNominationId(null);
      await fetchPendingNominations();
    } catch (error) {
      console.error('Error rejecting nomination:', error);
      alert(`Failed to reject: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading pending nominations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (nominations.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
          <p className="text-muted-foreground">
            No pending committee nominations require your approval.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Pending Committee Nominations</h2>
        <Badge variant="secondary">{nominations.length} Pending</Badge>
      </div>

      {nominations.map((nomination) => {
        const isExpanded = expandedNominationId === nomination.id;
        const isProcessing = processing === nomination.id;

        return (
          <Card key={nomination.id} className="border-l-4 border-l-yellow-500">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl">{nomination.clubName}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Submitted {formatDistanceToNow(new Date(nomination.submittedAt), { addSuffix: true })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    AGM Date: {new Date(nomination.agmDate).toLocaleDateString()}
                  </p>
                </div>
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                  <Clock className="h-3 w-3 mr-1" />
                  Pending
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* District Commissioner */}
              <div className="bg-slate-50 rounded-lg p-4 border">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg">District Commissioner</h3>
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Name</p>
                    <p className="font-medium">{nomination.districtCommissioner.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Pony Club ID</p>
                    <p className="font-medium">{nomination.districtCommissioner.ponyClubId}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium text-blue-600">{nomination.districtCommissioner.email}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Mobile</p>
                    <p className="font-medium">{nomination.districtCommissioner.mobile}</p>
                  </div>
                </div>
              </div>

              {/* Other Committee Members */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {nomination.secretary && (
                  <div className="bg-slate-50 rounded-lg p-3 border">
                    <p className="font-semibold text-sm mb-1">Secretary</p>
                    <p className="text-sm">{nomination.secretary.name}</p>
                    <p className="text-xs text-muted-foreground">{nomination.secretary.email}</p>
                  </div>
                )}
                {nomination.treasurer && (
                  <div className="bg-slate-50 rounded-lg p-3 border">
                    <p className="font-semibold text-sm mb-1">Treasurer</p>
                    <p className="text-sm">{nomination.treasurer.name}</p>
                    <p className="text-xs text-muted-foreground">{nomination.treasurer.email}</p>
                  </div>
                )}
              </div>

              {/* Additional Committee Members */}
              {nomination.additionalCommittee && nomination.additionalCommittee.length > 0 && (
                <div>
                  <p className="font-semibold text-sm mb-2">Additional Committee Members</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {nomination.additionalCommittee.map((member, index) => (
                      <div key={index} className="bg-slate-50 rounded p-2 border text-sm">
                        <span className="font-medium">{member.position}:</span> {member.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Approval Actions */}
              <div className="border-t pt-4 space-y-3">
                {!isExpanded ? (
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleApprove(nomination)}
                      disabled={isProcessing}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {isProcessing ? 'Approving...' : 'Approve District Commissioner'}
                    </Button>
                    <Button
                      onClick={() => setExpandedNominationId(nomination.id!)}
                      disabled={isProcessing}
                      variant="destructive"
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="font-semibold text-sm">Provide a reason for rejection:</p>
                    <Textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Please provide detailed feedback for the club..."
                      rows={4}
                      className="w-full"
                    />
                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleReject(nomination)}
                        disabled={isProcessing || !rejectionReason.trim()}
                        variant="destructive"
                        className="flex-1"
                      >
                        {isProcessing ? 'Rejecting...' : 'Confirm Rejection'}
                      </Button>
                      <Button
                        onClick={() => {
                          setExpandedNominationId(null);
                          setRejectionReason('');
                        }}
                        disabled={isProcessing}
                        variant="outline"
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
