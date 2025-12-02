-- Seed inserts para la base de datos local (PostgreSQL)
-- Ejecutar con: psql <connection_string> -f seed_inserts.sql

-- IDs usados en este seed (UUIDs fijos para referencia)
-- usuario espectador: 997800b7-14de-4c33-95ca-a551d5738eaa
-- usuario streamer:   1f4a9c2e-8b3c-4d2a-9f6b-2e1b3c4d5e6f
-- nivel streamer:     2c9b7e1a-3d4f-4b2a-8c6d-7e5f4a3b2c1d
-- nivel espectador:   3e7a1b2c-5d6f-4a3b-9d8c-6b5a4f3e2d1c
-- progreso:           4f6b2a1c-7d8e-4c5b-8a9f-1b2c3d4e5f6a
-- sesion:             5a1b2c3d-9e8f-4c6b-8d7a-2f3e4d5c6b7a
-- mensaje:            6b2c3d4e-1f2a-4d3b-9c8e-3a4b5c6d7e8f
-- regalo:             7c3d4e5f-2a1b-4e6c-8b9d-4c5d6e7f8a9b
-- envio:              8d4e5f6a-3b2c-4f7d-9a8c-5d6e7f8a9b0c
-- jugada:             9e5f6a7b-4c3d-4a8e-9b7c-6e7f8a9b0c1d
-- recarga:            a16f2b3c-5d4e-4b9a-8c7d-7f8a9b0c1d2e
-- notificacion:       b27e3c4d-6f5a-4c1b-9d8e-8a9b0c1d2e3f

BEGIN;

-- 1) Usuarios
INSERT INTO "Usuario" ("id_usuario","nombre","email","contrasena_hash","rol","fecha_registro","estado") VALUES
('997800b7-14de-4c33-95ca-a551d5738eaa','Juan Espectador','ulima@aloe.du.pe','$2b$10$aE7G9pQAQa5txhB71b5Q0el6cS82XWLYqYDz/YWvsXLroDMAinCvO','ESPECTADOR', NOW(), 'ACTIVO'),
('1f4a9c2e-8b3c-4d2a-9f6b-2e1b3c4d5e6f','Ana Streamer','ana@example.com','$2b$10$examplehash2','STREAMER', NOW(), 'ACTIVO');

-- 2) Perfiles
INSERT INTO "PerfilEspectador" ("id_usuario","saldo_monedas","fecha_creacion") VALUES
('997800b7-14de-4c33-95ca-a551d5738eaa', 250, NOW());

INSERT INTO "PerfilStreamer" ("id_usuario","horas_transmitidas_total","id_nivel_streamer","fecha_creacion") VALUES
('1f4a9c2e-8b3c-4d2a-9f6b-2e1b3c4d5e6f', 120, '2c9b7e1a-3d4f-4b2a-8c6d-7e5f4a3b2c1d', NOW());

-- 3) Niveles
INSERT INTO "NivelStreamer" ("id_nivel_streamer","nombre_nivel","orden","horas_requeridas") VALUES
('2c9b7e1a-3d4f-4b2a-8c6d-7e5f4a3b2c1d','Master Streamer',1,100);

INSERT INTO "NivelEspectador" ("id_nivel_espectador","id_streamer","nombre_nivel","orden","puntos_requeridos","activo") VALUES
('3e7a1b2c-5d6f-4a3b-9d8c-6b5a4f3e2d1c','1f4a9c2e-8b3c-4d2a-9f6b-2e1b3c4d5e6f','Fan Inicial',1,0, true);

-- 4) Progreso de espectador
INSERT INTO "ProgresoEspectador" ("id_progreso","id_espectador","id_streamer","puntos_actuales","id_nivel_espectador","fecha_hora") VALUES
('4f6b2a1c-7d8e-4c5b-8a9f-1b2c3d4e5f6a','997800b7-14de-4c33-95ca-a551d5738eaa','1f4a9c2e-8b3c-4d2a-9f6b-2e1b3c4d5e6f', 120, '3e7a1b2c-5d6f-4a3b-9d8c-6b5a4f3e2d1c', NOW());

-- 5) Sesion y mensajes
INSERT INTO "SesionStreaming" ("id_sesion","id_streamer","titulo","fecha_inicio","fecha_fin","duracion_minutos") VALUES
('5a1b2c3d-9e8f-4c6b-8d7a-2f3e4d5c6b7a','1f4a9c2e-8b3c-4d2a-9f6b-2e1b3c4d5e6f','Stream de prueba', NOW(), NULL, NULL);

INSERT INTO "MensajeChat" ("id_mensaje","id_sesion","id_espectador","contenido","fecha_hora","puntos_otorgados") VALUES
('6b2c3d4e-1f2a-4d3b-9c8e-3a4b5c6d7e8f','5a1b2c3d-9e8f-4c6b-8d7a-2f3e4d5c6b7a','997800b7-14de-4c33-95ca-a551d5738eaa','¡Buen stream!', NOW(), 5);

-- 6) Regalos y envíos
INSERT INTO "Regalo" ("id_regalo","id_streamer","nombre","costo_monedas","puntos_otorgados","activo") VALUES
('7c3d4e5f-2a1b-4e6c-8b9d-4c5d6e7f8a9b','1f4a9c2e-8b3c-4d2a-9f6b-2e1b3c4d5e6f','Corazón',50,10,true);

INSERT INTO "EnvioRegalo" ("id_envio","id_regalo","id_espectador","id_streamer","id_sesion","cantidad","monedas_usadas","puntos_otorgados","fecha_hora") VALUES
('8d4e5f6a-3b2c-4f7d-9a8c-5d6e7f8a9b0c','7c3d4e5f-2a1b-4e6c-8b9d-4c5d6e7f8a9b','997800b7-14de-4c33-95ca-a551d5738eaa','1f4a9c2e-8b3c-4d2a-9f6b-2e1b3c4d5e6f','5a1b2c3d-9e8f-4c6b-8d7a-2f3e4d5c6b7a',1,50,10,NOW());

-- 7) Ruleta, recarga y notificación
INSERT INTO "JugadaRuleta" ("id_jugada","id_espectador","id_streamer","puntos_apostados","resultado_segmento","monedas_ganadas","puntos_convertidos","fecha_hora") VALUES
('9e5f6a7b-4c3d-4a8e-9b7c-6e7f8a9b0c1d','997800b7-14de-4c33-95ca-a551d5738eaa','1f4a9c2e-8b3c-4d2a-9f6b-2e1b3c4d5e6f', 20, 'ROJO', 40, 4, NOW());

INSERT INTO "RecargaMonedas" ("id_recarga","id_espectador","monedas_compradas","monto_pagado","moneda","pasarela","codigo_comprobante","estado","fecha_hora") VALUES
('a16f2b3c-5d4e-4b9a-8c7d-7f8a9b0c1d2e','997800b7-14de-4c33-95ca-a551d5738eaa', 500, 4.99, 'USD', 'stripe', 'RCPT12345', 'COMPLETED', NOW());

INSERT INTO "Notificacion" ("id_notificacion","id_usuario","tipo","mensaje","leido","fecha_hora") VALUES
('b27e3c4d-6f5a-4c1b-9d8e-8a9b0c1d2e3f','997800b7-14de-4c33-95ca-a551d5738eaa','REGALO_RECIBIDO','Has recibido un regalo de Ana Streamer', false, NOW());

COMMIT;

-- Fin del seed
