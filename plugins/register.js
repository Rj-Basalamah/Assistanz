let handler = async (m, { user, saveDB }) => {
  if (user.registered) return m.reply('✅ Sudah terdaftar')

  user.registered = true
  user.limit = 20
  saveDB()

  m.reply('🎉 Berhasil daftar')
}

handler.command = ['daftar']
handler.help = ['daftar']
handler.tags = ['user']

export default handler