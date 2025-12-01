import bcrypt from "bcrypt"
import { PrismaClient } from "../generated/prisma"
import dotenv from "dotenv"

dotenv.config()

const prisma = new PrismaClient()
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || "10")

async function migratePasswords() {
    try {
        console.log("Iniciando migración de contraseñas...")
        
        const usuarios = await prisma.usuario.findMany()
        console.log(`Se encontraron ${usuarios.length} usuarios`)
        
        let migrados = 0
        let yaHasheados = 0
        
        for (const usuario of usuarios) {
            // Verificar si la contraseña ya está hasheada (bcrypt hash comienza con $2)
            if (usuario.contrasena_hash.startsWith("$2")) {
                console.log(`✓ ${usuario.email} - Ya está hasheado`)
                yaHasheados++
                continue
            }
            
            console.log(`Hasheando contraseña de ${usuario.email}...`)
            const contrasena_hash = await bcrypt.hash(usuario.contrasena_hash, BCRYPT_ROUNDS)
            
            await prisma.usuario.update({
                where: { id_usuario: usuario.id_usuario },
                data: { contrasena_hash }
            })
            
            console.log(`✓ ${usuario.email} - Contraseña hasheada`)
            migrados++
        }
        
        console.log(`\n=== Resumen ===`)
        console.log(`Contraseñas migradas: ${migrados}`)
        console.log(`Ya estaban hasheadas: ${yaHasheados}`)
        console.log(`Total: ${usuarios.length}`)
        
    } catch (error) {
        console.error("Error durante la migración:", error)
    } finally {
        await prisma.$disconnect()
    }
}

migratePasswords()
