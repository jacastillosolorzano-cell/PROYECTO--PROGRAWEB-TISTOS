import { PrismaClient } from "../generated/prisma"

const prisma = new PrismaClient()

async function main() {
  try {
    // Obtener todos los usuarios
    const usuarios = await prisma.usuario.findMany()
    
    console.log(`Encontrados ${usuarios.length} usuarios`)
    
    for (const usuario of usuarios) {
      // Verificar si ya tiene perfil de espectador
      const perfilExistente = await prisma.perfilEspectador.findUnique({
        where: { id_usuario: usuario.id_usuario }
      })
      
      if (!perfilExistente) {
        // Crear el perfil de espectador
        const perfil = await prisma.perfilEspectador.create({
          data: {
            id_usuario: usuario.id_usuario,
            saldo_monedas: 0
          }
        })
        console.log(`✓ Perfil creado para ${usuario.nombre} (${usuario.email})`)
      } else {
        console.log(`✗ ${usuario.nombre} ya tiene perfil`)
      }
    }
    
    console.log("\n✓ Proceso completado")
  } catch (error) {
    console.error("Error:", error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
