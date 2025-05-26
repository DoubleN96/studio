
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

interface ReservationSummaryDialogProps {
  room: Room;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export default function ReservationSummaryDialog({
  room,
  open,
  onOpenChange,
  onConfirm,
}: ReservationSummaryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Resumen de la Reserva</DialogTitle>
          <DialogDescription>
            Por favor, revisa los detalles de la habitación antes de continuar.
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
              {room.monthly_price}
              {room.currency_symbol}
            </p>
          </div>
          <Separator className="my-2" />
           <div>
            <span className="font-semibold text-muted-foreground">Fecha de Entrada:</span>
            <p className="text-foreground italic">A seleccionar en el siguiente paso</p>
          </div>
           <div>
            <span className="font-semibold text-muted-foreground">Duración:</span>
            <p className="text-foreground italic">A seleccionar en el siguiente paso</p>
          </div>
        </div>
        <DialogFooter className="mt-6">
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button
            onClick={() => {
              onConfirm();
              onOpenChange(false); // Close dialog on confirm
            }}
            className="bg-primary hover:bg-primary/90"
          >
            Confirmar y Continuar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
