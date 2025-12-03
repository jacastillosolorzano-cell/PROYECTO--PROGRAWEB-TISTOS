import bcrypt from "bcrypt"
import { PrismaClient } from "../generated/prisma"
import dotenv from "dotenv"
import * as readline from "readline"

dotenv.config()

const prisma = new PrismaClient()
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || "10")

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

function question(prompt: string): Promise<string> {
    return new Promise((resolve) => {
        rl.question(prompt, (answer) => {
            resolve(answer)
        })
    })
}

async function updateUserPassword() {
    try {
        const email = await question("Ingresa el email del usuario: ")
        const contraOriginal = await question("Ingresa la nueva contraseña: ")
        
        const usuario = await prisma.usuario.findFirst({
            where: { email }
        })
        
        if (!usuario) {
            console.log("❌ Usuario no encontrado")
            return
        }
        
        const contrasena_hash = await bcrypt.hash(contraOriginal, BCRYPT_ROUNDS)
        
        await prisma.usuario.update({
            where: { id_usuario: usuario.id_usuario },
            data: { contrasena_hash }
        })
        
        console.log(`✓ Contraseña actualizada para ${email}`)
        
    } catch (error) {
        console.error("Error:", error)
    } finally {
        await prisma.$disconnect()
        rl.close()
    }
}

updateUserPassword()
