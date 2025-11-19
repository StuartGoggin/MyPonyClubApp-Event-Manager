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
}: MemberAutocompleteFieldProps) {
  const [searchQuery, setSearchQuery] = useState(value);
  const [results, setResults] = useState<UserAutocompleteResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/users/autocomplete?q=${encodeURIComponent(searchQuery)}&limit=10`
        );
        
        if (!response.ok) {
          throw new Error('Failed to search users');
        }

        const data: UserAutocompleteResult[] = await response.json();
        setResults(data);
        setIsOpen(data.length > 0);
      } catch (error) {
        console.error('Error searching users:', error);
        setResults([]);
        setIsOpen(false);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleSelectUser = (user: UserAutocompleteResult) => {
    setSearchQuery(user.name);
    setIsOpen(false);
    onChange(user);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    
    // If user clears the input, reset the selection
    if (newValue === '') {
      onChange(null);
    }
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
          placeholder={placeholder}
          className={error ? 'border-red-500' : ''}
        />
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      </div>

      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {isLoading ? (
            <div className="p-3 text-sm text-gray-500 text-center">
              Searching...
            </div>
          ) : results.length === 0 ? (
            <div className="p-3 text-sm text-gray-500 text-center">
              No members found
            </div>
          ) : (
            <ul className="py-1">
              {results.map((user) => (
                <li
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
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
                    {user.ponyClubId && (
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">ID:</span> {user.ponyClubId}
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
