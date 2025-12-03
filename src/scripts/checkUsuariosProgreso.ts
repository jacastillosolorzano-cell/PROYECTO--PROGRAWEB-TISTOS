import { PrismaClient } from "../generated/prisma"

const prisma = new PrismaClient()

async function main() {
  try {
    console.log("=== USUARIOS Y SU PROGRESO ===\n")

    const usuarios = await prisma.usuario.findMany({
      include: {
        progresosComoEspectador: {
          select: {
            id_progreso: true,
            id_streamer: true,
            puntos_actuales: true
          }
        }
      }
    })

    for (const usuario of usuarios) {
      console.log(`\n${usuario.nombre} (${usuario.email})`)
      console.log(`  ID: ${usuario.id_usuario}`)
      console.log(`  Rol: ${usuario.rol}`)
      
      if (usuario.progresosComoEspectador.length > 0) {
        console.log(`  Progreso:`)
        usuario.progresosComoEspectador.forEach(p => {
          console.log(`    - Streamer ID: ${p.id_streamer}, Puntos: ${p.puntos_actuales}`)
        })
      } else {
        console.log(`  ⚠️  SIN PROGRESO ASIGNADO`)
      }
    }

    console.log("\n=== RESUMEN ===")
    const conProgreso = usuarios.filter(u => u.progresosComoEspectador.length > 0)
    const sinProgreso = usuarios.filter(u => u.progresosComoEspectador.length === 0)
    console.log(`✓ ${conProgreso.length} usuarios con progreso`)
    console.log(`⚠️  ${sinProgreso.length} usuarios SIN progreso`)
    
  } catch (error) {
    console.error("Error:", error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
