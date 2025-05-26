
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
  // Add other fields from the feed as needed
}

export interface ReservationDetails {
  name: string;
  email: string;
  phone: string;
  idFile: File | null;
}

