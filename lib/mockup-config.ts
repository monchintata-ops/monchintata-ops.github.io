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
  isCylindrical?: boolean;
  curvature?: number;
}

export const MOCKUP_TEMPLATES: Record<string, MockupTemplate> = {
  'camisa-negra': {
    id: 'camisa-negra',
    label: 'Camisa Negra',
    baseImage: '/mockups/camisa-negra.png',
    printArea: { x: 1165, y: 707, width: 999, height: 884 },
  },
  'camisa-blanca': {
    id: 'camisa-blanca',
    label: 'Camisa Blanca',
    baseImage: '/mockups/camisa-blanca.png',
    printArea: { x: 1165, y: 707, width: 999, height: 884 },
  },
  gorra: {
    id: 'gorra',
    label: 'Gorra',
    baseImage: '/mockups/MockupGorraNegra.png',
    printArea: { x: 866, y: 648, width: 1148, height: 595 },
  },
  taza: {
    id: 'taza',
    label: 'Taza',
    baseImage: '/mockups/MockupTazaWhite.png',
    printArea: { x: 820, y: 390, width: 1120, height: 1190 },
    isCylindrical: true,
    curvature: 0.18,
  },
  termo: {
    id: 'termo',
    label: 'Termo',
    baseImage: '/mockups/MockupThermoNegro.png',
    printArea: { x: 225, y: 645, width: 328, height: 338 },
    isCylindrical: true,
    curvature: 0.08,
  },
};