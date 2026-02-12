import { getUser } from '../database.js'

let handler = async (m, { args, saveDB }) => {
  if (!args[0]) return m.reply('Masukkan nomor')

  let jid = args[0].replace(/\D/g, '') + '@s.whatsapp.net'
  let user = getUser(jid)

  user.premium = true
  user.limit = 9999
  saveDB()

  m.reply('✅ Premium ditambahkan')
}

handler.command = ['addprem']
handler.onlyme = true
handler.help = ['addprem nomor']
handler.tags = ['owner']

export default handler