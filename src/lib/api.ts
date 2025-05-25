
import type { Room, RoomPhoto, Amenity, RoomAvailability } from './types';

const API_URL = 'https://tripath.colivingsoft.site/api/version/2.0/default/rooms/feed';

// Helper to get a currency symbol (simplified)
function getCurrencySymbol(currencyCode: string): string {
  switch (currencyCode.toUpperCase()) {
    case 'EUR':
      return '€';
    case 'USD':
      return '$';
    case 'GBP':
      return '£';
    default:
      return currencyCode;
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

    if (!Array.isArray(apiResult)) {
      console.warn('Rooms API response is not an array as expected at the root. Returning empty array.', apiResult);
      return [];
    }

    // Map the raw API data to our Room interface
    return apiResult.map((item: any): Room => {
      const photos: RoomPhoto[] = (item.photos && Array.isArray(item.photos)
        ? item.photos.map((url: string, index: number) => ({
            id: index, // Assuming index as id if no specific id is provided per photo
            url_thumbnail: url, // Using the same URL for all sizes for simplicity
            url_medium: url,
            url_original: url,
            caption: null,
            order: index,
          }))
        : []);

      const amenities: Amenity[] = [];
      if (Array.isArray(item.flat_services)) {
        item.flat_services.forEach((serviceName: string, index: number) => {
          amenities.push({
            id: amenities.length,
            name: serviceName,
            key: serviceName.toLowerCase().replace(/\s+/g, '-'),
            icon_name: null, // Or map based on serviceName if logic is available
            category_id: 1, // Example category
            category_name: 'Flat Services'
          });
        });
      }
      if (Array.isArray(item.room_services)) {
        item.room_services.forEach((serviceName: string, index: number) => {
          amenities.push({
            id: amenities.length,
            name: serviceName,
            key: serviceName.toLowerCase().replace(/\s+/g, '-'),
            icon_name: null,
            category_id: 2, // Example category
            category_name: 'Room Services'
          });
        });
      }
      
      const availability: RoomAvailability = {
        available_now: item.available_now || false,
        available_from: item.available_date_for_sys || null,
        minimum_stay_months: item.minimum_stay_months || null, // Assuming field name, not in sample
        maximum_stay_months: item.maximum_stay_months || null, // Assuming field name, not in sample
      };

      return {
        id: item.id,
        title: item.room_descriptions?.es_ES?.room_title || item.name || item.code || `Habitación ${item.id}`,
        description: item.room_descriptions?.es_ES?.room_description || null,
        monthly_price: typeof item.price_rental === 'number' ? item.price_rental : 0,
        currency_symbol: getCurrencySymbol(item.currency || 'EUR'),
        currency_code: item.currency || 'EUR',
        city: item.flat_area || 'Ciudad no especificada',
        address_1: item.flat_address || 'Dirección no disponible',
        address_2: null,
        postcode: item.flat_postcode || null, // Assuming field name, not in sample
        country: item.flat_country || 'España', // Assuming field name, default to Spain
        lat: item.flat_lat ? parseFloat(item.flat_lat) : null,
        lng: item.flat_lon ? parseFloat(item.flat_lon) : null,
        photos,
        availability,
        property_type_name: item.flat_type_name || (item.type === 'room' ? 'Piso Compartido' : 'Propiedad'), // Example mapping
        room_type_name: item.room_type_name || (item.type === 'room' ? 'Habitación Privada' : 'Espacio'), // Example mapping
        bedrooms: item.rooms_in_flat ? parseInt(item.rooms_in_flat, 10) : null,
        bathrooms: item.flat_bathrooms ? parseInt(item.flat_bathrooms, 10) : null,
        square_meters: item.square_meters || item.room_area || null, // Assuming field name
        amenities,
        is_verified: item.is_verified || false, // Assuming field name
      };
    });

  } catch (error) {
    console.error('Failed to fetch or parse rooms due to an exception:', error);
    if (error instanceof Error && error.message.toLowerCase().includes('failed to fetch')) {
        console.error("This 'Failed to fetch' error (client-side) might be due to CORS policy or network connectivity issues. Please check the browser's developer console (Network and Console tabs) for more specific error messages from the browser, especially regarding CORS.");
    }
    return []; // Return empty array on any error
  }
}

export async function fetchRoomById(id: number): Promise<Room | undefined> {
  const rooms = await fetchRooms();
  return rooms.find(room => room.id === id);
}
