import type { Room } from './types';

const API_URL = 'https://tripath.colivingsoft.site/api/version/2.0/default/rooms/feed';

export async function fetchRooms(): Promise<Room[]> {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      console.error(`API request failed to fetch rooms: ${response.status} ${response.statusText}`);
      throw new Error(`Error fetching rooms: ${response.status} ${response.statusText}`);
    }
    const apiResult = await response.json();
    // Ensure apiResult.data is an array, otherwise default to an empty array.
    if (apiResult && Array.isArray(apiResult.data)) {
      return apiResult.data as Room[];
    }
    // Log a warning if the structure is not as expected but the response was ok
    console.warn('Rooms API response.data is not an array or is missing, returning empty array. Response:', apiResult);
    return [];
  } catch (error) {
    console.error('Failed to fetch rooms due to an exception:', error);
    return []; // Return empty array on any error
  }
}

export async function fetchRoomById(id: number): Promise<Room | undefined> {
  const rooms = await fetchRooms();
  return rooms.find(room => room.id === id);
}
