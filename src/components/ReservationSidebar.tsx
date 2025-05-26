
'use client'; // Required for useState and event handlers

import { useState } from 'react';
import { useRouter } from 'next/navigation'; // For client-side navigation
import type { Room } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import ReservationSummaryDialog from '@/components/ReservationSummaryDialog'; // Import the dialog
import { CalendarDays, Info, ShieldCheck } from 'lucide-react';

interface ReservationSidebarProps {
  room: Room;
}

export default function ReservationSidebar({ room }: ReservationSidebarProps) {
  const router = useRouter();
  const [isSummaryDialogOpen, setIsSummaryDialogOpen] = useState(false);

  // Mock data for illustration, as full pricing logic is complex
  const platformFee = room.monthly_price * 0.1; // Example platform fee
  const totalFirstMonth = room.monthly_price + platformFee;

  const handleOpenSummary = () => {
    setIsSummaryDialogOpen(true);
  };

  const handleConfirmReservation = () => {
    setIsSummaryDialogOpen(false); // Close the dialog
    router.push(`/reserve/${room.id}`); // Navigate to reservation page
  };

  return (
    <>
      <Card className="sticky top-24 shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Reserva esta Habitación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-3xl font-bold text-primary">
              {room.monthly_price}{room.currency_symbol}
              <span className="text-base font-normal text-muted-foreground">/mes</span>
            </p>
          </div>
          
          <div className="border p-3 rounded-md">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Fecha de Entrada</span>
              <span className="text-sm text-muted-foreground">A seleccionar</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Duración</span>
              <span className="text-sm text-muted-foreground">A seleccionar</span>
            </div>
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Alquiler primer mes</span>
              <span>{room.monthly_price.toFixed(2)}{room.currency_symbol}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tarifa de servicio (ejemplo)</span>
              <span>{platformFee.toFixed(2)}{room.currency_symbol}</span>
            </div>
            <div className="flex justify-between font-semibold text-lg">
              <span>Total Estimado (primer pago)</span>
              <span>{totalFirstMonth.toFixed(2)}{room.currency_symbol}</span>
            </div>
            <p className="text-xs text-muted-foreground flex items-start mt-1">
              <Info size={14} className="mr-1 mt-0.5 shrink-0" />
              Este es un precio estimado. Los detalles finales se mostrarán en el proceso de reserva.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button 
            size="lg" 
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
            onClick={handleOpenSummary} // Open dialog on click
          >
            Reservar Ahora
          </Button>
          <div className="flex items-center text-xs text-muted-foreground pt-2">
              <ShieldCheck size={14} className="mr-1 text-green-600" />
              <span>Pago seguro y datos protegidos.</span>
          </div>
        </CardFooter>
      </Card>

      {/* Reservation Summary Dialog */}
      <ReservationSummaryDialog
        room={room}
        open={isSummaryDialogOpen}
        onOpenChange={setIsSummaryDialogOpen}
        onConfirm={handleConfirmReservation}
      />
    </>
  );
}
