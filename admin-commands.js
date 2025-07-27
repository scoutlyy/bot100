const { EmbedBuilder, PermissionFlagsBits } = require("discord.js")
const axios = require("axios")
const { getRobloxCSRFToken, getRobloxUserInfo, acceptUserToGroup, CONFIG } = require("./path-to-your-functions")

// Comando para listar solicitudes pendientes del grupo
async function handlePendingRequestsCommand(message) {
  // Verificar permisos de administrador
  if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
    const embed = new EmbedBuilder()
      .setColor("#ff0000")
      .setTitle("❌ Sin permisos")
      .setDescription("Solo los administradores pueden usar este comando.")

    return message.reply({ embeds: [embed] })
  }

  try {
    const csrfToken = await getRobloxCSRFToken()

    if (!csrfToken) {
      throw new Error("No se pudo obtener el token CSRF")
    }

    const response = await axios.get(`https://groups.roblox.com/v1/groups/${CONFIG.GROUP_ID}/join-requests`, {
      headers: {
        Cookie: CONFIG.ROBLOX_COOKIE,
        "X-CSRF-TOKEN": csrfToken,
      },
    })

    const pendingRequests = response.data.data

    if (pendingRequests.length === 0) {
      const embed = new EmbedBuilder()
        .setColor("#00ff00")
        .setTitle("📋 Solicitudes Pendientes")
        .setDescription("No hay solicitudes pendientes en el grupo.")

      return message.reply({ embeds: [embed] })
    }

    const embed = new EmbedBuilder()
      .setColor("#0099ff")
      .setTitle("📋 Solicitudes Pendientes del Grupo")
      .setDescription(`Hay ${pendingRequests.length} solicitudes pendientes:`)

    // Mostrar hasta 10 solicitudes
    const requestsToShow = pendingRequests.slice(0, 10)

    for (const request of requestsToShow) {
      embed.addFields({
        name: `👤 ${request.requester.username}`,
        value: `**ID:** ${request.requester.userId}\n**Solicitado:** ${new Date(request.created).toLocaleDateString()}`,
        inline: true,
      })
    }

    if (pendingRequests.length > 10) {
      embed.setFooter({ text: `Mostrando 10 de ${pendingRequests.length} solicitudes` })
    }

    message.reply({ embeds: [embed] })
  } catch (error) {
    console.error("Error obteniendo solicitudes pendientes:", error)
    const embed = new EmbedBuilder()
      .setColor("#ff0000")
      .setTitle("❌ Error")
      .setDescription("No se pudieron obtener las solicitudes pendientes del grupo.")

    message.reply({ embeds: [embed] })
  }
}

// Comando para aceptar manualmente a un usuario
async function handleAcceptUserCommand(message, args) {
  if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
    const embed = new EmbedBuilder()
      .setColor("#ff0000")
      .setTitle("❌ Sin permisos")
      .setDescription("Solo los administradores pueden usar este comando.")

    return message.reply({ embeds: [embed] })
  }

  if (args.length === 0) {
    const embed = new EmbedBuilder()
      .setColor("#ff0000")
      .setTitle("❌ Error")
      .setDescription("Proporciona el nombre de usuario o ID de Roblox.\n**Uso:** `!aceptar <username_o_id>`")

    return message.reply({ embeds: [embed] })
  }

  const userIdentifier = args[0]
  let robloxUserId

  // Verificar si es un ID numérico o un nombre de usuario
  if (/^\d+$/.test(userIdentifier)) {
    robloxUserId = userIdentifier
  } else {
    // Obtener ID del nombre de usuario
    const userInfo = await getRobloxUserInfo(userIdentifier)
    if (!userInfo) {
      const embed = new EmbedBuilder()
        .setColor("#ff0000")
        .setTitle("❌ Usuario no encontrado")
        .setDescription("No se pudo encontrar el usuario de Roblox.")

      return message.reply({ embeds: [embed] })
    }
    robloxUserId = userInfo.id
  }

  const result = await acceptUserToGroup(robloxUserId)

  const embed = new EmbedBuilder()
    .setColor(result.success ? "#00ff00" : "#ff0000")
    .setTitle(result.success ? "✅ Usuario Aceptado" : "❌ Error")
    .setDescription(result.message)

  message.reply({ embeds: [embed] })
}

module.exports = {
  handlePendingRequestsCommand,
  handleAcceptUserCommand,
}
