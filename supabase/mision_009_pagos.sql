-- Misión 009: pagos híbridos (transferencia + PayPal)

create table if not exists public.cuentas_bancarias (
  id uuid primary key default gen_random_uuid(),
  banco text not null,
  numero_cuenta text not null,
  titular text not null,
  tipo_cuenta text,
  rtn text,
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

alter table public.cuentas_bancarias enable row level security;

alter table public.ordenes add column if not exists metodo_pago text;
alter table public.ordenes add column if not exists comprobante_url text;
alter table public.ordenes add column if not exists cuenta_bancaria_id uuid references public.cuentas_bancarias(id);
alter table public.ordenes add column if not exists cliente_nombre text;

comment on column public.ordenes.metodo_pago is 'transferencia | paypal';
comment on column public.ordenes.estado_pago is 'pendiente_verificacion | completado | rechazado | pagado';
comment on column public.ordenes.comprobante_url is 'Ruta en Storage archivos-privados (comprobantes/...)';
