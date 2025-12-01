import { PrismaClient } from "../generated/prisma"

const prisma = new PrismaClient()

async function main() {
  try {
    console.log("Creando progreso para TODOS los usuarios...\n")

    // Obtener todos los usuarios
    const usuarios = await prisma.usuario.findMany()
    console.log(`Encontrados ${usuarios.length} usuarios`)

    // Obtener un streamer
    const streamer = await prisma.usuario.findFirst({
      where: { rol: "STREAMER" }
    })

    if (!streamer) {
      console.log("❌ No hay streamers en la base de datos.")
      return
    }

    console.log(`Streamer seleccionado: ${streamer.nombre}\n`)

    // Obtener o crear el nivel Bronce
    let nivel = await prisma.nivelEspectador.findFirst({
      where: { 
        id_streamer: streamer.id_usuario,
        nombre_nivel: "Bronce"
      }
    })

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

      nivel = await prisma.nivelEspectador.findFirst({
        where: { 
          id_streamer: streamer.id_usuario,
          nombre_nivel: "Bronce"
        }
      })
    }

    if (!nivel) {
      console.log("❌ No se pudo crear el nivel")
      return
    }

    // Crear progreso para TODOS los usuarios (incluyendo streamers)
    let creados = 0
    let ya_existen = 0

    for (const usuario of usuarios) {
      // Verificar si ya tiene progreso con este streamer
      const progresoExistente = await prisma.progresoEspectador.findFirst({
        where: { 
          id_espectador: usuario.id_usuario,
          id_streamer: streamer.id_usuario
        }
      })

      if (!progresoExistente) {
        await prisma.progresoEspectador.create({
          data: {
            id_espectador: usuario.id_usuario,
            id_streamer: streamer.id_usuario,
            puntos_actuales: 1000,
            id_nivel_espectador: nivel.id_nivel_espectador
          }
        })
        console.log(`✓ Progreso creado: ${usuario.nombre}`)
        creados++
      } else {
        ya_existen++
      }
    }

    console.log(`\n✓ Completado:`)
    console.log(`  - ${creados} nuevos registros`)
    console.log(`  - ${ya_existen} registros ya existentes`)
    
  } catch (error) {
    console.error("Error:", error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
