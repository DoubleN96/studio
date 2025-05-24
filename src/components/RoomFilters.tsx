'use client';

import { useState, type Dispatch, type SetStateAction } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Search, DollarSign, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export interface Filters {
  city: string;
  availabilityDate: Date | undefined;
  maxPrice: string;
}

interface RoomFiltersProps {
  onFilterChange: Dispatch<SetStateAction<Filters>>;
  initialFilters: Filters;
}

export default function RoomFilters({ onFilterChange, initialFilters }: RoomFiltersProps) {
  const [city, setCity] = useState(initialFilters.city);
  const [availabilityDate, setAvailabilityDate] = useState<Date | undefined>(initialFilters.availabilityDate);
  const [maxPrice, setMaxPrice] = useState(initialFilters.maxPrice);

  const handleApplyFilters = () => {
    onFilterChange({ city, availabilityDate, maxPrice });
  };

  const handleClearFilters = () => {
    setCity('');
    setAvailabilityDate(undefined);
    setMaxPrice('');
    onFilterChange({ city: '', availabilityDate: undefined, maxPrice: '' });
  };

  return (
    <div className="p-6 mb-8 bg-card rounded-xl shadow-lg space-y-4 md:space-y-0 md:flex md:gap-4 md:items-end">
      <div className="flex-grow">
        <label htmlFor="city" className="block text-sm font-medium text-foreground mb-1">Ciudad</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="city"
            type="text"
            placeholder="Ej. Madrid, Barcelona..."
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="pl-10"
            suppressHydrationWarning={true}
          />
        </div>
      </div>

      <div>
        <label htmlFor="availabilityDate" className="block text-sm font-medium text-foreground mb-1">Fecha de Entrada</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className="w-full md:w-[280px] justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {availabilityDate ? format(availabilityDate, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={availabilityDate}
              onSelect={setAvailabilityDate}
              initialFocus
              locale={es}
            />
          </PopoverContent>
        </Popover>
      </div>
      
      <div className="flex-grow md:max-w-xs">
        <label htmlFor="maxPrice" className="block text-sm font-medium text-foreground mb-1">Presupuesto Máx. (€/mes)</label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="maxPrice"
            type="number"
            placeholder="Ej. 500"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="pl-10"
            suppressHydrationWarning={true}
          />
        </div>
      </div>

      <div className="flex gap-2 pt-5">
        <Button onClick={handleApplyFilters} className="w-full md:w-auto">
          <Filter className="mr-2 h-4 w-4" /> Aplicar Filtros
        </Button>
        <Button onClick={handleClearFilters} variant="outline" className="w-full md:w-auto">
          Limpiar
        </Button>
      </div>
    </div>
  );
}
