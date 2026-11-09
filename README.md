# Vitalia (vitalia-frontend)

## Vitalia: seguimiento personal de salud

Vitalia usa Supabase para registrar cuentas, mantener la sesión y sincronizar
mediciones de glucemia, presión arterial, medicamentos, preferencias de
recordatorios y comidas entre dispositivos. No se limita a 100 cuentas. Las
contraseñas las administra Supabase; la aplicación solo recuerda el correo en el
dispositivo.

### Configurar Supabase

1. Crea un proyecto en [Supabase](https://supabase.com/) y habilita el proveedor
   **Email** en **Authentication → Providers**.
2. En **SQL Editor**, ejecuta el contenido de [`supabase/schema.sql`](./supabase/schema.sql).
   El esquema crea perfiles y tablas para los módulos de salud, con políticas RLS
   para que cada persona solo pueda consultar y modificar sus propios registros.
3. En **Project Settings → API**, copia la **Project URL** y la **publishable key**
   (o la `anon` key heredada). No uses ni publiques la `service_role` key.
4. Activa los registros por correo en **Authentication → Providers → Email**.
   Si quieres que las cuentas nuevas puedan iniciar sesión inmediatamente, desactiva
   **Confirm email** en la configuración del proveedor Email. Esto reduce la
   verificación de que cada persona controla el correo registrado. Las cuentas
   creadas antes de cambiar esta opción podrían necesitar confirmación manual en
   **Authentication → Users** o que se reenvíe su correo de confirmación.
   Configura un proveedor SMTP propio si vas a invitar a muchas personas: el correo
   de prueba de Supabase tiene límites de envío. En **Authentication → URL
   Configuration**, configura el **Site URL** y las URLs permitidas para desarrollo,
   recuperación y el dominio del sitio publicado. La recuperación vuelve a
   `/?flow=recovery#/login?recovery=1`.
5. Copia `.env.example` como `.env` y completa:

   ```env
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-clave-publicable
   ```

   Luego reinicia la aplicación con `npm run dev`.

6. Publica el frontend en un hosting web (por ejemplo, Vercel o Netlify) y configura
   allí las mismas dos variables de entorno. Supabase comparte las cuentas y datos;
   el hosting publica la aplicación para que los dispositivos puedan abrirla.

No hay un tope de 100 cuentas fijado en Vitalia; el límite real depende del plan y
las cuotas de tu proyecto Supabase. Cada persona debe registrarse una sola vez en el
proyecto compartido y podrá entrar desde otros dispositivos con sus credenciales.

Las cuentas creadas anteriormente en el almacenamiento local no se comparten por sí
solas. Si el mismo navegador conserva la cuenta local y se inicia sesión con su correo
y contraseña correctos, Vitalia intentará crearla en Supabase y migrar su historial
local al primer acceso. En otro dispositivo, registra la cuenta en el servicio
compartido con el mismo correo y contraseña. Los usuarios existentes en otro
dispositivo o navegador no se pueden recuperar desde este proyecto: no hay acceso a
ese almacenamiento local. Las cuentas antiguas con contraseñas que no cumplan la
política mínima de Supabase deberán registrarse nuevamente con una contraseña segura.
La pantalla de ayuda envía un enlace para restablecer la contraseña; después del
enlace, permite guardar una nueva contraseña y conserva la sesión en ese dispositivo.

Los recordatorios se guardan en la cuenta y utilizan notificaciones del navegador
cuando se concede permiso. Para recibirlos, Vitalia debe permanecer abierta en el
dispositivo; no son alarmas médicas ni se ejecutan con el navegador cerrado.

### Bluetooth y estimaciones nutricionales

En **Glucemia**, el botón **Conectar glucómetro** utiliza Web Bluetooth y solo
busca dispositivos que anuncian el perfil estándar BLE Glucose Service. Al
conectar, guarda automáticamente la última lectura que comparte el medidor y
las nuevas notificaciones compatibles mientras la sesión sigue conectada y la
página permanece abierta. No se ejecuta en segundo plano. Requiere HTTPS (o
localhost) y un navegador compatible, como Chrome para Android o Chrome/Edge de
escritorio. Safari en iPhone/iPad no admite Web Bluetooth, aunque se instale
otro navegador. Los sensores de brazo con protocolos propietarios no serán
compatibles con esta lectura estándar.

En **Alimentación**, busca alimentos del catálogo para calcular porciones
aproximadas de calorías, proteína, carbohidratos y potasio, o registra sus
valores manualmente. Para guardar proteína y potasio en Supabase, aplica la
versión actualizada de [`supabase/schema.sql`](./supabase/schema.sql); los
valores de porción son orientativos y no sustituyen indicaciones profesionales.

## Install the dependencies

```bash
pnpm install
# or: yarn/npm/bun install
```

### Start the app in development mode (HMR, error reporting, etc.)

```bash
quasar dev
```

### Format & Lint the files

```bash
pnpm run lint
# or: yarn/npm/bun run lint
```

...or just check formatting & linting:

```bash
pnpm run lint:check
# or: yarn/npm/bun run lint:check
```

### Build the app for production

```bash
quasar build
```

### Customize the configuration

See [Configuring quasar.config.js](https://v2.quasar.dev/quasar-cli-vite/quasar-config-file).
