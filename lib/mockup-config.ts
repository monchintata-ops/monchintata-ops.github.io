export interface MockupArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MockupTemplate {
  id: string;
  label: string;
  baseImage: string;
  printArea: MockupArea;
}

export const MOCKUP_TEMPLATES: Record<string, MockupTemplate> = {
  camisa: {
    id: 'camisa',
    label: 'Camisa',
    baseImage: '/mockups/camisa-base.png',
    printArea: { x: 150, y: 120, width: 200, height: 250 },
  },
  gorra: {
    id: 'gorra',
    label: 'Gorra',
    baseImage: '/mockups/gorra-base.png',
    printArea: { x: 180, y: 140, width: 100, height: 60 },
  },
  taza: {
    id: 'taza',
    label: 'Taza',
    baseImage: '/mockups/taza-base.png',
    printArea: { x: 120, y: 100, width: 140, height: 140 },
  },
  termo: {
    id: 'termo',
    label: 'Termo',
    baseImage: '/mockups/termo-base.png',
    printArea: { x: 140, y: 110, width: 120, height: 220 },
  },
};