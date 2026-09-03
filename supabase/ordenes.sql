-- Alineado al esquema real de ordenes (usuario_email, estado_pago, creado_en)

alter table public.ordenes enable row level security;
