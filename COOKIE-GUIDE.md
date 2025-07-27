# 🍪 Guía para Obtener la Cookie de Roblox

## ⚠️ IMPORTANTE - SEGURIDAD
- **NUNCA compartas tu cookie con nadie**
- La cookie permite acceso completo a tu cuenta
- Úsala solo en aplicaciones que controles
- Cambia tu contraseña si sospechas que fue comprometida

## 📋 Pasos para Obtener la Cookie

### 1. Abrir Roblox en el Navegador
- Ve a https://www.roblox.com
- Inicia sesión con la cuenta que será el bot del grupo

### 2. Abrir Herramientas de Desarrollador
- **Chrome/Edge:** Presiona `F12` o `Ctrl+Shift+I`
- **Firefox:** Presiona `F12` o `Ctrl+Shift+I`
- **Safari:** `Cmd+Option+I`

### 3. Ir a la Pestaña Application/Storage
- **Chrome/Edge:** Pestaña "Application"
- **Firefox:** Pestaña "Storage"
- **Safari:** Pestaña "Storage"

### 4. Encontrar las Cookies
- En el panel izquierdo, expande "Cookies"
- Haz clic en "https://www.roblox.com"

### 5. Buscar la Cookie .ROBLOSECURITY
- Busca una cookie llamada `.ROBLOSECURITY`
- Haz clic en ella
- Copia todo el valor (será muy largo)

### 6. Formato de la Cookie
La cookie debe verse así:
\`\`\`
_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_[CÓDIGO_MUY_LARGO]
\`\`\`

## 🔧 Configuración en el Bot

### Variables de Entorno Necesarias:
\`\`\`env
ROBLOX_COOKIE=tu_cookie_completa_aqui
GROUP_ID=12345678
\`\`\`

### Permisos Necesarios en el Grupo:
La cuenta del bot debe tener:
- ✅ Permisos de "Manage Members" o superior
- ✅ Ser Owner o tener rol con permisos de aceptar solicitudes

## 🛠️ Comandos Adicionales para Administradores

- `!pendientes` - Ver solicitudes pendientes del grupo
- `!aceptar <username>` - Aceptar manualmente a un usuario
- `!verificados` - Ver lista de usuarios verificados

## 🔍 Solución de Problemas

### Error: "No se pudo obtener el token CSRF"
- Verifica que la cookie sea correcta y completa
- Asegúrate de que la cuenta esté activa
- La cookie puede haber expirado, obtén una nueva

### Error: "Sin permisos en el grupo"
- Verifica que la cuenta tenga permisos de gestión
- Asegúrate de que el GROUP_ID sea correcto

### Error: "No hay solicitud pendiente"
- El usuario debe enviar solicitud al grupo primero
- Verifica que el GROUP_ID sea correcto
- El usuario puede ya estar en el grupo

## 🔄 Renovación de Cookie

Las cookies de Roblox pueden expirar. Si el bot deja de funcionar:
1. Obtén una nueva cookie siguiendo estos pasos
2. Actualiza la variable de entorno
3. Reinicia el bot
