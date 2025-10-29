// Inventory types and enums

export enum InventoryType {
  ENTRY = 'ENTRY', // État des lieux d'entrée
  EXIT = 'EXIT',   // État des lieux de sortie
}

export enum ItemType {
  ROOM = 'ROOM',  // Pièce (avec aspects standards)
  ITEM = 'ITEM',  // Autre élément (balcon, meuble, etc.)
}

export enum RoomAspect {
  FLOOR = 'FLOOR',           // Sol
  WALLS = 'WALLS',           // Murs
  CEILING = 'CEILING',       // Plafond
  WINDOWS = 'WINDOWS',       // Fenêtres
  DOORS = 'DOORS',           // Portes
  ELECTRICITY = 'ELECTRICITY', // Électricité
  WATER = 'WATER',           // Eau/plomberie
  GENERAL = 'GENERAL',       // État général (pour items non-room)
}

export enum Condition {
  TB = 'TB', // Très bon état
  B = 'B',   // Bon état
  M = 'M',   // Mauvais état
  TM = 'TM', // Très mauvais état
}

export const CONDITION_LABELS: Record<Condition, string> = {
  [Condition.TB]: 'Très bon état',
  [Condition.B]: 'Bon état',
  [Condition.M]: 'Mauvais état',
  [Condition.TM]: 'Très mauvais état',
};

export const ROOM_ASPECT_LABELS: Record<RoomAspect, string> = {
  [RoomAspect.FLOOR]: 'Sol',
  [RoomAspect.WALLS]: 'Murs',
  [RoomAspect.CEILING]: 'Plafond',
  [RoomAspect.WINDOWS]: 'Fenêtres',
  [RoomAspect.DOORS]: 'Portes',
  [RoomAspect.ELECTRICITY]: 'Électricité',
  [RoomAspect.WATER]: 'Eau/Plomberie',
  [RoomAspect.GENERAL]: 'État général',
};

// Standard aspects for a room
export const STANDARD_ROOM_ASPECTS = [
  RoomAspect.FLOOR,
  RoomAspect.WALLS,
  RoomAspect.CEILING,
  RoomAspect.WINDOWS,
  RoomAspect.DOORS,
  RoomAspect.ELECTRICITY,
  RoomAspect.WATER,
];
