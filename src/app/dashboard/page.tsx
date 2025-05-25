
'use client';

import { useEffect, useState, useMemo } from 'react';
import type { Room } from '@/lib/types';
import { fetchRooms } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DollarSign, Home, CheckCircle2, ListTree, MapPin, TrendingUp, ShieldAlert } from "lucide-react";

interface CitySummary {
  [city: string]: number;
}

export default function DashboardPage() {
  const [allRooms, setAllRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const totalRooms = useMemo(() => allRooms.length, [allRooms]);
  
  const verifiedRooms = useMemo(() => allRooms.filter(room => room.is_verified).length, [allRooms]);
  
  const averagePrice = useMemo(() => {
    if (totalRooms === 0) return 0;
    const validPriceRooms = allRooms.filter(room => typeof room.monthly_price === 'number');
    if (validPriceRooms.length === 0) return 0;
    const sumPrices = validPriceRooms.reduce((acc, room) => acc + room.monthly_price, 0);
    return sumPrices / validPriceRooms.length;
  }, [allRooms, totalRooms]);

  const roomsAvailableNow = useMemo(() => allRooms.filter(room => room.availability && room.availability.available_now).length, [allRooms]);

  const citiesSummary: CitySummary = useMemo(() => {
    return allRooms.reduce((acc: CitySummary, room) => {
      if (room.city) { // Ensure city is defined
        acc[room.city] = (acc[room.city] || 0) + 1;
      }
      return acc;
    }, {});
  }, [allRooms]);
  
  const sortedCities = useMemo(() => Object.entries(citiesSummary).sort((a, b) => b[1] - a[1]), [citiesSummary]);


  if (isLoading) {
    return (
      <div>
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
  
  if (totalRooms === 0 && !error) {
     return (
      <div>
        <h1 className="text-3xl font-bold mb-8 text-primary">Dashboard de Habitaciones</h1>
        <Alert className="max-w-2xl mx-auto">
            <MapPin className="h-4 w-4" />
            <AlertTitle>No hay datos de habitaciones</AlertTitle>
            <AlertDescription>
            No se encontraron habitaciones en la fuente de datos. Verifica la conexión o la fuente.
            </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 text-primary">Dashboard de Habitaciones</h1>
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
            <div className="text-2xl font-bold">{averagePrice.toFixed(2)} {allRooms.find(room => room.currency_symbol)?.currency_symbol || '€'}</div>
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
            <p className="text-muted-foreground">No hay datos de ciudades disponibles.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
