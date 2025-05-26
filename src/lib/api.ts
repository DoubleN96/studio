
import type { Room, RoomPhoto, Amenity, RoomAvailability } from './types';

const API_URL = 'https://tripath.colivingsoft.site/api/version/2.0/default/rooms/feed';

// Helper to get a currency symbol (simplified)
function getCurrencySymbol(currencyCode: string): string {
  switch (currencyCode?.toUpperCase()) {
    case 'EUR':
      return '€';
    case 'USD':
      return '$';
    case 'GBP':
      return '£';
    default:
      return currencyCode || '';
  }
}

export async function fetchRooms(): Promise<Room[]> {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      let errorBody = '';
      try {
        errorBody = await response.text();
      } catch (textError) {
        // Ignore if can't read body
      }
      console.error(`API request failed to fetch rooms: ${response.status} ${response.statusText}. Response body: ${errorBody}`);
      throw new Error(`Error fetching rooms: ${response.status} ${response.statusText}`);
    }
    const apiResult = await response.json();

    let roomsData: any[] = [];

    if (Array.isArray(apiResult)) {
      roomsData = apiResult;
    } else if (typeof apiResult === 'object' && apiResult !== null) {
      // Try common keys for nested arrays
      const commonKeys = ['data', 'results', 'items', 'rooms', 'feed'];
      for (const key of commonKeys) {
        if (Array.isArray(apiResult[key])) {
          roomsData = apiResult[key];
          break;
        } else if (typeof apiResult[key] === 'object' && apiResult[key] !== null) {
          // Try common keys within a nested object like data.rooms
           const subKeys = ['rooms', 'items', 'results', 'list', 'entities'];
           for (const subKey of subKeys) {
             if (Array.isArray(apiResult[key][subKey])) {
               roomsData = apiResult[key][subKey];
               break;
             }
           }
        }
        if (roomsData.length > 0) break;
      }
    }

    if (roomsData.length === 0 && !Array.isArray(apiResult)) {
      console.warn('Rooms API response is not an array and common nested array keys were not found. Returning empty array. Root keys:', Object.keys(apiResult || {}));
      return [];
    }
     if (roomsData.length === 0 && Array.isArray(apiResult) && apiResult.length === 0) {
      // It's an empty array, which is valid.
    }


    return roomsData.map((item: any): Room => {
      const photos: RoomPhoto[] = Array.isArray(item.photos)
        ? item.photos.map((url: string, index: number) => ({
            id: index,
            url_thumbnail: url || "https://placehold.co/300x200.png",
            url_medium: url || "https://placehold.co/600x400.png",
            url_original: url || "https://placehold.co/800x600.png",
            caption: null,
            order: index,
          }))
        : [];

      const amenities: Amenity[] = [];
      if (Array.isArray(item.flat_services)) {
        item.flat_services.forEach((serviceName: string) => {
          amenities.push({
            id: amenities.length + 1, // Ensure unique IDs
            name: serviceName,
            key: serviceName.toLowerCase().replace(/\s+/g, '-'),
            icon_name: null,
            category_id: 1,
            category_name: 'Flat Services'
          });
        });
      }
      if (Array.isArray(item.room_services)) {
        item.room_services.forEach((serviceName: string) => {
          amenities.push({
            id: amenities.length + 1, // Ensure unique IDs
            name: serviceName,
            key: serviceName.toLowerCase().replace(/\s+/g, '-'),
            icon_name: null,
            category_id: 2,
            category_name: 'Room Services'
          });
        });
      }
      
      const availability: RoomAvailability = {
        available_now: item.available_now || false,
        available_from: item.available_date_for_sys || null,
        minimum_stay_months: typeof item.minimum_stay_months === 'number' ? item.minimum_stay_months : (item.type === "room" ? 1 : null),
        maximum_stay_months: typeof item.maximum_stay_months === 'number' ? item.maximum_stay_months : null,
        unavailable_dates_range: item.unavailable_dates_range || null,
      };
      
      const roomTitle = item.room_descriptions?.es_ES?.room_title || item.name || item.code || `Habitación ${item.id}`;
      const roomDescription = item.room_descriptions?.es_ES?.room_description || null;

      return {
        id: item.id,
        title: roomTitle,
        description: roomDescription,
        monthly_price: typeof item.price_rental === 'number' ? item.price_rental : 0,
        currency_symbol: getCurrencySymbol(item.currency),
        currency_code: item.currency || 'EUR',
        city: item.flat_area || 'Ciudad no especificada',
        address_1: item.flat_address || 'Dirección no disponible',
        address_2: null,
        postcode: item.flat_postcode || null,
        country: item.flat_country || 'España',
        lat: item.flat_lat ? parseFloat(item.flat_lat) : null,
        lng: item.flat_lon ? parseFloat(item.flat_lon) : null,
        photos,
        availability,
        property_type_name: item.flat_type_name || (item.type === 'room' ? 'Piso Compartido' : 'Propiedad'),
        room_type_name: item.type === 'room' ? `Habitación en ${item.flat_type_name || 'Piso'}` : (item.room_type_name || 'Estudio/Apartamento'),
        bedrooms: item.rooms_in_flat ? parseInt(item.rooms_in_flat, 10) : null,
        bathrooms: item.flat_bathrooms ? parseInt(item.flat_bathrooms, 10) : null,
        square_meters: item.square_meters || item.room_area || null,
        amenities,
        is_verified: item.is_verified || false,
      };
    });

  } catch (error) {
    console.error('Failed to fetch or parse rooms due to an exception:', error);
    if (error instanceof Error && error.message.toLowerCase().includes('failed to fetch')) {
        console.error("This 'Failed to fetch' error (client-side) might be due to CORS policy or network connectivity issues. Please check the browser's developer console (Network and Console tabs) for more specific error messages from the browser, especially regarding CORS.");
    }
    return []; 
  }
}

export async function fetchRoomById(id: number): Promise<Room | undefined> {
  const rooms = await fetchRooms();
  return rooms.find(room => room.id === id);
}
