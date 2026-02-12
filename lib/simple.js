import fs from 'fs'
import path from 'path'
import fetch from 'node-fetch'
import { fileTypeFromBuffer } from 'file-type'
import PhoneNumber from 'awesome-phonenumber'
import {
  proto,
  areJidsSameUser,
  downloadContentFromMessage,
  jidDecode
} from '@adiwajshing/baileys'

/* ================= HELPER ================= */

const getBuffer = async (input) => {
  if (Buffer.isBuffer(input)) return input
  if (/^https?:\/\//.test(input)) {
    const res = await fetch(input)
    return await res.buffer()
  }
  if (fs.existsSync(input)) return fs.readFileSync(input)
  return Buffer.alloc(0)
}

const decodeJid = (jid) => {
  if (!jid) return jid
  if (/:\d+@/gi.test(jid)) {
    const d = jidDecode(jid) || {}
    return (d.user && d.server) ? `${d.user}@${d.server}` : jid
  }
  return jid
}

/* ================= SERIALIZE MESSAGE ================= */

export function smsg(conn, m) {
  if (!m) return m

  m.id = m.key.id
  m.chat = decodeJid(m.key.remoteJid)
  m.fromMe = m.key.fromMe
  m.isGroup = m.chat.endsWith('@g.us')
  m.sender = decodeJid(
    m.fromMe ? conn.user.id : m.key.participant || m.chat
  )

  m.mtype = Object.keys(m.message || {})[0]
  m.msg = m.message?.[m.mtype]
  m.text =
    m.msg?.text ||
    m.msg?.caption ||
    m.message?.conversation ||
    ''

  /* ===== QUOTED ===== */
  if (m.msg?.contextInfo?.quotedMessage) {
    let q = {}
    q.key = {
      remoteJid: m.chat,
      fromMe: areJidsSameUser(
        decodeJid(m.msg.contextInfo.participant),
        decodeJid(conn.user.id)
      ),
      id: m.msg.contextInfo.stanzaId,
      participant: decodeJid(m.msg.contextInfo.participant)
    }
    q.message = m.msg.contextInfo.quotedMessage
    m.quoted = smsg(conn, q)

    m.quoted.reply = (text, opt = {}) =>
      conn.reply(m.chat, text, m.quoted, { ai: true, ...opt })
  } else {
    m.quoted = null
  }

  /* ===== REPLY (AI FLAG ALWAYS ON) ===== */
  m.reply = (text, opt = {}) =>
    conn.sendMessage(
      m.chat,
      {
        text,
        mentions: conn.parseMention(text),
        ai: true,
        ...opt
      },
      { quoted: m }
    )

  /* ===== DOWNLOAD MEDIA ===== */
  m.download = async (saveToFile = false) => {
    if (!m.msg?.url && !m.msg?.directPath) return null
    const stream = await downloadContentFromMessage(
      m.msg,
      m.mtype.replace(/Message/i, '')
    )
    let buffer = Buffer.from([])
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])
    if (!saveToFile) return buffer

    const type = await fileTypeFromBuffer(buffer)
    const filename = `./tmp/${Date.now()}.${type.ext}`
    fs.writeFileSync(filename, buffer)
    return filename
  }

  return m
}

/* ================= EXTEND CONNECTION ================= */

export function bind(conn) {
  /* ===== REPLY GLOBAL ===== */
  conn.reply = (jid, text, quoted, options = {}) => {
    return conn.sendMessage(
      jid,
      {
        text,
        mentions: conn.parseMention(text),
        ai: true,
        ...options
      },
      { quoted }
    )
  }

  /* ===== SEND FILE ===== */
  conn.sendFile = async (
  jid,
  input,
  filename = '',
  caption = '',
  quoted,
  options = {}
) => {
  const buffer = await getBuffer(input)
  const type = await fileTypeFromBuffer(buffer)
  const mime = type?.mime || 'application/octet-stream'

  let message = {}

  if (mime.startsWith('audio/')) {
    message = {
      audio: buffer,
      mimetype: mime,
      ptt: options.ptt || false,
      ai: true,
      ...options
    }
  } else if (mime.startsWith('video/')) {
    message = {
      video: buffer,
      caption,
      ai: true,
      ...options
    }
  } else if (mime.startsWith('image/')) {
    message = {
      image: buffer,
      caption,
      ai: true,
      ...options
    }
  } else {
    message = {
      document: buffer,
      mimetype: mime,
      fileName: filename,
      caption,
      ai: true,
      ...options
    }
  }

  return conn.sendMessage(jid, message, { quoted })
}

  /* ===== PARSE MENTION ===== */
  conn.parseMention = (text = '') =>
    [...text.matchAll(/@([0-9]{5,16})/g)].map(
      v => v[1] + '@s.whatsapp.net'
    )

  /* ===== GET NAME ===== */
  conn.getName = (jid = '') => {
    jid = decodeJid(jid)
    let contact = conn.contacts?.[jid]
    if (contact?.name) return contact.name
    if (jid.endsWith('@s.whatsapp.net'))
      return PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international')
    return jid
  }

  return conn
}