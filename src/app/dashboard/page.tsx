
'use client';

import { useEffect, useState, useMemo } from 'react';
import type { Room, GeneralContractSettings } from '@/lib/types';
import { fetchRooms } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DollarSign, Home, CheckCircle2, ListTree, MapPin, TrendingUp, ShieldAlert, Settings, Save } from "lucide-react";
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/hooks/use-toast";
import { getFromLocalStorage, setToLocalStorage } from '@/lib/localStorageUtils';

interface CitySummary {
  [city: string]: number;
}

const generalContractSettingsSchema = z.object({
  companyName: z.string().min(1, "El nombre de la empresa es obligatorio."),
  companyCif: z.string().min(1, "El CIF de la empresa es obligatorio."),
  representativeName: z.string().min(1, "El nombre del representante es obligatorio."),
  representativeDni: z.string().min(1, "El DNI del representante es obligatorio."),
  contactEmail: z.string().email("Email de contacto inválido."),
  supplyCostsClause: z.string().min(10, "La cláusula de gastos debe tener al menos 10 caracteres."),
  lateRentPenaltyClause: z.string().min(10, "La cláusula de penalización por retraso de alquiler debe tener al menos 10 caracteres."),
  lateCheckoutPenaltyClause: z.string().min(10, "La cláusula de penalización por desalojo tardío debe tener al menos 10 caracteres."),
  inventoryDamagePolicy: z.string().min(10, "La política de daños de inventario debe tener al menos 10 caracteres."),
  noisePolicyGuestLimit: z.coerce.number().min(0, "El límite de invitados debe ser 0 o más."),
  depositReturnTimeframe: z.string().min(3, "El plazo de devolución de fianza debe tener al menos 3 caracteres."),
});

const LOCAL_STORAGE_CONTRACT_SETTINGS_KEY = 'chattyRentalContractSettings';

const defaultContractSettings: GeneralContractSettings = {
  companyName: "Tripath Coliving SL",
  companyCif: "B00000000",
  representativeName: "Marcelino Ribón Parada",
  representativeDni: "15417100-Q",
  contactEmail: "no-reply@tripath.site",
  supplyCostsClause: "El ARRENDATARIO/A abonará un importe de CINCUENTA (50) EUROS mensuales derivado de los suministros del Inmueble...",
  lateRentPenaltyClause: "El retraso en el pago de la renta facultará a la parte representante para reclamar... veinte euros (20 €) por cada día de retraso...",
  lateCheckoutPenaltyClause: "En caso contrario, por cada día de retraso, devengará a favor de la parte representante una indemnización por importe de treinta euros (30 €)...",
  inventoryDamagePolicy: "Extraordinariamente, a la finalización del contrato, [NAME_COMPANY] podrá descontar de la garantía del inquilino el importe necesario...",
  noisePolicyGuestLimit: 5,
  depositReturnTimeframe: "dos meses",
};


export default function DashboardPage() {
  const [allRooms, setAllRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const { control, handleSubmit, reset, formState: { errors, isDirty } } = useForm<GeneralContractSettings>({
    resolver: zodResolver(generalContractSettingsSchema),
    defaultValues: getFromLocalStorage<GeneralContractSettings>(LOCAL_STORAGE_CONTRACT_SETTINGS_KEY, defaultContractSettings),
  });

  useEffect(() => {
    async function loadRoomsData() {
      try {
        setIsLoading(true);
        const roomsData = await fetchRooms();
        setAllRooms(roomsData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ocurrió un error desconocido al cargar los datos del dashboard');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadRoomsData();
  }, []);
  
  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = getFromLocalStorage<GeneralContractSettings>(LOCAL_STORAGE_CONTRACT_SETTINGS_KEY, defaultContractSettings);
    reset(savedSettings);
  }, [reset]);


  const handleSaveContractSettings: SubmitHandler<GeneralContractSettings> = (data) => {
    setToLocalStorage(LOCAL_STORAGE_CONTRACT_SETTINGS_KEY, data);
    toast({
      title: "Configuración Guardada",
      description: "La configuración general del contrato se ha guardado localmente.",
    });
    reset(data); // Reset form with new data to clear isDirty state
  };

  const totalRooms = useMemo(() => allRooms.length, [allRooms]);
  
  const verifiedRooms = useMemo(() => allRooms.filter(room => room.is_verified).length, [allRooms]);
  
  const averagePrice = useMemo(() => {
    if (totalRooms === 0) return 0;
    const validPriceRooms = allRooms.filter(room => typeof room.monthly_price === 'number');
    if (validPriceRooms.length === 0) return 0;
    const sumPrices = validPriceRooms.reduce((acc, room) => acc + (room.monthly_price || 0), 0);
    return sumPrices / validPriceRooms.length;
  }, [allRooms, totalRooms]);

  const roomsAvailableNow = useMemo(() => allRooms.filter(room => room.availability && room.availability.available_now).length, [allRooms]);

  const citiesSummary: CitySummary = useMemo(() => {
    return allRooms.reduce((acc: CitySummary, room) => {
      if (room.city) {
        acc[room.city] = (acc[room.city] || 0) + 1;
      }
      return acc;
    }, {});
  }, [allRooms]);
  
  const sortedCities = useMemo(() => Object.entries(citiesSummary).sort((a, b) => b[1] - a[1]), [citiesSummary]);


  if (isLoading && totalRooms === 0) { // Only show full page skeleton if rooms are also loading
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold mb-8 text-primary">Dashboard de Habitaciones</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-6 w-6 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-1" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/3" />
          </CardHeader>
          <CardContent className="space-y-2">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}
          </CardContent>
        </Card>
         <Card>
            <CardHeader>
                 <Skeleton className="h-8 w-1/2" />
                 <Skeleton className="h-4 w-3/4 mt-1" />
            </CardHeader>
            <CardContent className="space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="space-y-1">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-8 w-full" />
                    </div>
                ))}
            </CardContent>
            <CardFooter>
                <Skeleton className="h-10 w-24" />
            </CardFooter>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Error al Cargar el Dashboard</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-primary">Dashboard de Habitaciones</h1>
      
      {isLoading && totalRooms === 0 ? (
         <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-6 w-6 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-1" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : totalRooms === 0 && !error ? (
         <Alert className="max-w-2xl mx-auto">
            <MapPin className="h-4 w-4" />
            <AlertTitle>No hay datos de habitaciones</AlertTitle>
            <AlertDescription>
            No se encontraron habitaciones en la fuente de datos. Verifica la conexión o la fuente.
            </AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Habitaciones</CardTitle>
                <Home className="h-5 w-5 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalRooms}</div>
                <p className="text-xs text-muted-foreground">Número total de propiedades listadas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Habitaciones Verificadas</CardTitle>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{verifiedRooms}</div>
                <p className="text-xs text-muted-foreground">{totalRooms > 0 ? ((verifiedRooms / totalRooms) * 100).toFixed(1) : 0}% del total</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Precio Promedio Mensual</CardTitle>
                <DollarSign className="h-5 w-5 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{averagePrice > 0 ? averagePrice.toFixed(2) : '0.00'} {allRooms.find(room => room.currency_symbol)?.currency_symbol || '€'}</div>
                <p className="text-xs text-muted-foreground">Media de precios de alquiler</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Disponibles Ahora</CardTitle>
                <TrendingUp className="h-5 w-5 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{roomsAvailableNow}</div>
                <p className="text-xs text-muted-foreground">{totalRooms > 0 ? ((roomsAvailableNow / totalRooms) * 100).toFixed(1) : 0}% listas para ocupar</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><ListTree className="mr-2 h-5 w-5 text-accent" /> Habitaciones por Ciudad</CardTitle>
              <CardDescription>Distribución de las propiedades en diferentes ciudades.</CardDescription>
            </CardHeader>
            <CardContent>
              {sortedCities.length > 0 ? (
                <ul className="space-y-2 max-h-96 overflow-y-auto">
                  {sortedCities.map(([city, count]) => (
                    <li key={city} className="flex justify-between items-center p-3 bg-muted/50 rounded-md hover:bg-muted transition-colors">
                      <span className="font-medium text-foreground flex items-center"><MapPin size={16} className="mr-2 text-primary" /> {city}</span>
                      <span className="text-sm text-primary font-semibold py-1 px-3 rounded-full bg-primary/10">{count} hab.</span>
                    </li>
                  ))}
                </ul>
              ) : (
                 isLoading ? <Skeleton className="h-20 w-full" /> : <p className="text-muted-foreground">No hay datos de ciudades disponibles.</p>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* General Contract Settings Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-xl"><Settings className="mr-2 h-6 w-6 text-accent" /> Configuración General de Contratos</CardTitle>
          <CardDescription>Define los datos y cláusulas generales que se usarán en los contratos. Los cambios se guardan localmente en tu navegador.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(handleSaveContractSettings)}>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="companyName">Nombre de la Empresa Representante</Label>
                <Controller name="companyName" control={control} render={({ field }) => <Input id="companyName" {...field} />} />
                {errors.companyName && <p className="text-sm text-destructive mt-1">{errors.companyName.message}</p>}
              </div>
              <div>
                <Label htmlFor="companyCif">CIF de la Empresa</Label>
                <Controller name="companyCif" control={control} render={({ field }) => <Input id="companyCif" {...field} />} />
                {errors.companyCif && <p className="text-sm text-destructive mt-1">{errors.companyCif.message}</p>}
              </div>
              <div>
                <Label htmlFor="representativeName">Nombre del Representante Legal</Label>
                <Controller name="representativeName" control={control} render={({ field }) => <Input id="representativeName" {...field} />} />
                {errors.representativeName && <p className="text-sm text-destructive mt-1">{errors.representativeName.message}</p>}
              </div>
              <div>
                <Label htmlFor="representativeDni">DNI del Representante Legal</Label>
                <Controller name="representativeDni" control={control} render={({ field }) => <Input id="representativeDni" {...field} />} />
                {errors.representativeDni && <p className="text-sm text-destructive mt-1">{errors.representativeDni.message}</p>}
              </div>
            </div>
             <div>
                <Label htmlFor="contactEmail">Email de Contacto General (para notificaciones)</Label>
                <Controller name="contactEmail" control={control} render={({ field }) => <Input id="contactEmail" type="email" {...field} />} />
                {errors.contactEmail && <p className="text-sm text-destructive mt-1">{errors.contactEmail.message}</p>}
            </div>
            <div>
              <Label htmlFor="supplyCostsClause">Cláusula de Gastos de Suministros</Label>
              <Controller name="supplyCostsClause" control={control} render={({ field }) => <Textarea id="supplyCostsClause" {...field} rows={4} placeholder="Ej: El ARRENDATARIO/A abonará un importe de CINCUENTA (50) EUROS mensuales..."/>} />
              {errors.supplyCostsClause && <p className="text-sm text-destructive mt-1">{errors.supplyCostsClause.message}</p>}
            </div>
            <div>
              <Label htmlFor="lateRentPenaltyClause">Cláusula Penalización por Retraso de Alquiler</Label>
              <Controller name="lateRentPenaltyClause" control={control} render={({ field }) => <Textarea id="lateRentPenaltyClause" {...field} rows={3} placeholder="Ej: El retraso en el pago de la renta facultará..."/>} />
              {errors.lateRentPenaltyClause && <p className="text-sm text-destructive mt-1">{errors.lateRentPenaltyClause.message}</p>}
            </div>
            <div>
              <Label htmlFor="lateCheckoutPenaltyClause">Cláusula Penalización por Desalojo Tardío</Label>
              <Controller name="lateCheckoutPenaltyClause" control={control} render={({ field }) => <Textarea id="lateCheckoutPenaltyClause" {...field} rows={3} placeholder="Ej: En caso contrario, por cada día de retraso..."/>} />
              {errors.lateCheckoutPenaltyClause && <p className="text-sm text-destructive mt-1">{errors.lateCheckoutPenaltyClause.message}</p>}
            </div>
            <div>
              <Label htmlFor="inventoryDamagePolicy">Política de Daños al Inventario</Label>
              <Controller name="inventoryDamagePolicy" control={control} render={({ field }) => <Textarea id="inventoryDamagePolicy" {...field} rows={4} placeholder="Ej: Extraordinariamente, a la finalización del contrato..."/>} />
              {errors.inventoryDamagePolicy && <p className="text-sm text-destructive mt-1">{errors.inventoryDamagePolicy.message}</p>}
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="noisePolicyGuestLimit">Límite de Invitados (Política de Ruidos)</Label>
                <Controller name="noisePolicyGuestLimit" control={control} render={({ field }) => <Input id="noisePolicyGuestLimit" type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value,10))}/>} />
                {errors.noisePolicyGuestLimit && <p className="text-sm text-destructive mt-1">{errors.noisePolicyGuestLimit.message}</p>}
              </div>
              <div>
                <Label htmlFor="depositReturnTimeframe">Plazo Devolución de Fianza</Label>
                <Controller name="depositReturnTimeframe" control={control} render={({ field }) => <Input id="depositReturnTimeframe" {...field} placeholder="Ej: dos meses, 60 días"/>} />
                {errors.depositReturnTimeframe && <p className="text-sm text-destructive mt-1">{errors.depositReturnTimeframe.message}</p>}
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button type="submit" disabled={!isDirty}>
              <Save className="mr-2 h-4 w-4" /> Guardar Configuración
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
