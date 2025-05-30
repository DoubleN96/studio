
'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import type { Room } from '@/lib/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface InteractiveMapProps {
  rooms: Room[];
  defaultCenter?: LatLngExpression;
  defaultZoom?: number;
}

interface GroupedRooms {
  [key: string]: Room[];
}

export default function InteractiveMap({
  rooms,
  defaultCenter = [40.416775, -3.703790], // Default to Madrid
  defaultZoom = 6,
}: InteractiveMapProps) {
  
  const validRooms = rooms.filter(room => room.lat != null && room.lng != null);

  const groupedRooms = validRooms.reduce((acc, room) => {
    const key = `${room.lat?.toFixed(5)},${room.lng?.toFixed(5)}`; // Group by coordinates with some precision
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(room);
    return acc;
  }, {} as GroupedRooms);

  let mapCenter: LatLngExpression = defaultCenter;
  let mapZoom = defaultZoom;

  if (validRooms.length > 0) {
    const latitudes = validRooms.map(room => room.lat!);
    const longitudes = validRooms.map(room => room.lng!);
    mapCenter = [
      latitudes.reduce((a, b) => a + b, 0) / latitudes.length,
      longitudes.reduce((a, b) => a + b, 0) / longitudes.length,
    ];
    // Simple zoom adjustment: more rooms might mean a wider spread
    if (validRooms.length > 1) mapZoom = 10;
    if (Object.keys(groupedRooms).length === 1) mapZoom = 13; // Zoom in if only one location
  }


  return (
    <MapContainer center={mapCenter} zoom={mapZoom} scrollWheelZoom={true} style={{ height: 'calc(100vh - 200px)', width: '100%' }} className="rounded-lg shadow-lg">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {Object.entries(groupedRooms).map(([coordKey, roomsInFlat]) => {
        if (roomsInFlat.length === 0 || roomsInFlat[0].lat == null || roomsInFlat[0].lng == null) {
          return null;
        }
        const position: LatLngExpression = [roomsInFlat[0].lat, roomsInFlat[0].lng];
        
        return (
          <Marker key={coordKey} position={position}>
            <Popup minWidth={250}>
              <div className="space-y-2">
                <h3 className="text-md font-semibold mb-1 border-b pb-1">
                  {roomsInFlat.length > 1 ? `${roomsInFlat.length} habitaciones en esta ubicación` : roomsInFlat[0].title}
                </h3>
                <ul className="space-y-1 max-h-48 overflow-y-auto">
                  {roomsInFlat.map(room => (
                    <li key={room.id} className="text-xs p-1.5 bg-muted/50 rounded-md">
                      <p className="font-medium text-primary">{room.title || 'Habitación sin título'}</p>
                      <p className="text-muted-foreground">
                        {room.monthly_price.toLocaleString('es-ES', { style: 'currency', currency: room.currency_code || 'EUR' })}/mes
                      </p>
                      <Button variant="link" size="sm" asChild className="p-0 h-auto text-xs mt-0.5">
                        <Link href={`/room/${room.id}`}>Ver Detalles &rarr;</Link>
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
