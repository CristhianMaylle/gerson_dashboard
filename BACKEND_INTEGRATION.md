# Guía de Integración Backend

## Estado Actual del Proyecto

El dashboard está **listo para integrar un backend**. La arquitectura permite reemplazar los datos simulados con datos reales sin cambiar la interfaz de usuario.

---

## Estructura de Indicadores

Los indicadores están organizados en 3 dimensiones (Social, Económica, Técnica) con 9 indicadores totales:

### DIMENSIÓN SOCIAL

1. **SOC_1**: Continuidad del servicio
2. **SOC_2**: Calidad percibida del agua
3. **SOC_3**: Condiciones sanitarias

### DIMENSIÓN ECONÓMICA

4. **ECO_1**: Gestión y mantenimiento
5. **ECO_2**: Sostenibilidad financiera
6. **ECO_3**: Reducción de enfermedades y mejora del bienestar infantil

### DIMENSIÓN TÉCNICA

7. **TEC_1**: Ahorro económico
8. **TEC_2**: Aprovechamiento del tiempo
9. **TEC_3**: Participación comunitaria

---

## Estructura de Datos Esperados

### 1. Endpoint: GET `/api/indicadores`

Debe retornar un array de indicadores:

```json
[
  {
    "id": "SOC_1",
    "nombre": "Continuidad del servicio",
    "dimension": "Social",
    "dimLabel": "DIMENSIÓN SOCIAL: INDICADOR 1",
    "preguntas": ["P07", "P08", "P09", "P10"]
  },
  ...
]
```

**Ubicación en código**: [src/api/contract.js](src/api/contract.js#L28)

- Función: `getIndicadores()`

---

### 2. Endpoint: GET `/api/indicadores/:id/data?geoId=:geoId&geoNombre=:geoNombre`

Debe retornar datos temporales del indicador:

```json
{
  "fuente": "real|simulado",
  "fechas": ["May. 2026", "Jun. 2026", ...],
  "desde": "May. 2026",
  "hasta": "Dec. 2026",
  "n": 64,
  "preguntas": [
    {
      "codigo": "P07",
      "texto": "Pregunta del cuestionario...",
      "valores": [4.77, 4.75, 4.72, ...],
      "promedio": 4.75,
      "n": 64
    },
    ...
  ],
  "promedioTotal": 4.73,
  "geoNombre": "Corralcucho"
}
```

**Ubicación en código**: [src/api/contract.js](src/api/contract.js#L48)

- Función: `getIndicadorData(geoId, indicadorId, geoNombre)`
- Parámetros:
  - `geoId`: identificador geográfico (código de provincia, distrito, etc.)
  - `indicadorId`: identificador del indicador (SOC_1, ECO_2, etc.)
  - `geoNombre`: nombre del centro poblado (para validar si tiene datos reales)

**Lógica importante**:

- Si `geoNombre` contiene "corralcucho" o "llushcapampa", devolver datos reales
- Si no, generar datos simulados
- **Los gráficos usan este formato para ambos casos**

---

### 3. Endpoint: GET `/api/mapa/valores?indicadorId=:id`

Debe retornar valores para la coropleta del mapa:

```json
[
  {
    "deptCode": "01",
    "valor": 3.45,
    "esReal": false
  },
  {
    "deptCode": "06",
    "valor": 4.73,
    "esReal": true
  },
  ...
]
```

**Ubicación en código**: [src/api/contract.js](src/api/contract.js#L120)

- Función: `getValoresMapa(indicadorId)`

---

## Interfaz de Gráficos

### Tipo de Gráfico: LineChart (Recharts)

**Características**:

- Gráfico de líneas múltiples (una línea por pregunta del indicador)
- Eje Y: escala Likert 1-5
- Eje X: fechas mensuales
- Tooltip interactivo con valores de cada pregunta
- Leyenda con códigos de preguntas (P07, P08, etc.)

**Validación**:

- El mismo formato de LineChart se usa para datos reales Y simulados
- No hay diferencia visual en la estructura del gráfico
- Solo cambia el badge "Datos reales" vs "Datos simulados"

---

## Puntos de Integración

### Archivo Principal: [src/api/contract.js](src/api/contract.js)

Este archivo contiene las funciones que **DEBEN ser reemplazadas** por llamadas al backend:

1. **`getIndicadores()`** - Actualmente retorna array hardcodeado de [src/data/simulatedData.js](src/data/simulatedData.js)

   ```javascript
   // CAMBIAR ESTO POR:
   return await fetch("/api/indicadores").then((r) => r.json());
   ```

2. **`getIndicadorData(geoId, indicadorId, geoNombre)`** - Actualmente usa datos simulados o reales locales

   ```javascript
   // CAMBIAR ESTO POR:
   return await fetch(
     `/api/indicadores/${indicadorId}/data?geoId=${geoId}&geoNombre=${geoNombre}`,
   ).then((r) => r.json());
   ```

3. **`getValoresMapa(indicadorId)`** - Actualmente genera valores simulados

   ```javascript
   // CAMBIAR ESTO POR:
   return await fetch(`/api/mapa/valores?indicadorId=${indicadorId}`).then(
     (r) => r.json(),
   );
   ```

4. **`tieneDataReal(geoId, nombre)`** - Validación local de datos reales
   - Puede seguir siendo local O moverse al backend

### Archivos de Datos Locales:

Estos pueden ser **eliminados** una vez el backend esté implementado:

- [src/data/simulatedData.js](src/data/simulatedData.js) - Datos simulados
- [src/data/encuesta_series.json](src/data/encuesta_series.json) - Datos reales de Corralcucho

---

## Especificación de Preguntas (P01-P33)

Las preguntas están mapeadas en [src/data/simulatedData.js](src/data/simulatedData.js#L44):

```javascript
export const PREGUNTAS_LABELS = {
  // SOC_1 (cols 7-10)
  P07: "Agua ayudó a mantener la casa limpia y mejorar higiene familiar",
  P08: "Más fácil conseguir agua que antes del proyecto",
  ...
};
```

**El backend debe retornar los textos completos** en la respuesta, ya que el frontend usa:

- `pregunta.codigo` para la clave (P07, P08, etc.)
- `pregunta.texto` para mostrar en la tabla
- `pregunta.valores` para graficar

---

## Flujo de Datos en el Dashboard

```
Usuario selecciona ubicación (departamento, provincia, distrito, CP)
         ↓
App.jsx detecta cambio en geo
         ↓
ImpactChart.jsx solicita datos con getIndicadorData()
         ↓
contract.js valida si es data real o simulada
         ↓
Respuesta contiene fechas, preguntas y valores
         ↓
LineChart grafica automáticamente
         ↓
Tabla muestra preguntas con promedios
```

---

## Consideraciones Importantes

### 1. Escala Likert

- **Rango**: 1 a 5
- **1**: Muy en desacuerdo
- **2**: En desacuerdo
- **3**: Neutral
- **4**: De acuerdo
- **5**: Muy de acuerdo

El gráfico tiene referencia visual en `y=3` (línea punteada).

### 2. Centros Poblados

- Data real disponible actualmente: **Corralcucho** (La Ramada, Cutervo, Cajamarca)
- Código: `deptCode="06"` (Cajamarca)
- Para expandir a más ubicaciones: usar el mismo formato JSON de [encuesta_series.json](src/data/encuesta_series.json)

### 3. Consistencia de Gráficos

- **Ambos tipos de datos** (real y simulado) usan el **mismo LineChart**
- El código NO distingue entre ellos para la visualización
- Solo el badge indica la fuente

### 4. Exportación de Datos

- Función `exportarData()` en [contract.js](src/api/contract.js#L126)
- Actualmente es simulada
- Backend puede mantener o implementar descarga real de XLSX

---

## Cambios de Nombres de Indicadores

Se han actualizado los nombres de indicadores a más cortos y descriptivos:

| Antes                                                | Ahora                                                         |
| ---------------------------------------------------- | ------------------------------------------------------------- |
| Acceso a agua potable y mejoras sanitarias           | **Continuidad del servicio**                                  |
| Mejora en la salud pública                           | **Calidad percibida del agua**                                |
| Participación comunitaria y conciencia sobre higiene | **Condiciones sanitarias**                                    |
| Generación de empleo y actividades económicas        | **Gestión y mantenimiento**                                   |
| Ahorro en costos médicos                             | **Sostenibilidad financiera**                                 |
| Productividad laboral y eficiencia                   | **Reducción de enfermedades y mejora del bienestar infantil** |
| Eficiencia y funcionamiento del sistema              | **Ahorro económico**                                          |
| Mantenimiento y sostenibilidad                       | **Aprovechamiento del tiempo**                                |
| _Nuevo_                                              | **Participación comunitaria** (TEC_3)                         |

---

## Próximos Pasos

1. **Crear endpoints en backend** que retornen JSON en el formato especificado
2. **Reemplazar funciones en** [src/api/contract.js](src/api/contract.js)
3. **Validar datos reales** con formato consistent en [encuesta_series.json](src/data/encuesta_series.json)
4. **Pruebas E2E** con múltiples ubicaciones y indicadores
5. **Eliminar datos simulados** una vez backend esté en producción

---

## Ejemplos de Respuestas Backend

### Respuesta Completa de Indicador

```json
{
  "fuente": "real",
  "fechas": ["Ene. 2024", "Feb. 2024", "Mar. 2024"],
  "desde": "Ene. 2024",
  "hasta": "Mar. 2024",
  "n": 64,
  "preguntas": [
    {
      "codigo": "P07",
      "texto": "Agua ayudó a mantener la casa limpia y mejorar higiene familiar",
      "valores": [4.77, 4.75, 4.8],
      "promedio": 4.77,
      "n": 64
    },
    {
      "codigo": "P08",
      "texto": "Más fácil conseguir agua que antes del proyecto",
      "valores": [4.7, 4.68, 4.72],
      "promedio": 4.7,
      "n": 64
    }
  ],
  "promedioTotal": 4.735,
  "geoNombre": "Corralcucho"
}
```

---

## Contacto de Soporte

Para dudas sobre estructura o implementación, revisar:

- [src/components/ImpactChart.jsx](src/components/ImpactChart.jsx) - Uso de datos
- [src/api/contract.js](src/api/contract.js) - Contrato actual
- [src/data/simulatedData.js](src/data/simulatedData.js) - Estructura de indicadores
