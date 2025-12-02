import { PrismaClient } from "../generated/prisma"
import bcrypt from "bcrypt"

const prisma = new PrismaClient()

async function main() {
  const rounds = parseInt(process.env.BCRYPT_ROUNDS || '10')

  // Crear un streamer y un espectador de prueba si no existen
  const existingStreamer = await prisma.usuario.findFirst({ where: { rol: 'STREAMER' } })
  if (!existingStreamer) {
    const password = await bcrypt.hash('streamer123', rounds)
    const streamer = await prisma.usuario.create({
      data: {
        nombre: 'Streamer Demo',
        email: 'streamer@example.com',
        contrasena_hash: password,
        rol: 'STREAMER',
        estado: 'ACTIVO'
      }
    })
    console.log('✓ Streamer creado:', streamer.id_usuario)
  } else {
    console.log('✗ Ya existe un streamer:', existingStreamer.email)
  }

  const existingSpectator = await prisma.usuario.findFirst({ where: { rol: 'ESPECTADOR' } })
  if (!existingSpectator) {
    const password = await bcrypt.hash('espectador123', rounds)
    const espectador = await prisma.usuario.create({
      data: {
        nombre: 'Espectador Demo',
        email: 'espectador@example.com',
        contrasena_hash: password,
        rol: 'ESPECTADOR',
        estado: 'ACTIVO'
      }
    })
    console.log('✓ Espectador creado:', espectador.id_usuario)

    // Crear perfilEspectador
    await prisma.perfilEspectador.create({
      data: { id_usuario: espectador.id_usuario, saldo_monedas: 0 }
    })
    console.log('✓ PerfilEspectador creado para espectador demo')
  } else {
    console.log('✗ Ya existe un espectador:', existingSpectator.email)
  }

  console.log('\nListo. Puedes usar las credenciales de ejemplo para probar la ruleta:')
  console.log('  Streamer: streamer@example.com / streamer123')
  console.log('  Espectador: espectador@example.com / espectador123')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
