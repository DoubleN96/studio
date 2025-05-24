'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Room, ReservationDetails as ReservationDetailsType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, User, Mail, Phone, UploadCloud, CreditCard, FileText, ArrowLeft, ArrowRight } from 'lucide-react';

const personalInfoSchema = z.object({
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  email: z.string().email({ message: "Correo electrónico inválido." }),
  phone: z.string().min(9, { message: "El teléfono debe tener al menos 9 dígitos." }),
});

type PersonalInfoFormData = z.infer<typeof personalInfoSchema>;

interface ReservationFormProps {
  room: Room;
}

const STEPS = [
  { id: 1, title: 'Seleccionar Fechas' },
  { id: 2, title: 'Información Personal' },
  { id: 3, title: 'Subir Identificación (Mock)' },
  { id: 4, title: 'Pago (Mock)' },
  { id: 5, title: 'Confirmación (Mock)' },
];

export default function ReservationForm({ room }: ReservationFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [startDate, setStartDate] = useState<Date | undefined>(
    room.availability.available_from ? new Date(room.availability.available_from) : new Date()
  );
  const [duration, setDuration] = useState<number>(room.availability.minimum_stay_months || 1);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [reservationDetails, setReservationDetails] = useState<Partial<ReservationDetailsType>>({});
  const { toast } = useToast();

  const { control, handleSubmit, formState: { errors } } = useForm<PersonalInfoFormData>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: { name: '', email: '', phone: ''}
  });

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setIdFile(event.target.files[0]);
    }
  };

  const onSubmitPersonalInfo: SubmitHandler<PersonalInfoFormData> = (data) => {
    setReservationDetails(prev => ({ ...prev, ...data }));
    nextStep();
  };

  const progressPercentage = (currentStep / STEPS.length) * 100;

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-2xl">
      <CardHeader>
        <CardTitle className="text-2xl text-center text-primary">Proceso de Reserva</CardTitle>
        <CardDescription className="text-center">
          {STEPS[currentStep -1].title} (Paso {currentStep} de {STEPS.length})
        </CardDescription>
        <Progress value={progressPercentage} className="mt-2" />
      </CardHeader>
      <CardContent>
        {/* Step 1: Select Dates */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <Label htmlFor="startDate" className="block text-sm font-medium mb-1">Fecha de Entrada</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    locale={es}
                    disabled={{ before: room.availability.available_from ? new Date(new Date(room.availability.available_from).setDate(new Date(room.availability.available_from).getDate() -1)) : new Date(new Date().setDate(new Date().getDate() -1)) }}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="duration" className="block text-sm font-medium mb-1">Duración (meses)</Label>
              <Input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value, 10)))}
                min={room.availability.minimum_stay_months || 1}
                max={room.availability.maximum_stay_months || 120}
                className="w-full"
              />
              {room.availability.minimum_stay_months && <p className="text-xs text-muted-foreground mt-1">Estancia mínima: {room.availability.minimum_stay_months} meses.</p>}
            </div>
          </div>
        )}

        {/* Step 2: Personal Info */}
        {currentStep === 2 && (
          <form onSubmit={handleSubmit(onSubmitPersonalInfo)} className="space-y-4">
            <div>
              <Label htmlFor="name" className="flex items-center mb-1"><User className="mr-2 h-4 w-4 text-accent" />Nombre Completo</Label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => <Input {...field} id="name" placeholder="Tu nombre completo" />}
              />
              {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="email" className="flex items-center mb-1"><Mail className="mr-2 h-4 w-4 text-accent" />Correo Electrónico</Label>
              <Controller
                name="email"
                control={control}
                render={({ field }) => <Input {...field} id="email" type="email" placeholder="tu@ejemplo.com" />}
              />
              {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <Label htmlFor="phone" className="flex items-center mb-1"><Phone className="mr-2 h-4 w-4 text-accent" />Teléfono</Label>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => <Input {...field} id="phone" type="tel" placeholder="Tu número de teléfono" />}
              />
              {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>}
            </div>
             <Button type="submit" className="w-full hidden">Siguiente</Button> {/* Hidden, form submission handled by footer button */}
          </form>
        )}

        {/* Step 3: Upload ID */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <Label htmlFor="idFile" className="flex items-center mb-1"><UploadCloud className="mr-2 h-4 w-4 text-accent" />Sube tu Identificación (NIE/DNI/Pasaporte)</Label>
            <Input id="idFile" type="file" onChange={handleFileChange} className="file:text-primary file:font-semibold" />
            {idFile && <p className="text-sm text-muted-foreground mt-1">Archivo seleccionado: {idFile.name}</p>}
            <p className="text-xs text-muted-foreground">Esto es una simulación. El archivo no se subirá realmente.</p>
          </div>
        )}

        {/* Step 4: Payment Page (Mock) */}
        {currentStep === 4 && (
          <div className="text-center space-y-4">
            <CreditCard className="mx-auto h-16 w-16 text-primary" />
            <h3 className="text-xl font-semibold">Página de Pago (Simulación)</h3>
            <p className="text-muted-foreground">Serás redirigido a una pasarela de pago segura.</p>
            <p className="font-bold text-lg">Total a pagar: {(room.monthly_price * duration * 0.25).toFixed(2)} {room.currency_symbol} (Ej: 25% adelanto)</p>
            <Button size="lg" onClick={() => {
              toast({ title: "Pago Simulado Exitoso", description: "Redirigiendo a confirmación..." });
              nextStep();
            }} className="w-full">
              Proceder al Pago Simulado
            </Button>
          </div>
        )}

        {/* Step 5: Contract Preview & Download (Mock) */}
        {currentStep === 5 && (
          <div className="text-center space-y-4">
            <FileText className="mx-auto h-16 w-16 text-green-600" />
            <h3 className="text-xl font-semibold">¡Reserva Casi Lista!</h3>
            <p className="text-muted-foreground">Tu contrato de alquiler simulado está listo para descargar.</p>
            <div className="text-left bg-muted p-4 rounded-md text-sm space-y-1">
              <p><strong>Habitación:</strong> {room.title}</p>
              <p><strong>Ciudad:</strong> {room.city}</p>
              <p><strong>Fecha Entrada:</strong> {startDate ? format(startDate, "PPP", { locale: es }) : 'N/A'}</p>
              <p><strong>Duración:</strong> {duration} mes(es)</p>
              <p><strong>Nombre:</strong> {reservationDetails.name || 'N/A'}</p>
              <p><strong>Email:</strong> {reservationDetails.email || 'N/A'}</p>
            </div>
            <Button size="lg" onClick={() => {
              toast({ title: "Contrato Descargado (Simulación)", description: "¡Gracias por tu reserva!" });
            }} className="w-full">
              Descargar Contrato Simulado (PDF)
            </Button>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-6">
        <Button variant="outline" onClick={prevStep} disabled={currentStep === 1}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
        </Button>
        {currentStep < STEPS.length && (
          <Button onClick={currentStep === 2 ? handleSubmit(onSubmitPersonalInfo) : nextStep} disabled={currentStep === 3 && !idFile}>
            Siguiente <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
        {currentStep === STEPS.length && (
            <Button onClick={() => alert("¡Proceso de reserva simulado completado!")}>
                Finalizar
            </Button>
        )}
      </CardFooter>
    </Card>
  );
}
