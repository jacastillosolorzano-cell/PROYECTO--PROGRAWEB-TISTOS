# Mejoras de Seguridad Implementadas

## 1. Hashing de Contraseñas con Bcrypt

### Backend (`src/index.ts`)
- Instalado **bcrypt** para hashear contraseñas de forma segura
- Las contraseñas se hashean con **10 rondas** (BCRYPT_ROUNDS) configurable

**Cambios:**
- **POST `/usuarios/crear`**: Hashea la contraseña antes de guardarla
- **POST `/login`**: Usa `bcrypt.compare()` para validar contraseñas de forma segura
- **POST `/usuarios/actualizar`**: Hashea la nueva contraseña si se proporciona
- Las respuestas nunca retornan el `contrasena_hash`

## 2. Variables de Entorno

### Backend
Archivo `.env`:
```
DATABASE_URL=postgres://tistos:posgres@localhost:5432/tistosdb
PORT=5002
JWT_SECRET=tu_clave_secreta_muy_segura_cambiar_en_produccion
BCRYPT_ROUNDS=10
```

**Archivo `.env.example`** documenta las variables necesarias sin valores sensibles.

### Frontend
Archivo `.env`:
```
VITE_BACKEND_URL=http://localhost:5002
```

Archivo `src/config.tsx` actualizado para usar:
```typescript
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5002"
```

## 3. .gitignore Actualizado

### Backend
- Añadido `.env` y `.env.local` para no versionar credenciales

### Frontend
- Añadido `.env`, `.env.local` y `.env.*.local` para no versionar variables sensibles

## 4. Mejoras Adicionales de Seguridad

✅ **Validación de entrada**: Los endpoints validan que los datos requeridos existan
✅ **Mensajes de error genéricos**: El endpoint de login devuelve "Credenciales inválidas" sin revelar si el email existe
✅ **Manejo de errores seguro**: Se capturan excepciones sin exponer información sensible
✅ **Sin instancias múltiples de PrismaClient**: Usando instancia única
✅ **Contraseñas nunca en logs**: Solo hashes se almacenan

## Próximos pasos recomendados

1. **JWT Tokens**: Implementar autenticación basada en tokens JWT
2. **HTTPS**: Usar HTTPS en producción
3. **Rate Limiting**: Implementar límite de intentos de login
4. **Validación de email**: Confirmar email del usuario
5. **Contraseña fuerte**: Validar requisitos de contraseña (longitud, caracteres especiales, etc.)
6. **2FA**: Implementar autenticación de dos factores
7. **Audit Logs**: Registrar intentos de login fallidos
