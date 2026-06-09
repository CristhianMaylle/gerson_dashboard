// ============================================================
// DATOS SIMULADOS — reemplazar con llamadas reales al backend
// ============================================================

// ── Indicadores — códigos alineados con columnas del Excel ────
// Excel: col 7→P07, col 8→P08 ... col 33→P33
export const INDICADORES = [
  {
    id: "SOC_1",
    nombre: "Continuidad del servicio",
    dimension: "Social",
    dimLabel: "DIMENSIÓN SOCIAL: INDICADOR 1",
    preguntas: ["P07","P08","P09","P10"],   // cols 7-10
  },
  {
    id: "SOC_2",
    nombre: "Calidad percibida del agua",
    dimension: "Social",
    dimLabel: "DIMENSIÓN SOCIAL: INDICADOR 2",
    preguntas: ["P11","P12","P13","P14"],   // cols 11-14
  },
  {
    id: "SOC_3",
    nombre: "Condiciones sanitarias",
    dimension: "Social",
    dimLabel: "DIMENSIÓN SOCIAL: INDICADOR 3",
    preguntas: ["P15","P16"],               // cols 15-16
  },
  {
    id: "ECO_1",
    nombre: "Gestión y mantenimiento",
    dimension: "Económico",
    dimLabel: "DIMENSIÓN ECONÓMICA: INDICADOR 1",
    preguntas: ["P17","P18","P19"],         // cols 17-19
  },
  {
    id: "ECO_2",
    nombre: "Sostenibilidad financiera",
    dimension: "Económico",
    dimLabel: "DIMENSIÓN ECONÓMICA: INDICADOR 2",
    preguntas: ["P20","P21","P22","P23"],   // cols 20-23
  },
  {
    id: "ECO_3",
    nombre: "Reducción de enfermedades y mejora del bienestar infantil",
    dimension: "Económico",
    dimLabel: "DIMENSIÓN ECONÓMICA: INDICADOR 3",
    preguntas: ["P24","P25","P26","P27"],   // cols 24-27
  },
  {
    id: "TEC_1",
    nombre: "Ahorro económico",
    dimension: "Técnico",
    dimLabel: "DIMENSIÓN TÉCNICA: INDICADOR 1",
    preguntas: ["P28","P29"],               // cols 28-29
  },
  {
    id: "TEC_2",
    nombre: "Aprovechamiento del tiempo",
    dimension: "Técnico",
    dimLabel: "DIMENSIÓN TÉCNICA: INDICADOR 2",
    preguntas: ["P30","P31","P32","P33"],   // cols 30-33
  },
  {
    id: "TEC_3",
    nombre: "Participación comunitaria",
    dimension: "Técnico",
    dimLabel: "DIMENSIÓN TÉCNICA: INDICADOR 3",
    preguntas: ["P07","P08","P09"],         // preguntas representativas
  },
];

// ── Etiquetas de preguntas — alineadas con columnas reales del Excel ──
export const PREGUNTAS_LABELS = {
  // SOC_1 (cols 7-10)
  P07: "Agua ayudó a mantener la casa limpia y mejorar higiene familiar",
  P08: "Más fácil conseguir agua que antes del proyecto",
  P09: "Sistema evita que excretas estén al aire libre o contacto con animales",
  P10: "Agua libre de contaminación desde captación hasta grifo",
  // SOC_2 (cols 11-14)
  P11: "Disminución de casos de diarrea en niños menores de 5 años",
  P12: "Personas de la comunidad se enferman menos gracias al agua limpia",
  P13: "Reducción de enfermedades por falta de evacuación adecuada de heces",
  P14: "Calidad del agua genera confianza para aseo y preparación de alimentos",
  // SOC_3 (cols 15-16)
  P15: "Comunidad motivada a trabajar junta para cuidar el sistema",
  P16: "Conciencia sobre importancia de lavarse manos y mantener higiene",
  // ECO_1 (cols 17-19)
  P17: "Proyecto generó mayor ingreso económico en fechas festivas o eventos",
  P18: "Agua mejoró oportunidades económicas como apertura de negocios",
  P19: "Familias gastan menos tiempo buscando agua para dedicarse a otros trabajos",
  // ECO_2 (cols 20-23)
  P20: "Familia gasta menos en atención médica por enfermedades del agua",
  P21: "Disminuyó número de visitas al centro de salud por enfermedades del agua",
  P22: "Familia ahorra dinero en compra de medicinas",
  P23: "Uso de productos de limpieza adecuados en lugar de productos caros",
  // ECO_3 (cols 24-27)
  P24: "Niños asisten más a clases porque ya no se enferman frecuentemente",
  P25: "Sistema redujo carga de trabajo doméstico de las mujeres",
  P26: "Agua redujo tiempo que niños dedicaban a recolección",
  P27: "Mayor interés y motivación de niños por la educación",
  // TEC_1 (cols 28-29)
  P28: "Sistema garantiza suministro continuo durante las 24 horas del día",
  P29: "Medidas preventivas para evitar fallas o colapsos del sistema",
  // TEC_2 (cols 30-33)
  P30: "La JASS realiza mantenimiento preventivo",
  P31: "Comunidad paga cuota familiar para operar y mantener el sistema",
  P32: "Sistema sigue funcionando en épocas de sequía o lluvia",
  P33: "Suficientes herramientas y recursos para mantener el sistema",
};

// ── Centroides de departamentos (lat, lng) — claves siempre string ──
export const DEPT_CENTROIDS = {
  "01": { lat: -6.23,  lng: -77.87, nombre: "Amazonas" },
  "02": { lat: -9.53,  lng: -77.53, nombre: "Áncash" },
  "03": { lat: -14.05, lng: -73.09, nombre: "Apurímac" },
  "04": { lat: -16.41, lng: -71.54, nombre: "Arequipa" },
  "05": { lat: -13.16, lng: -74.22, nombre: "Ayacucho" },
  "06": { lat: -7.16,  lng: -78.51, nombre: "Cajamarca" },
  "07": { lat: -12.05, lng: -77.13, nombre: "Callao" },
  "08": { lat: -13.53, lng: -71.97, nombre: "Cusco" },
  "09": { lat: -12.79, lng: -74.97, nombre: "Huancavelica" },
  "10": { lat: -9.93,  lng: -76.24, nombre: "Huánuco" },
  "11": { lat: -14.07, lng: -75.73, nombre: "Ica" },
  "12": { lat: -11.16, lng: -75.33, nombre: "Junín" },
  "13": { lat: -8.12,  lng: -78.99, nombre: "La Libertad" },
  "14": { lat: -6.77,  lng: -79.84, nombre: "Lambayeque" },
  "15": { lat: -12.05, lng: -77.03, nombre: "Lima" },
  "16": { lat: -4.0,   lng: -75.0,  nombre: "Loreto" },
  "17": { lat: -11.0,  lng: -70.0,  nombre: "Madre de Dios" },
  "18": { lat: -17.19, lng: -70.94, nombre: "Moquegua" },
  "19": { lat: -10.67, lng: -75.25, nombre: "Pasco" },
  "20": { lat: -5.19,  lng: -80.63, nombre: "Piura" },
  "21": { lat: -15.84, lng: -70.02, nombre: "Puno" },
  "22": { lat: -6.97,  lng: -76.36, nombre: "San Martín" },
  "23": { lat: -18.01, lng: -70.25, nombre: "Tacna" },
  "24": { lat: -3.57,  lng: -80.45, nombre: "Tumbes" },
  "25": { lat: -8.38,  lng: -74.54, nombre: "Ucayali" },
};

// ── Bounding boxes para zoom ─────────────────────────────────
export const GEO_BOUNDS = {
  default: [[-18.35, -81.33], [-0.03, -68.65]],
  departamentos: {
    "01": [[-6.9,  -78.9], [-4.5, -76.6]],
    "02": [[-10.9, -78.7], [-8.0, -76.3]],
    "03": [[-14.7, -73.8], [-13.0, -71.7]],
    "04": [[-17.5, -73.1], [-14.5, -70.0]],
    "05": [[-14.5, -75.2], [-11.5, -72.7]],
    "06": [[-8.0,  -79.5], [-5.5, -77.5]],
    "07": [[-12.2, -77.3], [-11.8, -76.8]],
    "08": [[-15.5, -73.0], [-11.5, -70.0]],
    "09": [[-13.6, -75.7], [-11.7, -74.2]],
    "10": [[-10.8, -77.3], [-8.6,  -74.5]],
    "11": [[-15.0, -76.4], [-13.0, -74.6]],
    "12": [[-12.5, -76.0], [-10.0, -73.5]],
    "13": [[-9.0,  -79.5], [-6.5,  -77.4]],
    "14": [[-7.3,  -80.4], [-5.7,  -79.2]],
    "15": [[-13.0, -77.5], [-10.2, -75.0]],
    "16": [[-6.5,  -77.0], [0.0,   -70.0]],
    "17": [[-13.5, -71.5], [-9.5,  -68.2]],
    "18": [[-17.5, -71.6], [-16.0, -69.9]],
    "19": [[-11.5, -76.6], [-9.5,  -74.3]],
    "20": [[-6.3,  -81.5], [-3.5,  -79.2]],
    "21": [[-17.5, -71.5], [-13.5, -68.5]],
    "22": [[-8.8,  -77.8], [-5.2,  -75.3]],
    "23": [[-18.5, -71.0], [-16.5, -69.5]],
    "24": [[-4.3,  -81.3], [-3.0,  -79.5]],
    "25": [[-11.5, -75.5], [-6.5,  -70.5]],
  },
};

// ── Generación de datos de serie temporal simulados ──────────
const rand = (min, max, seed = 0) => {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  const r = x - Math.floor(x);
  return +(min + r * (max - min)).toFixed(2);
};

// Genera periodos mensuales de inicio a fin
function generarPeriodos(n = 12) {
  const periodos = [];
  const hoy = new Date(2024, 11, 1); // dic 2024
  const inicio = new Date(hoy);
  inicio.setMonth(inicio.getMonth() - (n - 1));
  for (let i = 0; i < n; i++) {
    const d = new Date(inicio);
    d.setMonth(inicio.getMonth() + i);
    periodos.push(
      `${d.toLocaleString("es-PE", { month: "short" })} ${d.getFullYear()}`
    );
  }
  return periodos;
}

// Genera tendencia (ligeramente creciente con ruido)
function tendencia(base, n, seed) {
  return Array.from({ length: n }, (_, i) => {
    const trend = base + (i / n) * 0.8;
    return +Math.min(5, Math.max(1, trend + rand(-0.3, 0.3, seed + i))).toFixed(2);
  });
}

const _seriesCache = {};

export function getSeriesTemporales(geoKey, indicadorId) {
  const cacheKey = `${geoKey}__${indicadorId}`;
  if (_seriesCache[cacheKey]) return _seriesCache[cacheKey];

  const ind = INDICADORES.find((i) => i.id === indicadorId);
  if (!ind) return null;

  const n = 12; // 12 meses
  const periodos = generarPeriodos(n);
  const seed = (geoKey + indicadorId).split("").reduce((a, c) => a + c.charCodeAt(0), 0);

  // Todas las preguntas del indicador (máx 6 para legibilidad)
  const preguntas = ind.preguntas.slice(0, 6);
  const series = preguntas.map((p, idx) => ({
    pregunta: p,
    label: PREGUNTAS_LABELS[p] ?? p,
    valores: tendencia(rand(1.5, 3.5, seed + idx * 100), n, seed + idx * 100),
  }));

  const result = {
    periodos,
    desde: periodos[0],
    hasta: periodos[periodos.length - 1],
    series,
  };
  _seriesCache[cacheKey] = result;
  return result;
}

// ── Valor de indicador por departamento (para burbujas) ──────
const _valorCache = {};

export function getValorDept(deptCode, indicadorId) {
  const key = `${deptCode}__${indicadorId}`;
  if (_valorCache[key] !== undefined) return _valorCache[key];
  const seed = (deptCode + indicadorId).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const val = rand(2.5, 4.8, seed);
  _valorCache[key] = val;
  return val;
}

// Convierte valor 1-5 a color de coropleta
export function valorToColor(v) {
  if (v === null || v === undefined) return "#f3f4f6";
  if (v >= 4.25) return "#1e3a8a";
  if (v >= 3.75) return "#2563eb";
  if (v >= 3.25) return "#60a5fa";
  if (v >= 2.75) return "#fde68a";
  return "#fca5a5";
}
