'use client';

import { useEffect, useState, useMemo } from 'react';
import type { Room } from '@/lib/types';
import { fetchRooms } from '@/lib/api';
import RoomCard from '@/components/RoomCard';
import RoomFilters, { type Filters } from '@/components/RoomFilters';
import PaginationControls from '@/components/PaginationControls';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

const ITEMS_PER_PAGE = 12;

export default function HomePage() {
  const [allRooms, setAllRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [filters, setFilters] = useState<Filters>({
    city: '',
    availabilityDate: undefined,
    maxPrice: '',
  });
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function loadRooms() {
      try {
        setIsLoading(true);
        const roomsData = await fetchRooms();
        setAllRooms(roomsData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ocurrió un error desconocido');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadRooms();
  }, []);

  const filteredRooms = useMemo(() => {
    return allRooms.filter(room => {
      const cityMatch = filters.city ? room.city.toLowerCase().includes(filters.city.toLowerCase()) : true;
      
      const priceMatch = filters.maxPrice ? room.monthly_price <= parseFloat(filters.maxPrice) : true;
      
      let availabilityMatch = true;
      if (filters.availabilityDate) {
        if (room.availability.available_now) {
          availabilityMatch = true;
        } else if (room.availability.available_from) {
          availabilityMatch = new Date(room.availability.available_from) <= filters.availabilityDate;
        } else {
          availabilityMatch = false; // No info, assume not available for specific date
        }
      }
      return cityMatch && priceMatch && availabilityMatch;
    });
  }, [allRooms, filters]);

  const paginatedRooms = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredRooms.slice(startIndex, endIndex);
  }, [filteredRooms, currentPage]);

  const totalPages = Math.ceil(filteredRooms.length / ITEMS_PER_PAGE);

  const handleFilterChange = (newFilters: Filters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page on filter change
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
     window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto">
        <Info className="h-4 w-4" />
        <AlertTitle>Error al cargar habitaciones</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 text-center text-primary">Encuentra tu Espacio Ideal</h1>
      <RoomFilters onFilterChange={handleFilterChange} initialFilters={filters} />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
            <div key={index} className="space-y-3">
              <Skeleton className="h-[200px] w-full rounded-xl" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          ))}
        </div>
      ) : paginatedRooms.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginatedRooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
          {totalPages > 1 && (
             <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
            />
           )}
        </>
      ) : (
        <Alert className="max-w-2xl mx-auto">
            <Info className="h-4 w-4" />
            <AlertTitle>No se encontraron resultados</AlertTitle>
            <AlertDescription>
            Intenta ajustar tus filtros o revisa más tarde. Continuamente añadimos nuevas propiedades.
            </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
