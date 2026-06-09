# Guía de Migración: contract.js a Backend Real

## Ubicación del archivo

[src/api/contract.js](../src/api/contract.js)

---

## Reemplazo de Funciones

### ANTES (Datos Simulados/Locales)

El archivo actual tiene esta estructura:

```javascript
import { INDICADORES, getSeriesTemporales } from "../data/simulatedData.js";
import encuestaSeries from "../data/encuesta_series.json";

export async function getIndicadores() {
  await delay();
  return INDICADORES;
}

export async function getIndicadorData(geoId, indicadorId, geoNombre = "") {
  await delay(280);
  const esReal = tieneDataReal(geoId, geoNombre);

  if (esReal) {
    // Lee datos de encuesta_series.json
  } else {
    // Genera datos simulados
  }
}
```

---

## DESPUÉS (Backend Real)

### Opción 1: Cambios Mínimos (Recomendado)

```javascript
// ============================================================
// CONTRATO DE API — conectado al backend
// ============================================================

// Configurable según ambiente
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:3000/api";
const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

// ─── Indicadores ────────────────────────────────────────────
export async function getIndicadores() {
  try {
    const response = await fetch(`${API_BASE}/indicadores`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error cargando indicadores:", error);
    throw error;
  }
}

// ─── Series de encuesta ──────────────────────────────────────
export async function getIndicadorData(geoId, indicadorId, geoNombre = "") {
  try {
    const params = new URLSearchParams({
      geoId: geoId || "PERU",
      ...(geoNombre && { geoNombre }),
    });

    const response = await fetch(
      `${API_BASE}/indicadores/${indicadorId}/data?${params}`,
    );

    if (response.status === 404) return null; // Sin datos
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    return await response.json();
  } catch (error) {
    console.error(`Error cargando datos de ${indicadorId}:`, error);
    return null;
  }
}

// ─── Valores para mapa ───────────────────────────────────────
export async function getValoresMapa(indicadorId) {
  try {
    const response = await fetch(
      `${API_BASE}/mapa/valores?indicadorId=${indicadorId}`,
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error cargando valores del mapa:", error);
    return []; // Retornar array vacío para no romper
  }
}

// ─── Validación de datos reales ──────────────────────────────
export function tieneDataReal(geoId, nombre = "") {
  // Opción A: Mantener validación local (rápido)
  const n = (nombre || geoId || "").toLowerCase().trim();
  return n.includes("corralcucho") || n.includes("llushcapampa");

  // Opción B: Preguntar al backend
  // return await fetch(`${API_BASE}/datos-reales?geoNombre=${nombre}`)
  //   .then(r => r.json())
  //   .then(d => d.esReal);
}

// ─── Exportar ────────────────────────────────────────────────
export async function exportarData(geoId, indicadorId, formato = "xlsx") {
  try {
    const params = new URLSearchParams({
      geoId: geoId || "PERU",
      indicadorId,
      formato,
    });

    const response = await fetch(`${API_BASE}/exportar?${params}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    // Descargar archivo
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `indicador_${indicadorId}.${formato === "xlsx" ? "xlsx" : "csv"}`;
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error exportando:", error);
    throw error;
  }
}

// ─── Metadata ────────────────────────────────────────────────
export async function getMetadataReal() {
  try {
    const response = await fetch(`${API_BASE}/metadata`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error cargando metadata:", error);
    return null;
  }
}

// ─── Valor de indicador por departamento (deprecated) ────────
export async function getValorDept(deptCode, indicadorId) {
  // Usar getValoresMapa() en su lugar
  const valores = await getValoresMapa(indicadorId);
  const dept = valores.find((v) => v.deptCode === deptCode);
  return dept?.valor ?? null;
}
```

---

### Opción 2: Con Caché Local

```javascript
// ============================================================
// CONTRATO DE API — con caché en memoria
// ============================================================

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:3000/api";

// Caché simple en memoria
const CACHE = {
  indicadores: { data: null, timestamp: 0 },
  mapaValores: {},
};

const CACHE_TTL = 3600000; // 1 hora en ms

function isCacheValid(timestamp) {
  return Date.now() - timestamp < CACHE_TTL;
}

// ─── Indicadores (cacheado) ─────────────────────────────────
export async function getIndicadores() {
  if (CACHE.indicadores.data && isCacheValid(CACHE.indicadores.timestamp)) {
    return CACHE.indicadores.data;
  }

  const response = await fetch(`${API_BASE}/indicadores`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const data = await response.json();
  CACHE.indicadores = { data, timestamp: Date.now() };
  return data;
}

// ─── Datos de indicador ──────────────────────────────────────
export async function getIndicadorData(geoId, indicadorId, geoNombre = "") {
  const params = new URLSearchParams({
    geoId: geoId || "PERU",
    ...(geoNombre && { geoNombre }),
  });

  const response = await fetch(
    `${API_BASE}/indicadores/${indicadorId}/data?${params}`,
  );

  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  return await response.json();
}

// ─── Valores mapa (cacheado) ────────────────────────────────
export async function getValoresMapa(indicadorId) {
  const key = `mapas_${indicadorId}`;

  if (
    CACHE.mapaValores[key] &&
    isCacheValid(CACHE.mapaValores[key].timestamp)
  ) {
    return CACHE.mapaValores[key].data;
  }

  const response = await fetch(
    `${API_BASE}/mapa/valores?indicadorId=${indicadorId}`,
  );

  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const data = await response.json();
  CACHE.mapaValores[key] = { data, timestamp: Date.now() };
  return data;
}

// ... resto de funciones igual que Opción 1
```

---

### Opción 3: Con Manejo de Errores Avanzado

```javascript
// ============================================================
// CONTRATO DE API — con reintentos y fallback
// ============================================================

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:3000/api";

class APIError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function fetchWithRetry(url, options = {}, retries = 2) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      if (response.status === 404) return null;
      if (response.status >= 500 && i < retries - 1) {
        await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
        continue;
      }
      throw new APIError(response.status, `HTTP ${response.status}`);
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}

export async function getIndicadores() {
  try {
    const response = await fetchWithRetry(`${API_BASE}/indicadores`);
    if (!response) throw new Error("No data");
    return await response.json();
  } catch (error) {
    console.error("Failed to load indicadores:", error);
    // Fallback a datos mock si backend falla
    return [];
  }
}

export async function getIndicadorData(geoId, indicadorId, geoNombre = "") {
  try {
    const params = new URLSearchParams({
      geoId: geoId || "PERU",
      ...(geoNombre && { geoNombre }),
    });

    const response = await fetchWithRetry(
      `${API_BASE}/indicadores/${indicadorId}/data?${params}`,
      {},
      2,
    );

    return response ? await response.json() : null;
  } catch (error) {
    console.error(`Failed to load data for ${indicadorId}:`, error);
    return null;
  }
}

// ... resto similar
```

---

## Pasos de Migración

### 1. Configurar URL del Backend

**Crear archivo** `.env` en raíz del proyecto:

```env
VITE_API_URL=http://localhost:3000/api
```

**Usar en code**:

```javascript
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
```

### 2. Actualizar contract.js

Reemplazar imports y funciones siguiendo una de las opciones arriba.

### 3. Remover Importes Innecesarios

```javascript
// ELIMINAR estos imports:
// - import { INDICADORES, getSeriesTemporales } from "../data/simulatedData.js";
// - import encuestaSeries from "../data/encuesta_series.json";
```

### 4. Mantener Compatibilidad

Asegurar que la respuesta del backend siga exactamente el formato esperado.

### 5. Probar

```javascript
// En navegador (F12):
const indicadores = await getIndicadores();
console.log(indicadores);

const data = await getIndicadorData("06", "SOC_1", "Cajamarca");
console.log(data);
```

---

## Manejo de Errores

El frontend debe manejar:

```javascript
try {
  const data = await getIndicadorData(geoId, indicadorId, geoNombre);
  if (!data) {
    // Mostrar "No hay datos para esta ubicación"
  } else {
    // Mostrar gráfico
  }
} catch (error) {
  console.error("Error cargando datos:", error);
  // Mostrar mensaje de error al usuario
}
```

---

## Testing Local

Para probar sin backend real, usar mock server:

### Opción A: json-server

```bash
npm install -D json-server

# Crear db.json con estructura:
{
  "indicadores": [...],
  "mapaValores": [...],
  "indicador-data": [...]
}

# Ejecutar:
json-server --watch db.json --port 3000
```

### Opción B: MSW (Mock Service Worker)

```bash
npm install -D msw
```

```javascript
// src/mocks/handlers.js
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/indicadores', () => {
    return HttpResponse.json([...]);
  }),
  http.get('/api/indicadores/:id/data', ({ request }) => {
    const url = new URL(request.url);
    const geoId = url.searchParams.get('geoId');
    return HttpResponse.json({...});
  }),
];
```

---

## Variables de Ambiente

Crear `.env.local` (git-ignored):

```env
# Desarrollo
VITE_API_URL=http://localhost:3000/api

# Producción
# VITE_API_URL=https://api.production.com/api
```

Usar en React:

```javascript
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
```

---

## Checklist de Migración

- [ ] Crear endpoints en backend
- [ ] Validar formato de respuesta JSON
- [ ] Actualizar contract.js con nuevo código
- [ ] Probar cada función individualmente
- [ ] Probar flujo completo (seleccionar geo → ver gráfico)
- [ ] Validar que Corralcucho devuelva `fuente: "real"`
- [ ] Validar que otros lugares devuelvan `fuente: "simulado"`
- [ ] Probar exportación
- [ ] Probar manejo de errores (404, 500, timeout)
- [ ] Remover datos locales simulados si ya no se necesitan
- [ ] Actualizar documentación

---

## Referencia: Estructura Actual

El archivo actual ([src/api/contract.js](../src/api/contract.js)) tiene ~130 líneas.

Después de migración tendrá ~80-100 líneas (más simple).
