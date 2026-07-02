-- ============================================================
-- OVER IT LAB — Script de creación de base de datos
-- Ejecutar en Supabase: Panel > SQL Editor > New query > pegar y RUN
-- ============================================================

-- 1) Tabla principal de servicios
create table if not exists servicios (
  id                 bigint generated always as identity primary key,
  numero_servicio    text not null,
  nombre_cliente     text not null,
  celular            text not null,
  direccion          text,
  maps_url           text,
  fecha_deposito     date,
  fecha_entrega      date,
  estado             text not null default 'En local'
                       check (estado in ('En local', 'En taller', 'Listo para entregar', 'Entregado')),
  precio_total       numeric(10,2) not null default 0,
  sena               numeric(10,2) not null default 0,
  saldo_pendiente    numeric(10,2) generated always as (precio_total - sena) stored,
  detalles_calzado   text,
  foto_antes         text,
  foto_despues       text,
  created_at         timestamptz not null default now()
);

-- 2) Índices para que la búsqueda y los filtros sean rápidos
create index if not exists idx_servicios_estado on servicios (estado);
create index if not exists idx_servicios_cliente on servicios (nombre_cliente);

-- 3) Seguridad: habilitar RLS (Row Level Security)
alter table servicios enable row level security;

-- 4) Política de acceso: solo usuarios logueados (con cuenta creada en
--    Authentication) pueden leer y escribir. Así el panel queda protegido
--    con usuario y contraseña en vez de quedar abierto a cualquiera con el link.
create policy "Solo usuarios logueados"
  on servicios
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- 5) Datos de ejemplo (opcional, podés borrar este bloque si no los querés)
insert into servicios
  (numero_servicio, nombre_cliente, celular, direccion, fecha_deposito, fecha_entrega, estado, precio_total, sena, detalles_calzado)
values
  ('#001', 'Marcos Farfán', '3884521230', 'Av. Bolivia 1450, San Salvador de Jujuy', '2026-06-25', '2026-06-28', 'Listo para entregar', 6000, 3000, 'Nike Air Force 1 blancas — lavado profundo + blanqueo de suela'),
  ('#002', 'Ailén Quispe', '3885671234', 'Belgrano 320, San Salvador de Jujuy', '2026-06-26', '2026-06-29', 'En taller', 6000, 0, 'Adidas Superstar — lavado estándar');

-- ============================================================
-- 6) Storage: bucket público para las fotos de antes/después
--    (esto crea el "cajón" donde se guardan las imágenes que
--    subís desde la cámara del celular)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('fotos', 'fotos', true)
on conflict (id) do nothing;

-- Solo usuarios logueados pueden subir/editar/borrar fotos
create policy "Usuarios logueados pueden subir fotos"
  on storage.objects for insert
  with check (bucket_id = 'fotos' and auth.role() = 'authenticated');

create policy "Usuarios logueados pueden actualizar fotos"
  on storage.objects for update
  using (bucket_id = 'fotos' and auth.role() = 'authenticated');

create policy "Usuarios logueados pueden borrar fotos"
  on storage.objects for delete
  using (bucket_id = 'fotos' and auth.role() = 'authenticated');

-- Cualquiera con el link de una foto puede verla (para poder mostrarla en el panel)
create policy "Fotos visibles públicamente"
  on storage.objects for select
  using (bucket_id = 'fotos');
