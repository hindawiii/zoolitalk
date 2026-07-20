export interface Country {
  /** ISO 3166-1 alpha-2 code, e.g. "SD" */
  iso2: string
  /** Arabic country name */
  nameAr: string
  /** English country name (used for search) */
  nameEn: string
  /** International dial code without the leading + , e.g. "249" */
  dial: string
  /** Flag emoji */
  flag: string
}

/**
 * Curated list of countries for the phone auth picker.
 * MENA countries are listed first, then the rest alphabetically by English name.
 */
export const COUNTRIES: Country[] = [
  { iso2: 'SD', nameAr: 'السودان', nameEn: 'Sudan', dial: '249', flag: '🇸🇩' },
  { iso2: 'SA', nameAr: 'السعودية', nameEn: 'Saudi Arabia', dial: '966', flag: '🇸🇦' },
  { iso2: 'AE', nameAr: 'الإمارات', nameEn: 'United Arab Emirates', dial: '971', flag: '🇦🇪' },
  { iso2: 'EG', nameAr: 'مصر', nameEn: 'Egypt', dial: '20', flag: '🇪🇬' },
  { iso2: 'QA', nameAr: 'قطر', nameEn: 'Qatar', dial: '974', flag: '🇶🇦' },
  { iso2: 'KW', nameAr: 'الكويت', nameEn: 'Kuwait', dial: '965', flag: '🇰🇼' },
  { iso2: 'BH', nameAr: 'البحرين', nameEn: 'Bahrain', dial: '973', flag: '🇧🇭' },
  { iso2: 'OM', nameAr: 'عُمان', nameEn: 'Oman', dial: '968', flag: '🇴🇲' },
  { iso2: 'JO', nameAr: 'الأردن', nameEn: 'Jordan', dial: '962', flag: '🇯🇴' },
  { iso2: 'LB', nameAr: 'لبنان', nameEn: 'Lebanon', dial: '961', flag: '🇱🇧' },
  { iso2: 'SY', nameAr: 'سوريا', nameEn: 'Syria', dial: '963', flag: '🇸🇾' },
  { iso2: 'IQ', nameAr: 'العراق', nameEn: 'Iraq', dial: '964', flag: '🇮🇶' },
  { iso2: 'YE', nameAr: 'اليمن', nameEn: 'Yemen', dial: '967', flag: '🇾🇪' },
  { iso2: 'PS', nameAr: 'فلسطين', nameEn: 'Palestine', dial: '970', flag: '🇵🇸' },
  { iso2: 'LY', nameAr: 'ليبيا', nameEn: 'Libya', dial: '218', flag: '🇱🇾' },
  { iso2: 'TN', nameAr: 'تونس', nameEn: 'Tunisia', dial: '216', flag: '🇹🇳' },
  { iso2: 'DZ', nameAr: 'الجزائر', nameEn: 'Algeria', dial: '213', flag: '🇩🇿' },
  { iso2: 'MA', nameAr: 'المغرب', nameEn: 'Morocco', dial: '212', flag: '🇲🇦' },
  { iso2: 'MR', nameAr: 'موريتانيا', nameEn: 'Mauritania', dial: '222', flag: '🇲🇷' },
  { iso2: 'SO', nameAr: 'الصومال', nameEn: 'Somalia', dial: '252', flag: '🇸🇴' },
  { iso2: 'DJ', nameAr: 'جيبوتي', nameEn: 'Djibouti', dial: '253', flag: '🇩🇯' },
  { iso2: 'KM', nameAr: 'جزر القمر', nameEn: 'Comoros', dial: '269', flag: '🇰🇲' },
  { iso2: 'SS', nameAr: 'جنوب السودان', nameEn: 'South Sudan', dial: '211', flag: '🇸🇸' },
  { iso2: 'TD', nameAr: 'تشاد', nameEn: 'Chad', dial: '235', flag: '🇹🇩' },
  { iso2: 'ET', nameAr: 'إثيوبيا', nameEn: 'Ethiopia', dial: '251', flag: '🇪🇹' },
  { iso2: 'ER', nameAr: 'إريتريا', nameEn: 'Eritrea', dial: '291', flag: '🇪🇷' },
  { iso2: 'KE', nameAr: 'كينيا', nameEn: 'Kenya', dial: '254', flag: '🇰🇪' },
  { iso2: 'UG', nameAr: 'أوغندا', nameEn: 'Uganda', dial: '256', flag: '🇺🇬' },
  { iso2: 'NG', nameAr: 'نيجيريا', nameEn: 'Nigeria', dial: '234', flag: '🇳🇬' },
  { iso2: 'US', nameAr: 'الولايات المتحدة', nameEn: 'United States', dial: '1', flag: '🇺🇸' },
  { iso2: 'GB', nameAr: 'المملكة المتحدة', nameEn: 'United Kingdom', dial: '44', flag: '🇬🇧' },
  { iso2: 'CA', nameAr: 'كندا', nameEn: 'Canada', dial: '1', flag: '🇨🇦' },
  { iso2: 'FR', nameAr: 'فرنسا', nameEn: 'France', dial: '33', flag: '🇫🇷' },
  { iso2: 'DE', nameAr: 'ألمانيا', nameEn: 'Germany', dial: '49', flag: '🇩🇪' },
  { iso2: 'IT', nameAr: 'إيطاليا', nameEn: 'Italy', dial: '39', flag: '🇮🇹' },
  { iso2: 'ES', nameAr: 'إسبانيا', nameEn: 'Spain', dial: '34', flag: '🇪🇸' },
  { iso2: 'NL', nameAr: 'هولندا', nameEn: 'Netherlands', dial: '31', flag: '🇳🇱' },
  { iso2: 'SE', nameAr: 'السويد', nameEn: 'Sweden', dial: '46', flag: '🇸🇪' },
  { iso2: 'NO', nameAr: 'النرويج', nameEn: 'Norway', dial: '47', flag: '🇳🇴' },
  { iso2: 'TR', nameAr: 'تركيا', nameEn: 'Turkey', dial: '90', flag: '🇹🇷' },
  { iso2: 'IN', nameAr: 'الهند', nameEn: 'India', dial: '91', flag: '🇮🇳' },
  { iso2: 'PK', nameAr: 'باكستان', nameEn: 'Pakistan', dial: '92', flag: '🇵🇰' },
  { iso2: 'ID', nameAr: 'إندونيسيا', nameEn: 'Indonesia', dial: '62', flag: '🇮🇩' },
  { iso2: 'MY', nameAr: 'ماليزيا', nameEn: 'Malaysia', dial: '60', flag: '🇲🇾' },
  { iso2: 'AU', nameAr: 'أستراليا', nameEn: 'Australia', dial: '61', flag: '🇦🇺' },
  { iso2: 'ZA', nameAr: 'جنوب أفريقيا', nameEn: 'South Africa', dial: '27', flag: '🇿🇦' },
  { iso2: 'CN', nameAr: 'الصين', nameEn: 'China', dial: '86', flag: '🇨🇳' },
]

export const DEFAULT_COUNTRY: Country =
  COUNTRIES.find((c) => c.iso2 === 'SD') ?? COUNTRIES[0]

export function findCountryByIso(iso2: string | null | undefined): Country | undefined {
  if (!iso2) return undefined
  const upper = iso2.toUpperCase()
  return COUNTRIES.find((c) => c.iso2 === upper)
}
