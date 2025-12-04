// src/prisma/client.ts
import { PrismaClient } from "../generated/prisma/index.js";
import { PrismaClientKnownRequestError } from "../generated/prisma/runtime/library.js";

export const prisma = new PrismaClient();

export { PrismaClientKnownRequestError };
