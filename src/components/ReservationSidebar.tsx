
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { Room, GeneralContractSettings } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import ReservationSummaryDialog from '@/components/ReservationSummaryDialog';
import { CalendarDays, Info, ShieldCheck, Eye, CalendarIcon as LucideCalendarIcon } from 'lucide-react';
import { getFromLocalStorage } from '@/lib/localStorageUtils';
import { format, parseISO, isBefore, addMonths, differenceInCalendarMonths, startOfDay, formatISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const LOCAL_STORAGE_CONTRACT_SETTINGS_KEY = 'chattyRentalContractSettings';

interface ReservationSidebarProps {
  room: Room;
  selectedCheckInDate: Date | undefined;
  selectedCheckOutDate: Date | undefined;
  onCheckInDateSelect: (date: Date | undefined) => void;
  onCheckOutDateSelect: (date: Date | undefined) => void;
}

export default function ReservationSidebar({ 
  room, 
  selectedCheckInDate, 
  selectedCheckOutDate,
  onCheckInDateSelect,
  onCheckOutDateSelect
}: ReservationSidebarProps) {
  const router = useRouter();
  const [isSummaryDialogOpen, setIsSummaryDialogOpen] = useState(false);
  const [contractSettings, setContractSettings] = useState<GeneralContractSettings | null>(null);

  useEffect(() => {
    const settings = getFromLocalStorage<GeneralContractSettings>(
      LOCAL_STORAGE_CONTRACT_SETTINGS_KEY,
      // Ensure a default for serviceFeePercentage if not found in localStorage
      // and that it's part of the default GeneralContractSettings type
      { 
        companyName: "Default Company",
        companyCif: "B00000000",
        representativeName: "Default Rep",
        representativeDni: "00000000X",
        contactEmail: "default@example.com",
        supplyCostsClause: "Default supply clause",
        lateRentPenaltyClause: "Default late rent clause",
        lateCheckoutPenaltyClause: "Default late checkout clause",
        inventoryDamagePolicy: "Default damage policy",
        noisePolicyGuestLimit: 0,
        depositReturnTimeframe: "N/A",
        serviceFeePercentage: 100 
      } as GeneralContractSettings 
    );
    setContractSettings(settings);
  }, []);

  const serviceFeePercentage = contractSettings?.serviceFeePercentage ?? 100; 
  const platformFee = room.monthly_price * (serviceFeePercentage / 100);
  const totalFirstMonth = room.monthly_price + platformFee;

  const handleOpenSummaryDialog = () => {
    setIsSummaryDialogOpen(true);
  };

  const handleNavigateToReservation = () => {
    let queryString = '';
    if (selectedCheckInDate && isValid(selectedCheckInDate)) {
      queryString += `?checkIn=${formatISO(selectedCheckInDate, { representation: 'date' })}`;
      if (selectedCheckOutDate && isValid(selectedCheckOutDate)) {
        queryString += `&checkOut=${formatISO(selectedCheckOutDate, { representation: 'date' })}`;
      }
    }
    router.push(`/reserve/${room.id}${queryString}`);
  };
  
  const minCalendarDateForCheckIn = room.availability.available_now 
    ? startOfDay(new Date()) 
    : room.availability.available_from 
    ? startOfDay(parseISO(room.availability.available_from)) 
    : startOfDay(new Date());

   const today = startOfDay(new Date());
   const effectiveMinCheckInDate = isBefore(minCalendarDateForCheckIn, today) ? today : minCalendarDateForCheckIn;

  const minStayMonths = room.availability.minimum_stay_months;

  const defaultCheckoutCalendarInitialMonth = useMemo(() => {
    if (selectedCheckInDate) {
      if (typeof minStayMonths === 'number' && minStayMonths > 0) {
        return addMonths(selectedCheckInDate, minStayMonths);
      }
      // If no minStayMonths or it's 0, default to the month of the selectedCheckInDate
      return selectedCheckInDate; 
    }
    return undefined; // No default if no check-in date
  }, [selectedCheckInDate, minStayMonths]);


  return (
    <>
      <Card className="sticky top-24 shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Reserva esta Habitación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-3xl font-bold text-primary">
              {room.monthly_price.toLocaleString('es-ES', { style: 'currency', currency: room.currency_code || 'EUR' })}
              <span className="text-base font-normal text-muted-foreground">/mes</span>
            </p>
          </div>
          
          <div className="border p-3 rounded-md space-y-3">
            <div>
              <Label htmlFor="checkInDateSidebar" className="text-sm font-medium">Fecha de Entrada</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="checkInDateSidebar"
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal mt-1",
                      !selectedCheckInDate && "text-muted-foreground"
                    )}
                  >
                    <LucideCalendarIcon className="mr-2 h-4 w-4" />
                    {selectedCheckInDate ? format(selectedCheckInDate, "PPP", { locale: es }) : <span>Selecciona entrada</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedCheckInDate}
                    onSelect={onCheckInDateSelect}
                    initialFocus
                    locale={es}
                    disabled={(date) => 
                      isBefore(date, effectiveMinCheckInDate) || 
                      (selectedCheckOutDate ? isAfter(date, selectedCheckOutDate) : false)
                    }
                    defaultMonth={selectedCheckInDate || effectiveMinCheckInDate}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="checkOutDateSidebar" className="text-sm font-medium">Fecha de Salida</Label>
               <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="checkOutDateSidebar"
                    variant={"outline"}
                    disabled={!selectedCheckInDate}
                    className={cn(
                      "w-full justify-start text-left font-normal mt-1",
                      !selectedCheckOutDate && "text-muted-foreground"
                    )}
                  >
                    <LucideCalendarIcon className="mr-2 h-4 w-4" />
                    {selectedCheckOutDate ? format(selectedCheckOutDate, "PPP", { locale: es }) : <span>Selecciona salida</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedCheckOutDate}
                    onSelect={onCheckOutDateSelect}
                    initialFocus
                    locale={es}
                    defaultMonth={defaultCheckoutCalendarInitialMonth}
                    disabled={(date) => !selectedCheckInDate || isBefore(date, selectedCheckInDate)}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Alquiler primer mes</span>
              <span>{room.monthly_price.toLocaleString('es-ES', { style: 'currency', currency: room.currency_code || 'EUR' })}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tarifa de servicio ({serviceFeePercentage}%)</span>
              <span>{platformFee.toLocaleString('es-ES', { style: 'currency', currency: room.currency_code || 'EUR' })}</span>
            </div>
             {selectedCheckInDate && selectedCheckOutDate && isBefore(selectedCheckInDate, selectedCheckOutDate) && (
              <div className="flex justify-between text-sm font-medium">
                <span>Duración Total</span>
                <span>
                  {(() => {
                    const months = differenceInCalendarMonths(selectedCheckOutDate, selectedCheckInDate);
                    return months > 0 ? `${months} mes(es)` : 'Menos de 1 mes';
                  })()}
                </span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-lg">
              <span>Total Estimado (primer pago)</span>
              <span>{totalFirstMonth.toLocaleString('es-ES', { style: 'currency', currency: room.currency_code || 'EUR' })}</span>
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
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={handleNavigateToReservation}
            disabled={!selectedCheckInDate || !selectedCheckOutDate} // Require both check-in and check-out date
          >
            Reservar Ahora
          </Button>
          <Button
            variant="link"
            size="sm"
            className="w-full text-muted-foreground hover:text-primary mt-1"
            onClick={handleOpenSummaryDialog}
          >
            <Eye size={16} className="mr-2" />
            Ver Resumen Estimado
          </Button>
          <div className="flex items-center text-xs text-muted-foreground pt-2">
              <ShieldCheck size={14} className="mr-1 text-green-600" />
              <span>Pago seguro y datos protegidos.</span>
          </div>
        </CardFooter>
      </Card>

      <ReservationSummaryDialog
        room={room}
        open={isSummaryDialogOpen}
        onOpenChange={setIsSummaryDialogOpen}
        onConfirm={handleNavigateToReservation}
        selectedCheckInDate={selectedCheckInDate}
        selectedCheckOutDate={selectedCheckOutDate}
      />
    </>
  );
}

