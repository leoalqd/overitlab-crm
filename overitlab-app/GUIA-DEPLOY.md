# OVER IT LAB — Guía completa: de cero a funcionando en tu celular

Antes de arrancar, una aclaración importante: yo no puedo crear cuentas por vos en sitios externos (Supabase, GitHub, Vercel) — esas cuentas quedan a tu nombre y con tu contraseña, y necesitan que las crees vos mismo con un par de clics. Lo que sí hice fue dejar **todo el código ya preparado** para que la cuenta de administrador `leoalqd` con la contraseña que me pasaste (`N04lp3l4d0`) funcione apenas la crees en el panel — son 2 minutos, te digo exactamente dónde tocar.

En total son 4 partes. Con conexión a internet, esto se hace en 20-30 minutos.

---

## PARTE 1 — Crear la base de datos (Supabase)

1. Entrá a **[supabase.com](https://supabase.com)** → botón **"Start your project"** → creá tu cuenta (con Google o email).
2. **"New project"**:
   - Nombre: `overitlab`
   - Contraseña de la base de datos: generá una y **guardala** (es distinta a la del panel, es solo técnica).
   - Región: `South America (São Paulo)`.
3. Esperá 1-2 minutos a que se cree.
4. Menú lateral → **SQL Editor** → **New query**.
5. Abrí el archivo `supabase-schema.sql` (incluido en la carpeta), copiá todo, pegalo y tocá **RUN**.
   - Esto crea la tabla de servicios, protege el acceso solo a usuarios logueados, y crea el "cajón" (`fotos`) donde se van a guardar las imágenes que subas desde el celular.
6. Menú lateral → **Settings** (engranaje) → **API**. Copiá y guardá:
   - **Project URL**
   - **anon public key**

---

## PARTE 2 — Crear tu usuario administrador (leoalqd)

Acá creás el login con el que vas a entrar vos al panel todos los días.

1. Menú lateral → **Authentication** → **Users**.
2. Botón **"Add user"** → **"Create new user"**.
3. Completá:
   - **Email:** `leoalqd@overitlab.com`
   - **Password:** `N04lp3l4d0`
   - Marcá **"Auto Confirm User"** (importante, si no lo tildás no te va a dejar entrar).
4. Click en **Create user**.

Listo — ese es tu usuario administrador. En la pantalla de login de la app vas a escribir `leoalqd` (o el email completo) y esa contraseña.

> 💡 Si más adelante querés cambiar la contraseña o agregar otro usuario (por ejemplo para un empleado), es el mismo camino: Authentication → Users → Add user.

---

## PARTE 3 — Conectar y probar la app en tu computadora

1. Descomprimí la carpeta `overitlab-app`.
2. Descomprimí la carpeta `overitlab-app`.
3. Dentro de la carpeta vas a ver un archivo llamado **`env-example.txt`**. Abrilo con el Bloc de notas (o cualquier editor de texto), reemplazá las dos líneas con los datos de la Parte 1, y guardalo **con el nombre exacto `.env`** (sin `.txt`, empieza con un punto):
   ```
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-clave-publica-anon
   ```
   - En Windows: "Guardar como" → Tipo: "Todos los archivos" → nombre `".env"` (con comillas).
   - En Mac: el Finder puede pedir confirmación para usar un nombre que empieza con punto — confirmá que sí.
   - Después de guardarlo el archivo puede "desaparecer" de la vista porque los nombres con punto quedan ocultos por el sistema — es normal, está ahí igual.
3. Instalá [Node.js](https://nodejs.org) si no lo tenés (versión 18+).
4. Abrí una terminal en la carpeta del proyecto:
   ```
   npm install
   npm run dev
   ```
5. Entrá a `http://localhost:5173`, te va a pedir usuario y contraseña — usá `leoalqd` / `N04lp3l4d0`.
6. Probá crear un servicio y subir una foto tocando el recuadro "ANTES" (en la compu te va a abrir el explorador de archivos; en el celular te va a abrir directo la cámara).

---

## PARTE 4 — Publicar la app gratis (para usarla desde el celular)

1. Subí la carpeta a GitHub:
   - Creá cuenta en [github.com](https://github.com).
   - Creá un repositorio nuevo, por ejemplo `overitlab-crm`, y subí todos los archivos (se puede arrastrar y soltar directo desde la web de GitHub, sin usar comandos).
2. Entrá a **[vercel.com](https://vercel.com)** → creá cuenta con tu usuario de GitHub.
3. **"Add New" → "Project"** → elegí `overitlab-crm`.
4. Antes de tocar Deploy, abrí **"Environment Variables"** y cargá las mismas dos variables del `.env`.
5. Click en **Deploy**. En un minuto te da un link fijo, por ejemplo `overitlab-crm.vercel.app`.

### Usarla como una app en el celular

1. Abrí ese link en Chrome (Android) o Safari (iPhone) desde tu celular.
2. Iniciá sesión con `leoalqd` / `N04lp3l4d0`.
3. Tocá el menú del navegador → **"Agregar a pantalla de inicio"** (Android) o **"Compartir" → "Agregar a inicio"** (iPhone).
4. Te queda un ícono como una app normal. Al abrirlo, el botón "ANTES"/"DESPUÉS" te abre la cámara directo para sacar la foto y se sube sola a la base de datos.

---

## Cómo funciona la seguridad ahora

- Nadie puede ver ni editar pedidos sin loguearse con `leoalqd` / `N04lp3l4d0`.
- Las fotos se guardan en Supabase Storage (gratis hasta 1GB) y quedan asociadas al pedido automáticamente.
- Podés cambiar la contraseña cuando quieras desde Authentication → Users → click en el usuario → "Reset password", o simplemente decime la nueva y actualizamos la guía.

## Límites del plan gratuito (por si crecés)

- **Supabase free:** 500MB de base de datos, 1GB de storage para fotos, el proyecto se pausa si pasa una semana sin uso (se reactiva solo con la primera visita, tarda unos segundos).
- **Vercel free:** de sobra para el tráfico de un negocio como el tuyo.
- Si en algún momento se queda corto, ambos tienen planes pagos desde unos pocos dólares por mes, pero para arrancar no hace falta.
