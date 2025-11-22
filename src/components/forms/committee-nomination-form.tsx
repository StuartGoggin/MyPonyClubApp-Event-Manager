'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MemberAutocompleteField } from './member-autocomplete-field';
import { CommitteeNominationFormData, UserAutocompleteResult } from '@/types/committee-nomination';
import { AlertCircle } from 'lucide-react';

interface CommitteeNominationFormProps {
  clubId: string;
  clubName: string;
  zoneId?: string;
  zoneName?: string;
  onSubmitSuccess?: () => void;
  existingNominationId?: string; // For editing existing nominations
  initialData?: Partial<CommitteeNominationFormData>; // Pre-populate form data
}

interface FormErrors {
  [key: string]: string;
}

export function CommitteeNominationForm({ clubId, clubName, zoneId, zoneName, onSubmitSuccess, existingNominationId, initialData }: CommitteeNominationFormProps) {
  const [formData, setFormData] = useState<CommitteeNominationFormData>({
    clubId,
    clubName,
    zoneId: initialData?.zoneId || zoneId || '',
    zoneName: initialData?.zoneName || zoneName || '',
    year: initialData?.year || new Date().getFullYear(),
    agmDate: initialData?.agmDate || '',
    effectiveDate: initialData?.effectiveDate || '',
    clubContactDetails: initialData?.clubContactDetails || {
      postalAddress: '',
      physicalAddress: '',
      email: '',
      clubColours: '',
      cavIncorporationNumber: '',
      rallyDay: '',
    },
    districtCommissioner: initialData?.districtCommissioner || {
      name: '',
      ponyClubId: '',
      email: '',
      mobile: '',
      address: '',
      isZoneRep: false,
      isNewDC: true, // Default to "New"
    },
    president: initialData?.president || undefined,
    vicePresident: initialData?.vicePresident || undefined,
    secretary: initialData?.secretary || undefined,
    treasurer: initialData?.treasurer || undefined,
    zoneRepOption: 'other',
    zoneRepOther: initialData?.zoneRepOther || undefined,
    submitterName: initialData?.submitterName || '',
    submitterEmail: initialData?.submitterEmail || '',
    submitterPhone: initialData?.submitterPhone || '',
    additionalNotes: initialData?.additionalNotes || '',
  });

  const [zoneReps, setZoneReps] = useState<{ id: string; name: string; zone: string }[]>([]);
  const [clubs, setClubs] = useState<{ id: string; name: string; zoneId?: string; zoneName?: string }[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitterComplete, setIsSubmitterComplete] = useState(false);
  const [hasValidationErrors, setHasValidationErrors] = useState(false);
  
  // Submitter state
  const [selectedUserData, setSelectedUserData] = useState<any>(null);
  const [selectedClubId, setSelectedClubId] = useState(clubId || '');
  const [selectedClubName, setSelectedClubName] = useState(clubName || '');

  // Load zone representatives and clubs
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

  useEffect(() => {
    const loadClubs = async () => {
      try {
        const response = await fetch('/api/clubs');
        if (response.ok) {
          const data = await response.json();
          console.log('Clubs API response:', data);
          // Handle both { clubs: [...] } and direct array responses
          const clubsList = Array.isArray(data) ? data : (data.clubs || []);
          console.log('Setting clubs:', clubsList.length, 'clubs');
          setClubs(clubsList);
        }
      } catch (error) {
        console.error('Error loading clubs:', error);
      }
    };
    loadClubs();
  }, []);

  // Auto-select club when user data is loaded and clubs are available
  useEffect(() => {
    if (selectedUserData?.clubId && clubs.length > 0) {
      const userClub = clubs.find(c => c.id === selectedUserData.clubId);
      console.log('Auto-selecting club:', { 
        userClubId: selectedUserData.clubId, 
        foundClub: userClub?.name,
        currentSelection: selectedClubId 
      });
      if (userClub && selectedClubId !== userClub.id) {
        console.log('Setting club to:', userClub.name);
        setSelectedClubId(userClub.id);
        setSelectedClubName(userClub.name);
        setFormData(prev => ({
          ...prev,
          clubId: userClub.id,
          clubName: userClub.name,
          zoneId: userClub.zoneId || prev.zoneId,
          zoneName: userClub.zoneName || prev.zoneName,
        }));
      }
    }
  }, [selectedUserData, clubs]);

  // Load club contact details when club is selected
  useEffect(() => {
    const loadClubContactDetails = async () => {
      if (!selectedClubId) return;
      
      try {
        const response = await fetch(`/api/clubs/${selectedClubId}`);
        if (response.ok) {
          const club = await response.json();
          setFormData(prev => ({
            ...prev,
            clubContactDetails: {
              postalAddress: club.postalAddress || '',
              physicalAddress: club.physicalAddress || '',
              email: club.email || '',
              clubColours: club.clubColours || '',
              cavIncorporationNumber: club.cavIncorporationNumber || '',
              rallyDay: club.rallyDay || '',
            }
          }));
        }
      } catch (error) {
        console.error('Error loading club contact details:', error);
      }
    };
    loadClubContactDetails();
  }, [selectedClubId]);

  // Check if submitter section is complete
  useEffect(() => {
    const isComplete = 
      formData.submitterName.trim() !== '' &&
      formData.submitterEmail.trim() !== '' &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.submitterEmail) &&
      formData.submitterPhone.trim() !== '' &&
      selectedClubId !== '';
    setIsSubmitterComplete(isComplete);
  }, [formData.submitterName, formData.submitterEmail, formData.submitterPhone, selectedClubId]);

  // Fetch user names for autocomplete
  // Handle name selection for submitter - with auto-fill capability
  const handleSubmitterNameChange = (user: UserAutocompleteResult | null) => {
    if (!user) {
      setFormData(prev => ({ ...prev, submitterName: '' }));
      setSelectedUserData(null);
      return;
    }

    // Set the name
    setFormData(prev => ({ ...prev, submitterName: user.name }));
    
    // Clear name error
    if (errors.submitterName) {
      setErrors(prev => ({ ...prev, submitterName: '' }));
    }
  };

  // Handle full user data when found (for auto-fill)
  const handleUserDataFound = (fullData: any) => {
    if (fullData?.user) {
      setSelectedUserData(fullData.user);
      
      // Auto-populate all submitter details
      setFormData(prev => ({
        ...prev,
        submitterEmail: fullData.user?.email || prev.submitterEmail,
        submitterPhone: fullData.user?.mobileNumber || prev.submitterPhone,
      }));
      
      // Auto-select club if user has a clubId
      if (fullData.user?.clubId) {
        const userClub = clubs.find(c => c.id === fullData.user.clubId);
        if (userClub) {
          setSelectedClubId(userClub.id);
          setSelectedClubName(userClub.name);
          setFormData(prev => ({
            ...prev,
            clubId: userClub.id,
            clubName: userClub.name,
            zoneId: userClub.zoneId || prev.zoneId,
            zoneName: userClub.zoneName || prev.zoneName,
          }));
        }
      }
      
      // Clear any errors
      setErrors(prev => ({
        ...prev,
        submitterName: '',
        submitterEmail: '',
        submitterPhone: '',
      }));
    }
  };

  const handleDCChange = (user: UserAutocompleteResult | null) => {
    setFormData(prev => ({
      ...prev,
      districtCommissioner: user ? {
        name: user.name,
        ponyClubId: user.ponyClubId,
        email: user.email || '',
        mobile: user.mobile || '',
        address: prev.districtCommissioner.address, // Preserve address
        isZoneRep: false,
        isNewDC: prev.districtCommissioner.isNewDC, // Preserve existing selection
      } : {
        name: '',
        ponyClubId: '',
        email: '',
        mobile: '',
        address: '',
        isZoneRep: false,
        isNewDC: prev.districtCommissioner.isNewDC, // Preserve existing selection
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
        address: prev.president?.address || '',
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
        address: prev.vicePresident?.address || '',
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
        address: prev.secretary?.address || '',
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
        address: prev.treasurer?.address || '',
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
        address: prev.zoneRepOther?.address || '',
        isZoneRep: true,
      } : undefined
    }));
    if (errors.zoneRepresentative) {
      setErrors(prev => ({ ...prev, zoneRepresentative: '' }));
    }
  };



  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Submitter information validation (required)
    if (!formData.submitterName || formData.submitterName.trim() === '') {
      newErrors.submitterName = 'Your name is required';
    }
    if (!formData.submitterEmail || formData.submitterEmail.trim() === '') {
      newErrors.submitterEmail = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.submitterEmail)) {
      newErrors.submitterEmail = 'Please enter a valid email address';
    }
    if (!formData.submitterPhone || formData.submitterPhone.trim() === '') {
      newErrors.submitterPhone = 'Phone number is required';
    }

    // Club selection validation
    if (!selectedClubId || selectedClubId === '') {
      newErrors.club = 'Please select a club';
    }

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



    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submission started');
    console.log('Form data:', formData);
    
    if (!validateForm()) {
      setHasValidationErrors(true);
      console.log('Validation failed:', errors);
      // Scroll to first error
      setTimeout(() => {
        const firstError = document.querySelector('.border-red-500');
        if (firstError) {
          firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return;
    }

    setHasValidationErrors(false);
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      console.log('Submitting to API...');
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

      console.log('API response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error:', errorData);
        throw new Error(errorData.error || `Failed to ${existingNominationId ? 'update' : 'submit'} nomination`);
      }

      const responseData = await response.json();
      console.log('Success response:', responseData);

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

  // Fill form with test data
  const fillTestData = () => {
    const testDate = new Date();
    testDate.setDate(testDate.getDate() + 7); // AGM in 7 days
    
    setFormData({
      ...formData,
      submitterName: 'Sarah Johnson',
      submitterEmail: 'sarah.johnson@example.com',
      submitterPhone: '0412 345 678',
      agmDate: testDate.toISOString().split('T')[0],
      effectiveDate: new Date(testDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days after AGM
      districtCommissioner: {
        name: 'John Smith',
        ponyClubId: 'PC12345',
        email: 'john.smith@example.com',
        mobile: '0423 456 789',
        address: '123 Main Street, Melbourne VIC 3000',
        isZoneRep: false,
        isNewDC: true,
      },
      president: {
        name: 'Emma Wilson',
        ponyClubId: 'PC23456',
        email: 'emma.wilson@example.com',
        mobile: '0434 567 890',
        address: '456 Oak Avenue, Geelong VIC 3220',
        isZoneRep: false,
      },
      vicePresident: {
        name: 'Michael Brown',
        ponyClubId: 'PC34567',
        email: 'michael.brown@example.com',
        mobile: '0445 678 901',
        address: '789 Elm Road, Ballarat VIC 3350',
        isZoneRep: false,
      },
      secretary: {
        name: 'Lisa Anderson',
        ponyClubId: 'PC45678',
        email: 'lisa.anderson@example.com',
        mobile: '0456 789 012',
        address: '321 Pine Street, Bendigo VIC 3550',
        isZoneRep: false,
      },
      treasurer: {
        name: 'David Taylor',
        ponyClubId: 'PC56789',
        email: 'david.taylor@example.com',
        mobile: '0467 890 123',
        address: '654 Maple Drive, Warrnambool VIC 3280',
        isZoneRep: false,
      },
      zoneRepOther: {
        name: 'Rebecca Martinez',
        ponyClubId: 'PC67890',
        email: 'rebecca.martinez@example.com',
        mobile: '0478 901 234',
        address: '159 River Road, Echuca VIC 3564',
        isZoneRep: true,
      },
      additionalNotes: 'This is a test submission with realistic dummy data for testing purposes.',
    });
    
    // Set submitter as complete
    setIsSubmitterComplete(true);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Test Data Button - Only show in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 z-50">
          <Button
            type="button"
            onClick={fillTestData}
            className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg"
            size="sm"
          >
            🧪 Fill Test Data
          </Button>
        </div>
      )}
      
      {/* Process Flow Chart */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">Committee Nomination Process</h3>
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          {/* Step 1 */}
          <div className="flex flex-col items-center flex-1">
            <div className="w-16 h-16 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-xl mb-2 shadow-lg">
              1
            </div>
            <p className="text-sm font-semibold text-gray-700 text-center">Enter Your Info</p>
            <p className="text-xs text-gray-500 text-center mt-1">Name, email, phone</p>
          </div>
          
          {/* Arrow */}
          <div className="flex items-center px-2">
            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          
          {/* Step 2 */}
          <div className="flex flex-col items-center flex-1">
            <div className={`w-16 h-16 rounded-full ${isSubmitterComplete ? 'bg-blue-500' : 'bg-gray-300'} text-white flex items-center justify-center font-bold text-xl mb-2 shadow-lg`}>
              2
            </div>
            <p className="text-sm font-semibold text-gray-700 text-center">AGM & Committee</p>
            <p className="text-xs text-gray-500 text-center mt-1">5 core positions</p>
          </div>
          
          {/* Arrow */}
          <div className="flex items-center px-2">
            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          
          {/* Step 3 */}
          <div className="flex flex-col items-center flex-1">
            <div className="w-16 h-16 rounded-full bg-gray-300 text-white flex items-center justify-center font-bold text-xl mb-2 shadow-lg">
              3
            </div>
            <p className="text-sm font-semibold text-gray-700 text-center">Submit</p>
            <p className="text-xs text-gray-500 text-center mt-1">Review & send</p>
          </div>
          
          {/* Arrow */}
          <div className="flex items-center px-2">
            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          
          {/* Step 4 */}
          <div className="flex flex-col items-center flex-1">
            <div className="w-16 h-16 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-700 text-center">Email with PDF</p>
            <p className="text-xs text-gray-500 text-center mt-1">Confirmation sent</p>
          </div>
        </div>
        
        {/* What happens after submission */}
        <div className="mt-6 pt-6 border-t border-blue-200">
          <p className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            After Submission:
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Email Confirmation</p>
                <p className="text-xs text-gray-600 mt-1">
                  You will receive an email confirmation containing the official <strong>SMZ Club Contacts Update Form</strong> as required by zone bylaws.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Zone Approval</p>
                <p className="text-xs text-gray-600 mt-1">
                  The SMZ Club Contacts Update Form will be sent to your zone for approval and ratification. This will take place at the zone meeting following your submission.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">District Commissioner Approval</p>
                <p className="text-xs text-gray-600 mt-1">
                  Your chosen District Commissioner must be approved and minuted at a zone meeting for that role to be officially recognised.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Submitter Information Card - Always Visible */}
      <Card className="border-2 border-blue-500">
        <CardHeader className="bg-blue-50">
          <CardTitle className="text-blue-900 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">1</span>
            Your Information
          </CardTitle>
          <CardDescription>
            Start by entering your details. Your club will be auto-filled from your profile, but you can change it if needed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Name with Autocomplete */}
          <div className="space-y-2">
            <MemberAutocompleteField
              label="Your Name"
              value={formData.submitterName}
              onChange={handleSubmitterNameChange}
              onUserDataFound={handleUserDataFound}
              useNamesEndpoint={true}
              error={errors.submitterName}
              required={true}
              placeholder="Type your name..."
            />
          </div>

          {/* Auto-filled user info display */}
          {selectedUserData && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-700">
                  Profile Found: {selectedUserData.firstName} {selectedUserData.lastName}
                </span>
              </div>
              <p className="text-xs text-green-600 mt-1">
                Contact details and club auto-filled from your profile (you can still change them below)
              </p>
            </div>
          )}

          {/* Email and Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="submitterEmail">
                Email Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="submitterEmail"
                type="email"
                value={formData.submitterEmail}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, submitterEmail: e.target.value }));
                  setErrors(prev => ({ ...prev, submitterEmail: '' }));
                }}
                placeholder="your.email@example.com"
                className={errors.submitterEmail ? 'border-red-500' : ''}
                required
              />
              {errors.submitterEmail && <p className="text-sm text-red-500 mt-1">{errors.submitterEmail}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="submitterPhone">
                Phone Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="submitterPhone"
                type="tel"
                value={formData.submitterPhone}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, submitterPhone: e.target.value }));
                  setErrors(prev => ({ ...prev, submitterPhone: '' }));
                }}
                placeholder="0400 000 000"
                className={errors.submitterPhone ? 'border-red-500' : ''}
                required
              />
              {errors.submitterPhone && <p className="text-sm text-red-500 mt-1">{errors.submitterPhone}</p>}
            </div>
          </div>

          {/* Club Selection - Overridable */}
          <div className="space-y-2">
            <Label htmlFor="clubSelect">
              Club <span className="text-red-500">*</span>
            </Label>
            <select
              id="clubSelect"
              aria-label="Select your club"
              value={selectedClubId}
              onChange={(e) => {
                const club = clubs.find(c => c.id === e.target.value);
                if (club) {
                  setSelectedClubId(club.id);
                  setSelectedClubName(club.name);
                  setFormData(prev => ({
                    ...prev,
                    clubId: club.id,
                    clubName: club.name,
                    zoneId: club.zoneId || prev.zoneId,
                    zoneName: club.zoneName || prev.zoneName,
                  }));
                }
              }}
              className="block h-10 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            >
              <option value="">Select a club...</option>
              {clubs.map((club) => (
                <option key={club.id} value={club.id}>
                  {club.name}
                </option>
              ))}
            </select>
            {selectedUserData?.clubId && (
              <p className="text-xs text-blue-600 mt-1">
                ✓ Auto-filled from your profile. You can change if needed.
              </p>
            )}
          </div>

          {/* Continue Button */}
          {!isSubmitterComplete && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                Please complete all required fields above to continue to the committee nomination form.
              </p>
            </div>
          )}
          
          {isSubmitterComplete && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800 font-medium">
                ✓ Submitter information complete! Scroll down to fill in committee details.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Club Contact Details - Only shown when club is selected */}
      {selectedClubId && (
        <Card>
          <CardHeader>
            <CardTitle>Club Contact Details</CardTitle>
            <CardDescription>
              Review and update club contact information. This data defaults from your club settings but can be edited for this nomination.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Postal Address */}
              <div className="space-y-2">
                <Label htmlFor="clubPostalAddress">Club Postal Address</Label>
                <Textarea
                  id="clubPostalAddress"
                  value={formData.clubContactDetails?.postalAddress || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    clubContactDetails: {
                      ...prev.clubContactDetails!,
                      postalAddress: e.target.value,
                    }
                  }))}
                  placeholder="Enter club postal address"
                  rows={3}
                  className="resize-none"
                />
              </div>

              {/* Physical Address */}
              <div className="space-y-2">
                <Label htmlFor="clubPhysicalAddress">Club Physical Address</Label>
                <Textarea
                  id="clubPhysicalAddress"
                  value={formData.clubContactDetails?.physicalAddress || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    clubContactDetails: {
                      ...prev.clubContactDetails!,
                      physicalAddress: e.target.value,
                    }
                  }))}
                  placeholder="Enter club physical address"
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="clubEmail">Club Email</Label>
                <Input
                  id="clubEmail"
                  type="email"
                  value={formData.clubContactDetails?.email || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    clubContactDetails: {
                      ...prev.clubContactDetails!,
                      email: e.target.value,
                    }
                  }))}
                  placeholder="club@example.com"
                />
              </div>

              {/* Club Colours */}
              <div className="space-y-2">
                <Label htmlFor="clubColours">Club Colours</Label>
                <Input
                  id="clubColours"
                  value={formData.clubContactDetails?.clubColours || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    clubContactDetails: {
                      ...prev.clubContactDetails!,
                      clubColours: e.target.value,
                    }
                  }))}
                  placeholder="e.g., Royal Blue and White"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* CAV Incorporation Number */}
              <div className="space-y-2">
                <Label htmlFor="cavIncorporationNumber">CAV Incorporation Number</Label>
                <Input
                  id="cavIncorporationNumber"
                  value={formData.clubContactDetails?.cavIncorporationNumber || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    clubContactDetails: {
                      ...prev.clubContactDetails!,
                      cavIncorporationNumber: e.target.value,
                    }
                  }))}
                  placeholder="e.g., A1234567X"
                />
              </div>

              {/* Rally Day */}
              <div className="space-y-2">
                <Label htmlFor="rallyDay">Rally Day</Label>
                <Input
                  id="rallyDay"
                  value={formData.clubContactDetails?.rallyDay || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    clubContactDetails: {
                      ...prev.clubContactDetails!,
                      rallyDay: e.target.value,
                    }
                  }))}
                  placeholder="e.g., Saturday"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Committee Nomination Form - Only shown when submitter is complete */}
      {isSubmitterComplete && (
        <Card className="border-2 border-blue-400">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
            <CardTitle className="text-blue-900 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">2</span>
              AGM Details & Committee Positions
            </CardTitle>
            <CardDescription>
              {existingNominationId 
                ? 'Update your club\'s committee nominations. Changes will reset the approval status to pending.'
                : `Fill in the AGM date and core committee positions for ${selectedClubName}. Search for members by name to auto-fill their contact details.`
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* AGM Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">AGM Details</h3>
            
            <div className="space-y-2">
              <Label htmlFor="agmDate" className="block">
                AGM Date <span className="text-red-500">*</span>
              </Label>
              <input
                id="agmDate"
                name="agmDate"
                type="date"
                value={formData.agmDate}
                onChange={(e) => {
                  const agmDate = e.target.value;
                  const year = agmDate ? new Date(agmDate).getFullYear() : new Date().getFullYear();
                  setFormData(prev => ({ ...prev, agmDate, year }));
                  if (errors.agmDate) setErrors(prev => ({ ...prev, agmDate: '' }));
                }}
                className={`block h-10 w-full rounded-md border px-3 py-2 text-sm ${errors.agmDate ? 'border-red-500' : 'border-gray-300'}`}
                max={new Date().toISOString().split('T')[0]}
                title="Select the date of your Annual General Meeting"
                required
                aria-label="AGM Date"
              />
              {errors.agmDate && <p className="text-sm text-red-500 mt-1">{errors.agmDate}</p>}
              {formData.agmDate && (
                <p className="text-sm text-gray-500 mt-1">Committee Year: {new Date(formData.agmDate).getFullYear()}</p>
              )}
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
              
              <div className="pl-4 border-l-2 border-blue-200">
                <Label htmlFor="dcAddress" className="text-xs">Address</Label>
                <Input
                  id="dcAddress"
                  type="text"
                  value={formData.districtCommissioner.address}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      districtCommissioner: { ...prev.districtCommissioner, address: e.target.value }
                    }));
                  }}
                  placeholder="Street address, City, State, Postcode"
                  className="h-9 text-sm"
                />
              </div>
              
              {/* New or Existing DC Radio Buttons */}
              <div className="pl-4 border-l-2 border-blue-200">
                <Label className="text-xs mb-2 block">District Commissioner Status</Label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="dcStatus"
                      checked={formData.districtCommissioner.isNewDC === true}
                      onChange={() => {
                        setFormData(prev => ({
                          ...prev,
                          districtCommissioner: { ...prev.districtCommissioner, isNewDC: true }
                        }));
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">New</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="dcStatus"
                      checked={formData.districtCommissioner.isNewDC === false}
                      onChange={() => {
                        setFormData(prev => ({
                          ...prev,
                          districtCommissioner: { ...prev.districtCommissioner, isNewDC: false }
                        }));
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Existing</span>
                  </label>
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
                        president: prev.president ? { ...prev.president, email: e.target.value } : { name: '', ponyClubId: '', email: e.target.value, mobile: '', address: '', isZoneRep: false }
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
                        president: prev.president ? { ...prev.president, mobile: e.target.value } : { name: '', ponyClubId: '', email: '', mobile: e.target.value, address: '', isZoneRep: false }
                      }));
                    }}
                    placeholder="0400 000 000"
                    className="h-9 text-sm"
                  />
                </div>
              </div>
              
              <div className="pl-4 border-l-2 border-blue-200">
                <Label htmlFor="presidentAddress" className="text-xs">Address</Label>
                <Input
                  id="presidentAddress"
                  type="text"
                  value={formData.president?.address || ''}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      president: prev.president ? { ...prev.president, address: e.target.value } : { name: '', ponyClubId: '', email: '', mobile: '', address: e.target.value, isZoneRep: false }
                    }));
                  }}
                  placeholder="Street address, City, State, Postcode"
                  className="h-9 text-sm"
                />
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
                        vicePresident: prev.vicePresident ? { ...prev.vicePresident, email: e.target.value } : { name: '', ponyClubId: '', email: e.target.value, mobile: '', address: '', isZoneRep: false }
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
                        vicePresident: prev.vicePresident ? { ...prev.vicePresident, mobile: e.target.value } : { name: '', ponyClubId: '', email: '', mobile: e.target.value, address: '', isZoneRep: false }
                      }));
                    }}
                    placeholder="0400 000 000"
                    className="h-9 text-sm"
                  />
                </div>
              </div>
              
              <div className="pl-4 border-l-2 border-blue-200">
                <Label htmlFor="vicePresidentAddress" className="text-xs">Address</Label>
                <Input
                  id="vicePresidentAddress"
                  type="text"
                  value={formData.vicePresident?.address || ''}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      vicePresident: prev.vicePresident ? { ...prev.vicePresident, address: e.target.value } : { name: '', ponyClubId: '', email: '', mobile: '', address: e.target.value, isZoneRep: false }
                    }));
                  }}
                  placeholder="Street address, City, State, Postcode"
                  className="h-9 text-sm"
                />
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
                        secretary: prev.secretary ? { ...prev.secretary, email: e.target.value } : { name: '', ponyClubId: '', email: e.target.value, mobile: '', address: '', isZoneRep: false }
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
                        secretary: prev.secretary ? { ...prev.secretary, mobile: e.target.value } : { name: '', ponyClubId: '', email: '', mobile: e.target.value, address: '', isZoneRep: false }
                      }));
                    }}
                    placeholder="0400 000 000"
                    className="h-9 text-sm"
                  />
                </div>
              </div>
              
              <div className="pl-4 border-l-2 border-blue-200">
                <Label htmlFor="secretaryAddress" className="text-xs">Address</Label>
                <Input
                  id="secretaryAddress"
                  type="text"
                  value={formData.secretary?.address || ''}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      secretary: prev.secretary ? { ...prev.secretary, address: e.target.value } : { name: '', ponyClubId: '', email: '', mobile: '', address: e.target.value, isZoneRep: false }
                    }));
                  }}
                  placeholder="Street address, City, State, Postcode"
                  className="h-9 text-sm"
                />
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
                        treasurer: prev.treasurer ? { ...prev.treasurer, email: e.target.value } : { name: '', ponyClubId: '', email: e.target.value, mobile: '', address: '', isZoneRep: false }
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
                        treasurer: prev.treasurer ? { ...prev.treasurer, mobile: e.target.value } : { name: '', ponyClubId: '', email: '', mobile: e.target.value, address: '', isZoneRep: false }
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
              
              <div className="pl-4 border-l-2 border-blue-200">
                <Label htmlFor="treasurerAddress" className="text-xs">Address</Label>
                <Input
                  id="treasurerAddress"
                  type="text"
                  value={formData.treasurer?.address || ''}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      treasurer: prev.treasurer ? { ...prev.treasurer, address: e.target.value } : { name: '', ponyClubId: '', email: '', mobile: '', address: e.target.value, isZoneRep: false }
                    }));
                  }}
                  placeholder="Street address, City, State, Postcode"
                  className="h-9 text-sm"
                />
              </div>
            </div>
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
                      } : { name: '', ponyClubId: '', email: e.target.value, mobile: '', address: '', isZoneRep: true }
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
                      } : { name: '', ponyClubId: '', email: '', mobile: e.target.value, address: '', isZoneRep: true }
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
          <div className={`bg-gradient-to-r rounded-lg p-6 border-2 transition-all duration-300 ${
            hasValidationErrors 
              ? 'from-red-50 to-orange-50 border-red-500 shadow-lg shadow-red-200' 
              : 'from-green-50 to-blue-50 border-green-200'
          }`}>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <span className={`w-12 h-12 rounded-full text-white flex items-center justify-center text-lg font-bold shadow-lg ${
                  hasValidationErrors ? 'bg-red-500' : 'bg-green-500'
                }`}>
                  {hasValidationErrors ? (
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  ) : (
                    '4'
                  )}
                </span>
              </div>
              <div className="flex-1">
                {hasValidationErrors ? (
                  <>
                    <h3 className="text-lg font-semibold text-red-800 mb-2 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Please Fix Errors Before Submitting
                    </h3>
                    <div className="bg-red-100 border border-red-300 rounded-lg p-4 mb-4">
                      <p className="text-sm text-red-800 font-medium mb-2">
                        The form has {Object.keys(errors).length} validation error{Object.keys(errors).length !== 1 ? 's' : ''}:
                      </p>
                      <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                        {Object.entries(errors).slice(0, 5).map(([key, error]) => (
                          <li key={key}>{error}</li>
                        ))}
                        {Object.keys(errors).length > 5 && (
                          <li className="text-red-600 font-medium">...and {Object.keys(errors).length - 5} more</li>
                        )}
                      </ul>
                      <p className="text-xs text-red-600 mt-3 font-medium">
                        → Scroll up to see fields highlighted in red
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Ready to Submit?</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      After submitting, you'll receive an instant confirmation email with a filled PDF form attached. 
                      The PDF will contain all the committee details you've entered, formatted in the official PCA template.
                    </p>
                  </>
                )}
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className={`font-semibold px-8 py-6 text-lg shadow-lg transition-all ${
                    hasValidationErrors
                      ? 'bg-red-600 hover:bg-red-700 cursor-not-allowed opacity-75'
                      : 'bg-green-600 hover:bg-green-700'
                  } text-white`}
                >
                  {isSubmitting 
                    ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {existingNominationId ? 'Updating...' : 'Submitting...'}
                      </span>
                    )
                    : (
                      <span className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {existingNominationId ? 'Update Committee Nomination' : 'Submit Committee Nomination'}
                      </span>
                    )
                  }
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      )}
    </form>
  );
}
