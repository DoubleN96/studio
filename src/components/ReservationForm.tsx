
'use client';

import { useState, type ChangeEvent, useEffect } from 'react';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Room, ReservationDetailsType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from "@/hooks/use-toast";
import { format, addMonths, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, User, Mail, Phone, UploadCloud, CreditCard, FileText, ArrowLeft, ArrowRight, Briefcase, GraduationCap, HomeIcon, Landmark, ShieldQuestion, UsersIcon, BookUser, Globe, Building } from 'lucide-react';

// Schema for Step 1
const step1Schema = z.object({
  startDate: z.date({ required_error: "La fecha de entrada es obligatoria." }),
  duration: z.number().min(1, "La duración mínima es de 1 mes."),
  firstName: z.string().min(1, "El nombre es obligatorio."),
  lastName: z.string().min(1, "Los apellidos son obligatorios."),
  email: z.string().email("Correo electrónico inválido."),
  phone: z.string().min(9, "El teléfono debe tener al menos 9 caracteres."),
});

// Schema for Step 3
const step3Schema = z.object({
  birthDate: z.date({ required_error: "La fecha de nacimiento es obligatoria." }),
  gender: z.string().min(1, "El género es obligatorio."),
  studyOrWork: z.string().min(1, "Debes indicar si estudias o trabajas."),
  currentAddress: z.string().min(1, "La dirección actual es obligatoria. Formato: Calle Número, CP Ciudad, País."),
  passportIdNumber: z.string().min(1, "El número de pasaporte/ID es obligatorio."),
  originCountry: z.string().min(1, "El país de origen es obligatorio."),
  iban: z.string().min(1, "El IBAN es obligatorio."),
  bic: z.string().optional(), // BIC is optional based on form
  emergencyContact: z.string().min(1, "El contacto de emergencia es obligatorio. Formato: Nombre, Email, Teléfono."),
  universityWorkCenter: z.string().optional(),
});

// Combined type for react-hook-form, covering all validated fields
type ReservationFormData = z.infer<typeof step1Schema> & Partial<z.infer<typeof step3Schema>>;

interface ReservationFormProps {
  room: Room;
}

const STEPS = [
  { id: 1, title: 'Fechas e Información de Contacto' },
  { id: 2, title: 'Pago (Simulación)' },
  { id: 3, title: 'Información Adicional' },
  { id: 4, title: 'Confirmación y Contrato (Simulación)' },
];

export default function ReservationForm({ room }: ReservationFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [reservationDetails, setReservationDetails] = useState<ReservationDetailsType>({
    duration: room.availability.minimum_stay_months || 1,
    startDate: room.availability.available_from ? parseISO(room.availability.available_from) : new Date(),
    bookedRoom: room.code || room.title,
  });
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const { toast } = useToast();

  const { control, handleSubmit, trigger, getValues, formState: { errors } } = useForm<ReservationFormData>({
    resolver: zodResolver(currentStep === 1 ? step1Schema : step3Schema), // Schema changes based on step
    defaultValues: {
      startDate: reservationDetails.startDate,
      duration: reservationDetails.duration,
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      birthDate: undefined,
      gender: '',
      studyOrWork: '',
      currentAddress: '',
      passportIdNumber: '',
      originCountry: '',
      iban: '',
      bic: '',
      emergencyContact: '',
      universityWorkCenter: '',
    }
  });
  
  useEffect(() => {
    // Pre-fill check-in/out dates for step 3 if startDate and duration are set
    if (reservationDetails.startDate && reservationDetails.duration) {
      setReservationDetails(prev => ({
        ...prev,
        checkInDate: prev.startDate,
        checkOutDate: addMonths(prev.startDate!, prev.duration!)
      }));
    }
  }, [reservationDetails.startDate, reservationDetails.duration]);


  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const handlePassportFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setPassportFile(event.target.files[0]);
    }
  };

  const handleProofFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setProofFile(event.target.files[0]);
    }
  };

  const handleStep1Submit: SubmitHandler<ReservationFormData> = (data) => {
    setReservationDetails(prev => ({
      ...prev,
      startDate: data.startDate,
      duration: data.duration,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      checkInDate: data.startDate, // Set checkInDate for later steps
      checkOutDate: addMonths(data.startDate!, data.duration!), // Set checkOutDate
    }));
    nextStep();
  };
  
  const handleStep3Submit: SubmitHandler<ReservationFormData> = (data) => {
     if (!passportFile) {
      toast({ variant: "destructive", title: "Archivo Requerido", description: "Por favor, sube una foto de tu pasaporte/ID." });
      return;
    }
    // Proof of study/work is optional based on Google Form wording, but can be made mandatory here if needed.
    // if (!proofFile) {
    //   toast({ variant: "destructive", title: "Archivo Requerido", description: "Por favor, sube tu justificante de estudios o trabajo." });
    //   return;
    // }

    setReservationDetails(prev => ({
      ...prev,
      birthDate: data.birthDate,
      gender: data.gender,
      studyOrWork: data.studyOrWork,
      currentAddress: data.currentAddress,
      passportIdNumber: data.passportIdNumber,
      originCountry: data.originCountry,
      iban: data.iban,
      bic: data.bic,
      emergencyContact: data.emergencyContact,
      universityWorkCenter: data.universityWorkCenter,
      passportIdFile: passportFile,
      proofOfStudiesWorkFile: proofFile,
    }));
    nextStep();
  };


  const progressPercentage = (currentStep / STEPS.length) * 100;

  const calculatedCheckOutDate = reservationDetails.startDate && reservationDetails.duration
    ? addMonths(reservationDetails.startDate, reservationDetails.duration)
    : undefined;

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-2xl">
      <CardHeader>
        <CardTitle className="text-2xl text-center text-primary">Proceso de Reserva</CardTitle>
        <CardDescription className="text-center">
          {STEPS[currentStep - 1].title} (Paso {currentStep} de {STEPS.length})
        </CardDescription>
        <Progress value={progressPercentage} className="mt-2" />
      </CardHeader>
      
      <form onSubmit={handleSubmit(currentStep === 1 ? handleStep1Submit : handleStep3Submit)}>
        <CardContent>
          {/* Step 1: Dates & Initial Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="startDate" className="block text-sm font-medium mb-1">Fecha de Entrada</Label>
                <Controller
                  name="startDate"
                  control={control}
                  render={({ field }) => (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            field.onChange(date);
                            setReservationDetails(prev => ({ ...prev, startDate: date }));
                          }}
                          initialFocus
                          locale={es}
                          disabled={{ before: room.availability.available_from ? parseISO(room.availability.available_from) : new Date(new Date().setDate(new Date().getDate() -1)) }}
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                />
                {errors.startDate && <p className="text-sm text-destructive mt-1">{errors.startDate.message}</p>}
              </div>
              <div>
                <Label htmlFor="duration" className="block text-sm font-medium mb-1">Duración (meses)</Label>
                <Controller
                  name="duration"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="duration"
                      type="number"
                      value={field.value || ''}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        field.onChange(isNaN(val) ? '' : val);
                        if (!isNaN(val)) setReservationDetails(prev => ({ ...prev, duration: val }));
                      }}
                      min={room.availability.minimum_stay_months || 1}
                      max={room.availability.maximum_stay_months || 120}
                      className="w-full"
                    />
                  )}
                />
                {errors.duration && <p className="text-sm text-destructive mt-1">{errors.duration.message}</p>}
                {room.availability.minimum_stay_months && <p className="text-xs text-muted-foreground mt-1">Estancia mínima: {room.availability.minimum_stay_months} meses.</p>}
                 {calculatedCheckOutDate && <p className="text-xs text-muted-foreground mt-1">Fecha de salida estimada: {format(calculatedCheckOutDate, "PPP", { locale: es })}.</p>}
              </div>
              <div>
                <Label htmlFor="firstName" className="flex items-center mb-1"><User className="mr-2 h-4 w-4 text-accent" />Nombre</Label>
                <Controller name="firstName" control={control} render={({ field }) => <Input {...field} id="firstName" placeholder="Tu nombre" />} />
                {errors.firstName && <p className="text-sm text-destructive mt-1">{errors.firstName.message}</p>}
              </div>
              <div>
                <Label htmlFor="lastName" className="flex items-center mb-1"><User className="mr-2 h-4 w-4 text-accent" />Apellidos</Label>
                <Controller name="lastName" control={control} render={({ field }) => <Input {...field} id="lastName" placeholder="Tus apellidos" />} />
                {errors.lastName && <p className="text-sm text-destructive mt-1">{errors.lastName.message}</p>}
              </div>
              <div>
                <Label htmlFor="email" className="flex items-center mb-1"><Mail className="mr-2 h-4 w-4 text-accent" />Correo Electrónico</Label>
                <Controller name="email" control={control} render={({ field }) => <Input {...field} id="email" type="email" placeholder="tu@ejemplo.com" />} />
                {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <Label htmlFor="phone" className="flex items-center mb-1"><Phone className="mr-2 h-4 w-4 text-accent" />Teléfono/Whatsapp</Label>
                <Controller name="phone" control={control} render={({ field }) => <Input {...field} id="phone" type="tel" placeholder="Ej: +34 656 93 33 91" />} />
                {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>}
              </div>
            </div>
          )}

          {/* Step 2: Payment Page (Mock) */}
          {currentStep === 2 && (
            <div className="text-center space-y-4">
              <CreditCard className="mx-auto h-16 w-16 text-primary" />
              <h3 className="text-xl font-semibold">Página de Pago (Simulación)</h3>
              <p className="text-muted-foreground">Serás redirigido a una pasarela de pago segura.</p>
              <p className="font-bold text-lg">Total a pagar (ej. 25% adelanto): {(room.monthly_price * (reservationDetails.duration || 1) * 0.25).toFixed(2)} {room.currency_symbol}</p>
              <Button size="lg" onClick={() => {
                toast({ title: "Pago Simulado Exitoso", description: "Redirigiendo a información adicional..." });
                nextStep();
              }} className="w-full" type="button"> {/* type="button" to prevent form submission */}
                Proceder al Pago Simulado
              </Button>
            </div>
          )}

          {/* Step 3: Additional Information */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="bookedRoom" className="flex items-center mb-1"><HomeIcon className="mr-2 h-4 w-4 text-accent" />Habitación Reservada</Label>
                <Input id="bookedRoom" value={reservationDetails.bookedRoom} readOnly className="bg-muted"/>
              </div>

              <div>
                <Label htmlFor="birthDate" className="block text-sm font-medium mb-1">Fecha de Nacimiento</Label>
                 <Controller
                  name="birthDate"
                  control={control}
                  render={({ field }) => (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, "PPP", { locale: es }) : <span>Selecciona tu fecha de nacimiento</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          captionLayout="dropdown-buttons"
                          fromYear={1950}
                          toYear={getValues("startDate") ? getValues("startDate")!.getFullYear() - 10 : new Date().getFullYear() -10}
                          initialFocus
                          locale={es}
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                />
                {errors.birthDate && <p className="text-sm text-destructive mt-1">{errors.birthDate.message}</p>}
              </div>
              
              <div>
                 <Label className="flex items-center mb-2"><UsersIcon className="mr-2 h-4 w-4 text-accent" />Género</Label>
                <Controller
                    name="gender"
                    control={control}
                    render={({ field }) => (
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                            <div className="flex items-center space-x-2"><RadioGroupItem value="male" id="male" /><Label htmlFor="male">Masculino</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="female" id="female" /><Label htmlFor="female">Femenino</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="other" id="other" /><Label htmlFor="other">Otro</Label></div>
                        </RadioGroup>
                    )}
                />
                 {errors.gender && <p className="text-sm text-destructive mt-1">{errors.gender.message}</p>}
              </div>

               <div>
                <Label className="flex items-center mb-2"><ShieldQuestion className="mr-2 h-4 w-4 text-accent" />¿Estudias o Trabajas?</Label>
                 <Controller
                    name="studyOrWork"
                    control={control}
                    render={({ field }) => (
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                            <div className="flex items-center space-x-2"><RadioGroupItem value="study" id="study" /><Label htmlFor="study">Estudio</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="work" id="work" /><Label htmlFor="work">Trabajo</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="both" id="both" /><Label htmlFor="both">Ambos</Label></div>
                             <div className="flex items-center space-x-2"><RadioGroupItem value="neither" id="neither" /><Label htmlFor="neither">Ninguno</Label></div>
                        </RadioGroup>
                    )}
                />
                {errors.studyOrWork && <p className="text-sm text-destructive mt-1">{errors.studyOrWork.message}</p>}
              </div>

              <div>
                <Label htmlFor="currentAddress" className="flex items-center mb-1"><HomeIcon className="mr-2 h-4 w-4 text-accent" />Dirección Actual</Label>
                <Controller name="currentAddress" control={control} render={({ field }) => <Input {...field} id="currentAddress" placeholder="Calle Número, CP Ciudad, País" />} />
                 {errors.currentAddress && <p className="text-sm text-destructive mt-1">{errors.currentAddress.message}</p>}
              </div>
              <div>
                <Label htmlFor="passportIdNumber" className="flex items-center mb-1"><BookUser className="mr-2 h-4 w-4 text-accent" />Número de Pasaporte / ID</Label>
                <Controller name="passportIdNumber" control={control} render={({ field }) => <Input {...field} id="passportIdNumber" placeholder="Tu número de identificación" />} />
                {errors.passportIdNumber && <p className="text-sm text-destructive mt-1">{errors.passportIdNumber.message}</p>}
              </div>
              <div>
                <Label htmlFor="originCountry" className="flex items-center mb-1"><Globe className="mr-2 h-4 w-4 text-accent" />País de Origen</Label>
                <Controller name="originCountry" control={control} render={({ field }) => <Input {...field} id="originCountry" placeholder="Tu país de origen" />} />
                 {errors.originCountry && <p className="text-sm text-destructive mt-1">{errors.originCountry.message}</p>}
              </div>
               <div>
                <Label htmlFor="checkInDateDisplay" className="flex items-center mb-1"><CalendarIcon className="mr-2 h-4 w-4 text-accent" />Check-IN Estimado</Label>
                <Input id="checkInDateDisplay" value={reservationDetails.checkInDate ? format(reservationDetails.checkInDate, "PPP", { locale: es }) : 'N/A'} readOnly  className="bg-muted"/>
              </div>
              <div>
                <Label htmlFor="checkOutDateDisplay" className="flex items-center mb-1"><CalendarIcon className="mr-2 h-4 w-4 text-accent" />Check-OUT Estimado</Label>
                <Input id="checkOutDateDisplay" value={reservationDetails.checkOutDate ? format(reservationDetails.checkOutDate, "PPP", { locale: es }) : 'N/A'} readOnly className="bg-muted"/>
              </div>
              <div>
                <Label htmlFor="iban" className="flex items-center mb-1"><Landmark className="mr-2 h-4 w-4 text-accent" />IBAN (Para devolución de fianza)</Label>
                <Controller name="iban" control={control} render={({ field }) => <Input {...field} id="iban" placeholder="Tu IBAN" />} />
                 {errors.iban && <p className="text-sm text-destructive mt-1">{errors.iban.message}</p>}
              </div>
               <div>
                <Label htmlFor="bic" className="flex items-center mb-1"><Landmark className="mr-2 h-4 w-4 text-accent" />BIC (Opcional)</Label>
                <Controller name="bic" control={control} render={({ field }) => <Input {...field} id="bic" placeholder="El BIC de tu banco" />} />
                {errors.bic && <p className="text-sm text-destructive mt-1">{errors.bic.message}</p>}
              </div>
              <div>
                <Label htmlFor="emergencyContact" className="flex items-center mb-1"><UsersIcon className="mr-2 h-4 w-4 text-accent" />Contacto de Emergencia</Label>
                <Controller name="emergencyContact" control={control} render={({ field }) => <Input {...field} id="emergencyContact" placeholder="Nombre, email, teléfono" />} />
                {errors.emergencyContact && <p className="text-sm text-destructive mt-1">{errors.emergencyContact.message}</p>}
              </div>
               <div>
                <Label htmlFor="passportFile" className="flex items-center mb-1"><UploadCloud className="mr-2 h-4 w-4 text-accent" />Foto de tu Pasaporte/ID</Label>
                <Input id="passportFile" type="file" onChange={handlePassportFileChange} className="file:text-primary file:font-semibold" accept="image/*,.pdf"/>
                {passportFile && <p className="text-sm text-muted-foreground mt-1">Archivo: {passportFile.name}</p>}
                <p className="text-xs text-muted-foreground">Simulación. El archivo no se subirá.</p>
              </div>
              <div>
                <Label htmlFor="proofFile" className="flex items-center mb-1"><UploadCloud className="mr-2 h-4 w-4 text-accent" />Justificante de Estudios o Trabajo (Opcional)</Label>
                <Input id="proofFile" type="file" onChange={handleProofFileChange} className="file:text-primary file:font-semibold" accept="image/*,.pdf"/>
                {proofFile && <p className="text-sm text-muted-foreground mt-1">Archivo: {proofFile.name}</p>}
                 <p className="text-xs text-muted-foreground">Simulación. El archivo no se subirá.</p>
              </div>
               <div>
                <Label htmlFor="universityWorkCenter" className="flex items-center mb-1"><Building className="mr-2 h-4 w-4 text-accent" />Universidad o Centro de Trabajo (Opcional)</Label>
                <Controller name="universityWorkCenter" control={control} render={({ field }) => <Input {...field} id="universityWorkCenter" placeholder="Nombre de la institución" />} />
                 {errors.universityWorkCenter && <p className="text-sm text-destructive mt-1">{errors.universityWorkCenter.message}</p>}
              </div>
            </div>
          )}

          {/* Step 4: Contract Preview & Download (Mock) */}
          {currentStep === 4 && (
            <div className="text-center space-y-4">
              <FileText className="mx-auto h-16 w-16 text-green-600" />
              <h3 className="text-xl font-semibold">¡Reserva Casi Lista!</h3>
              <p className="text-muted-foreground">Tu contrato de alquiler simulado está listo para descargar.</p>
              <div className="text-left bg-muted p-4 rounded-md text-sm space-y-1 max-h-60 overflow-y-auto">
                <p><strong>Habitación:</strong> {reservationDetails.bookedRoom || 'N/A'}</p>
                <p><strong>Fecha Entrada:</strong> {reservationDetails.startDate ? format(reservationDetails.startDate, "PPP", { locale: es }) : 'N/A'}</p>
                <p><strong>Duración:</strong> {reservationDetails.duration} mes(es)</p>
                <p><strong>Fecha Salida:</strong> {reservationDetails.checkOutDate ? format(reservationDetails.checkOutDate, "PPP", { locale: es }) : 'N/A'}</p>
                <p><strong>Nombre:</strong> {reservationDetails.firstName} {reservationDetails.lastName}</p>
                <p><strong>Email:</strong> {reservationDetails.email}</p>
                <p><strong>Teléfono:</strong> {reservationDetails.phone}</p>
                <hr className="my-1"/>
                <p><strong>Fecha Nacimiento:</strong> {reservationDetails.birthDate ? format(reservationDetails.birthDate, "PPP", { locale: es }) : 'N/A'}</p>
                <p><strong>Género:</strong> {reservationDetails.gender}</p>
                <p><strong>Estudia/Trabaja:</strong> {reservationDetails.studyOrWork}</p>
                <p><strong>Dirección Actual:</strong> {reservationDetails.currentAddress}</p>
                <p><strong>Pasaporte/ID:</strong> {reservationDetails.passportIdNumber}</p>
                <p><strong>País Origen:</strong> {reservationDetails.originCountry}</p>
                <p><strong>IBAN:</strong> {reservationDetails.iban}</p>
                <p><strong>BIC:</strong> {reservationDetails.bic || 'N/A'}</p>
                <p><strong>Contacto Emergencia:</strong> {reservationDetails.emergencyContact}</p>
                <p><strong>Universidad/Trabajo:</strong> {reservationDetails.universityWorkCenter || 'N/A'}</p>
                <p><strong>ID Cargado:</strong> {reservationDetails.passportIdFile?.name || 'No'}</p>
                <p><strong>Justificante Cargado:</strong> {reservationDetails.proofOfStudiesWorkFile?.name || 'No'}</p>
              </div>
              <Button size="lg" onClick={() => {
                toast({ title: "Contrato Descargado (Simulación)", description: "¡Gracias por tu reserva!" });
              }} className="w-full" type="button">
                Descargar Contrato Simulado (PDF)
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-6">
          <Button variant="outline" onClick={prevStep} disabled={currentStep === 1} type="button">
            <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
          </Button>
          
          {currentStep === 1 && (
            <Button type="submit"> {/* Submits Step 1 form */}
              Siguiente <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}

          {currentStep === 2 && ( // No submit button needed here, handled by "Proceder al Pago Simulado"
             <Button onClick={nextStep} type="button"> {/* Manually go to next step after mock payment interaction */}
              Siguiente (Tras Pago) <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}

          {currentStep === 3 && (
             <Button type="submit"> {/* Submits Step 3 form */}
              Siguiente <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}

          {currentStep === STEPS.length && (
              <Button onClick={() => {
                 toast({ title: "Proceso Simulado Completo", description: "¡Gracias por utilizar ChattyRental!" });
                 // Potentially redirect or reset form here
              }} type="button">
                  Finalizar
              </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}
