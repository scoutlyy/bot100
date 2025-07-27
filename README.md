# Bot de Verificación de Roblox para Discord

Este bot verifica automáticamente cuentas de Roblox en Discord mediante códigos aleatorios en el perfil.

## Características

- ✅ Verificación mediante código aleatorio en "Sobre mí"
- 📅 Verificación de edad mínima de cuenta (4 semanas)
- 🔄 Asignación automática de roles
- 🛡️ Protección contra spam y abuse
- 🌐 Completamente gratuito

## Configuración

### 1. Crear el Bot en Discord

1. Ve a https://discord.com/developers/applications
2. Crea una nueva aplicación
3. Ve a la sección "Bot" y crea un bot
4. Copia el token del bot
5. Habilita los intents necesarios:
   - MESSAGE CONTENT INTENT
   - SERVER MEMBERS INTENT

### 2. Invitar el Bot

Usa este enlace (reemplaza CLIENT_ID con tu ID de aplicación):
\`\`\`
https://discord.com/api/oauth2/authorize?client_id=CLIENT_ID&permissions=268435456&scope=bot
\`\`\`

### 3. Configurar Variables de Entorno

Crea un archivo `.env` basado en `.env.example`:

\`\`\`env
DISCORD_TOKEN=tu_token_del_bot
GUILD_ID=id_de_tu_servidor
VERIFIED_ROLE_ID=id_del_rol_verificado
PENDING_ROLE_ID=id_del_rol_pendiente
\`\`\`

### 4. Instalar y Ejecutar

\`\`\`bash
npm install
npm start
\`\`\`

## Comandos

- `!verify <username>` - Iniciar proceso de verificación
- `!confirmar` - Confirmar verificación después de agregar el código
- `!ayuda` - Mostrar información de ayuda

## Hospedaje Gratuito

### Opciones recomendadas:

1. **Railway** (Recomendado)
   - Conecta tu repositorio de GitHub
   - Configuración automática
   - 500 horas gratis al mes

2. **Render**
   - Plan gratuito disponible
   - Fácil despliegue desde GitHub

3. **Heroku**
   - Plan gratuito limitado
   - Buena documentación

### Pasos para Railway:

1. Sube tu código a GitHub
2. Ve a railway.app
3. Conecta tu repositorio
4. Configura las variables de entorno
5. ¡Despliega!

## Requisitos del Sistema

- Node.js 16+
- Conexión a internet estable
- Token de bot de Discord válido

## Solución de Problemas

### El bot no responde:
- Verifica que el token sea correcto
- Asegúrate de que los intents estén habilitados
- Revisa que el bot tenga permisos en el servidor

### Error de API de Roblox:
- Las APIs de Roblox pueden tener límites de velocidad
- Espera unos minutos e intenta de nuevo

### Problemas de roles:
- Verifica que el bot tenga permisos para gestionar roles
- Asegúrate de que los IDs de roles sean correctos
