-- Catálogo público + producto de prueba
-- Ejecutar en Supabase → SQL Editor

alter table public.productos enable row level security;

drop policy if exists "catalogo_publico_select" on public.productos;
create policy "catalogo_publico_select"
on public.productos
for select
to anon, authenticated
using (true);

insert into public.productos (
  titulo,
  descripcion,
  precio,
  imagen_preview_url,
  archivo_r2_key,
  categoria
)
select
  '01 Local Dtf DC Shoes dorado',
  'Diseño imprimible de prueba para DTF / UV-DTF.',
  2.50,
  '/placeholder_preview.svg',
  'disenos/01_dc_shoes_dorado.png',
  'Marcas & Logos'
where not exists (
  select 1
  from public.productos
  where titulo = '01 Local Dtf DC Shoes dorado'
);
