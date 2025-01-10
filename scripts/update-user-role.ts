import { PrismaClient, UserRole } from '@prisma/client'

const prisma = new PrismaClient()

async function updateUserRole() {
  const email = process.argv[2]
  const role = process.argv[3] as UserRole

  if (!email || !['USER', 'LEAGUE_MANAGER', 'ADMIN'].includes(role)) {
    console.error('Usage: npx tsx scripts/update-user-role.ts <email> <role>')
    console.error('Role must be one of: USER, LEAGUE_MANAGER, ADMIN')
    process.exit(1)
  }

  try {
    const user = await prisma.user.update({
      where: { email },
      data: { role },
    })

    console.log(`✅ Successfully updated user ${email} to role ${role}`)
    console.log('Updated user:', user)
  } catch (error) {
    console.error('Error updating user role:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateUserRole() 