
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
  const firstRoom = roomsInGroup[0];
  
  const titleText = isGroup 
    ? `${roomsInGroup.length} habitaci${roomsInGroup.length === 1 ? 'ón' : 'ones'} aquí:` 
    : (firstRoom?.title || 'Detalles de la Habitación');
  
  const address = `${firstRoom?.address_1 || ''}, ${firstRoom?.city || ''}`;

  const photoHTML = (room: Room, isGroupItem: boolean) => {
    const imageHeight = isGroupItem ? '50px' : '100px';
    const marginBottom = isGroupItem ? '3px' : '5px';
    const placeholderUrl = isGroupItem ? "https://placehold.co/200x100.png" : "https://placehold.co/300x150.png";
    const imageHint = room.title ? room.title.substring(0,15) : (isGroupItem ? "room thumbnail" : "room interior");

    return (room.photos && room.photos.length > 0)
    ? `<div style="position: relative; width: 100%; height: ${imageHeight}; margin-bottom: ${marginBottom}; border-radius: 0.25rem; overflow: hidden;">
         <img src="${room.photos[0].url_thumbnail || placeholderUrl}" alt="${room.title || 'Room image'}" style="width: 100%; height: 100%; object-fit: cover;" data-ai-hint="${imageHint}" />
       </div>`
    : `<div style="position: relative; width: 100%; height: ${imageHeight}; margin-bottom: ${marginBottom}; border-radius: 0.25rem; overflow: hidden; background-color: #f0f0f0;">
         <img src="${placeholderUrl}" alt="No image available" style="width: 100%; height: 100%; object-fit: cover;" data-ai-hint="${imageHint}" />
       </div>`;
  }

  const priceHTML = (room: Room, isGroupItem: boolean) => {
    const fontSize = isGroupItem ? '0.75rem' : '0.85rem'; // Reduced
    const marginBottom = isGroupItem ? '1px' : '2px'; // Reduced
    return `<p style="color: hsl(var(--primary)); font-weight: 600; margin-bottom: ${marginBottom}; font-size: ${fontSize}; line-height: 1.2;">${room.monthly_price.toLocaleString('es-ES', { style: 'currency', currency: room.currency_code || 'EUR' })}/mes</p>`;
  }

  const availabilityHTML = (room: Room, isGroupItem: boolean) => {
    const fontSize = isGroupItem ? '0.65rem' : '0.7rem'; // Reduced
    return room.availability?.available_from
    ? `<p style="color: hsl(var(--muted-foreground)); font-size: ${fontSize}; display: flex; align-items: center; margin-top: 1px; margin-bottom: 2px; line-height: 1.2;">
         <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 3px; flex-shrink: 0;"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect><line x1="16" x2="16" y1="2" y2="6"></line><line x1="8" x2="8" y1="2" y2="6"></line><line x1="3" x2="21" y1="10" y2="10"></line></svg>
         <span style="white-space: nowrap;">Desde: ${new Date(room.availability.available_from).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
       </p>`
    : '';
  }
  
  const detailsLinkHTML = (room: Room, isGroupItem: boolean) => {
    const fontSize = isGroupItem ? '0.7rem' : '0.75rem'; // Reduced
    return `<a href="/room/${room.id}" target="_blank" style="padding: 0; height: auto; font-size: ${fontSize}; margin-top: 2px; color: hsl(var(--accent)); text-decoration: none; display: inline-block; font-weight:500;">Ver Detalles &rarr;</a>`;
  }

  if (isGroup) {
    return `
      <div class="leaflet-popup-custom-content" style="width: 230px; max-height: 260px; font-size: 0.75rem;">
        <h3 style="color: hsl(var(--primary)); border-bottom: 1px solid hsl(var(--border)); padding-bottom: 2px; margin-bottom:3px; font-size: 0.9rem; font-weight: 600; line-height: 1.3;">
          ${titleText}
        </h3>
        <p style="color: hsl(var(--muted-foreground)); margin-top: -1px; margin-bottom: 4px; font-size: 0.65rem; line-height: 1.2;">${address}</p>
        <ul style="max-height: 180px; overflow-y: auto; padding-right: 5px; list-style: none; padding-left: 0; margin:0;">
          ${roomsInGroup.map(r => `
            <li style="background-color: hsla(var(--muted-hsl, 207 20% 92%), 0.4); padding: 6px; border-radius: 0.25rem; margin-bottom: 5px; border: 1px solid hsla(var(--border-hsl, 207 20% 88%), 0.5);">
              ${photoHTML(r, true)}
              <p style="font-weight: 500; color: hsl(var(--foreground)); margin-bottom: 1px; line-height: 1.2; font-size: 0.7rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; height: 1.4rem; ">${r.title || 'Habitación sin título'}</p>
              ${priceHTML(r, true)}
              ${availabilityHTML(r, true)}
              ${detailsLinkHTML(r, true)}
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  } else { 
     return `
      <div class="leaflet-popup-custom-content" style="width: 210px; font-size: 0.75rem;">
        ${photoHTML(firstRoom, false)}
        <h3 style="color: hsl(var(--primary)); margin-top: ${firstRoom.photos && firstRoom.photos.length > 0 ? '3px' : '0'}; margin-bottom: 1px; font-size: 0.9rem; line-height: 1.3; font-weight:600;">${titleText}</h3>
        <p style="color: hsl(var(--muted-foreground)); margin-bottom: 2px; font-size: 0.7rem; line-height: 1.2;">${address}</p>
        ${priceHTML(firstRoom, false)}
        ${availabilityHTML(firstRoom, false)}
        ${detailsLinkHTML(firstRoom, false)}
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
      setL(leafletModule.default || leafletModule); // Handle CJS/ESM interop
    }).catch(error => console.error("Failed to load Leaflet library:", error));
  }, []);

  useEffect(() => {
    if (L && mapNodeRef.current && !mapInstance) {
      const map = L.map(mapNodeRef.current, {
        scrollWheelZoom: true, // Enable scroll wheel zoom by default
      }).setView(defaultCenter, defaultZoom);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);
      setMapInstance(map);
    }
    
    // Cleanup function
    return () => {
      if (mapInstance) {
        mapInstance.remove();
        setMapInstance(null); 
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, [L, defaultCenter, defaultZoom]); // mapInstance removed from deps to prevent re-init loop

  useEffect(() => {
    if (!mapInstance || !L || !rooms ) { 
      return; 
    }

    // Clear existing markers
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
        const key = `${room.lat!.toFixed(5)},${room.lng!.toFixed(5)}`; // Group by slightly rounded coords
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
    if (Object.keys(groupedRooms).length === 1 && validRooms.length > 0) { // Only one marker group
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
                .bindPopup(L.popup({ 
                    minWidth: roomsAtLocation.length > 1 ? 230 : 210, 
                    maxWidth: roomsAtLocation.length > 1 ? 250 : 230, // Adjusted maxWidth
                    maxHeight: 270 // Slightly more than content max height
                }).setContent(popupHTML));
        }
    });

  }, [rooms, mapInstance, L, defaultCenter, defaultZoom]);

  return <div ref={mapNodeRef} style={{ height: '100%', width: '100%' }} className="rounded-lg shadow-inner bg-muted" />;
}

