import { fetchRoomById } from '@/lib/api';
import type { Room } from '@/lib/types';
import ImageCarousel from '@/components/ImageCarousel';
import ReservationSidebar from '@/components/ReservationSidebar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MapPin, Building, BedDouble, Bath, Users, Maximize, CheckCircle2, Home, Tag, Edit3, Info } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface RoomPageParams {
  params: {
    id: string;
  };
}

// Helper to render amenities
const AmenityItem = ({ amenity }: { amenity: { name: string, icon_name?: string | null } }) => (
  <li className="flex items-center text-sm bg-muted p-2 rounded-md">
    {/* Basic icon mapping, extend as needed */}
    {amenity.icon_name === 'wifi' && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-accent"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>}
    {amenity.icon_name !== 'wifi' && <CheckCircle2 className="mr-2 h-4 w-4 text-accent" />}
    {amenity.name}
  </li>
);


export async function generateMetadata({ params }: RoomPageParams) {
  const room = await fetchRoomById(Number(params.id));
  if (!room) {
    return { title: 'Habitación no encontrada' };
  }
  return {
    title: `${room.title} - ChattyRental`,
    description: room.description || `Detalles sobre ${room.title}`,
  };
}


export default async function RoomPage({ params }: RoomPageParams) {
  const roomId = Number(params.id);
  const room = await fetchRoomById(roomId);

  if (!room) {
    return (
       <div className="text-center py-10">
        <h1 className="text-2xl font-semibold mb-4">Habitación no Encontrada</h1>
        <p className="text-muted-foreground mb-6">Lo sentimos, la habitación que buscas no existe o no está disponible.</p>
        <Button asChild variant="outline">
          <Link href="/">Volver al Inicio</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="md:flex md:gap-8">
        {/* Main Content Area */}
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

          {room.amenities && room.amenities.length > 0 && (
            <div className="bg-card p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4 flex items-center"><Tag size={20} className="mr-2 text-accent" /> Comodidades</h2>
              <ul className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {room.amenities.map((amenity) => (
                  <AmenityItem key={amenity.id} amenity={amenity} />
                ))}
              </ul>
            </div>
          )}

          <div className="bg-card p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-3 flex items-center"><Info size={20} className="mr-2 text-accent" /> Información de Disponibilidad</h2>
            <div className="space-y-2 text-sm">
              <p><strong>Disponible Ahora:</strong> {room.availability.available_now ? 'Sí' : 'No'}</p>
              {room.availability.available_from && <p><strong>Disponible Desde:</strong> {new Date(room.availability.available_from).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>}
              {room.availability.minimum_stay_months && <p><strong>Estancia Mínima:</strong> {room.availability.minimum_stay_months} mes(es)</p>}
              {room.availability.maximum_stay_months && <p><strong>Estancia Máxima:</strong> {room.availability.maximum_stay_months} mes(es)</p>}
            </div>
          </div>
          
          {/* Placeholder for Floorplan/Video - if data becomes available */}
          {/* <div className="bg-card p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2">Plano y Video</h2>
            <p className="text-muted-foreground">Planos y videos estarán disponibles pronto.</p>
          </div> */}

        </div>

        {/* Sticky Sidebar */}
        <div className="md:w-1/3 mt-8 md:mt-0">
          <ReservationSidebar room={room} />
        </div>
      </div>
    </div>
  );
}
