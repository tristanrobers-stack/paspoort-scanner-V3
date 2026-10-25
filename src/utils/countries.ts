export interface Country {
  code: string; // ISO 3166-1 alpha-3
  nameEn: string;
  nameNl: string;
  nameEs: string;
  flag: string;
}

export const COUNTRIES: Country[] = [
  { code: 'NLD', nameEn: 'Netherlands', nameNl: 'Nederland', nameEs: 'Países Bajos', flag: '🇳🇱' },
  { code: 'BEL', nameEn: 'Belgium', nameNl: 'België', nameEs: 'Bélgica', flag: '🇧🇪' },
  { code: 'DEU', nameEn: 'Germany', nameNl: 'Duitsland', nameEs: 'Alemania', flag: '🇩🇪' },
  { code: 'GBR', nameEn: 'United Kingdom', nameNl: 'Verenigd Koninkrijk', nameEs: 'Reino Unido', flag: '🇬🇧' },
  { code: 'ESP', nameEn: 'Spain', nameNl: 'Spanje', nameEs: 'España', flag: '🇪🇸' },
  { code: 'FRA', nameEn: 'France', nameNl: 'Frankrijk', nameEs: 'Francia', flag: '🇫🇷' },
  { code: 'ITA', nameEn: 'Italy', nameNl: 'Italië', nameEs: 'Italia', flag: '🇮🇹' },
  { code: 'USA', nameEn: 'United States', nameNl: 'Verenigde Staten', nameEs: 'Estados Unidos', flag: '🇺🇸' },
  { code: 'IRL', nameEn: 'Ireland', nameNl: 'Ierland', nameEs: 'Irlanda', flag: '🇮🇪' },
  { code: 'POL', nameEn: 'Poland', nameNl: 'Polen', nameEs: 'Polonia', flag: '🇵🇱' },
  { code: 'CHE', nameEn: 'Switzerland', nameNl: 'Zwitserland', nameEs: 'Suiza', flag: '🇨🇭' },
  { code: 'AUT', nameEn: 'Austria', nameNl: 'Oostenrijk', nameEs: 'Austria', flag: '🇦🇹' },
  { code: 'PRT', nameEn: 'Portugal', nameNl: 'Portugal', nameEs: 'Portugal', flag: '🇵🇹' },
  { code: 'DNK', nameEn: 'Denmark', nameNl: 'Denemarken', nameEs: 'Dinamarca', flag: '🇩🇰' },
  { code: 'SWE', nameEn: 'Sweden', nameNl: 'Zweden', nameEs: 'Suecia', flag: '🇸🇪' },
  { code: 'NOR', nameEn: 'Norway', nameNl: 'Noorwegen', nameEs: 'Noruega', flag: '🇳🇴' },
  { code: 'FIN', nameEn: 'Finland', nameNl: 'Finland', nameEs: 'Finlandia', flag: '🇫🇮' },
  { code: 'CZE', nameEn: 'Czech Republic', nameNl: 'Tsjechië', nameEs: 'República Checa', flag: '🇨🇿' },
  { code: 'CAN', nameEn: 'Canada', nameNl: 'Canada', nameEs: 'Canadá', flag: '🇨🇦' },
  { code: 'AUS', nameEn: 'Australia', nameNl: 'Australië', nameEs: 'Australia', flag: '🇦🇺' },
  { code: 'ROU', nameEn: 'Romania', nameNl: 'Roemenië', nameEs: 'Rumania', flag: '🇷🇴' },
  { code: 'MAR', nameEn: 'Morocco', nameNl: 'Marokko', nameEs: 'Marruecos', flag: '🇲🇦' },
  { code: 'UKR', nameEn: 'Ukraine', nameNl: 'Oekraïne', nameEs: 'Ucrania', flag: '🇺🇦' },
  { code: 'COL', nameEn: 'Colombia', nameNl: 'Colombia', nameEs: 'Colombia', flag: '🇨🇴' },
  { code: 'ARG', nameEn: 'Argentina', nameNl: 'Argentinië', nameEs: 'Argentina', flag: '🇦🇷' },
];

export function getCountryByCode(code: string): Country | undefined {
  if (!code) return undefined;
  const upper = code.trim().toUpperCase();
  return COUNTRIES.find((c) => c.code === upper);
}
