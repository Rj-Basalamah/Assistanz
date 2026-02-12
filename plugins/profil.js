let handler = async (m, { user }) => {
  m.reply(
`👤 *PROFIL USER*

• Terdaftar : ${user.registered}
• Premium   : ${user.premium}
• Limit     : ${user.limit}
• EXP       : ${user.exp}`
  )
}

handler.command = ['profil', 'me']
handler.help = ['profil']
handler.tags = ['user']

export default handler