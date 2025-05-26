
'use client';

import type { RoomAvailability } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { format, getMonth, getYear, isWithinInterval, parseISO, startOfMonth, endOfMonth, addMonths, isBefore, isEqual } from 'date-fns';
import { es } from 'date-fns/locale';
import { Info } from 'lucide-react';

interface AvailabilityDisplayProps {
  availability: RoomAvailability;
}

const MONTH_NAMES_SHORT = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

// Helper function to check if a specific month is occupied
const isMonthOccupied = (year: number, monthIndex: number, unavailableRanges: Array<[Date, Date]>, firstAvailableDate: Date | null): boolean => {
  const monthDate = new Date(year, monthIndex, 1);
  
  if (firstAvailableDate && (isBefore(monthDate, startOfMonth(firstAvailableDate)) && !isEqual(startOfMonth(monthDate), startOfMonth(firstAvailableDate)))) {
      return true;
  }

  const checkMonthStart = startOfMonth(monthDate);
  const checkMonthEnd = endOfMonth(monthDate);

  for (const [start, end] of unavailableRanges) {
    // Check for overlap: (StartA <= EndB) and (EndA >= StartB)
    if (isBefore(start, checkMonthEnd) && isBefore(checkMonthStart, end)) {
       // More precise check: if the unavailable range fully contains or significantly overlaps the month
       if ( (isBefore(start, checkMonthEnd) || isEqual(start, checkMonthEnd)) && 
            (isBefore(checkMonthStart, end) || isEqual(checkMonthStart, end)) ) {
            
            // If the unavailable range starts after the month starts AND ends before the month ends, it's not fully occupied by THIS range.
            // However, the problem asks for a simple "occupied" or "available" status for the whole month.
            // So, any overlap from an unavailable_dates_range makes the month "occupied".
             return true;
           }
    }
  }
  return false;
};


export default function AvailabilityDisplay({ availability }: AvailabilityDisplayProps) {
  const {
    available_now,
    available_from,
    minimum_stay_months,
    maximum_stay_months,
    unavailable_dates_range,
  } = availability;

  const today = new Date();
  let startYear = available_from ? getYear(parseISO(available_from)) : getYear(today);
  if (available_from && getYear(parseISO(available_from)) < getYear(today) && !available_now) {
    startYear = getYear(today);
  }


  const yearsToDisplay = [startYear, startYear + 1];

  const parsedUnavailableRanges: Array<[Date, Date]> = [];
  if (unavailable_dates_range) {
    Object.values(unavailable_dates_range).forEach(range => {
      if (range && range.length === 2 && range[0] && range[1]) {
        parsedUnavailableRanges.push([parseISO(range[0]), parseISO(range[1])]);
      }
    });
  }
  
  const firstOverallAvailableDate = available_from ? parseISO(available_from) : (available_now ? today : null) ;


  return (
    <Card className="shadow-lg rounded-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold text-primary">Disponibilidad</CardTitle>
      </CardHeader>
      <CardContent className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4 text-sm">
          <div>
            <p className="font-medium text-gray-600">Disponible desde</p>
            <p className="text-gray-800">
              {available_now
                ? <span className="font-semibold text-green-600">¡Disponible Ahora!</span>
                : available_from
                ? format(parseISO(available_from), 'dd LLLL yyyy', { locale: es })
                : 'Consultar'}
            </p>
          </div>
          <Separator />
          <div>
            <p className="font-medium text-gray-600">Estancia Mínima</p>
            <p className="text-gray-800">
              {minimum_stay_months ? `${minimum_stay_months} mes(es)` : 'No especificada'}
            </p>
          </div>
          <Separator />
          <div>
            <p className="font-medium text-gray-600">Estancia Máxima</p>
            <p className="text-gray-800">
              {maximum_stay_months ? `${maximum_stay_months} mes(es)` : 'Sin estancia máxima'}
            </p>
          </div>
          <Separator />
          <div>
            <p className="font-medium text-gray-600">Calendario Actualizado</p>
            <p className="text-gray-800 italic">(Calendario actualizado hace aprox. 8 horas)</p>
          </div>
        </div>

        <div className="md:col-span-2 space-y-4">
          {yearsToDisplay.map(year => (
            <div key={year}>
              <h4 className="text-lg font-semibold mb-2 text-center text-gray-700">{year}</h4>
              <div className="grid grid-cols-6 gap-1">
                {MONTH_NAMES_SHORT.map((monthName, monthIndex) => {
                  const occupied = isMonthOccupied(year, monthIndex, parsedUnavailableRanges, firstOverallAvailableDate);
                  return (
                    <div
                      key={`${year}-${monthIndex}`}
                      className={`p-2 text-xs font-medium rounded text-center
                        ${occupied 
                          ? 'bg-red-100 text-red-700 border border-red-200' 
                          : 'bg-green-100 text-green-700 border border-green-200'
                        }`}
                    >
                      {monthName}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          <div className="mt-4 flex items-center space-x-4 text-xs">
            <div className="flex items-center">
              <span className="w-3 h-3 rounded-sm bg-green-100 border border-green-200 mr-1.5"></span> Disponible
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 rounded-sm bg-red-100 border border-red-200 mr-1.5"></span> Ocupado
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
