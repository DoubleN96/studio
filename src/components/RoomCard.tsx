
import type { Room } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, CalendarDays, Tag, BedDouble } from 'lucide-react';

interface RoomCardProps {
  room: Room;
}

export default function RoomCard({ room }: RoomCardProps) {
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
      <CardContent className="p-4 flex-grow">
        <Link href={`/room/${room.id}`} className="block">
          <CardTitle className="text-lg font-semibold mb-2 hover:text-primary transition-colors line-clamp-2">{room.title || 'Título no disponible'}</CardTitle>
        </Link>
        <div className="text-sm text-muted-foreground space-y-1">
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-2 text-accent" />
            <span>{room.address_1 || 'Dirección no disponible'}, {room.city || 'Ciudad no disponible'}</span>
          </div>
          <div className="flex items-center">
            <BedDouble className="h-4 w-4 mr-2 text-accent" />
            <span>{room.room_type_name || 'Tipo no disponible'} en {room.property_type_name || 'Propiedad no disponible'}</span>
          </div>
          {room.availability && room.availability.available_from && (
            <div className="flex items-center">
              <CalendarDays className="h-4 w-4 mr-2 text-accent" />
              <span>Disponible desde: {new Date(room.availability.available_from).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 bg-muted/50 flex justify-between items-center">
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
