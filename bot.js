const { Client, GatewayIntentBits, EmbedBuilder, PermissionFlagsBits } = require("discord.js")
const axios = require("axios")
const tough = require("tough-cookie")
const { handlePendingRequestsCommand, handleAcceptUserCommand } = require("./admin-commands")

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
})

// Configuración
const CONFIG = {
  TOKEN: process.env.DISCORD_TOKEN,
  GUILD_ID: process.env.GUILD_ID,
  VERIFIED_ROLE_ID: process.env.VERIFIED_ROLE_ID,
  PENDING_ROLE_ID: process.env.PENDING_ROLE_ID,
  MIN_ACCOUNT_AGE_WEEKS: 4,
  ROBLOX_COOKIE: process.env.ROBLOX_COOKIE,
  GROUP_ID: process.env.GROUP_ID,
}

// Palabras aleatorias para verificación
const VERIFICATION_WORDS = [
  "vaca",
  "casa",
  "perro",
  "gato",
  "sol",
  "luna",
  "agua",
  "fuego",
  "árbol",
  "flor",
  "libro",
  "mesa",
  "silla",
  "ventana",
  "puerta",
  "cielo",
  "tierra",
  "mar",
  "montaña",
  "río",
  "piedra",
  "hierba",
]

// Cliente HTTP con cookies para Roblox
const cookieJar = new tough.CookieJar()

// Base de datos en memoria (en producción usar una base de datos real)
const verificationCodes = new Map()
const verifiedUsers = new Set()

// Función para configurar las cookies de Roblox
function setupRobloxCookies() {
  if (CONFIG.ROBLOX_COOKIE) {
    const cookie = tough.Cookie.parse(CONFIG.ROBLOX_COOKIE)
    cookieJar.setCookieSync(cookie, "https://www.roblox.com")
  }
}

// Función para generar código de verificación
function generateVerificationCode() {
  const words = []
  for (let i = 0; i < 3; i++) {
    const randomWord = VERIFICATION_WORDS[Math.floor(Math.random() * VERIFICATION_WORDS.length)]
    words.push(randomWord)
  }
  return words.join(" ")
}

// Función para obtener información del usuario de Roblox
async function getRobloxUserInfo(username) {
  try {
    // Obtener ID del usuario
    const userResponse = await axios.post("https://users.roblox.com/v1/usernames/users", {
      usernames: [username],
    })

    if (!userResponse.data.data || userResponse.data.data.length === 0) {
      return null
    }

    const userId = userResponse.data.data[0].id

    // Obtener información detallada del usuario
    const detailResponse = await axios.get(`https://users.roblox.com/v1/users/${userId}`)

    return {
      id: userId,
      username: detailResponse.data.name,
      displayName: detailResponse.data.displayName,
      description: detailResponse.data.description || "",
      created: new Date(detailResponse.data.created),
    }
  } catch (error) {
    console.error("Error obteniendo información de Roblox:", error.message)
    return null
  }
}

// Función para obtener el token CSRF de Roblox
async function getRobloxCSRFToken() {
  try {
    const response = await axios.post(
      "https://auth.roblox.com/v2/logout",
      {},
      {
        headers: {
          Cookie: CONFIG.ROBLOX_COOKIE,
        },
        validateStatus: () => true,
      },
    )

    return response.headers["x-csrf-token"]
  } catch (error) {
    console.error("Error obteniendo CSRF token:", error.message)
    return null
  }
}

// Función para aceptar usuario en el grupo de Roblox
async function acceptUserToGroup(robloxUserId) {
  try {
    const csrfToken = await getRobloxCSRFToken()

    if (!csrfToken) {
      throw new Error("No se pudo obtener el token CSRF")
    }

    // Primero verificar si el usuario tiene solicitud pendiente
    const pendingResponse = await axios.get(`https://groups.roblox.com/v1/groups/${CONFIG.GROUP_ID}/join-requests`, {
      headers: {
        Cookie: CONFIG.ROBLOX_COOKIE,
        "X-CSRF-TOKEN": csrfToken,
      },
    })

    const pendingUser = pendingResponse.data.data.find(
      (request) => request.requester.userId === Number.parseInt(robloxUserId),
    )

    if (!pendingUser) {
      return { success: false, message: "No hay solicitud pendiente para este usuario en el grupo" }
    }

    // Aceptar la solicitud
    const acceptResponse = await axios.post(
      `https://groups.roblox.com/v1/groups/${CONFIG.GROUP_ID}/join-requests/users/${robloxUserId}`,
      {},
      {
        headers: {
          Cookie: CONFIG.ROBLOX_COOKIE,
          "X-CSRF-TOKEN": csrfToken,
          "Content-Type": "application/json",
        },
      },
    )

    if (acceptResponse.status === 200) {
      return { success: true, message: "Usuario aceptado en el grupo exitosamente" }
    } else {
      return { success: false, message: "Error al aceptar usuario en el grupo" }
    }
  } catch (error) {
    console.error("Error aceptando usuario al grupo:", error.message)
    return { success: false, message: `Error: ${error.message}` }
  }
}

// Función para verificar si el usuario está en el grupo
async function checkUserInGroup(robloxUserId) {
  try {
    const response = await axios.get(`https://groups.roblox.com/v2/users/${robloxUserId}/groups/roles`)

    const userGroups = response.data.data
    const isInGroup = userGroups.some((group) => group.group.id === Number.parseInt(CONFIG.GROUP_ID))

    return isInGroup
  } catch (error) {
    console.error("Error verificando membresía del grupo:", error)
    return false
  }
}

// Función para verificar la edad de la cuenta
function isAccountOldEnough(createdDate) {
  const now = new Date()
  const diffTime = Math.abs(now - createdDate)
  const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7))
  return diffWeeks >= CONFIG.MIN_ACCOUNT_AGE_WEEKS
}

// Comando de verificación
async function handleVerifyCommand(message, args) {
  if (args.length === 0) {
    const embed = new EmbedBuilder()
      .setColor("#ff0000")
      .setTitle("❌ Error")
      .setDescription("Por favor proporciona tu nombre de usuario de Roblox.\n**Uso:** `!verify <username>`")

    return message.reply({ embeds: [embed] })
  }

  const robloxUsername = args[0]
  const discordUserId = message.author.id

  // Verificar si ya está verificado
  if (verifiedUsers.has(discordUserId)) {
    const embed = new EmbedBuilder()
      .setColor("#ffaa00")
      .setTitle("⚠️ Ya verificado")
      .setDescription("Tu cuenta ya está verificada.")

    return message.reply({ embeds: [embed] })
  }

  // Obtener información del usuario de Roblox
  const userInfo = await getRobloxUserInfo(robloxUsername)

  if (!userInfo) {
    const embed = new EmbedBuilder()
      .setColor("#ff0000")
      .setTitle("❌ Usuario no encontrado")
      .setDescription("No se pudo encontrar el usuario de Roblox. Verifica que el nombre de usuario sea correcto.")

    return message.reply({ embeds: [embed] })
  }

  // Verificar edad de la cuenta
  if (!isAccountOldEnough(userInfo.created)) {
    const embed = new EmbedBuilder()
      .setColor("#ff0000")
      .setTitle("❌ Cuenta muy nueva")
      .setDescription(
        `Tu cuenta de Roblox debe tener al menos ${CONFIG.MIN_ACCOUNT_AGE_WEEKS} semanas de antigüedad.\n**Creada:** ${userInfo.created.toLocaleDateString()}`,
      )

    return message.reply({ embeds: [embed] })
  }

  // Generar código de verificación
  const verificationCode = generateVerificationCode()
  verificationCodes.set(discordUserId, {
    code: verificationCode,
    robloxUsername: userInfo.username,
    robloxId: userInfo.id,
    timestamp: Date.now(),
  })

  const embed = new EmbedBuilder()
    .setColor("#00ff00")
    .setTitle("🔐 Verificación iniciada")
    .setDescription(
      `**Paso 1:** Ve a tu perfil de Roblox y edita tu "Sobre mí"\n**Paso 2:** Agrega este código a tu descripción: \`${verificationCode}\`\n**Paso 3:** Usa el comando \`!confirmar\` cuando hayas agregado el código\n\n**⏰ Este código expira en 10 minutos**`,
    )
    .addFields(
      { name: "👤 Usuario de Roblox", value: userInfo.username, inline: true },
      { name: "📅 Cuenta creada", value: userInfo.created.toLocaleDateString(), inline: true },
    )
    .setFooter({ text: "Asegúrate de que el código sea visible en tu perfil público" })

  message.reply({ embeds: [embed] })
}

// Comando de confirmación
async function handleConfirmCommand(message) {
  const discordUserId = message.author.id
  const verification = verificationCodes.get(discordUserId)

  if (!verification) {
    const embed = new EmbedBuilder()
      .setColor("#ff0000")
      .setTitle("❌ No hay verificación pendiente")
      .setDescription("No tienes ninguna verificación en proceso. Usa `!verify <username>` primero.")

    return message.reply({ embeds: [embed] })
  }

  // Verificar si el código ha expirado (10 minutos)
  if (Date.now() - verification.timestamp > 10 * 60 * 1000) {
    verificationCodes.delete(discordUserId)
    const embed = new EmbedBuilder()
      .setColor("#ff0000")
      .setTitle("❌ Código expirado")
      .setDescription("Tu código de verificación ha expirado. Usa `!verify <username>` para generar uno nuevo.")

    return message.reply({ embeds: [embed] })
  }

  // Obtener información actualizada del usuario
  const userInfo = await getRobloxUserInfo(verification.robloxUsername)

  if (!userInfo) {
    const embed = new EmbedBuilder()
      .setColor("#ff0000")
      .setTitle("❌ Error")
      .setDescription("No se pudo verificar tu perfil de Roblox. Inténtalo de nuevo.")

    return message.reply({ embeds: [embed] })
  }

  // Verificar si el código está en la descripción
  if (!userInfo.description.includes(verification.code)) {
    const embed = new EmbedBuilder()
      .setColor("#ff0000")
      .setTitle("❌ Código no encontrado")
      .setDescription(
        `No se encontró el código \`${verification.code}\` en tu descripción de Roblox.\n\nAsegúrate de:\n• Haber guardado los cambios en tu perfil\n• El código esté visible públicamente\n• No haber modificado el código`,
      )

    return message.reply({ embeds: [embed] })
  }

  // Verificación exitosa
  verificationCodes.delete(discordUserId)
  verifiedUsers.add(discordUserId)

  // Asignar rol de verificado
  try {
    const member = await message.guild.members.fetch(discordUserId)

    if (CONFIG.VERIFIED_ROLE_ID) {
      await member.roles.add(CONFIG.VERIFIED_ROLE_ID)
    }

    if (CONFIG.PENDING_ROLE_ID) {
      await member.roles.remove(CONFIG.PENDING_ROLE_ID)
    }

    const embed = new EmbedBuilder()
      .setColor("#00ff00")
      .setTitle("✅ Verificación completada")
      .setDescription(`¡Felicidades! Tu cuenta ha sido verificada exitosamente.`)
      .addFields(
        { name: "👤 Usuario de Roblox", value: userInfo.username, inline: true },
        { name: "🆔 ID de Roblox", value: userInfo.id.toString(), inline: true },
      )
      .setTimestamp()

    message.reply({ embeds: [embed] })

    // Intentar aceptar al usuario en el grupo de Roblox
    if (CONFIG.GROUP_ID && CONFIG.ROBLOX_COOKIE) {
      const groupResult = await acceptUserToGroup(userInfo.id)

      if (groupResult.success) {
        embed.addFields({
          name: "🎉 Grupo de Roblox",
          value: "Has sido aceptado automáticamente en el grupo",
          inline: false,
        })
      } else {
        embed.addFields({
          name: "⚠️ Grupo de Roblox",
          value: `${groupResult.message}\nPuede que necesites enviar una solicitud manualmente.`,
          inline: false,
        })
      }
    }

    // Log de verificación
    console.log(`Usuario verificado: ${message.author.tag} -> ${userInfo.username} (${userInfo.id})`)
  } catch (error) {
    console.error("Error asignando roles:", error)
    const embed = new EmbedBuilder()
      .setColor("#ffaa00")
      .setTitle("⚠️ Verificación completada con advertencias")
      .setDescription(
        "Tu cuenta fue verificada pero hubo un problema asignando los roles. Contacta a un administrador.",
      )

    message.reply({ embeds: [embed] })
  }
}

// Comando de ayuda
function handleHelpCommand(message) {
  const embed = new EmbedBuilder()
    .setColor("#0099ff")
    .setTitle("🤖 Bot de Verificación de Roblox")
    .setDescription("Este bot verifica tu cuenta de Roblox para acceder al servidor.")
    .addFields(
      {
        name: "📝 Comandos disponibles",
        value:
          "`!verify <username>` - Iniciar verificación\n`!confirmar` - Confirmar verificación\n`!ayuda` - Mostrar esta ayuda",
        inline: false,
      },
      {
        name: "📋 Requisitos",
        value: `• Cuenta de Roblox con mínimo ${CONFIG.MIN_ACCOUNT_AGE_WEEKS} semanas de antigüedad\n• Perfil público\n• Capacidad de editar "Sobre mí"`,
        inline: false,
      },
      {
        name: "🔧 Proceso de verificación",
        value:
          '1. Usa `!verify <tu_username>`\n2. Agrega el código a tu "Sobre mí" en Roblox\n3. Usa `!confirmar` para completar',
        inline: false,
      },
    )
    .setFooter({ text: "Si tienes problemas, contacta a un administrador" })

  message.reply({ embeds: [embed] })
}

// Event listeners
client.on("ready", () => {
  console.log(`Bot conectado como ${client.user.tag}`)
  client.user.setActivity("Verificando cuentas de Roblox", { type: "WATCHING" })
  setupRobloxCookies()
})

client.on("messageCreate", async (message) => {
  if (message.author.bot) return
  if (!message.content.startsWith("!")) return

  const args = message.content.slice(1).trim().split(/ +/)
  const command = args.shift().toLowerCase()

  try {
    switch (command) {
      case "verify":
      case "verificar":
        await handleVerifyCommand(message, args)
        break

      case "confirm":
      case "confirmar":
        await handleConfirmCommand(message)
        break

      case "help":
      case "ayuda":
        handleHelpCommand(message)
        break

      case "pending":
      case "pendientes":
        await handlePendingRequestsCommand(message)
        break

      case "accept":
      case "aceptar":
        await handleAcceptUserCommand(message, args)
        break
    }
  } catch (error) {
    console.error("Error ejecutando comando:", error)
    const embed = new EmbedBuilder()
      .setColor("#ff0000")
      .setTitle("❌ Error interno")
      .setDescription("Ocurrió un error procesando tu comando. Inténtalo de nuevo.")

    message.reply({ embeds: [embed] })
  }
})

// Manejo de errores
client.on("error", console.error)

// Iniciar el bot
client.login(CONFIG.TOKEN)
