# Especificación de Endpoints Backend

## Base URL

```
http://localhost:3000/api
```

---

## 1. GET `/api/indicadores`

### Descripción

Retorna la lista de todos los indicadores disponibles.

### Respuesta (200 OK)

```json
[
  {
    "id": "SOC_1",
    "nombre": "Continuidad del servicio",
    "dimension": "Social",
    "dimLabel": "DIMENSIÓN SOCIAL: INDICADOR 1",
    "preguntas": ["P07", "P08", "P09", "P10"]
  },
  {
    "id": "SOC_2",
    "nombre": "Calidad percibida del agua",
    "dimension": "Social",
    "dimLabel": "DIMENSIÓN SOCIAL: INDICADOR 2",
    "preguntas": ["P11", "P12", "P13", "P14"]
  },
  {
    "id": "SOC_3",
    "nombre": "Condiciones sanitarias",
    "dimension": "Social",
    "dimLabel": "DIMENSIÓN SOCIAL: INDICADOR 3",
    "preguntas": ["P15", "P16"]
  },
  {
    "id": "ECO_1",
    "nombre": "Gestión y mantenimiento",
    "dimension": "Económico",
    "dimLabel": "DIMENSIÓN ECONÓMICA: INDICADOR 1",
    "preguntas": ["P17", "P18", "P19"]
  },
  {
    "id": "ECO_2",
    "nombre": "Sostenibilidad financiera",
    "dimension": "Económico",
    "dimLabel": "DIMENSIÓN ECONÓMICA: INDICADOR 2",
    "preguntas": ["P20", "P21", "P22", "P23"]
  },
  {
    "id": "ECO_3",
    "nombre": "Reducción de enfermedades y mejora del bienestar infantil",
    "dimension": "Económico",
    "dimLabel": "DIMENSIÓN ECONÓMICA: INDICADOR 3",
    "preguntas": ["P24", "P25", "P26", "P27"]
  },
  {
    "id": "TEC_1",
    "nombre": "Ahorro económico",
    "dimension": "Técnico",
    "dimLabel": "DIMENSIÓN TÉCNICA: INDICADOR 1",
    "preguntas": ["P28", "P29"]
  },
  {
    "id": "TEC_2",
    "nombre": "Aprovechamiento del tiempo",
    "dimension": "Técnico",
    "dimLabel": "DIMENSIÓN TÉCNICA: INDICADOR 2",
    "preguntas": ["P30", "P31", "P32", "P33"]
  },
  {
    "id": "TEC_3",
    "nombre": "Participación comunitaria",
    "dimension": "Técnico",
    "dimLabel": "DIMENSIÓN TÉCNICA: INDICADOR 3",
    "preguntas": ["P07", "P08", "P09"]
  }
]
```

### Notas

- Este endpoint puede ser **cacheado** en memoria (no cambia frecuentemente)
- El array debe mantener el **orden de dimensiones y números**

---

## 2. GET `/api/indicadores/:id/data`

### Descripción

Retorna los datos temporales de un indicador específico para una ubicación geográfica.

### Parámetros de Query

| Parámetro   | Tipo   | Requerido | Descripción                                                  |
| ----------- | ------ | --------- | ------------------------------------------------------------ |
| `geoId`     | string | Sí        | Identificador geográfico (código UBIGEO, provincia, etc.)    |
| `geoNombre` | string | No        | Nombre del centro poblado (para validar si hay datos reales) |

### Ejemplos de Llamada

```
GET /api/indicadores/SOC_1/data?geoId=PERU&geoNombre=Nacional
GET /api/indicadores/SOC_1/data?geoId=06&geoNombre=Cajamarca
GET /api/indicadores/SOC_1/data?geoId=060104&geoNombre=Corralcucho
```

### Respuesta (200 OK)

```json
{
  "fuente": "real",
  "fechas": ["Ene. 2024", "Feb. 2024", "Mar. 2024", "Abr. 2024", "May. 2024"],
  "desde": "Ene. 2024",
  "hasta": "May. 2024",
  "n": 64,
  "preguntas": [
    {
      "codigo": "P07",
      "texto": "Agua ayudó a mantener la casa limpia y mejorar higiene familiar",
      "valores": [4.77, 4.75, 4.78, 4.76, 4.77],
      "promedio": 4.77,
      "n": 64
    },
    {
      "codigo": "P08",
      "texto": "Más fácil conseguir agua que antes del proyecto",
      "valores": [4.7, 4.68, 4.71, 4.69, 4.7],
      "promedio": 4.7,
      "n": 64
    },
    {
      "codigo": "P09",
      "texto": "Sistema evita que excretas estén al aire libre o contacto con animales",
      "valores": [3.92, 3.9, 3.93, 3.91, 3.92],
      "promedio": 3.92,
      "n": 64
    },
    {
      "codigo": "P10",
      "texto": "Agua libre de contaminación desde captación hasta grifo",
      "valores": [5.0, 5.0, 5.0, 5.0, 5.0],
      "promedio": 5.0,
      "n": 64
    }
  ],
  "promedioTotal": 4.6,
  "geoNombre": "Corralcucho"
}
```

### Campos Requeridos

#### En respuesta principal:

- `fuente` (string): "real" o "simulado"
- `fechas` (array): Fechas en formato "Mes. Año" (ej: "Ene. 2024", "May. 2026")
- `desde` (string): Primera fecha
- `hasta` (string): Última fecha
- `n` (number): Número total de encuestados
- `preguntas` (array): Array de preguntas con sus datos
- `promedioTotal` (number): Promedio de todos los promedios (1-5)
- `geoNombre` (string): Nombre de la ubicación

#### En cada pregunta:

- `codigo` (string): P07, P08, etc. (debe coincidir con id del indicador)
- `texto` (string): Texto completo de la pregunta
- `valores` (array): Valores mensales (números 1-5)
- `promedio` (number): Promedio de `valores`
- `n` (number): Número de respondentes para esta pregunta

### Lógica Esperada

```javascript
if (
  geoNombre.toLowerCase().includes("corralcucho") ||
  geoNombre.toLowerCase().includes("llushcapampa")
) {
  // Retornar datos reales de base de datos (fuente: "real")
} else {
  // Generar o retornar datos simulados (fuente: "simulado")
}
```

### Errores

- **400 Bad Request**: Si falta `geoId` o `indicadorId` no válido
- **404 Not Found**: Si no hay datos para esa combinación
- **500 Server Error**: Error en el servidor

---

## 3. GET `/api/mapa/valores`

### Descripción

Retorna valores de todos los departamentos para la coropleta del mapa.

### Parámetros de Query

| Parámetro     | Tipo   | Requerido | Descripción                           |
| ------------- | ------ | --------- | ------------------------------------- |
| `indicadorId` | string | Sí        | ID del indicador (SOC_1, ECO_2, etc.) |

### Ejemplo de Llamada

```
GET /api/mapa/valores?indicadorId=SOC_1
```

### Respuesta (200 OK)

```json
[
  {
    "deptCode": "01",
    "valor": 3.45,
    "esReal": false
  },
  {
    "deptCode": "02",
    "valor": 3.67,
    "esReal": false
  },
  {
    "deptCode": "03",
    "valor": 2.89,
    "esReal": false
  },
  {
    "deptCode": "04",
    "valor": 4.12,
    "esReal": false
  },
  {
    "deptCode": "05",
    "valor": 3.56,
    "esReal": false
  },
  {
    "deptCode": "06",
    "valor": 4.60,
    "esReal": true
  },
  ...
  {
    "deptCode": "25",
    "valor": 3.78,
    "esReal": false
  }
]
```

### Campos

- `deptCode` (string): Código INEI de departamento (01-25, siempre como string)
- `valor` (number): Promedio para ese departamento (1-5)
- `esReal` (boolean): true si el valor viene de datos reales, false si es simulado

### Códigos de Departamentos

```
01: Amazonas
02: Áncash
03: Apurímac
04: Arequipa
05: Ayacucho
06: Cajamarca
07: Callao
08: Cusco
09: Huancavelica
10: Huánuco
11: Ica
12: Junín
13: La Libertad
14: Lambayeque
15: Lima
16: Loreto
17: Madre de Dios
18: Moquegua
19: Pasco
20: Piura
21: Puno
22: San Martín
23: Tacna
24: Tumbes
25: Ucayali
```

### Notas

- Actualmente solo departamento 06 (Cajamarca) tiene `esReal: true`
- El resto genera `valor` simulado
- Este endpoint es **crítico para la coropleta del mapa**

---

## 4. GET `/api/exportar` (Opcional)

### Descripción

Genera y descarga un archivo Excel con los datos del indicador.

### Parámetros de Query

| Parámetro     | Tipo   | Requerido | Descripción                      |
| ------------- | ------ | --------- | -------------------------------- |
| `geoId`       | string | Sí        | Ubicación                        |
| `indicadorId` | string | Sí        | ID del indicador                 |
| `formato`     | string | No        | "xlsx" o "csv" (default: "xlsx") |

### Ejemplo

```
GET /api/exportar?geoId=PERU&indicadorId=SOC_1&formato=xlsx
```

### Respuesta

- **Content-Type**: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- **Content-Disposition**: `attachment; filename="indicador_SOC_1.xlsx"`
- Archivo Excel con datos temporales y tabla de preguntas

---

## Configuración de Cors

El backend debe permitir requests desde el frontend:

```javascript
// Express.js ejemplo
app.use(
  cors({
    origin: "http://localhost:5173", // Puerto de Vite en desarrollo
    methods: ["GET"],
    credentials: true,
  }),
);
```

---

## Caché Recomendado

Para mejorar performance:

| Endpoint                    | TTL      | Invalidador                      |
| --------------------------- | -------- | -------------------------------- |
| `/api/indicadores`          | 24 horas | Manual al actualizar indicadores |
| `/api/indicadores/:id/data` | 1 hora   | Cuando hay nuevas encuestas      |
| `/api/mapa/valores`         | 1 hora   | Cuando hay nuevos datos          |

---

## Validaciones Esperadas

### En Frontend

```javascript
// En src/api/contract.js al reemplazar:
export async function getIndicadores() {
  const response = await fetch("/api/indicadores");
  if (!response.ok) throw new Error(`Error ${response.status}`);
  const data = await response.json();
  // Validar que sea array con estructura correcta
  return data;
}
```

### En Backend

```javascript
// Validar siempre:
- indicadorId existe en INDICADORES
- geoId es válido (formato UBIGEO o nacional)
- valores están en rango [1, 5]
- n (respondentes) es positivo
- fechas son válidas
- cantidad de valores coincide con cantidad de fechas
```

---

## Datos Reales Actuales

Los únicos datos reales disponibles:

**Centro Poblado**: Corralcucho

- **Departamento**: Cajamarca (deptCode: 06)
- **Provincia**: Cutervo
- **Distrito**: La Ramada
- **Respondentes**: 64
- **Fecha**: Mayo 2026
- **Indicadores con datos**: SOC_1, SOC_2, SOC_3, ECO_1, ECO_2, ECO_3, TEC_1, TEC_2

Ver datos completos en: [src/data/encuesta_series.json](../src/data/encuesta_series.json)

---

## Testing

### Ejemplo con curl

```bash
# Obtener indicadores
curl http://localhost:3000/api/indicadores

# Obtener datos de SOC_1 para Cajamarca
curl "http://localhost:3000/api/indicadores/SOC_1/data?geoId=06&geoNombre=Cajamarca"

# Obtener valores del mapa
curl "http://localhost:3000/api/mapa/valores?indicadorId=SOC_1"
```

### Ejemplo con JavaScript/fetch

```javascript
// En navegador o Node.js

// 1. Obtener indicadores
const indicadores = await fetch("/api/indicadores").then((r) => r.json());

// 2. Obtener datos de un indicador
const data = await fetch(
  `/api/indicadores/SOC_1/data?geoId=06&geoNombre=Cajamarca`,
).then((r) => r.json());

// 3. Obtener valores para mapa
const valores = await fetch(`/api/mapa/valores?indicadorId=SOC_1`).then((r) =>
  r.json(),
);
```

---

## Notas de Implementación

1. **Los gráficos son iguales para data real y simulada**
   - No hacer lógica diferente para visualización
   - Solo cambiar `fuente` en respuesta

2. **Preguntas deben coincidir exactamente**
   - El frontend mapea por `codigo` (P07, P08, etc.)
   - Texto debe ser completo y legible

3. **Valores en escala 1-5**
   - No usar 0 (rompería los gráficos)
   - No exceder 5
   - Pueden ser decimales (4.75)

4. **Fechas en formato "Mes. Año"**
   - "Ene. 2024", "Feb. 2024", etc.
   - Usar abreviaturas en español
   - Usar 4 dígitos para año

5. **Backend puede estar en cualquier framework**
   - Express.js, Django, FastAPI, Laravel, etc.
   - Solo debe retornar JSON en formato especificado
