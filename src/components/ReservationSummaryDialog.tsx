
'use client';

import type { Room } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { format, isBefore, getYear, getMonth } from 'date-fns';
import { es } from 'date-fns/locale';

interface ReservationSummaryDialogProps {
  room: Room;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  selectedCheckInDate?: Date;
  selectedCheckOutDate?: Date;
}

export default function ReservationSummaryDialog({
  room,
  open,
  onOpenChange,
  onConfirm,
  selectedCheckInDate,
  selectedCheckOutDate,
}: ReservationSummaryDialogProps) {
  
  const calculatedDurationString = () => {
    if (selectedCheckInDate && selectedCheckOutDate && !isBefore(selectedCheckOutDate, selectedCheckInDate)) {
      const startYear = getYear(selectedCheckInDate);
      const startMonth = getMonth(selectedCheckInDate);
      const endYear = getYear(selectedCheckOutDate);
      const endMonth = getMonth(selectedCheckOutDate);

      let months = (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
      months = Math.max(1, months); // Ensure at least 1 month
      return `${months} mes(es)`;
    }
    return 'N/A';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Resumen Estimado de la Reserva</DialogTitle>
          <DialogDescription>
            Revisa los detalles. Podrás confirmar las fechas exactas en el siguiente paso.
          </DialogDescription>
        </DialogHeader>
        <Separator className="my-4" />
        <div className="space-y-3 text-sm">
          <div>
            <span className="font-semibold text-muted-foreground">Habitación:</span>
            <p className="text-foreground">{room.title}</p>
          </div>
          <div>
            <span className="font-semibold text-muted-foreground">Ciudad:</span>
            <p className="text-foreground">{room.city}</p>
          </div>
          <div>
            <span className="font-semibold text-muted-foreground">Precio Mensual:</span>
            <p className="text-foreground font-bold text-lg text-primary">
              {room.monthly_price.toLocaleString('es-ES', { style: 'currency', currency: room.currency_code || 'EUR' })}
            </p>
          </div>
          <Separator className="my-2" />
           <div>
            <span className="font-semibold text-muted-foreground">Fecha de Entrada:</span>
            <p className="text-foreground italic">
              {selectedCheckInDate ? format(selectedCheckInDate, "PPP", { locale: es }) : 'A seleccionar en el siguiente paso'}
            </p>
          </div>
           <div>
            <span className="font-semibold text-muted-foreground">Fecha de Salida:</span>
            <p className="text-foreground italic">
              {selectedCheckOutDate ? format(selectedCheckOutDate, "PPP", { locale: es }) : 'A seleccionar en el siguiente paso'}
            </p>
          </div>
          {selectedCheckInDate && selectedCheckOutDate && !isBefore(selectedCheckOutDate, selectedCheckInDate) && (
             <div>
              <span className="font-semibold text-muted-foreground">Duración Estimada:</span>
              <p className="text-foreground">
                {calculatedDurationString()}
              </p>
            </div>
          )}
        </div>
        <DialogFooter className="mt-6">
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button
            onClick={() => {
              onConfirm();
              onOpenChange(false); 
            }}
            className="bg-primary hover:bg-primary/90"
            disabled={!selectedCheckInDate || !selectedCheckOutDate || (selectedCheckInDate && selectedCheckOutDate && isBefore(selectedCheckOutDate, selectedCheckInDate))}
          >
            Ir a Reservar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
