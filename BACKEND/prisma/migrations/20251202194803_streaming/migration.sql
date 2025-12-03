/*
  Warnings:

  - The values [AMBOS,ADMIN] on the enum `UsuarioRol` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "UsuarioRol_new" AS ENUM ('ESPECTADOR', 'STREAMER');
ALTER TABLE "Usuario" ALTER COLUMN "rol" TYPE "UsuarioRol_new" USING ("rol"::text::"UsuarioRol_new");
ALTER TYPE "UsuarioRol" RENAME TO "UsuarioRol_old";
ALTER TYPE "UsuarioRol_new" RENAME TO "UsuarioRol";
DROP TYPE "public"."UsuarioRol_old";
COMMIT;