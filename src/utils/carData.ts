// Популярные марки и модели (подмножество, совместимое с carsBase/cars.json)
export const CAR_MAKES: Record<string, string[]> = {
  'Audi': ['A1', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Q3', 'Q5', 'Q7', 'Q8', 'TT'],
  'BMW': ['1 серия', '2 серия', '3 серия', '4 серия', '5 серия', '6 серия', '7 серия', 'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7'],
  'Chevrolet': ['Aveo', 'Captiva', 'Cobalt', 'Cruze', 'Equinox', 'Lacetti', 'Malibu', 'Niva', 'Orlando', 'Tahoe', 'Trailblazer'],
  'Ford': ['EcoSport', 'Edge', 'Escape', 'Explorer', 'F-150', 'Focus', 'Fusion', 'Kuga', 'Mondeo', 'Mustang', 'Puma', 'Transit'],
  'Hyundai': ['Accent', 'Creta', 'Elantra', 'Getz', 'i20', 'i30', 'i40', 'ix35', 'Solaris', 'Sonata', 'Tucson'],
  'Kia': ['Ceed', 'Cerato', 'K5', 'Mohave', 'Optima', 'Picanto', 'Rio', 'Sorento', 'Sportage', 'Stinger', 'Telluride'],
  'Lada': ['2107', 'Granta', 'Largus', 'Niva Travel', 'Priora', 'Vesta', 'XRAY'],
  'Land Rover': ['Defender', 'Discovery', 'Discovery Sport', 'Freelander', 'Range Rover', 'Range Rover Evoque', 'Range Rover Sport'],
  'Mazda': ['2', '3', '6', 'CX-3', 'CX-5', 'CX-7', 'CX-9', 'MX-5'],
  'Mercedes-Benz': ['A-класс', 'B-класс', 'C-класс', 'E-класс', 'G-класс', 'GLA', 'GLC', 'GLE', 'GLS', 'S-класс'],
  'Mitsubishi': ['ASX', 'Eclipse Cross', 'Galant', 'L200', 'Lancer', 'Outlander', 'Pajero', 'Pajero Sport'],
  'Nissan': ['Almera', 'Juke', 'Murano', 'Pathfinder', 'Patrol', 'Qashqai', 'Sentra', 'Teana', 'Terrano', 'X-Trail'],
  'Opel': ['Astra', 'Corsa', 'Crossland', 'Grandland', 'Insignia', 'Mokka', 'Vectra', 'Zafira'],
  'Peugeot': ['2008', '206', '207', '208', '301', '3008', '308', '408', '508', '5008'],
  'Renault': ['Arkana', 'Captur', 'Clio', 'Duster', 'Fluence', 'Kaptur', 'Koleos', 'Laguna', 'Logan', 'Megane', 'Sandero', 'Symbol'],
  'Skoda': ['Fabia', 'Karoq', 'Kodiaq', 'Octavia', 'Rapid', 'Superb', 'Yeti'],
  'Subaru': ['Forester', 'Impreza', 'Legacy', 'Outback', 'XV'],
  'Suzuki': ['Baleno', 'Grand Vitara', 'Jimny', 'Swift', 'Vitara', 'SX4'],
  'Toyota': ['Auris', 'Avensis', 'Camry', 'Corolla', 'Fortuner', 'Hilux', 'Land Cruiser', 'Land Cruiser Prado', 'RAV4', 'Rush', 'Yaris'],
  'Volkswagen': ['Golf', 'Jetta', 'Passat', 'Polo', 'Taos', 'Tiguan', 'Touareg', 'Touran', 'Transporter'],
  'Volvo': ['S60', 'S90', 'V40', 'V60', 'V90', 'XC40', 'XC60', 'XC90'],
  'Geely': ['Atlas', 'Coolray', 'Emgrand', 'Monjaro', 'Tugella'],
  'Haval': ['Dargo', 'F7', 'F7x', 'Jolion', 'H6', 'H9'],
  'Chery': ['Arrizo', 'Tiggo 4', 'Tiggo 7', 'Tiggo 8'],
};

export const ALL_MAKES = Object.keys(CAR_MAKES).sort();

export function getModels(make: string): string[] {
  return CAR_MAKES[make] ?? [];
}
