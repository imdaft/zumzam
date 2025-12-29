'use client'

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MapPin } from "lucide-react"
import { CITIES, useCity } from "@/components/providers/city-provider"

export function CitySelector() {
  const { currentCity, setCity } = useCity()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="flex items-center gap-2 h-10 px-4 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors font-medium"
        >
          <MapPin className="w-4 h-4 text-slate-500" />
          <span className="text-slate-700">{currentCity.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[200px] rounded-[24px] p-2">
        {CITIES.map((city) => (
          <DropdownMenuItem
            key={city.id}
            onClick={() => setCity(city)}
            className={`
              rounded-[8px] cursor-pointer px-3 py-2.5
              ${currentCity.id === city.id ? 'bg-slate-100 font-medium' : ''}
            `}
          >
            {city.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
