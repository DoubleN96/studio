
export interface RoomPhoto {
  id: number;
  url_thumbnail: string;
  url_medium: string;
  url_original: string;
  caption: string | null;
  order: number;
}

export interface RoomAvailability {
  available_now: boolean;
  available_from: string | null; // Date string e.g., "2024-08-01"
  minimum_stay_months: number | null;
  maximum_stay_months: number | null;
  unavailable_dates_range?: Record<string, [string, string]> | null; // e.g. {"timestamp": ["YYYY-MM-DD", "YYYY-MM-DD"]}
}

export interface Amenity {
  id: number;
  name: string;
  key: string; // e.g., "wifi", "tv", "air-conditioning"
  icon_name: string | null;
  category_id: number;
  category_name: string;
}

export interface Room {
  id: number;
  code?: string;
  title: string;
  description: string | null;
  monthly_price: number;
  currency_symbol: string;
  currency_code: string; // e.g., "EUR"
  city: string;
  address_1: string;
  address_2: string | null;
  postcode: string | null;
  country: string;
  lat: number | null;
  lng: number | null;
  photos: RoomPhoto[];
  availability: RoomAvailability;
  property_type_name: string; // e.g., "Apartment"
  room_type_name: string; // e.g., "Private Room"
  bedrooms: number | null;
  bathrooms: number | null;
  square_meters: number | null;
  amenities: Amenity[];
  is_verified: boolean;
  flat_video?: string | null; // Added for YouTube video
}

export interface ReservationDetailsType {
  // Step 1
  startDate?: Date;
  duration?: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;

  // Step 3 - Additional Information
  bookedRoom?: string;
  birthDate?: Date;
  gender?: string;
  studyOrWork?: string;
  currentAddress?: string;
  passportIdNumber?: string;
  originCountry?: string;
  checkInDate?: Date; // Derived from startDate
  checkOutDate?: Date; // Derived from startDate + duration
  iban?: string;
  bic?: string;
  emergencyContact?: string;
  universityWorkCenter?: string;

  // Mock file tracking (not part of form data directly)
  passportIdFile?: File | null;
  proofOfStudiesWorkFile?: File | null;
}

// For General Contract Settings on Dashboard
export interface GeneralContractSettings {
  companyName: string;
  companyCif: string;
  representativeName: string;
  representativeDni: string;
  contactEmail: string;
  supplyCostsClause: string; // Text area for longer clause
  lateRentPenaltyClause: string; // Text area
  lateCheckoutPenaltyClause: string; // Text area
  inventoryDamagePolicy: string; // Text area
  noisePolicyGuestLimit: number;
  depositReturnTimeframe: string; // e.g., "dos meses", "60 días"
  serviceFeePercentage?: number; // Added for service fee configuration
}
