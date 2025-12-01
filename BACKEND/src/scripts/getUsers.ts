import { PrismaClient } from "../generated/prisma"

const prisma = new PrismaClient()

async function main() {
  const usuarios = await prisma.usuario.findMany({
    select: {
      id_usuario: true,
      nombre: true,
      email: true,
      rol: true
    },
    take: 5
  })
  
  console.log("Usuarios en la base de datos:")
  console.log(JSON.stringify(usuarios, null, 2))
  
  if (usuarios.length > 0) {
    console.log("\nUsando este ID para el test:")
    console.log(usuarios[0]?.id_usuario)
  } else {
    console.log("\nNo hay usuarios en la base de datos")
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
