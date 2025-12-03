import { PrismaClient } from "../generated/prisma"

const prisma = new PrismaClient()

async function main() {
  try {
    console.log("Iniciando seed de ProgresoEspectador...")

    // Obtener todos los usuarios con rol ESPECTADOR
    const espectadores = await prisma.usuario.findMany({
      where: { rol: "ESPECTADOR" }
    })

    console.log(`Encontrados ${espectadores.length} espectadores`)

    // Obtener un streamer (para asignar el progreso)
    const streamer = await prisma.usuario.findFirst({
      where: { rol: "STREAMER" }
    })

    if (!streamer) {
      console.log("❌ No hay streamers en la base de datos. Crea un streamer primero.")
      return
    }

    console.log(`Usando streamer: ${streamer.nombre}`)

    // Obtener el primer nivel del streamer
    let nivel = await prisma.nivelEspectador.findFirst({
      where: { id_streamer: streamer.id_usuario }
    })

    // Si no hay nivel, crear los 4 niveles por defecto
    if (!nivel) {
      console.log("Creando niveles por defecto...")
      const niveles = [
        { nombre_nivel: "Bronce", orden: 1, puntos_requeridos: 0 },
        { nombre_nivel: "Plata", orden: 2, puntos_requeridos: 1000 },
        { nombre_nivel: "Oro", orden: 3, puntos_requeridos: 5000 },
        { nombre_nivel: "Diamante", orden: 4, puntos_requeridos: 10000 }
      ]

      for (const nv of niveles) {
        await prisma.nivelEspectador.create({
          data: {
            id_streamer: streamer.id_usuario,
            nombre_nivel: nv.nombre_nivel,
            orden: nv.orden,
            puntos_requeridos: nv.puntos_requeridos,
            activo: true
          }
        })
      }

      // Obtener el nivel Bronce creado
      nivel = await prisma.nivelEspectador.findFirst({
        where: { 
          id_streamer: streamer.id_usuario,
          nombre_nivel: "Bronce"
        }
      })
    }

    if (!nivel) {
      console.log("❌ No se pudo crear o encontrar el nivel")
      return
    }

    // Crear ProgresoEspectador para cada espectador
    let creados = 0
    let ya_existen = 0

    for (const espectador of espectadores) {
      // Verificar si ya tiene progreso
      const progresoExistente = await prisma.progresoEspectador.findFirst({
        where: { 
          id_espectador: espectador.id_usuario,
          id_streamer: streamer.id_usuario
        }
      })

      if (!progresoExistente) {
        await prisma.progresoEspectador.create({
          data: {
            id_espectador: espectador.id_usuario,
            id_streamer: streamer.id_usuario,
            puntos_actuales: 1000, // 1000 puntos iniciales para jugar ruleta
            id_nivel_espectador: nivel.id_nivel_espectador
          }
        })
        console.log(`✓ Progreso creado para ${espectador.nombre}`)
        creados++
      } else {
        console.log(`✗ ${espectador.nombre} ya tiene progreso`)
        ya_existen++
      }
    }

    console.log(`\n✓ Proceso completado:`)
    console.log(`  - ${creados} nuevos registros creados`)
    console.log(`  - ${ya_existen} registros ya existentes`)
  } catch (error) {
    console.error("Error:", error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
