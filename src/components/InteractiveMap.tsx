
'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useState, useEffect } from 'react'; // Added useState, useEffect
import type L from 'leaflet';
import type { LatLngExpression } from 'leaflet';
import type { Room } from '@/lib/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { CalendarDays } from 'lucide-react';

// Import for Leaflet default icon compatibility, ensuring it runs client-side
import 'leaflet-defaulticon-compatibility';

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
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const validRooms = rooms.filter(room => room.lat != null && room.lng != null);

  if (!isClient) {
    // Render a placeholder or null during SSR or before client mount
    return <div className="h-full w-full flex items-center justify-center bg-muted rounded-lg"><p className="text-muted-foreground text-center p-4">Inicializando mapa...</p></div>;
  }

  if (validRooms.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-muted rounded-lg">
        <p className="text-muted-foreground text-center p-4">
          No hay habitaciones con datos de ubicación para mostrar en el mapa.
        </p>
      </div>
    );
  }

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
    const avgLat = latitudes.reduce((a, b) => a + b, 0) / latitudes.length;
    const avgLng = longitudes.reduce((a, b) => a + b, 0) / longitudes.length;
    mapCenter = [avgLat, avgLng];

    if (Object.keys(groupedRooms).length === 1) {
        mapZoom = 13;
    } else if (validRooms.length > 1) {
        const latSpread = Math.max(...latitudes) - Math.min(...latitudes);
        const lngSpread = Math.max(...longitudes) - Math.min(...longitudes);
        if (latSpread < 0.1 && lngSpread < 0.1) mapZoom = 12;
        else if (latSpread < 0.5 && lngSpread < 0.5) mapZoom = 10;
        else if (latSpread < 2 && lngSpread < 2) mapZoom = 8;
        else mapZoom = 6;
    }
  }

  return (
    <MapContainer
      center={mapCenter}
      zoom={mapZoom}
      scrollWheelZoom={true}
      style={{ height: '100%', width: '100%' }}
      className="rounded-lg shadow-lg"
      placeholder={<div className="h-full w-full flex items-center justify-center bg-muted text-muted-foreground"><p>Cargando mapa...</p></div>}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {Object.entries(groupedRooms).map(([coordKey, roomsInFlat]) => {
        if (roomsInFlat.length === 0 || roomsInFlat[0].lat == null || roomsInFlat[0].lng == null) {
          return null;
        }
        const position: LatLngExpression = [roomsInFlat[0].lat, roomsInFlat[0].lng];

        const representativeRoom = roomsInFlat[0];

        return (
          <Marker key={coordKey} position={position}>
            <Popup minWidth={280} maxHeight={300}>
              <div className="space-y-2">
                <h3 className="text-base font-semibold mb-2 border-b pb-1.5 text-primary">
                  {roomsInFlat.length > 1
                    ? `${roomsInFlat.length} habitaciones en esta ubicación:`
                    : representativeRoom.title || 'Detalles de la Habitación'}
                </h3>
                <p className="text-xs text-muted-foreground -mt-1 mb-2">{representativeRoom.address_1}, {representativeRoom.city}</p>

                <ul className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {roomsInFlat.map(room => (
                    <li key={room.id} className="text-xs p-2 bg-muted/30 rounded-md shadow-sm">
                      {room.photos && room.photos.length > 0 && (
                        <div className="relative w-full h-24 mb-1.5 rounded overflow-hidden">
                           <Image
                            src={room.photos[0].url_thumbnail || "https://placehold.co/300x200.png"}
                            alt={room.title || 'Room image'}
                            layout="fill"
                            objectFit="cover"
                            data-ai-hint={room.title ? room.title.substring(0,20) : "room detail"}
                          />
                        </div>
                      )}
                      <p className="font-medium text-foreground mb-0.5 line-clamp-2 leading-tight">{room.title || 'Habitación sin título'}</p>
                      <p className="text-primary font-semibold">
                        {room.monthly_price.toLocaleString('es-ES', { style: 'currency', currency: room.currency_code || 'EUR' })}/mes
                      </p>
                      {room.availability?.available_from && (
                        <p className="text-muted-foreground text-[11px] flex items-center">
                          <CalendarDays size={12} className="mr-1"/> Disponible desde: {new Date(room.availability.available_from).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                        </p>
                      )}
                      <Button variant="link" size="sm" asChild className="p-0 h-auto text-xs mt-1 text-accent hover:text-primary">
                        <Link href={`/room/${room.id}`} target="_blank">Ver Detalles &rarr;</Link>
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

    