# Scripts Administrativos - Backend Tistos

Estos scripts son herramientas útiles para tareas administrativas del backend. No son necesarios para el funcionamiento normal de la aplicación.

## Disponibles

### 1. Migrar Contraseñas Hasheadas
**Comando:** `npm run migrate:passwords`

Hashea todas las contraseñas que estén en texto plano en la base de datos.

**Casos de uso:**
- Después de agregar bcrypt a un proyecto existente
- Para migrar datos de otra base de datos

**Qué hace:**
- Detecta contraseñas sin hashear (no comienzan con `$2`)
- Las hashea con bcrypt (10 rondas)
- Actualiza la base de datos
- Muestra un resumen de lo migrado

### 2. Actualizar Contraseña de Usuario
**Comando:** `npm run update:password`

Cambia la contraseña de un usuario existente (útil en caso de olvido o reset).

**Qué hace:**
- Solicita el email del usuario
- Solicita la nueva contraseña
- Hashea la nueva contraseña
- Actualiza en la base de datos

**Ejemplo de uso:**
```bash
npm run update:password
> Ingresa el email del usuario: juan@example.com
> Ingresa la nueva contraseña: nuevacontraseña123
> ✓ Contraseña actualizada para juan@example.com
```

## Estructura

```
src/
├── index.ts              # API principal (todos los endpoints)
├── scripts/
│   ├── migratePasswords.ts
│   └── updatePassword.ts
└── generated/            # Generado por Prisma
```

## Notas

- Los scripts usan Prisma ORM para acceder a la base de datos
- Las contraseñas siempre se hashean con bcrypt
- Los scripts se desconectan automáticamente de la base de datos al terminar
