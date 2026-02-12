let handler = async (m) => {
  m.reply('🏓 Pong!')
}

handler.command = ['ping']
handler.help = ['ping']
handler.tags = ['info']
handler.limit = false

export default handler