export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type MetodoPago = 'transferencia' | 'paypal';
export type EstadoPago = 'pendiente_verificacion' | 'completado' | 'rechazado' | 'pagado';

export interface CuentaBancaria {
  id: string;
  banco: string;
  numero_cuenta: string;
  titular: string;
  tipo_cuenta?: string | null;
  rtn?: string | null;
  activo: boolean;
  creado_en?: string | null;
}

export interface Producto {
  id: string;
  titulo: string;
  precio: number;
  imagen_preview_url: string;
  diseno_mockup_url?: string | null;
  diseno_corte_url?: string | null;
  logo_url?: string | null;
  categoria?: string | null;
  archivo_r2_key?: string | null;
  descripcion?: string | null;
  dpi?: number | string | null;
  formato?: string | null;
  creado_en?: string | null;
  [extra: string]: unknown;
}

export type OrdenEstado = EstadoPago | 'pendiente' | 'entregado';

export interface Orden {
  id: string;
  producto_id: string;
  email: string;
  nombre?: string | null;
  monto: number;
  estado: OrdenEstado | string;
  transaccion_id?: string | null;
  metodo_pago?: MetodoPago | string | null;
  comprobante_url?: string | null;
  cuenta_bancaria_id?: string | null;
  created_at?: string;
}
