import makeWASocket, { useMultiFileAuthState } from '@adiwajshing/baileys'
import { handler, loadPlugins } from './handler.js'

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState('./session')

  const conn = makeWASocket({
    auth: state,
    printQRInTerminal: true
  })

  loadPlugins()

  conn.ev.on('messages.upsert', async ({ messages }) => {
    let m = messages[0]
    if (!m.message) return

    m.text =
      m.message.conversation ||
      m.message.extendedTextMessage?.text

    m.sender = m.key.participant || m.key.remoteJid

    m.reply = (text) =>
      conn.sendMessage(m.key.remoteJid, { text })

    handler(m, conn)
  })

  conn.ev.on('creds.update', saveCreds)
}

start()