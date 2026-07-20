'use client'

import * as React from 'react'
import { Check, ChevronDown } from 'lucide-react'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { COUNTRIES, type Country } from '@/lib/data/countries'
import { cn } from '@/lib/utils'

interface CountryCodePickerProps {
  value: Country
  onChange: (country: Country) => void
  /** Shows a subtle pulse while geo-detection is in flight. */
  detecting?: boolean
}

export function CountryCodePicker({ value, onChange, detecting }: CountryCodePickerProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="اختيار رمز الدولة"
          className={cn(
            'flex shrink-0 items-center gap-1 rounded-lg bg-background px-2 py-1.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted',
            detecting && 'animate-pulse',
          )}
        >
          <span className="text-base leading-none" aria-hidden>
            {value.flag}
          </span>
          <span dir="ltr" className="text-muted-foreground">
            +{value.dial}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-0 font-arabic" dir="rtl">
        <Command
          filter={(itemValue, search) => {
            // itemValue is the searchable string we set on each item.
            return itemValue.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
          }}
        >
          <CommandInput placeholder="ابحث عن دولة..." className="text-sm" />
          <CommandList>
            <CommandEmpty>ما في دولة بالاسم ده</CommandEmpty>
            <CommandGroup>
              {COUNTRIES.map((country) => (
                <CommandItem
                  key={country.iso2}
                  value={`${country.nameAr} ${country.nameEn} ${country.dial} ${country.iso2}`}
                  onSelect={() => {
                    onChange(country)
                    setOpen(false)
                  }}
                  className="flex items-center gap-2"
                >
                  <span className="text-base leading-none" aria-hidden>
                    {country.flag}
                  </span>
                  <span className="flex-1 truncate">{country.nameAr}</span>
                  <span dir="ltr" className="text-xs text-muted-foreground">
                    +{country.dial}
                  </span>
                  <Check
                    className={cn(
                      'h-4 w-4 text-primary',
                      value.iso2 === country.iso2 ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
