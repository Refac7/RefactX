// 用于生成 bcrypt 哈希密码的脚本
// Usage: node scripts/gen-hash.js <username> <password>
// Outputs base64-encoded hash for ADMIN_USERS env var
// (base64 encoding avoids dotenv-expand $VAR expansion issues)

import bcrypt from 'bcryptjs'

const args = process.argv.slice(2)

let username
let password

if (args.length === 1) {
  username = 'admin'
  password = args[0]
} else if (args.length >= 2) {
  username = args[0]
  password = args[1]
} else {
  console.error('Usage: node scripts/gen-hash.js <username> <password>')
  console.error('       node scripts/gen-hash.js <password>  (uses default username "admin")')
  process.exit(1)
}

const saltRounds = 10
bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Hash generation failed:', err)
    process.exit(1)
  }
  const encoded = Buffer.from(hash).toString('base64')
  console.log(`Username: ${username}`)
  console.log(`Original hash: ${hash}`)
  console.log(`Base64 encoded: ${encoded}`)
  console.log('')
  console.log('-- Add to .env as ADMIN_USERS (JSON) --')
  console.log(`ADMIN_USERS='{"${username}":"${encoded}"}'`)
  console.log('')
  console.log('For multiple users, combine into a single JSON object:')
  console.log('ADMIN_USERS=\'{"user1":"base64hash...","user2":"base64hash..."}\'')
})
