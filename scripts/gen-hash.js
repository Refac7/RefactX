// 用于生成 bcrypt 哈希密码的脚本
// Usage: node scripts/gen-hash.js <username> <password>
// Outputs JSON entry for ADMIN_USERS env var
// Uses base64 encoding to avoid $VAR expansion issues in .env files

import bcrypt from 'bcryptjs'

const args = process.argv.slice(2)

// Backward compatible: single argument = password only (old style)
let username
let password

if (args.length === 1) {
  // Legacy mode: just password
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

  // Base64-encode to avoid $VAR expansion issues in .env files
  const base64Hash = Buffer.from(hash).toString('base64')

  console.log(`Username: ${username}`)
  console.log(`Raw hash:    ${hash}`)
  console.log(`Base64 hash: ${base64Hash}`)
  console.log('')
  console.log('-- Add to .env as ADMIN_USERS (JSON) --')
  console.log('')
  console.log(`ADMIN_USERS={"${username}":"${base64Hash}"}`)
  console.log('')
  console.log('For multiple users, combine into a single JSON object:')
  console.log(`ADMIN_USERS='{"user1":"<base64_hash_1>","user2":"<base64_hash_2>"}'`)
  console.log('')
  console.log('You can verify with: node scripts/test-hash.cjs <your-password>')
})
