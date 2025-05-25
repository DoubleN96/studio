
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

    // Path 1: Root is the array
    if (Array.isArray(apiResult)) {
      return apiResult as Room[];
    }

    // Path 2: apiResult is an object, check for common top-level keys that might contain the array
    if (typeof apiResult === 'object' && apiResult !== null) {
      const commonTopLevelKeys = ['data', 'results', 'items', 'rooms', 'feed'];
      for (const key of commonTopLevelKeys) {
        if (Array.isArray(apiResult[key])) {
          // If apiResult[key] is the array of rooms
          return apiResult[key] as Room[];
        }
      }

      // Path 3: Check if apiResult.data is an object containing the rooms array under another common nested key
      // This handles structures like { "data": { "rooms": [...] } }
      if (typeof apiResult.data === 'object' && apiResult.data !== null) {
        const commonNestedKeys = ['rooms', 'items', 'results', 'list', 'entities']; // Added 'list', 'entities'
        for (const key of commonNestedKeys) {
          if (Array.isArray(apiResult.data[key])) {
            return apiResult.data[key] as Room[];
          }
        }
      }
    }
    
    // If no recognized structure is found, log a detailed warning and return an empty array
    let warningMessage = 'Rooms API response is not in a recognized array structure. Returning empty array.';
    if (typeof apiResult === 'object' && apiResult !== null) {
      warningMessage += ` Available top-level keys: ${Object.keys(apiResult).join(', ')}.`;
      if (typeof apiResult.data === 'object' && apiResult.data !== null) {
        warningMessage += ` Keys under 'data' object: ${Object.keys(apiResult.data).join(', ')}.`;
      }
    }
    // It's often helpful to see the beginning of the problematic response.
    // Avoid logging overly large objects directly to console in production if they can be huge.
    // For debugging, logging a snippet or type can be useful.
    const responseSnippet = JSON.stringify(apiResult)?.substring(0, 500);
    warningMessage += ` Response snippet: ${responseSnippet}...`;
    console.warn(warningMessage, apiResult); // Log the full object for detailed inspection if needed
    
    return [];
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
