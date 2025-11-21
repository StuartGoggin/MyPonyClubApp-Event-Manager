'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserAutocompleteResult } from '@/types/committee-nomination';
import { Search } from 'lucide-react';

interface MemberAutocompleteFieldProps {
  label: string;
  value: string;
  onChange: (member: UserAutocompleteResult | null) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  useNamesEndpoint?: boolean; // Use /api/users/names for full user data with auto-fill
  onUserDataFound?: (userData: any) => void; // Callback when full user data is found
}

/**
 * Autocomplete input component for searching and selecting users
 * Used in committee nomination form to search members by name
 * and auto-populate their contact details (email, mobile, ponyClubId)
 */
export function MemberAutocompleteField({
  label,
  value,
  onChange,
  error,
  required = false,
  placeholder = 'Start typing name...',
  useNamesEndpoint = false,
  onUserDataFound,
}: MemberAutocompleteFieldProps) {
  const [searchQuery, setSearchQuery] = useState(value);
  const [results, setResults] = useState<UserAutocompleteResult[]>([]);
  const [fullResultsData, setFullResultsData] = useState<any[]>([]); // Store full data from /names endpoint
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync searchQuery with value prop when it changes from parent
  useEffect(() => {
    setSearchQuery(value);
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search users when query changes
  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.length < 2) {
        setResults([]);
        setFullResultsData([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      try {
        if (useNamesEndpoint) {
          // Use /api/users/names for full user data (for submitter field auto-fill)
          const response = await fetch(
            `/api/users/names?search=${encodeURIComponent(searchQuery)}`
          );
          
          if (!response.ok) {
            throw new Error('Failed to search users');
          }

          const data = await response.json();
          if (data.success && data.results) {
            setFullResultsData(data.results);
            // Convert to UserAutocompleteResult format
            const autocompleteResults: UserAutocompleteResult[] = data.results.map((result: any) => ({
              id: result.user?.id || 'manual-entry',
              name: result.name,
              ponyClubId: result.user?.id || '',
              email: result.user?.email || '',
              mobile: result.user?.mobileNumber || ''
            }));
            setResults(autocompleteResults);
            setIsOpen(autocompleteResults.length > 0);
          } else {
            setResults([]);
            setFullResultsData([]);
            setIsOpen(false);
          }
        } else {
          // Use /api/users/autocomplete (standard endpoint)
          const response = await fetch(
            `/api/users/autocomplete?q=${encodeURIComponent(searchQuery)}&limit=10`
          );
          
          if (!response.ok) {
            throw new Error('Failed to search users');
          }

          const data: UserAutocompleteResult[] = await response.json();
          setResults(data);
          setFullResultsData([]);
          setIsOpen(data.length > 0);
        }
      } catch (error) {
        console.error('Error searching users:', error);
        setResults([]);
        setFullResultsData([]);
        setIsOpen(false);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, useNamesEndpoint]);

  const handleSelectUser = (user: UserAutocompleteResult, index: number) => {
    setSearchQuery(user.name);
    setIsOpen(false);
    onChange(user);
    
    // If using names endpoint and callback provided, send full user data
    if (useNamesEndpoint && onUserDataFound && fullResultsData[index]) {
      onUserDataFound(fullResultsData[index]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    
    // If user clears the input, reset the selection
    if (newValue === '') {
      onChange(null);
    } else {
      // Allow manual entry - pass a basic user object with just the name
      // This allows new members who aren't in the directory yet
      onChange({
        id: 'manual-entry',
        name: newValue,
        ponyClubId: '',
        email: '',
        mobile: ''
      });
    }
  };

  // Handle blur to finalize manual entry
  const handleBlur = () => {
    setTimeout(() => {
      setIsOpen(false);
      // If there's text but no selection from dropdown, treat it as manual entry
      if (searchQuery.trim() && results.length === 0) {
        onChange({
          id: 'manual-entry',
          name: searchQuery.trim(),
          ponyClubId: '',
          email: '',
          mobile: ''
        });
      }
    }, 200);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Label htmlFor={`autocomplete-${label}`}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <div className="relative mt-1">
        <Input
          ref={inputRef}
          id={`autocomplete-${label}`}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={error ? 'border-red-500' : ''}
        />
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      </div>

      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
      
      {/* Show hint that manual entry is allowed */}
      {searchQuery.length >= 2 && !isLoading && results.length === 0 && !isOpen && (
        <p className="text-xs text-gray-500 mt-1">
          ℹ️ Entered name cannot be found as an active pony club member please enter details manually
        </p>
      )}

      {/* Loading indicator */}
      {isLoading && searchQuery.length >= 2 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="p-3 text-sm text-gray-500 text-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto mb-2"></div>
            Searching directory...
          </div>
        </div>
      )}

      {isOpen && !isLoading && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {results.length === 0 ? (
            <div className="p-3 text-sm text-gray-500 text-center">
              No members found
            </div>
          ) : (
            <ul className="py-1">
              {results.map((user, index) => (
                <li
                  key={user.id + index}
                  onClick={() => handleSelectUser(user, index)}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer transition-colors border-b border-gray-100 last:border-0"
                >
                  <div className="font-medium text-sm text-gray-900">{user.name}</div>
                  <div className="text-xs text-gray-600 mt-1 space-y-0.5">
                    {user.email && (
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">Email:</span> {user.email}
                      </div>
                    )}
                    {user.mobile && (
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">Mobile:</span> {user.mobile}
                      </div>
                    )}
                    {user.ponyClubId && user.id !== 'manual-entry' && (
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">ID:</span> {user.ponyClubId}
                      </div>
                    )}
                    {useNamesEndpoint && fullResultsData[index]?.clubId && (
                      <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full inline-block mt-1">
                        Auto-fill details
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
