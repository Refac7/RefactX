// Quick test: verify your password against the hash in .env
const bcrypt = require('bcryptjs')
const fs = require('fs')

const envContent = fs.readFileSync('.env', 'utf-8')
const match = envContent.match(/ADMIN_USERS=\s*(.+)/)
if (!match) { console.error('ADMIN_USERS not found in .env'); process.exit(1) }

const raw = match[1].trim()
console.log('Raw value (first 50 chars):', raw.substring(0, 50) + '...')

let parsed
try {
  parsed = JSON.parse(raw)
  console.log('JSON parse: OK, users:', Object.keys(parsed))
} catch (e) {
  console.error('JSON parse FAILED:', e.message)
  console.error('The value has quoting issues. Remove any surrounding quotes.')
  process.exit(1)
}

for (const [user, hash] of Object.entries(parsed)) {
  let finalHash = hash
  if (!finalHash.startsWith('$2')) {
    finalHash = Buffer.from(finalHash, 'base64').toString('utf-8')
    console.log(`Base64 decoded hash for ${user}: ${finalHash}`)
  }
  console.log(`Hash valid (starts with $2): ${finalHash.startsWith('$2')}`)
}

// Test with the password passed as argument
const testPassword = process.argv[2]
if (testPassword) {
  for (const [user, hash] of Object.entries(parsed)) {
    let finalHash = hash
    if (!finalHash.startsWith('$2')) finalHash = Buffer.from(finalHash, 'base64').toString('utf-8')
    bcrypt.compare(testPassword, finalHash).then(r => {
      console.log(`Password "${testPassword}" matches ${user}: ${r}`)
    })
  }
} else {
  console.log('\nUsage: node scripts/test-hash.js <your-password>')
}
