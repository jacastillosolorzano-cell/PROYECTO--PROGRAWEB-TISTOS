import { PrismaClient } from "../generated/prisma"

const prisma = new PrismaClient()

async function main() {
  try {
    // Obtener todos los streamers
    const streamers = await prisma.usuario.findMany({
      where: { rol: "STREAMER" }
    })

    console.log(`Encontrados ${streamers.length} streamers`)

    for (const streamer of streamers) {
      // Verificar si ya tiene niveles
      const nivelesExistentes = await prisma.nivelEspectador.findMany({
        where: { id_streamer: streamer.id_usuario }
      })

      if (nivelesExistentes.length === 0) {
        // Crear niveles por defecto
        const niveles = [
          { nombre_nivel: "Bronce", orden: 1, puntos_requeridos: 0 },
          { nombre_nivel: "Plata", orden: 2, puntos_requeridos: 1000 },
          { nombre_nivel: "Oro", orden: 3, puntos_requeridos: 5000 },
          { nombre_nivel: "Diamante", orden: 4, puntos_requeridos: 10000 }
        ]

        for (const nivel of niveles) {
          await prisma.nivelEspectador.create({
            data: {
              id_streamer: streamer.id_usuario,
              nombre_nivel: nivel.nombre_nivel,
              orden: nivel.orden,
              puntos_requeridos: nivel.puntos_requeridos,
              activo: true
            }
          })
          console.log(`✓ Nivel ${nivel.nombre_nivel} creado para ${streamer.nombre}`)
        }
      } else {
        console.log(`✗ ${streamer.nombre} ya tiene ${nivelesExistentes.length} niveles`)
      }
    }

    // Obtener todos los espectadores y asignarles un progreso si no lo tienen
    const espectadores = await prisma.usuario.findMany({
      where: { rol: "ESPECTADOR" }
    })

    console.log(`\nEncontrados ${espectadores.length} espectadores`)

    for (const espectador of espectadores) {
      const progresoExistente = await prisma.progresoEspectador.findFirst({
        where: { id_espectador: espectador.id_usuario }
      })

      if (!progresoExistente) {
        // Obtener el primer streamer y su primer nivel
        const streamer = await prisma.usuario.findFirst({
          where: { rol: "STREAMER" }
        })

        if (streamer) {
          const nivel = await prisma.nivelEspectador.findFirst({
            where: { id_streamer: streamer.id_usuario }
          })

          if (nivel) {
            await prisma.progresoEspectador.create({
              data: {
                id_espectador: espectador.id_usuario,
                id_streamer: streamer.id_usuario,
                puntos_actuales: 1000, // Puntos iniciales para jugar ruleta
                id_nivel_espectador: nivel.id_nivel_espectador
              }
            })
            console.log(`✓ Progreso creado para ${espectador.nombre}`)
          }
        }
      } else {
        console.log(`✗ ${espectador.nombre} ya tiene progreso`)
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
