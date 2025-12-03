-- Archivo: BACKEND/data/seed_add_nivel_espectador.sql
-- Inserta un NivelEspectador para un streamer concreto.
-- Reemplaza <UUID_NIVEL>, <UUID_STREAMER> por valores reales.

-- Opción A: insertar con UUID explícito
INSERT INTO "NivelEspectador" ("id_nivel_espectador", "id_streamer", "nombre_nivel", "orden", "puntos_requeridos", "activo")
VALUES ('<UUID_NIVEL>', '<UUID_STREAMER>', 'Inicial', 1, 0, true);

-- Opción B: usar función para generar UUID (si tu DB tiene uuid-ossp)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- INSERT INTO "NivelEspectador" ("id_nivel_espectador", "id_streamer", "nombre_nivel", "orden", "puntos_requeridos", "activo")
-- VALUES (uuid_generate_v4(), '<UUID_STREAMER>', 'Inicial', 1, 0, true);

-- Opción C: insertar solo si no existe un NivelEspectador para ese streamer
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "NivelEspectador" WHERE "id_streamer" = '<UUID_STREAMER>') THEN
    INSERT INTO "NivelEspectador" ("id_nivel_espectador", "id_streamer", "nombre_nivel", "orden", "puntos_requeridos", "activo")
    VALUES ('<UUID_NIVEL>', '<UUID_STREAMER>', 'Inicial', 1, 0, true);
  END IF;
END
$$;

-- Ejemplo de uso con psql (Windows PowerShell):
-- psql "postgresql://USER:PASSWORD@HOST:PORT/DATABASE" -f BACKEND/data/seed_add_nivel_espectador.sql

-- Notas:
-- - Prisma genera tablas con nombres tal cual aparecen en el schema. Si tu esquema fue personalizado o usaste un schema diferente, ajusta los nombres de tabla/columnas.
-- - Reemplaza los marcadores <UUID_NIVEL> y <UUID_STREAMER> antes de ejecutar, o activa uuid-ossp y usa uuid_generate_v4().
-- - Si tu base de datos está en Render Postgres, puedes ejecutar este SQL desde el panel de 'Databases' -> 'Connect' -> usar psql remoto o su UI para ejecutar queries.
