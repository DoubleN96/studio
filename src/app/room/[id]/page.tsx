
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { fetchRoomById, fetchRooms } from '@/lib/api'; // Added fetchRooms
import type { Room, RoomAvailability } from '@/lib/types';
import ImageCarousel from '@/components/ImageCarousel';
import ReservationSidebar from '@/components/ReservationSidebar';
import AvailabilityDisplay from '@/components/AvailabilityDisplay';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Added Card components
import { MapPin, Home, Maximize, BedDouble, Bath, CheckCircle2, Edit3, Info, AlertCircle, Tag, Youtube, ListCollapse, CalendarDays } from 'lucide-react'; // Added ListCollapse, CalendarDays
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { parseISO, isBefore, startOfDay, format } from 'date-fns'; // Added format
import { es } from 'date-fns/locale'; // Added es locale
import { Skeleton } from '@/components/ui/skeleton';

const CardSkeleton = () => (
  <div className="bg-card p-6 rounded-lg shadow-md space-y-4">
    <Skeleton className="h-8 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
    <Skeleton className="h-4 w-1/3" />
    <Separator className="my-6" />
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
    </div>
    <Skeleton className="h-20 w-full" />
  </div>
);

// Helper function for sibling room availability text
const getSiblingAvailabilityText = (availability: RoomAvailability): string => {
  if (availability.available_now) {
    return "Disponible Ahora";
  }
  if (availability.available_from) {
    try {
      const parsedDate = parseISO(availability.available_from);
      return `Desde: ${format(parsedDate, 'dd MMM yyyy', { locale: es })}`;
    } catch (e) {
      return "Consultar disponibilidad";
    }
  }
  return "Consultar disponibilidad";
};

export default function RoomPage() {
  const routeParams = useParams<{ id: string }>(); 
  const roomId = Number(routeParams.id); 
  const [room, setRoom] = useState<Room | null>(null);
  const [siblingRooms, setSiblingRooms] = useState<Room[]>([]); // New state for sibling rooms
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCheckInDate, setSelectedCheckInDate] = useState<Date | undefined>(undefined);
  const [selectedCheckOutDate, setSelectedCheckOutDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    async function loadRoomData() {
      if (isNaN(roomId)) {
        setError('ID de habitación inválido.');
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const roomData = await fetchRoomById(roomId);
        
        if (roomData) {
          setRoom(roomData);
          if (roomData.availability) {
            const today = startOfDay(new Date());
            let initialDateCandidate = roomData.availability.available_now
              ? today
              : roomData.availability.available_from
              ? startOfDay(parseISO(roomData.availability.available_from))
              : today;

            if (isBefore(initialDateCandidate, today)) {
              initialDateCandidate = today;
            }
            setSelectedCheckInDate(initialDateCandidate);
          }

          // Fetch all rooms to find siblings
          const allRoomsData = await fetchRooms();
          if (allRoomsData) {
            const siblings = allRoomsData.filter(
              (r) =>
                r.address_1 && roomData.address_1 && r.address_1.trim().toLowerCase() === roomData.address_1.trim().toLowerCase() &&
                r.city && roomData.city && r.city.trim().toLowerCase() === roomData.city.trim().toLowerCase() &&
                r.id !== roomData.id
            );
            setSiblingRooms(siblings);
          }

        } else {
          setError('Habitación no encontrada.');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar la habitación.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadRoomData();
  }, [roomId]);

  const handleCheckInDateSelect = (date: Date | undefined) => {
    setSelectedCheckInDate(date);
    if (date && selectedCheckOutDate && isBefore(selectedCheckOutDate, date)) {
      setSelectedCheckOutDate(undefined); 
    }
  };

  const handleCheckOutDateSelect = (date: Date | undefined) => {
    setSelectedCheckOutDate(date);
  };
  
  const handleAvailabilityDisplayDateSelect = (date: Date) => {
    const newCheckIn = startOfDay(date);
    const today = startOfDay(new Date());
    let effectiveInitialDate = newCheckIn;

    if (room?.availability) {
        const roomAvailableFrom = room.availability.available_from ? startOfDay(parseISO(room.availability.available_from)) : null;
        
        if (room.availability.available_now) {
            if (isBefore(newCheckIn,today)) effectiveInitialDate = today;

        } else if (roomAvailableFrom) {
            if (isBefore(newCheckIn, roomAvailableFrom)) effectiveInitialDate = roomAvailableFrom;
        } else { 
            if (isBefore(newCheckIn, today)) effectiveInitialDate = today;
        }
    }
    
    setSelectedCheckInDate(effectiveInitialDate);
    if (selectedCheckOutDate && isBefore(selectedCheckOutDate, effectiveInitialDate)) {
      setSelectedCheckOutDate(undefined);
    }
  };


  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto" suppressHydrationWarning={true}>
        <div className="md:flex md:gap-8">
          <div className="md:w-2/3 space-y-6">
            <Skeleton className="aspect-video w-full rounded-lg" />
            <CardSkeleton />
            <CardSkeleton />
            <Skeleton className="h-40 w-full rounded-lg" /> {/* Skeleton for sibling rooms */}
          </div>
          <div className="md:w-1/3 mt-8 md:mt-0">
            <Skeleton className="h-96 w-full rounded-lg sticky top-24" />
          </div>
        </div>
      </div>
    );
  }
  

  if (error) {
    return (
      <div className="text-center py-10 flex flex-col items-center justify-center" suppressHydrationWarning={true}>
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold mb-4">Error</h1>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button asChild variant="outline">
          <Link href="/">Volver al Inicio</Link>
        </Button>
      </div>
    );
  }

  if (!room) {
    return (
       <div className="text-center py-10" suppressHydrationWarning={true}>
        <h1 className="text-2xl font-semibold mb-4">Habitación no Encontrada</h1>
        <p className="text-muted-foreground mb-6">Lo sentimos, la habitación que buscas no existe o no está disponible.</p>
        <Button asChild variant="outline">
          <Link href="/">Volver al Inicio</Link>
        </Button>
      </div>
    );
  }

  const AmenityItem = ({ amenity }: { amenity: { name: string, icon_name?: string | null } }) => (
    <li className="flex items-center text-sm bg-muted p-2 rounded-md">
      {amenity.icon_name === 'wifi' && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-accent"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>}
      {amenity.icon_name !== 'wifi' && <CheckCircle2 className="mr-2 h-4 w-4 text-accent" />}
      {amenity.name}
    </li>
  );

  return (
    <div className="max-w-6xl mx-auto" suppressHydrationWarning={true}>
      <div className="md:flex md:gap-8">
        <div className="md:w-2/3 space-y-6">
          <ImageCarousel photos={room.photos} altText={room.title} />
          
          <div className="bg-card p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-primary mb-2">{room.title}</h1>
                     <div className="flex items-center text-muted-foreground text-sm mb-1">
                        <MapPin size={16} className="mr-2 text-accent" /> {room.address_1}, {room.city}, {room.country}
                    </div>
                     <div className="flex items-center text-muted-foreground text-sm">
                        <Home size={16} className="mr-2 text-accent" /> {room.room_type_name} en {room.property_type_name}
                    </div>
                </div>
                {room.is_verified && <Badge variant="default" className="bg-green-500 text-white text-sm px-3 py-1"><CheckCircle2 size={14} className="mr-1"/> Verificado</Badge>}
            </div>

            <Separator className="my-6" />

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm mb-6">
              {room.square_meters && (
                <div className="flex items-center bg-secondary/30 p-3 rounded-md">
                  <Maximize size={20} className="mr-2 text-accent" />
                  <div>
                    <p className="font-medium">{room.square_meters} m²</p>
                    <p className="text-xs text-muted-foreground">Tamaño</p>
                  </div>
                </div>
              )}
              {room.bedrooms && (
                <div className="flex items-center bg-secondary/30 p-3 rounded-md">
                  <BedDouble size={20} className="mr-2 text-accent" />
                  <div>
                    <p className="font-medium">{room.bedrooms} Hab.</p>
                    <p className="text-xs text-muted-foreground">Dormitorios (propiedad)</p>
                  </div>
                </div>
              )}
              {room.bathrooms && (
                <div className="flex items-center bg-secondary/30 p-3 rounded-md">
                  <Bath size={20} className="mr-2 text-accent" />
                  <div>
                    <p className="font-medium">{room.bathrooms} Baño(s)</p>
                    <p className="text-xs text-muted-foreground">Baños (propiedad)</p>
                  </div>
                </div>
              )}
            </div>
            
            {room.description && (
              <div>
                <h2 className="text-xl font-semibold mb-2 flex items-center"><Edit3 size={20} className="mr-2 text-accent" /> Descripción</h2>
                <p className="text-foreground/80 whitespace-pre-line leading-relaxed">{room.description}</p>
              </div>
            )}
          </div>

          {room.flat_video && (
            <div className="bg-card p-6 rounded-lg shadow-md mt-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Youtube className="mr-2 h-6 w-6 text-accent" />
                Vídeo de la Propiedad
              </h2>
              <div className="aspect-video">
                <iframe
                  className="w-full h-full rounded-lg border border-border"
                  src={room.flat_video}
                  title="Vídeo de la Propiedad"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          )}

          {room.availability && (
            <AvailabilityDisplay 
                availability={room.availability} 
                selectedCheckInDate={selectedCheckInDate}
                onDateSelect={handleAvailabilityDisplayDateSelect} 
            />
          )}


          {room.amenities && room.amenities.length > 0 && (
            <div className="bg-card p-6 rounded-lg shadow-md mt-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center"><Tag size={20} className="mr-2 text-accent" /> Comodidades</h2>
              <ul className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {room.amenities.map((amenity) => (
                  <AmenityItem key={amenity.id} amenity={amenity} />
                ))}
              </ul>
            </div>
          )}

          {/* Section for Sibling Rooms */}
          {siblingRooms.length > 0 && (
            <Card className="shadow-lg rounded-lg mt-6">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-primary flex items-center">
                  <ListCollapse className="mr-2 h-5 w-5" /> Otras habitaciones en este piso
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {siblingRooms.map((sibling) => (
                  <Link key={sibling.id} href={`/room/${sibling.id}`} className="block p-3 rounded-md bg-muted/50 hover:bg-muted transition-colors border">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium text-foreground truncate pr-2">{sibling.title}</h3>
                      <p className="font-semibold text-primary whitespace-nowrap">
                        {sibling.monthly_price.toLocaleString('es-ES', { style: 'currency', currency: sibling.currency_code || 'EUR' })}
                      </p>
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                      <CalendarDays size={14} className="mr-1.5 text-accent" />
                      <span>{getSiblingAvailabilityText(sibling.availability)}</span>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Placeholder for "Compañeros de piso" section - NOT IMPLEMENTED DUE TO DATA LIMITATIONS */}
          {/* 
          <Card className="shadow-lg rounded-lg mt-6">
            <CardHeader><CardTitle className="text-xl font-semibold text-primary flex items-center">Compañeros de Piso Actuales</CardTitle></CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Esta información no está disponible actualmente.</p>
            </CardContent>
          </Card>
          */}

        </div>

        <div className="md:w-1/3 mt-8 md:mt-0">
          <ReservationSidebar 
            room={room} 
            selectedCheckInDate={selectedCheckInDate}
            selectedCheckOutDate={selectedCheckOutDate}
            onCheckInDateSelect={handleCheckInDateSelect}
            onCheckOutDateSelect={handleCheckOutDateSelect}
          />
        </div>
      </div>
    </div>
  );
}
