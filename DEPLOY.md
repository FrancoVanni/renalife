# 🚀 Guía de Deploy - Render + Vercel

## ✅ Render + Vercel: Excelente Elección

**Render** es perfecto para NestJS porque:
- ✅ Soporte nativo de Node.js
- ✅ Deploy automático desde Git
- ✅ Variables de entorno fáciles
- ✅ Logs en tiempo real
- ✅ Plan gratuito disponible

**Vercel** es ideal para React porque:
- ✅ Deploy ultra-rápido
- ✅ CDN global automático
- ✅ SSL automático
- ✅ Plan gratuito generoso
- ✅ Integración perfecta con React/Vite

## 📋 Pasos para Deploy

### 1. Backend en Render

1. **Crear cuenta en Render**: https://render.com
2. **Nuevo Web Service**:
   - Conecta tu repositorio de GitHub
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:prod`

3. **Variables de Entorno**:
   ```
   NODE_ENV=production
   PORT=10000
   FRONTEND_URL=https://tu-app.vercel.app
   ```

4. **Nota sobre SQLite**:
   - Render usa filesystem efímero (se borra en cada deploy)
   - **Solución temporal**: Usamos `/tmp/sqlite.db` que persiste entre deploys
   - **Recomendación futura**: Migrar a PostgreSQL (Render tiene plan gratis)

### 2. Frontend en Vercel

1. **Crear cuenta en Vercel**: https://vercel.com
2. **Importar proyecto**:
   - Conecta tu repositorio de GitHub
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
   - Vercel detecta automáticamente la configuración

3. **Variables de Entorno** (si las necesitas):
   ```
   VITE_API_URL=https://tu-backend.onrender.com/api
   ```

4. **Actualizar API_BASE en frontend**:
   - El archivo `frontend/src/api/*.ts` usa `/api` como base
   - En producción, necesitas configurar un proxy o cambiar a la URL completa

### 3. Configurar CORS y Proxy

**Opción A: Proxy en Vercel (Recomendado)**

Crear `vercel.json` en la raíz del proyecto frontend:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://tu-backend.onrender.com/api/:path*"
    }
  ]
}
```

**Opción B: Cambiar API_BASE en producción**

Modificar `frontend/src/api/products.ts` (y otros archivos de API):

```typescript
const API_BASE = import.meta.env.VITE_API_URL || '/api';
```

Y agregar en Vercel:
```
VITE_API_URL=https://tu-backend.onrender.com/api
```

## ⚠️ Consideraciones Importantes

### SQLite en Producción

**Problema**: SQLite no es ideal para producción en servicios cloud porque:
- El filesystem puede ser efímero
- No escala bien con múltiples instancias
- Puede perder datos en deploys

**Solución Actual**: 
- Usamos `/tmp/sqlite.db` que persiste entre deploys en Render
- Funciona para una sola instancia

**Recomendación Futura**:
- Migrar a PostgreSQL (Render tiene plan gratis)
- O usar un servicio de almacenamiento persistente

### Base de Datos

Si quieres migrar a PostgreSQL más adelante:
1. Crear base de datos PostgreSQL en Render (gratis)
2. Instalar `pg` y `@nestjs/typeorm` o `@nestjs/sequelize`
3. Cambiar `DatabaseService` para usar PostgreSQL

## 🔧 Comandos Útiles

### Ver logs en Render:
```bash
# Desde el dashboard de Render
# O usando CLI de Render
```

### Ver logs en Vercel:
```bash
vercel logs
```

## 📝 Checklist Pre-Deploy

- [x] Script `start:prod` corregido
- [x] CORS configurado para producción
- [x] SQLite usando `/tmp` en producción
- [ ] Variables de entorno configuradas
- [ ] Proxy de Vercel configurado (vercel.json)
- [ ] Probar localmente con `npm run build && npm run start:prod`

## 🎯 URLs Finales

- **Backend**: `https://tu-backend.onrender.com`
- **Frontend**: `https://tu-app.vercel.app`
- **API**: `https://tu-backend.onrender.com/api`

## 💡 Tips

1. **Primer deploy**: Puede tardar 5-10 minutos en Render
2. **Cold starts**: Render puede tener "cold starts" en plan gratis (primera request lenta)
3. **Monitoreo**: Usa los logs de Render para ver errores
4. **Backups**: Considera hacer backups periódicos de la base de datos

