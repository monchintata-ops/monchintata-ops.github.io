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
    printArea: { x: 150, y: 120, width: 200, height: 250 },
  },
  'camisa-blanca': {
    id: 'camisa-blanca',
    label: 'Camisa Blanca',
    baseImage: '/mockups/camisa-blanca.png',
    printArea: { x: 150, y: 120, width: 200, height: 250 },
  },
};