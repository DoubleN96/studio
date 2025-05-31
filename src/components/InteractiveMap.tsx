
'use client';

import { useEffect, useRef, useState } from 'react';
import type LType from 'leaflet'; 
import type { LatLngExpression } from 'leaflet';
import type { Room } from '@/lib/types';

interface InteractiveMapProps {
  rooms: Room[];
  defaultCenter?: LatLngExpression;
  defaultZoom?: number;
}

interface GroupedRooms {
  [key: string]: Room[];
}

const createPopupHTML = (roomsInGroup: Room[]): string => {
  const isGroup = roomsInGroup.length > 1;
  const title = isGroup 
    ? `${roomsInGroup.length} habitaciones aquí:` 
    : (roomsInGroup[0]?.title || 'Detalles de la Habitación');
  const firstRoom = roomsInGroup[0];
  const address = `${firstRoom?.address_1 || ''}, ${firstRoom?.city || ''}`;

  const photoHTML = (room: Room) => (room.photos && room.photos.length > 0)
    ? `<div style="position: relative; width: 100%; height: ${isGroup ? '60px' : '70px'}; margin-bottom: ${isGroup ? '3px' : '4px'}; border-radius: 0.25rem; overflow: hidden;">
         <img src="${room.photos[0].url_thumbnail || "https://placehold.co/300x200.png"}" alt="${room.title || 'Room image'}" style="width: 100%; height: 100%; object-fit: cover;" data-ai-hint="${room.title ? room.title.substring(0,20) : (isGroup ? "room thumbnail" : "room interior")}" />
       </div>`
    : '';

  const priceHTML = (room: Room) => 
    `<p style="color: hsl(var(--primary)); font-weight: 600; margin-bottom: ${isGroup ? '0' : '4px'};">${room.monthly_price.toLocaleString('es-ES', { style: 'currency', currency: room.currency_code || 'EUR' })}/mes</p>`;

  const availabilityHTML = (room: Room) => room.availability?.available_from
    ? `<p style="color: hsl(var(--muted-foreground)); font-size: 11px; display: flex; align-items: center; margin-top: 2px;">
         <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect><line x1="16" x2="16" y1="2" y2="6"></line><line x1="8" x2="8" y1="2" y2="6"></line><line x1="3" x2="21" y1="10" y2="10"></line></svg>
         Disponible desde: ${new Date(room.availability.available_from).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
       </p>`
    : '';
  
  const detailsLinkHTML = (room: Room) => 
    `<a href="/room/${room.id}" target="_blank" style="padding: 0; height: auto; font-size: 12px; margin-top: 4px; color: hsl(var(--accent)); text-decoration: none; display: inline-block;">Ver Detalles &rarr;</a>`;

  if (isGroup) {
    return `
      <div class="space-y-2 leaflet-popup-custom-content" style="min-width: 260px; max-height: 280px;">
        <h3 class="text-base font-semibold mb-1 border-b pb-1 text-primary" style="color: hsl(var(--primary)); border-bottom: 1px solid hsl(var(--border)); padding-bottom: 4px; margin-bottom:4px;">
          ${title}
        </h3>
        <p class="text-xs text-muted-foreground -mt-1 mb-1.5" style="color: hsl(var(--muted-foreground)); margin-top: -4px; margin-bottom: 6px;">${address}</p>
        <ul class="space-y-2.5 max-h-52 overflow-y-auto pr-1" style="max-height: 180px; overflow-y: auto; padding-right: 4px; list-style: none; padding-left: 0;">
          ${roomsInGroup.map(r => `
            <li class="text-xs p-1.5 bg-muted/30 rounded-md shadow-sm" style="background-color: hsla(var(--muted-hsl, 207 20% 88%), 0.3); padding: 6px; border-radius: 0.375rem; box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05); margin-bottom: 6px;">
              ${photoHTML(r)}
              <p style="font-weight: 500; color: hsl(var(--foreground)); margin-bottom: 2px; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${r.title || 'Habitación sin título'}</p>
              ${priceHTML(r)}
              ${availabilityHTML(r)}
              ${detailsLinkHTML(r)}
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  } else { 
     return `
      <div class="leaflet-popup-custom-content" style="min-width: 220px; max-width:260px;">
        ${photoHTML(firstRoom)}
        <h3 class="text-base font-semibold mb-0.5" style="color: hsl(var(--primary)); margin-top: ${firstRoom.photos && firstRoom.photos.length > 0 ? '2px' : '0'}; margin-bottom: 2px; font-size: 1rem; line-height: 1.3;">${title}</h3>
        <p class="text-xs text-muted-foreground mb-1" style="color: hsl(var(--muted-foreground)); margin-bottom: 4px;">${address}</p>
        ${priceHTML(firstRoom)}
        ${availabilityHTML(firstRoom)}
        ${detailsLinkHTML(firstRoom)}
      </div>
    `;
  }
};

export default function InteractiveMap({
  rooms,
  defaultCenter = [40.416775, -3.703790], 
  defaultZoom = 6,
}: InteractiveMapProps) {
  const mapNodeRef = useRef<HTMLDivElement | null>(null);
  const [L, setL] = useState<typeof LType | null>(null);
  const [mapInstance, setMapInstance] = useState<LType.Map | null>(null);

  useEffect(() => {
    import('leaflet').then(leafletModule => {
      setL(leafletModule);
    }).catch(error => console.error("Failed to load Leaflet library:", error));
  }, []);

  useEffect(() => {
    if (L && mapNodeRef.current && !mapInstance) {
      const map = L.map(mapNodeRef.current).setView(defaultCenter, defaultZoom);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);
      setMapInstance(map);
    }
    
    return () => {
      if (mapInstance) {
        mapInstance.remove();
        setMapInstance(null); 
      }
    };
  }, [L, defaultCenter, defaultZoom, mapInstance]); 

  useEffect(() => {
    if (!mapInstance || !L || !rooms ) { 
      return; 
    }

    mapInstance.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        mapInstance.removeLayer(layer);
      }
    });

    const validRooms = rooms.filter(room => room.lat != null && room.lng != null);

    if (validRooms.length === 0) {
      mapInstance.invalidateSize();
      mapInstance.setView(defaultCenter, defaultZoom);
      return;
    }
    
    const groupedRooms = validRooms.reduce((acc, room) => {
        const key = `${room.lat!.toFixed(5)},${room.lng!.toFixed(5)}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(room);
        return acc;
    }, {} as GroupedRooms);

    const latitudes = validRooms.map(r => r.lat!);
    const longitudes = validRooms.map(r => r.lng!);
    
    if (latitudes.length === 0 || longitudes.length === 0) { 
        mapInstance.invalidateSize();
        mapInstance.setView(defaultCenter, defaultZoom);
        return;
    }

    const avgLat = latitudes.reduce((a, b) => a + b, 0) / latitudes.length;
    const avgLng = longitudes.reduce((a, b) => a + b, 0) / longitudes.length;
    
    let newZoom = defaultZoom;
    if (Object.keys(groupedRooms).length === 1 && validRooms.length > 0) {
        newZoom = 13; 
    } else if (validRooms.length > 1) {
        const latSpread = Math.max(...latitudes) - Math.min(...latitudes);
        const lngSpread = Math.max(...longitudes) - Math.min(...longitudes);
        if (latSpread < 0.05 && lngSpread < 0.05) newZoom = 13;
        else if (latSpread < 0.1 && lngSpread < 0.1) newZoom = 12;
        else if (latSpread < 0.5 && lngSpread < 0.5) newZoom = 10;
        else if (latSpread < 2 && lngSpread < 2) newZoom = 8;
        else newZoom = 6;
    }
    
    mapInstance.invalidateSize(); 
    mapInstance.setView([avgLat, avgLng], newZoom);

    Object.values(groupedRooms).forEach((roomsAtLocation) => {
        if (roomsAtLocation.length > 0 && roomsAtLocation[0].lat != null && roomsAtLocation[0].lng != null) {
            const position: LatLngExpression = [roomsAtLocation[0].lat!, roomsAtLocation[0].lng!];
            const popupHTML = createPopupHTML(roomsAtLocation);
            
            L.marker(position)
                .addTo(mapInstance)
                .bindPopup(L.popup({ minWidth: roomsAtLocation.length > 1 ? 280 : 220, maxHeight: 300 }).setContent(popupHTML));
        }
    });

  }, [rooms, mapInstance, L, defaultCenter, defaultZoom]);

  return <div ref={mapNodeRef} style={{ height: '100%', width: '100%' }} className="rounded-lg shadow-inner bg-muted" />;
}
