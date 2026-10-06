const fs = require('fs');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

if (fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const k = trimmed.slice(0, idx).trim();
        let v = trimmed.slice(idx + 1).trim();
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
          v = v.slice(1, -1);
        }
        if (!process.env[k]) process.env[k] = v;
      }
    }
  });
}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#%^&*';
  const bytes = crypto.randomBytes(20);
  let pwd = '';
  for (let i = 0; i < 20; i++) pwd += chars[bytes[i] % chars.length];
  return pwd;
}

async function run() {
  const email = process.argv[2] || 'uok@softsols.pk';
  const newPassword = generatePassword();
  const hashed = await bcrypt.hash(newPassword, 12);

  const updated = await prisma.user.update({
    where: { email },
    data: { password: hashed, failedLoginAttempts: 0, lockedUntil: null },
  });

  console.log('PASSWORD_ROTATED_FOR=' + updated.email);
  console.log('NEW_PASSWORD=' + newPassword);
  await prisma.$disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
