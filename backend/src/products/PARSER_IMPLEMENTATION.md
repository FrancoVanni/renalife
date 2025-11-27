# 📋 Implementación del Parser de Excel - Renalife y Adisfarm

## ✅ Archivos Creados/Modificados

### Nuevos Archivos:
- `backend/src/products/products.parser.ts` - Lógica completa del parser

### Archivos Modificados:
- `backend/src/products/entities/product.entity.ts` - Agregados campos opcionales: `provider`, `origin`, `price_alt_usd`, `sheet`
- `backend/src/products/dto/create-product.dto.ts` - Agregados campos opcionales
- `backend/src/products/products.repository.ts` - Migración de base de datos y soporte para nuevos campos
- `backend/src/products/products.service.ts` - Métodos `uploadExcel()` y `confirmUpload()`
- `backend/src/products/products.controller.ts` - Endpoints `POST /products/upload` y `POST /products/confirm-upload`

---

## 🔍 Lógica de Detección

### 1. Detección de Fila de Headers

El parser busca la fila que contiene las palabras clave **"Unix"** y **"Descripción"** (case-insensitive).

```typescript
detectHeaderRow(rows: any[][]): number {
  // Busca en cada fila hasta encontrar una que contenga ambas palabras
  // Retorna el índice de la fila o -1 si no la encuentra
}
```

**Ejemplo de header válido:**
```
Unix | Descripción | Proveedor | Proced. | U$S C/IVA | U$S C/IVA
```

### 2. Detección de Categorías

Una fila es considerada **categoría** si:
- ✅ La **primera celda** contiene texto (no vacío)
- ✅ Las **demás celdas** están vacías o son `null`

**Ejemplo válido:**
```
FILTROS CAPILARES PARA HEMO.- Polyethersulfone-Medio y Alto flujo | [vacío] | [vacío] | [vacío] | [vacío] | [vacío]
```

**Lógica:**
```typescript
isCategoryRow(row: any[]): boolean {
  // Primera celda: texto no vacío
  // Celdas 1 en adelante: todas vacías/null
}
```

### 3. Detección de Productos

Una fila es considerada **producto** si:
- ✅ **Columna 0**: Código (no vacío, numérico o texto)
- ✅ **Columna 1**: Descripción (no vacío, string)
- ✅ **Columna 4**: Precio principal (número válido)
- ✅ **Columna 5**: Precio alternativo (puede estar vacío, pero si existe debe ser número)
- ✅ **Columnas 2 y 3**: Proveedor y Procedencia (strings, pueden estar vacíos)

**Ejemplo válido:**
```
5595 | AGUJA DE FISTULA 15 G | BIOTEQ | TAIWAN | 0.52 | 0.68
```

**Lógica:**
```typescript
isProductRow(row: any[]): boolean {
  // Valida que todas las columnas requeridas existan y tengan formato correcto
}
```

### 4. Normalización de Datos

**Precios:**
- Convierte coma (`,`) a punto (`.`)
- Remueve caracteres no numéricos
- Parsea a `float`

**Códigos:**
- Convierte a `string`
- Aplica `trim()`

**Descripciones, Proveedor, Origen:**
- Aplica `trim()`
- Maneja valores `null`/`undefined`

---

## 📊 Ejemplo de Preview

### Input (Excel):
```excel
[Fila 1-8: Encabezado administrativo - ignorado]

Unix | Descripción | Proveedor | Proced. | U$S C/IVA | U$S C/IVA
5595 | AGUJA DE FISTULA 15 G | BIOTEQ | TAIWAN | 0,52 | 0,68
6012 | FILTRO CAPILAR REUSABLE | NIPRO | JAPON | 12,50 | 14,00

AGUJAS DE FISTULA PARA HEMODIALISIS

5595 | AGUJA DE FISTULA 15 G | BIOTEQ | TAIWAN | 0,52 | 0,68
```

### Output (POST /products/upload):
```json
{
  "preview": [
    {
      "code": "5595",
      "name": "AGUJA DE FISTULA 15 G",
      "provider": "BIOTEQ",
      "origin": "TAIWAN",
      "price_usd": 0.52,
      "price_alt_usd": 0.68,
      "iva_included": true,
      "category": "Sin categoría",
      "sheet": "Sheet1"
    },
    {
      "code": "6012",
      "name": "FILTRO CAPILAR REUSABLE",
      "provider": "NIPRO",
      "origin": "JAPON",
      "price_usd": 12.50,
      "price_alt_usd": 14.00,
      "iva_included": true,
      "category": "Sin categoría",
      "sheet": "Sheet1"
    },
    {
      "code": "5595",
      "name": "AGUJA DE FISTULA 15 G",
      "provider": "BIOTEQ",
      "origin": "TAIWAN",
      "price_usd": 0.52,
      "price_alt_usd": 0.68,
      "iva_included": true,
      "category": "AGUJAS DE FISTULA PARA HEMODIALISIS",
      "sheet": "Sheet1"
    }
  ],
  "totalParsed": 3,
  "warnings": [],
  "byCategories": {
    "Sin categoría": 2,
    "AGUJAS DE FISTULA PARA HEMODIALISIS": 1
  }
}
```

### Confirmación (POST /products/confirm-upload):
```json
{
  "products": [
    {
      "code": "5595",
      "name": "AGUJA DE FISTULA 15 G",
      ...
    },
    ...
  ]
}
```

**Respuesta:**
```json
[
  {
    "id": 1,
    "code": "5595",
    "name": "AGUJA DE FISTULA 15 G",
    "category": "Sin categoría",
    "price_usd": 0.52,
    "iva_included": true,
    "provider": "BIOTEQ",
    "origin": "TAIWAN",
    "price_alt_usd": 0.68,
    "sheet": "Sheet1",
    "updated_at": "2024-01-15T10:30:00.000Z"
  },
  ...
]
```

---

## 🛡️ Manejo de Errores y Warnings

El parser genera warnings en los siguientes casos:

1. **Código vacío**: Si una fila de producto no tiene código
   ```
   "Sheet \"Sheet1\", fila 15: Código vacío"
   ```

2. **Precio no parseable**: Si el precio no se puede convertir a número
   ```
   "Sheet \"Sheet1\", fila 20: No se pudo parsear precio principal (abc)"
   ```

3. **Categoría duplicada**: Si una categoría aparece múltiples veces
   ```
   "Sheet \"Sheet1\", fila 25: Categoría duplicada \"FILTROS CAPILARES\""
   ```

4. **Error de normalización**: Errores generales al normalizar un producto
   ```
   "Sheet \"Sheet1\", fila 30: Error al normalizar producto: [error]"
   ```

5. **Headers no encontrados**: Si no se encuentra la fila de headers en una sheet
   ```
   "Sheet \"Sheet2\": No se encontró la fila de headers (Unix, Descripción)"
   ```

---

## 🔄 Flujo de Uso

### 1. Subir y Preview
```bash
POST /api/products/upload
Content-Type: multipart/form-data
Body: { file: <excel_file> }
```

**Respuesta:** Preview con productos parseados (NO guardados)

### 2. Confirmar y Guardar
```bash
POST /api/products/confirm-upload
Content-Type: application/json
Body: {
  "products": [ /* array de ParsedProduct */ ]
}
```

**Respuesta:** Array de productos guardados en la base de datos

---

## 💡 Recomendaciones para Casos Futuros

### 1. **Nuevas Categorías**
El parser detecta automáticamente nuevas categorías basándose en el patrón:
- Primera celda con texto
- Resto de celdas vacías

**No requiere cambios** si se mantiene este patrón.

### 2. **Cambio de Orden de Columnas**
Si cambia el orden de las columnas, actualizar `normalizeProduct()`:

```typescript
// Ejemplo si cambian las columnas:
const code = row[0];        // Puede cambiar a row[1]
const name = row[1];        // Puede cambiar a row[0]
const provider = row[2];    // Puede cambiar de posición
```

**Recomendación:** Agregar detección automática de columnas por nombre en lugar de índice fijo.

### 3. **Nuevos Campos**
Para agregar nuevos campos:

1. Actualizar `ParsedProduct` interface
2. Actualizar `Product` entity (agregar campo opcional)
3. Actualizar `CreateProductDto`
4. Actualizar `ProductsRepository.initDatabase()` (agregar columna)
5. Actualizar `normalizeProduct()` para extraer el nuevo campo

### 4. **Validaciones Adicionales**
Si necesitas validaciones más estrictas:

- **Códigos únicos por categoría**: Validar antes de guardar
- **Rangos de precios**: Validar que precios estén en rango aceptable
- **Formato de códigos**: Validar formato específico (ej: `[A-Z]{3}-\d{4}`)

### 5. **Múltiples Formatos de Archivo**
Si llegan archivos con formatos ligeramente diferentes:

```typescript
// Crear múltiples parsers
class RenalifeParser extends ProductsParser { ... }
class AdisfarmParser extends ProductsParser { ... }

// Detectar formato automáticamente
detectFormat(workbook: XLSX.WorkBook): 'renalife' | 'adisfarm' {
  // Basarse en nombre de sheet, headers específicos, etc.
}
```

### 6. **Performance para Archivos Grandes**
Si los archivos crecen mucho:

- **Streaming**: Procesar fila por fila en lugar de cargar todo en memoria
- **Batch inserts**: Insertar productos en lotes de 100-500 en lugar de uno por uno
- **Async processing**: Procesar sheets en paralelo (con Promise.all)

### 7. **Manejo de Duplicados**
Actualmente, si un código ya existe, se ignora silenciosamente.

**Opciones:**
- **Actualizar existente**: Si el producto ya existe, actualizarlo con nuevos datos
- **Reportar duplicados**: Listar todos los códigos duplicados en warnings
- **Merge de datos**: Combinar datos existentes con nuevos datos

---

## 🧪 Testing Recomendado

### Casos de Prueba:

1. ✅ Archivo con múltiples sheets
2. ✅ Headers en diferentes posiciones (fila 8, 10, 12)
3. ✅ Categorías con diferentes formatos de texto
4. ✅ Precios con coma y punto decimal
5. ✅ Productos sin categoría (antes de primera categoría)
6. ✅ Productos con categoría vacía
7. ✅ Filas vacías entre productos
8. ✅ Códigos numéricos y alfanuméricos
9. ✅ Productos con precio alternativo vacío
10. ✅ Archivo con errores (precios inválidos, códigos vacíos)

---

## 📝 Notas Técnicas

- El parser **ignora completamente** las primeras filas hasta encontrar los headers
- Las **filas vacías** se ignoran
- El **pie de página administrativo** se ignora automáticamente (se procesa hasta el final, pero solo categorías/productos son válidos)
- **Todos los sheets** se procesan automáticamente
- Los productos **sin categoría** se asignan a "Sin categoría"
- El campo `iva_included` siempre es `true` porque el archivo tiene "U$S C/IVA"

---

## 🔗 Endpoints Disponibles

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/products/upload` | Parsea Excel y devuelve preview |
| POST | `/api/products/confirm-upload` | Guarda productos en BD |
| GET | `/api/products` | Lista todos los productos |
| GET | `/api/products/:id` | Obtiene un producto |
| POST | `/api/products/:id/calc-price` | Calcula precio (CRUD existente) |

---

**Implementación completa y lista para producción** ✅

