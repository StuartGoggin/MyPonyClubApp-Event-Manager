// Validation utilities for club data

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const validatePostcode = (postcode: string, country: string = 'AU'): boolean => {
  if (country === 'AU') {
    // Australian postcode: 4 digits
    return /^\d{4}$/.test(postcode);
  }
  // For other countries, basic length check
  return postcode.length >= 3 && postcode.length <= 10;
};

export const validateSocialMediaUrl = (url: string, platform: string): boolean => {
  if (!validateUrl(url)) return false;
  
  const platformPatterns = {
    facebook: /^https?:\/\/(www\.)?facebook\.com\/.+/i,
    instagram: /^https?:\/\/(www\.)?instagram\.com\/.+/i,
    twitter: /^https?:\/\/(www\.)?twitter\.com\/.+/i,
    youtube: /^https?:\/\/(www\.)?youtube\.com\/.+/i,
  };
  
  const pattern = platformPatterns[platform as keyof typeof platformPatterns];
  return pattern ? pattern.test(url) : true;
};

export const formatAddress = (address: {
  street?: string;
  suburb?: string;
  postcode?: string;
  state?: string;
  country?: string;
}): string => {
  const parts = [
    address.street,
    address.suburb,
    address.state && address.postcode ? `${address.state} ${address.postcode}` : address.state || address.postcode,
    address.country
  ].filter(Boolean);
  
  return parts.join(', ');
};

export interface ValidationErrors {
  email?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
  postcode?: string;
  logoUrl?: string;
}

export const validateClubData = (data: {
  email?: string;
  website?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
  };
  address?: {
    postcode?: string;
  };
  logoUrl?: string;
}): ValidationErrors => {
  const errors: ValidationErrors = {};
  
  if (data.email && !validateEmail(data.email)) {
    errors.email = 'Please enter a valid email address';
  }
  
  if (data.website && !validateUrl(data.website)) {
    errors.website = 'Please enter a valid website URL';
  }
  
  if (data.logoUrl && !validateUrl(data.logoUrl)) {
    errors.logoUrl = 'Please enter a valid image URL';
  }
  
  if (data.socialMedia?.facebook && !validateSocialMediaUrl(data.socialMedia.facebook, 'facebook')) {
    errors.facebook = 'Please enter a valid Facebook URL';
  }
  
  if (data.socialMedia?.instagram && !validateSocialMediaUrl(data.socialMedia.instagram, 'instagram')) {
    errors.instagram = 'Please enter a valid Instagram URL';
  }
  
  if (data.socialMedia?.twitter && !validateSocialMediaUrl(data.socialMedia.twitter, 'twitter')) {
    errors.twitter = 'Please enter a valid Twitter URL';
  }
  
  if (data.socialMedia?.youtube && !validateSocialMediaUrl(data.socialMedia.youtube, 'youtube')) {
    errors.youtube = 'Please enter a valid YouTube URL';
  }
  
  if (data.address?.postcode && !validatePostcode(data.address.postcode)) {
    errors.postcode = 'Please enter a valid postcode (4 digits for Australia)';
  }
  
  return errors;
};
