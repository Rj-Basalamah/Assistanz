import fs from 'fs'

const DB_PATH = './database/db.json'
export let db = JSON.parse(fs.readFileSync(DB_PATH))

export function saveDB() {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2))
}

export function getUser(jid) {
  if (!db.users[jid]) {
    db.users[jid] = {
      registered: false,
      premium: false,
      limit: 20,
      exp: 0,
      lastSeen: Date.now()
    }
    saveDB()
  }
  return db.users[jid]
}