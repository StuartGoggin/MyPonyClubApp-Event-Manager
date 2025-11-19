'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MemberAutocompleteField } from './member-autocomplete-field';
import { CommitteeNominationFormData, UserAutocompleteResult, AdditionalCommitteeMember } from '@/types/committee-nomination';
import { AlertCircle, Plus, Trash2, Upload } from 'lucide-react';

interface CommitteeNominationFormProps {
  clubId: string;
  clubName: string;
  onSubmitSuccess?: () => void;
  existingNominationId?: string; // For editing existing nominations
  initialData?: Partial<CommitteeNominationFormData>; // Pre-populate form data
}

interface FormErrors {
  [key: string]: string;
}

export function CommitteeNominationForm({ clubId, clubName, onSubmitSuccess, existingNominationId, initialData }: CommitteeNominationFormProps) {
  const [formData, setFormData] = useState<CommitteeNominationFormData>({
    clubId,
    clubName,
    zoneId: initialData?.zoneId || '',
    zoneName: initialData?.zoneName || '',
    agmDate: initialData?.agmDate || '',
    effectiveDate: initialData?.effectiveDate || '',
    districtCommissioner: initialData?.districtCommissioner || {
      name: '',
      ponyClubId: '',
      email: '',
      mobile: '',
      isZoneRep: false,
    },
    president: initialData?.president || undefined,
    vicePresident: initialData?.vicePresident || undefined,
    secretary: initialData?.secretary || undefined,
    treasurer: initialData?.treasurer || undefined,
    additionalCommittee: initialData?.additionalCommittee || [],
    zoneRepOption: 'other',
    zoneRepOther: initialData?.zoneRepOther || undefined,
    submitterName: initialData?.submitterName || '',
    submitterEmail: initialData?.submitterEmail || '',
    submitterPhone: initialData?.submitterPhone || '',
    additionalNotes: initialData?.additionalNotes || '',
  });

  const [zoneReps, setZoneReps] = useState<{ id: string; name: string; zone: string }[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploadingMinutes, setUploadingMinutes] = useState(false);

  // Load zone representatives
  useEffect(() => {
    const loadZoneReps = async () => {
      try {
        const response = await fetch('/api/zone-representatives');
        if (response.ok) {
          const data = await response.json();
          setZoneReps(data);
        }
      } catch (error) {
        console.error('Error loading zone representatives:', error);
      }
    };
    loadZoneReps();
  }, []);

  const handleDCChange = (user: UserAutocompleteResult | null) => {
    setFormData(prev => ({
      ...prev,
      districtCommissioner: user ? {
        name: user.name,
        ponyClubId: user.ponyClubId,
        email: user.email || '',
        mobile: user.mobile || '',
        isZoneRep: false,
      } : {
        name: '',
        ponyClubId: '',
        email: '',
        mobile: '',
        isZoneRep: false,
      }
    }));
    if (errors.districtCommissioner) {
      setErrors(prev => ({ ...prev, districtCommissioner: '' }));
    }
  };

  const handlePresidentChange = (user: UserAutocompleteResult | null) => {
    setFormData(prev => ({
      ...prev,
      president: user ? {
        name: user.name,
        ponyClubId: user.ponyClubId,
        email: user.email || '',
        mobile: user.mobile || '',
        isZoneRep: false,
      } : undefined
    }));
    if (errors.president) {
      setErrors(prev => ({ ...prev, president: '' }));
    }
  };

  const handleVicePresidentChange = (user: UserAutocompleteResult | null) => {
    setFormData(prev => ({
      ...prev,
      vicePresident: user ? {
        name: user.name,
        ponyClubId: user.ponyClubId,
        email: user.email || '',
        mobile: user.mobile || '',
        isZoneRep: false,
      } : undefined
    }));
    if (errors.vicePresident) {
      setErrors(prev => ({ ...prev, vicePresident: '' }));
    }
  };

  const handleSecretaryChange = (user: UserAutocompleteResult | null) => {
    setFormData(prev => ({
      ...prev,
      secretary: user ? {
        name: user.name,
        ponyClubId: user.ponyClubId,
        email: user.email || '',
        mobile: user.mobile || '',
        isZoneRep: false,
      } : undefined
    }));
    if (errors.secretary) {
      setErrors(prev => ({ ...prev, secretary: '' }));
    }
  };

  const handleTreasurerChange = (user: UserAutocompleteResult | null) => {
    setFormData(prev => ({
      ...prev,
      treasurer: user ? {
        name: user.name,
        ponyClubId: user.ponyClubId,
        email: user.email || '',
        mobile: user.mobile || '',
        isZoneRep: false,
      } : undefined
    }));
    if (errors.treasurer) {
      setErrors(prev => ({ ...prev, treasurer: '' }));
    }
  };

  const handleZoneRepChange = (user: UserAutocompleteResult | null) => {
    setFormData(prev => ({
      ...prev,
      zoneRepOther: user ? {
        name: user.name,
        ponyClubId: user.ponyClubId,
        email: user.email || '',
        mobile: user.mobile || '',
        isZoneRep: true,
      } : undefined
    }));
    if (errors.zoneRepresentative) {
      setErrors(prev => ({ ...prev, zoneRepresentative: '' }));
    }
  };

  const handleAdditionalMemberChange = (index: number, user: UserAutocompleteResult | null) => {
    setFormData(prev => {
      const updatedMembers = [...prev.additionalCommittee];
      if (user) {
        updatedMembers[index] = {
          name: user.name,
          ponyClubId: user.ponyClubId,
          email: user.email || '',
          mobile: user.mobile || '',
          isZoneRep: false,
          position: updatedMembers[index]?.position || '',
        };
      } else {
        updatedMembers[index] = {
          name: '',
          ponyClubId: '',
          email: '',
          mobile: '',
          isZoneRep: false,
          position: updatedMembers[index]?.position || '',
        };
      }
      return { ...prev, additionalCommittee: updatedMembers };
    });
  };

  const handleAdditionalMemberPositionChange = (index: number, position: string) => {
    setFormData(prev => {
      const updatedMembers = [...prev.additionalCommittee];
      updatedMembers[index] = {
        ...updatedMembers[index],
        position,
      };
      return { ...prev, additionalCommittee: updatedMembers };
    });
  };

  const addAdditionalMember = () => {
    setFormData(prev => ({
      ...prev,
      additionalCommittee: [
        ...prev.additionalCommittee,
        { name: '', ponyClubId: '', email: '', mobile: '', isZoneRep: false, position: '' }
      ]
    }));
  };

  const removeAdditionalMember = (index: number) => {
    setFormData(prev => ({
      ...prev,
      additionalCommittee: prev.additionalCommittee.filter((_: AdditionalCommitteeMember, i: number) => i !== index)
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type (PDF only)
    if (file.type !== 'application/pdf') {
      setErrors(prev => ({ ...prev, agmMinutes: 'Only PDF files are allowed' }));
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, agmMinutes: 'File size must be less than 5MB' }));
      return;
    }

    setUploadingMinutes(true);
    setErrors(prev => ({ ...prev, agmMinutes: '' }));

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('clubId', clubId);

      const response = await fetch('/api/upload/agm-minutes', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const data = await response.json();
      // setFormData(prev => ({ ...prev, agmMinutesUrl: data.url }));
    } catch (error) {
      console.error('Error uploading file:', error);
      setErrors(prev => ({ ...prev, agmMinutes: 'Failed to upload file. Please try again.' }));
    } finally {
      setUploadingMinutes(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Optional fields - only validate email/mobile if position is filled
    if (formData.districtCommissioner.name && !formData.districtCommissioner.email) {
      newErrors.districtCommissioner = 'District Commissioner email is required';
    }
    if (formData.districtCommissioner.name && !formData.districtCommissioner.mobile) {
      newErrors.districtCommissioner = 'District Commissioner mobile is required';
    }
    
    if (formData.president?.name && !formData.president.email) {
      newErrors.president = 'President email is required';
    }
    if (formData.president?.name && !formData.president.mobile) {
      newErrors.president = 'President mobile is required';
    }
    
    if (formData.vicePresident?.name && !formData.vicePresident.email) {
      newErrors.vicePresident = 'Vice President email is required';
    }
    if (formData.vicePresident?.name && !formData.vicePresident.mobile) {
      newErrors.vicePresident = 'Vice President mobile is required';
    }
    
    if (formData.secretary?.name && !formData.secretary.email) {
      newErrors.secretary = 'Secretary email is required';
    }
    if (formData.secretary?.name && !formData.secretary.mobile) {
      newErrors.secretary = 'Secretary mobile is required';
    }
    
    if (formData.treasurer?.name && !formData.treasurer.email) {
      newErrors.treasurer = 'Treasurer email is required';
    }
    if (formData.treasurer?.name && !formData.treasurer.mobile) {
      newErrors.treasurer = 'Treasurer mobile is required';
    }
    
    if (formData.zoneRepOther?.name && !formData.zoneRepOther.email) {
      newErrors.zoneRepEmail = 'Zone Representative email is required';
    }
    if (formData.zoneRepOther?.name && !formData.zoneRepOther.mobile) {
      newErrors.zoneRepMobile = 'Zone Representative mobile is required';
    }
    
    // AGM date is still required
    if (!formData.agmDate) {
      newErrors.agmDate = 'AGM date is required';
    }
    // AGM minutes removed from type definition
    // if (!formData.agmMinutesUrl) {
    //   newErrors.agmMinutes = 'AGM minutes upload is required';
    // }

    // Validate additional committee members
    formData.additionalCommittee.forEach((member: AdditionalCommitteeMember, index: number) => {
      if (member.name && !member.position) {
        newErrors[`additionalMember${index}Position`] = 'Position is required';
      }
      if (member.position && !member.name) {
        newErrors[`additionalMember${index}Name`] = 'Name is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      let response;
      
      if (existingNominationId) {
        // Update existing nomination
        response = await fetch(`/api/committee-nominations/${existingNominationId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
      } else {
        // Create new nomination
        response = await fetch('/api/committee-nominations/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${existingNominationId ? 'update' : 'submit'} nomination`);
      }

      // Success
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (error) {
      console.error(`Error ${existingNominationId ? 'updating' : 'submitting'} nomination:`, error);
      setSubmitError(error instanceof Error ? error.message : `Failed to ${existingNominationId ? 'update' : 'submit'} nomination`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{existingNominationId ? 'Edit' : 'Submit'} Committee Nomination for {clubName}</CardTitle>
          <CardDescription>
            {existingNominationId 
              ? 'Update your club\'s committee nominations. Changes will reset the approval status to pending.'
              : 'Submit your club\'s committee nominations following the Annual General Meeting. All fields marked with * are required.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* AGM Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">AGM Details</h3>
            
            <div>
              <Label htmlFor="agmDate">
                AGM Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="agmDate"
                type="date"
                value={formData.agmDate}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, agmDate: e.target.value }));
                  if (errors.agmDate) setErrors(prev => ({ ...prev, agmDate: '' }));
                }}
                className={errors.agmDate ? 'border-red-500' : ''}
              />
              {errors.agmDate && <p className="text-sm text-red-500 mt-1">{errors.agmDate}</p>}
            </div>

            <div>
              <Label htmlFor="agmMinutes">
                AGM Minutes (PDF)
              </Label>
              <div className="mt-1">
                <label htmlFor="agmMinutes" className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors">
                  {uploadingMinutes ? (
                    <span className="text-sm text-gray-500">Uploading...</span>
                  ) : (
                    <div className="text-center">
                      <Upload className="mx-auto h-8 w-8 text-gray-400" />
                      <span className="mt-2 block text-sm text-gray-600">
                        Click to upload AGM minutes (PDF, max 5MB)
                      </span>
                    </div>
                  )}
                  <input
                    id="agmMinutes"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploadingMinutes}
                  />
                </label>
              </div>
              {errors.agmMinutes && <p className="text-sm text-red-500 mt-1">{errors.agmMinutes}</p>}
            </div>
          </div>

          {/* Core Committee Positions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Core Committee Positions</h3>
            
            {/* District Commissioner */}
            <div className="space-y-3">
              <MemberAutocompleteField
                label="District Commissioner"
                value={formData.districtCommissioner.name}
                onChange={handleDCChange}
                error={errors.districtCommissioner}
                placeholder="Search for District Commissioner..."
              />
              
              <div className="grid grid-cols-2 gap-3 pl-4 border-l-2 border-blue-200">
                <div>
                  <Label htmlFor="dcEmail" className="text-xs">Email</Label>
                  <Input
                    id="dcEmail"
                    type="email"
                    value={formData.districtCommissioner.email}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        districtCommissioner: { ...prev.districtCommissioner, email: e.target.value }
                      }));
                    }}
                    placeholder="email@example.com"
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="dcMobile" className="text-xs">Mobile</Label>
                  <Input
                    id="dcMobile"
                    type="tel"
                    value={formData.districtCommissioner.mobile}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        districtCommissioner: { ...prev.districtCommissioner, mobile: e.target.value }
                      }));
                    }}
                    placeholder="0400 000 000"
                    className="h-9 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* President */}
            <div className="space-y-3">
              <MemberAutocompleteField
                label="President"
                value={formData.president?.name || ''}
                onChange={handlePresidentChange}
                error={errors.president}
                placeholder="Search for President..."
              />
              
              <div className="grid grid-cols-2 gap-3 pl-4 border-l-2 border-blue-200">
                <div>
                  <Label htmlFor="presidentEmail" className="text-xs">Email</Label>
                  <Input
                    id="presidentEmail"
                    type="email"
                    value={formData.president?.email || ''}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        president: prev.president ? { ...prev.president, email: e.target.value } : { name: '', ponyClubId: '', email: e.target.value, mobile: '', isZoneRep: false }
                      }));
                    }}
                    placeholder="email@example.com"
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="presidentMobile" className="text-xs">Mobile</Label>
                  <Input
                    id="presidentMobile"
                    type="tel"
                    value={formData.president?.mobile || ''}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        president: prev.president ? { ...prev.president, mobile: e.target.value } : { name: '', ponyClubId: '', email: '', mobile: e.target.value, isZoneRep: false }
                      }));
                    }}
                    placeholder="0400 000 000"
                    className="h-9 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Vice President */}
            <div className="space-y-3">
              <MemberAutocompleteField
                label="Vice President"
                value={formData.vicePresident?.name || ''}
                onChange={handleVicePresidentChange}
                error={errors.vicePresident}
                placeholder="Search for Vice President..."
              />
              
              <div className="grid grid-cols-2 gap-3 pl-4 border-l-2 border-blue-200">
                <div>
                  <Label htmlFor="vicePresidentEmail" className="text-xs">Email</Label>
                  <Input
                    id="vicePresidentEmail"
                    type="email"
                    value={formData.vicePresident?.email || ''}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        vicePresident: prev.vicePresident ? { ...prev.vicePresident, email: e.target.value } : { name: '', ponyClubId: '', email: e.target.value, mobile: '', isZoneRep: false }
                      }));
                    }}
                    placeholder="email@example.com"
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="vicePresidentMobile" className="text-xs">Mobile</Label>
                  <Input
                    id="vicePresidentMobile"
                    type="tel"
                    value={formData.vicePresident?.mobile || ''}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        vicePresident: prev.vicePresident ? { ...prev.vicePresident, mobile: e.target.value } : { name: '', ponyClubId: '', email: '', mobile: e.target.value, isZoneRep: false }
                      }));
                    }}
                    placeholder="0400 000 000"
                    className="h-9 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Secretary */}
            <div className="space-y-3">
              <MemberAutocompleteField
                label="Secretary"
                value={formData.secretary?.name || ''}
                onChange={handleSecretaryChange}
                error={errors.secretary}
                placeholder="Search for Secretary..."
              />
              
              <div className="grid grid-cols-2 gap-3 pl-4 border-l-2 border-blue-200">
                <div>
                  <Label htmlFor="secretaryEmail" className="text-xs">Email</Label>
                  <Input
                    id="secretaryEmail"
                    type="email"
                    value={formData.secretary?.email || ''}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        secretary: prev.secretary ? { ...prev.secretary, email: e.target.value } : { name: '', ponyClubId: '', email: e.target.value, mobile: '', isZoneRep: false }
                      }));
                    }}
                    placeholder="email@example.com"
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="secretaryMobile" className="text-xs">Mobile</Label>
                  <Input
                    id="secretaryMobile"
                    type="tel"
                    value={formData.secretary?.mobile || ''}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        secretary: prev.secretary ? { ...prev.secretary, mobile: e.target.value } : { name: '', ponyClubId: '', email: '', mobile: e.target.value, isZoneRep: false }
                      }));
                    }}
                    placeholder="0400 000 000"
                    className="h-9 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Treasurer */}
            <div className="space-y-3">
              <MemberAutocompleteField
                label="Treasurer"
                value={formData.treasurer?.name || ''}
                onChange={handleTreasurerChange}
                error={errors.treasurer}
                placeholder="Search for Treasurer..."
              />
              
              <div className="grid grid-cols-2 gap-3 pl-4 border-l-2 border-blue-200">
                <div>
                  <Label htmlFor="treasurerEmail" className="text-xs">Email</Label>
                  <Input
                    id="treasurerEmail"
                    type="email"
                    value={formData.treasurer?.email || ''}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        treasurer: prev.treasurer ? { ...prev.treasurer, email: e.target.value } : { name: '', ponyClubId: '', email: e.target.value, mobile: '', isZoneRep: false }
                      }));
                      // Clear error when user types
                      if (errors.treasurer) {
                        setErrors(prev => ({ ...prev, treasurer: '' }));
                      }
                    }}
                    placeholder="email@example.com"
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="treasurerMobile" className="text-xs">Mobile</Label>
                  <Input
                    id="treasurerMobile"
                    type="tel"
                    value={formData.treasurer?.mobile || ''}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        treasurer: prev.treasurer ? { ...prev.treasurer, mobile: e.target.value } : { name: '', ponyClubId: '', email: '', mobile: e.target.value, isZoneRep: false }
                      }));
                      // Clear error when user types
                      if (errors.treasurer) {
                        setErrors(prev => ({ ...prev, treasurer: '' }));
                      }
                    }}
                    placeholder="0400 000 000"
                    className="h-9 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Additional Committee Members */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Additional Committee Members</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addAdditionalMember}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </div>

            {formData.additionalCommittee.map((member: AdditionalCommitteeMember, index: number) => (
              <Card key={index} className="p-4">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <h4 className="font-medium">Member {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAdditionalMember(index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>

                  <div>
                    <Label htmlFor={`position-${index}`}>Position</Label>
                    <Input
                      id={`position-${index}`}
                      type="text"
                      value={member.position}
                      onChange={(e) => handleAdditionalMemberPositionChange(index, e.target.value)}
                      placeholder="e.g., Chief Instructor, Grounds Manager"
                      className={errors[`additionalMember${index}Position`] ? 'border-red-500' : ''}
                    />
                    {errors[`additionalMember${index}Position`] && (
                      <p className="text-sm text-red-500 mt-1">{errors[`additionalMember${index}Position`]}</p>
                    )}
                  </div>

                  <MemberAutocompleteField
                    label="Name"
                    value={member.name}
                    onChange={(user) => handleAdditionalMemberChange(index, user)}
                    error={errors[`additionalMember${index}Name`]}
                    placeholder="Search for member..."
                  />
                </div>
              </Card>
            ))}
          </div>

          {/* Zone Representative Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Zone Representative</h3>
            
            <MemberAutocompleteField
              label="Zone Representative"
              value={formData.zoneRepOther?.name || ''}
              onChange={handleZoneRepChange}
              error={errors.zoneRepresentative}
              placeholder="Search for Zone Representative..."
            />

            {/* Email - Editable */}
            <div className="grid grid-cols-2 gap-3 pl-4 border-l-2 border-blue-200">
              <div>
                <Label htmlFor="zoneRepEmail" className="text-xs">Email</Label>
                <Input
                  id="zoneRepEmail"
                  type="email"
                  value={formData.zoneRepOther?.email || ''}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      zoneRepOther: prev.zoneRepOther ? {
                        ...prev.zoneRepOther,
                        email: e.target.value
                      } : { name: '', ponyClubId: '', email: e.target.value, mobile: '', isZoneRep: true }
                    }));
                  }}
                  placeholder="zone.rep@example.com"
                  className={`h-9 text-sm ${errors.zoneRepEmail ? 'border-red-500' : ''}`}
                />
                {errors.zoneRepEmail && (
                  <p className="text-sm text-red-500 mt-1">{errors.zoneRepEmail}</p>
                )}
              </div>

              <div>
                <Label htmlFor="zoneRepMobile" className="text-xs">Mobile</Label>
                <Input
                  id="zoneRepMobile"
                  type="tel"
                  value={formData.zoneRepOther?.mobile || ''}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      zoneRepOther: prev.zoneRepOther ? {
                        ...prev.zoneRepOther,
                        mobile: e.target.value
                      } : { name: '', ponyClubId: '', email: '', mobile: e.target.value, isZoneRep: true }
                    }));
                  }}
                  placeholder="0400 000 000"
                  className={`h-9 text-sm ${errors.zoneRepMobile ? 'border-red-500' : ''}`}
                />
                {errors.zoneRepMobile && (
                  <p className="text-sm text-red-500 mt-1">{errors.zoneRepMobile}</p>
                )}
              </div>
            </div>
          </div>

          {/* Submit Error */}
          {submitError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting 
                ? (existingNominationId ? 'Updating...' : 'Submitting...') 
                : (existingNominationId ? 'Update Committee Nomination' : 'Submit Committee Nomination')
              }
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
