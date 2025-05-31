
import type { Room, RoomAvailability } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MapPin, CalendarDays, BedDouble, ListCollapse } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface RoomCardProps {
  room: Room;
  siblingRooms?: Room[];
}

const getAvailabilityText = (availability: RoomAvailability): string => {
  if (availability.available_now) {
    return "Disponible Ahora";
  }
  if (availability.available_from) {
    try {
      // Ensure the date is parsed correctly, handling potential nulls or invalid formats
      const parsedDate = parseISO(availability.available_from);
      return `Desde: ${format(parsedDate, 'dd MMM', { locale: es })}`;
    } catch (e) {
      // console.warn(`Invalid date format for availability_from: ${availability.available_from}`, e);
      return "Consultar disponibilidad";
    }
  }
  return "Consultar disponibilidad";
};

export default function RoomCard({ room, siblingRooms = [] }: RoomCardProps) {
  const placeholderImage = "https://placehold.co/600x400.png";
  const imageUrl = (room.photos && room.photos.length > 0 && room.photos[0].url_medium)
                   ? room.photos[0].url_medium
                   : placeholderImage;
  const imageHint = (room.photos && room.photos.length > 0 && room.title) ? room.title.substring(0,20) : "room interior";

  return (
    <Card className="flex flex-col h-full overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
      <Link href={`/room/${room.id}`} className="block group">
        <CardHeader className="p-0 relative">
          <div className="aspect-video w-full relative">
            <Image
              src={imageUrl}
              alt={room.title || 'Room image'}
              layout="fill"
              objectFit="cover"
              data-ai-hint={imageHint}
              className="transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          {room.is_verified && (
            <Badge variant="default" className="absolute top-2 right-2 bg-green-500 text-white">Verificado</Badge>
          )}
        </CardHeader>
      </Link>
      <CardContent className="p-4 flex-grow flex flex-col"> {/* Added flex flex-col */}
        <div> {/* Wrapper for main room content to allow sibling section to push footer down */}
            <Link href={`/room/${room.id}`} className="block">
            <CardTitle className="text-lg font-semibold mb-2 hover:text-primary transition-colors line-clamp-2">{room.title || 'Título no disponible'}</CardTitle>
            </Link>
            <div className="text-sm text-muted-foreground space-y-1">
            <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-accent flex-shrink-0" />
                <span className="truncate">{room.address_1 || 'Dirección no disponible'}, {room.city || 'Ciudad no disponible'}</span>
            </div>
            <div className="flex items-center">
                <BedDouble className="h-4 w-4 mr-2 text-accent flex-shrink-0" />
                <span>{room.room_type_name || 'Tipo no disponible'} en {room.property_type_name || 'Propiedad no disponible'}</span>
            </div>
            {room.availability && (room.availability.available_now || room.availability.available_from) && (
                <div className="flex items-center">
                <CalendarDays className="h-4 w-4 mr-2 text-accent flex-shrink-0" />
                <span>{getAvailabilityText(room.availability)}</span>
                </div>
            )}
            </div>
        </div>

        {siblingRooms && siblingRooms.length > 0 && (
          <div className="mt-4 pt-3 border-t border-border/50">
            <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center">
              <ListCollapse size={16} className="mr-2 text-accent" />
              Otras habitaciones en este piso:
            </h4>
            <div className="space-y-2 max-h-32 overflow-y-auto pr-1"> {/* Scrollable area for sibling rooms */}
              {siblingRooms.map(sibling => (
                <Link key={sibling.id} href={`/room/${sibling.id}`} className="block p-2 rounded-md bg-muted/40 hover:bg-muted/70 transition-colors">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-foreground truncate pr-2">{sibling.title}</span>
                    <span className="font-semibold text-primary whitespace-nowrap">{sibling.monthly_price}{sibling.currency_symbol}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{getAvailabilityText(sibling.availability)}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 bg-muted/50 flex justify-between items-center mt-auto"> {/* mt-auto to push footer to bottom */}
        <p className="text-xl font-bold text-primary">
          {room.monthly_price}{room.currency_symbol}/mes
        </p>
        <Link href={`/room/${room.id}`} className="text-sm text-primary hover:underline">
          Ver Detalles
        </Link>
      </CardFooter>
    </Card>
  );
}
