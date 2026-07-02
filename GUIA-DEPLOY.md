# OVER IT LAB — Guía completa desde cero

Esta es la guía definitiva, de punta a punta, para dejar tu panel funcionando en internet: con base de datos real, login protegido, y subida de fotos desde la cámara del celular.

**Vas a usar 3 servicios, todos gratuitos:**

| Servicio | Para qué |
|---|---|
| **Supabase** | Base de datos + login de administrador + fotos |
| **GitHub** | Guardar el código del proyecto |
| **Vercel** | Publicar la app con un link público |

Tiempo estimado: 30-40 minutos. Instrucciones pensadas para **Mac**.

---

## PASO 1 — Crear la base de datos en Supabase

1. Entrá a **[supabase.com](https://supabase.com)** → **"Start your project"** → creá tu cuenta (con Google o email).
2. Click en **"New project"** y completá:
   - Nombre: `overitlab`
   - Contraseña de la base de datos: generá una y guardala en un lugar seguro (es técnica, distinta a la que usás para entrar al panel).
   - Región: `South America (São Paulo)`
3. Esperá 1-2 minutos a que el proyecto termine de crearse.
4. Menú lateral → **SQL Editor** → **New query**.
5. Abrí el archivo `supabase-schema.sql` (está en la carpeta del proyecto), copiá **todo** su contenido, pegalo en el editor y tocá **RUN**.
   - Esto crea la tabla `servicios`, la protege para que solo usuarios logueados puedan leer/escribir, y crea el espacio de almacenamiento (`fotos`) para las imágenes.
6. **Importante — habilitar la API de la tabla:** menú lateral → **Database** → **Policies**. Buscá la tabla `servicios`: si aparece con la etiqueta **"API DISABLED"**, entrá a **Table Editor → servicios** y activá la opción para exponerla vía API (o andá a **Settings → API → Exposed schemas** y confirmá que `public` esté incluido). Sin este paso, la app se conecta pero no puede leer los pedidos.
7. Menú lateral → **Settings** (engranaje) → **API**. Copiá y guardá estos dos datos, los usás en el Paso 3:
   - **Project URL**
   - **anon public key**

---

## PASO 2 — Crear tu usuario administrador

1. Menú lateral → **Authentication** → **Users**.
2. Botón **"Add user"** → **"Create new user"**.
3. Completá:
   - **Email:** `leoalqd@overitlab.com`
   - **Password:** `N04lp3l4d0`
   - Tildá **"Auto Confirm User"** (sin esto no vas a poder entrar).
4. Click en **Create user**.

Con esto ya podés loguearte en el panel usando `leoalqd` / `N04lp3l4d0`.

---

## PASO 3 — Variables de conexión ✅ ya están cargadas

Buenas noticias: el archivo `.env` de este zip **ya viene completado** con tus credenciales reales de Supabase (`https://xgulgszwmbyescdothaw.supabase.co`), así que no tenés que tocar nada acá. Descomprimí la carpeta `overitlab-app` y pasá directo al Paso 4.

> Nota técnica: como el archivo empieza con un punto (`.env`), macOS lo oculta en el Finder — es normal, está ahí igual. Para verlo, el atajo es **Cmd + Shift + Punto (.)** dentro de la carpeta.

Si en algún momento cambiás de proyecto de Supabase o necesitás volver a generar este archivo a mano, el método es:
1. Abrí **`env-example.txt`** con TextEdit, reemplazá las dos líneas con tus datos (Supabase → Settings → API).
2. Guardalo y renombralo a `.env` desde Terminal: `mv env-example.txt .env`.

---

## PASO 4 — Probar la app en tu computadora (recomendado antes de publicar)

1. Instalá [Node.js](https://nodejs.org) si no lo tenés (versión 18+, hay instalador para Mac).
2. En la misma Terminal, parado en la carpeta del proyecto:
   ```
   npm install
   npm run dev
   ```
3. Entrá a `http://localhost:5173`, logueate con `leoalqd` / `N04lp3l4d0` y confirmá que veas los pedidos de ejemplo. Probá crear uno nuevo.

---

## PASO 5 — Subir el código a GitHub

1. Creá una cuenta gratis en **[github.com](https://github.com)** si no tenés.
2. Creá un repositorio nuevo, por ejemplo `overitlab-crm` (puede ser privado).
3. Subí **el contenido** de la carpeta `overitlab-app` (los archivos sueltos: `package.json`, `index.html`, `src/`, etc.), **no la carpeta contenedora**. Es decir, `package.json` tiene que quedar visible directo en la raíz del repositorio, no dentro de una subcarpeta.
   - Se puede arrastrar y soltar directo desde la web de GitHub, sin usar comandos.
   - **No subas el archivo `.env`** con tus claves reales (ya está configurado para que GitHub lo ignore automáticamente vía `.gitignore`).

---

## PASO 6 — Publicar en Vercel

1. Entrá a **[vercel.com](https://vercel.com)** → creá cuenta usando tu usuario de GitHub.
2. **"Add New"** → **"Project"** → elegí el repositorio `overitlab-crm`.
3. Antes de tocar **Deploy**, abrí **"Environment Variables"** y cargá las mismas dos variables del Paso 3 (las tenés también listas para copiar y pegar en el archivo `CREDENCIALES-VERCEL.txt`):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Click en **Deploy**. En 1-2 minutos te da un link fijo, por ejemplo:
   `https://overitlab-crm.vercel.app`

---

## PASO 7 — Usarlo como una app desde el celular

1. Abrí el link de Vercel en el celular (Chrome en Android, Safari en iPhone).
2. Logueate con `leoalqd` / `N04lp3l4d0`.
3. Agregalo a la pantalla de inicio:
   - **Android (Chrome):** ⋮ → "Agregar a pantalla de inicio"
   - **iPhone (Safari):** ícono de Compartir → "Agregar a inicio"
4. Te queda un ícono como una app normal. Al tocar "ANTES" o "DESPUÉS" en un pedido, se abre la cámara directo y la foto se sube sola a la base de datos.

---

## ✅ Con esto tenés

- Base de datos real y persistente (Supabase)
- Login protegido con tu usuario `leoalqd`
- App publicada con link propio (Vercel)
- Subida de fotos desde la cámara del celular
- Funciona como una app instalada en el teléfono

---

## Solución de problemas

**"404: NOT_FOUND" al abrir el link de Vercel**
El `package.json` quedó dentro de una subcarpeta del repositorio en vez de la raíz. Arreglo sin volver a subir nada: Vercel → **Settings → General → Root Directory → Edit** → escribí el nombre de esa subcarpeta → **Save** → **Deployments → Redeploy**.

**Página completamente en blanco**
Casi siempre son las variables de entorno faltantes o no aplicadas. Revisá Vercel → **Settings → Environment Variables** (con el tilde en **Production**) y hacé **Redeploy** — los cambios de variables no se aplican solos.

**El login funciona pero dice "No se pudo cargar la base de datos"**
La tabla existe pero su API está deshabilitada. Andá a Supabase → **Table Editor → servicios** y habilitá el acceso vía API (o **Settings → API → Exposed schemas** → confirmá `public`). No hace falta redeploy, es un cambio del lado de la base.

**Otro error no listado acá**
Contame el mensaje exacto (o mandame una captura) y lo resolvemos puntual.

---

## Límites del plan gratuito

- **Supabase:** 500MB de base de datos, 1GB de fotos. El proyecto se pausa solo si pasa una semana sin uso (se reactiva solo, tarda unos segundos la primera vez).
- **Vercel:** de sobra para el tráfico de un negocio como el tuyo.
- Ambos tienen planes pagos desde pocos dólares al mes si en algún momento se queda corto — para arrancar no hace falta gastar nada.
