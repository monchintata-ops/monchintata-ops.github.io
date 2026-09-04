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
  'camisa-negra': {
    id: 'camisa-negra',
    label: 'Camisa Negra',
    baseImage: '/mockups/camisa-negra.png',
    printArea: { x: 1000, y: 850, width: 1330, height: 1415 },
  },
  'camisa-blanca': {
    id: 'camisa-blanca',
    label: 'Camisa Blanca',
    baseImage: '/mockups/camisa-blanca.png',
    printArea: { x: 1000, y: 850, width: 1330, height: 1415 },
  },
  gorra: {
    id: 'gorra',
    label: 'Gorra',
    baseImage: '/mockups/MockupGorraNegra.png',
    printArea: { x: 620, y: 520, width: 1640, height: 850 },
  },
  taza: {
    id: 'taza',
    label: 'Taza',
    baseImage: '/mockups/MockupTazaWhite.png',
    printArea: { x: 820, y: 390, width: 1120, height: 1190 },
  },
  termo: {
    id: 'termo',
    label: 'Termo',
    baseImage: '/mockups/MockupThermoNegro.png',
    printArea: { x: 235, y: 405, width: 555, height: 850 },
  },
};