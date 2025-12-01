-- CreateEnum
CREATE TYPE "UsuarioRol" AS ENUM ('ESPECTADOR', 'STREAMER', 'AMBOS', 'ADMIN');

-- CreateEnum
CREATE TYPE "UsuarioEstado" AS ENUM ('ACTIVO', 'INACTIVO');

-- CreateEnum
CREATE TYPE "TipoNotificacion" AS ENUM ('NIVEL_ESPECTADOR_SUBIDO', 'NIVEL_STREAMER_SUBIDO', 'REGALO_RECIBIDO');

-- CreateTable
CREATE TABLE "Usuario" (
    "id_usuario" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "contrasena_hash" TEXT NOT NULL,
    "rol" "UsuarioRol" NOT NULL,
    "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" "UsuarioEstado" NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "PerfilEspectador" (
    "id_usuario" TEXT NOT NULL,
    "saldo_monedas" INTEGER NOT NULL,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerfilEspectador_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "PerfilStreamer" (
    "id_usuario" TEXT NOT NULL,
    "horas_transmitidas_total" INTEGER NOT NULL,
    "id_nivel_streamer" TEXT,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerfilStreamer_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "NivelStreamer" (
    "id_nivel_streamer" TEXT NOT NULL,
    "nombre_nivel" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "horas_requeridas" INTEGER NOT NULL,

    CONSTRAINT "NivelStreamer_pkey" PRIMARY KEY ("id_nivel_streamer")
);

-- CreateTable
CREATE TABLE "NivelEspectador" (
    "id_nivel_espectador" TEXT NOT NULL,
    "id_streamer" TEXT NOT NULL,
    "nombre_nivel" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "puntos_requeridos" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "NivelEspectador_pkey" PRIMARY KEY ("id_nivel_espectador")
);

-- CreateTable
CREATE TABLE "ProgresoEspectador" (
    "id_progreso" TEXT NOT NULL,
    "id_espectador" TEXT NOT NULL,
    "id_streamer" TEXT NOT NULL,
    "puntos_actuales" INTEGER NOT NULL,
    "id_nivel_espectador" TEXT NOT NULL,
    "fecha_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgresoEspectador_pkey" PRIMARY KEY ("id_progreso")
);

-- CreateTable
CREATE TABLE "SesionStreaming" (
    "id_sesion" TEXT NOT NULL,
    "id_streamer" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3),
    "duracion_minutos" INTEGER,

    CONSTRAINT "SesionStreaming_pkey" PRIMARY KEY ("id_sesion")
);

-- CreateTable
CREATE TABLE "MensajeChat" (
    "id_mensaje" TEXT NOT NULL,
    "id_sesion" TEXT NOT NULL,
    "id_espectador" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "fecha_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "puntos_otorgados" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "MensajeChat_pkey" PRIMARY KEY ("id_mensaje")
);

-- CreateTable
CREATE TABLE "Regalo" (
    "id_regalo" TEXT NOT NULL,
    "id_streamer" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "costo_monedas" INTEGER NOT NULL,
    "puntos_otorgados" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Regalo_pkey" PRIMARY KEY ("id_regalo")
);

-- CreateTable
CREATE TABLE "EnvioRegalo" (
    "id_envio" TEXT NOT NULL,
    "id_regalo" TEXT NOT NULL,
    "id_espectador" TEXT NOT NULL,
    "id_streamer" TEXT NOT NULL,
    "id_sesion" TEXT,
    "cantidad" INTEGER NOT NULL,
    "monedas_usadas" INTEGER NOT NULL,
    "puntos_otorgados" INTEGER NOT NULL,
    "fecha_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnvioRegalo_pkey" PRIMARY KEY ("id_envio")
);

-- CreateTable
CREATE TABLE "JugadaRuleta" (
    "id_jugada" TEXT NOT NULL,
    "id_espectador" TEXT NOT NULL,
    "id_streamer" TEXT,
    "puntos_apostados" INTEGER NOT NULL,
    "resultado_segmento" TEXT NOT NULL,
    "monedas_ganadas" INTEGER NOT NULL,
    "puntos_convertidos" INTEGER NOT NULL,
    "fecha_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JugadaRuleta_pkey" PRIMARY KEY ("id_jugada")
);

-- CreateTable
CREATE TABLE "RecargaMonedas" (
    "id_recarga" TEXT NOT NULL,
    "id_espectador" TEXT NOT NULL,
    "monedas_compradas" INTEGER NOT NULL,
    "monto_pagado" DOUBLE PRECISION NOT NULL,
    "moneda" TEXT NOT NULL,
    "pasarela" TEXT NOT NULL,
    "codigo_comprobante" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "fecha_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecargaMonedas_pkey" PRIMARY KEY ("id_recarga")
);

-- CreateTable
CREATE TABLE "Notificacion" (
    "id_notificacion" TEXT NOT NULL,
    "id_usuario" TEXT NOT NULL,
    "tipo" "TipoNotificacion" NOT NULL,
    "mensaje" TEXT NOT NULL,
    "leido" BOOLEAN NOT NULL DEFAULT false,
    "fecha_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notificacion_pkey" PRIMARY KEY ("id_notificacion")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ProgresoEspectador_id_espectador_id_streamer_key" ON "ProgresoEspectador"("id_espectador", "id_streamer");

-- AddForeignKey
ALTER TABLE "PerfilEspectador" ADD CONSTRAINT "PerfilEspectador_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerfilStreamer" ADD CONSTRAINT "PerfilStreamer_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerfilStreamer" ADD CONSTRAINT "PerfilStreamer_id_nivel_streamer_fkey" FOREIGN KEY ("id_nivel_streamer") REFERENCES "NivelStreamer"("id_nivel_streamer") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NivelEspectador" ADD CONSTRAINT "NivelEspectador_id_streamer_fkey" FOREIGN KEY ("id_streamer") REFERENCES "Usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgresoEspectador" ADD CONSTRAINT "ProgresoEspectador_id_espectador_fkey" FOREIGN KEY ("id_espectador") REFERENCES "Usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgresoEspectador" ADD CONSTRAINT "ProgresoEspectador_id_streamer_fkey" FOREIGN KEY ("id_streamer") REFERENCES "Usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgresoEspectador" ADD CONSTRAINT "ProgresoEspectador_id_nivel_espectador_fkey" FOREIGN KEY ("id_nivel_espectador") REFERENCES "NivelEspectador"("id_nivel_espectador") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SesionStreaming" ADD CONSTRAINT "SesionStreaming_id_streamer_fkey" FOREIGN KEY ("id_streamer") REFERENCES "Usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MensajeChat" ADD CONSTRAINT "MensajeChat_id_sesion_fkey" FOREIGN KEY ("id_sesion") REFERENCES "SesionStreaming"("id_sesion") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MensajeChat" ADD CONSTRAINT "MensajeChat_id_espectador_fkey" FOREIGN KEY ("id_espectador") REFERENCES "Usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Regalo" ADD CONSTRAINT "Regalo_id_streamer_fkey" FOREIGN KEY ("id_streamer") REFERENCES "Usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnvioRegalo" ADD CONSTRAINT "EnvioRegalo_id_regalo_fkey" FOREIGN KEY ("id_regalo") REFERENCES "Regalo"("id_regalo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnvioRegalo" ADD CONSTRAINT "EnvioRegalo_id_espectador_fkey" FOREIGN KEY ("id_espectador") REFERENCES "Usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnvioRegalo" ADD CONSTRAINT "EnvioRegalo_id_streamer_fkey" FOREIGN KEY ("id_streamer") REFERENCES "Usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnvioRegalo" ADD CONSTRAINT "EnvioRegalo_id_sesion_fkey" FOREIGN KEY ("id_sesion") REFERENCES "SesionStreaming"("id_sesion") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JugadaRuleta" ADD CONSTRAINT "JugadaRuleta_id_espectador_fkey" FOREIGN KEY ("id_espectador") REFERENCES "Usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JugadaRuleta" ADD CONSTRAINT "JugadaRuleta_id_streamer_fkey" FOREIGN KEY ("id_streamer") REFERENCES "Usuario"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecargaMonedas" ADD CONSTRAINT "RecargaMonedas_id_espectador_fkey" FOREIGN KEY ("id_espectador") REFERENCES "Usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacion" ADD CONSTRAINT "Notificacion_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;
