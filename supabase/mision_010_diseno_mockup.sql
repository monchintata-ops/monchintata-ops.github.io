-- Asset aislado de baja resolución para el generador de mockups.
alter table public.productos
  add column if not exists diseno_mockup_url text;
