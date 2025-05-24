import type { Room } from './types';

const API_URL = 'https://tripath.colivingsoft.site/api/version/2.0/default/rooms/feed';

export async function fetchRooms(): Promise<Room[]> {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`Error fetching rooms: ${response.statusText}`);
    }
    const data = await response.json();
    // The API returns an object with a "data" key which is an array of rooms
    return data.data as Room[];
  } catch (error) {
    console.error('Failed to fetch rooms:', error);
    return []; // Return empty array on error
  }
}

export async function fetchRoomById(id: number): Promise<Room | undefined> {
  const rooms = await fetchRooms();
  return rooms.find(room => room.id === id);
}
