
import type { Room } from './types';

const API_URL = 'https://tripath.colivingsoft.site/api/version/2.0/default/rooms/feed';

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

    // Check if the root is an array (handles direct array response)
    if (Array.isArray(apiResult)) {
      return apiResult as Room[];
    }
    // Check if rooms are under a 'data' property (handles { "data": [...] })
    if (apiResult && Array.isArray(apiResult.data)) {
      return apiResult.data as Room[];
    }
    
    console.warn('Rooms API response.data is not a recognized array structure, or apiResult itself is not an array. Returning empty array. Response:', apiResult);
    return []; // Default to empty array if structure is not recognized
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

