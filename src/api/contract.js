// ============================================================
// CONTRATO DE API — datos reales de DATOS.xlsx + simulados
// ============================================================
import { INDICADORES, getSeriesTemporales } from "../data/simulatedData.js";
import encuestaSeries from "../data/encuesta_series.json";
import { getValorDept } from "../data/simulatedData.js";

const delay = (ms = 200) => new Promise(r => setTimeout(r, ms));

// ─── Datos reales disponibles ────────────────────────────────
const GEO_REAL    = encuestaSeries.geoReal;  // { departamento, provincia, distrito, centroPoblado }
const NOMBRES_REALES = [
  GEO_REAL.centroPoblado.toLowerCase(),      // "corralcucho"
  'llushcapampa',                             // el CP padre en ubigeo
];

/**
 * Devuelve true SOLO cuando la ubicación seleccionada tiene datos reales del Excel.
 * Los datos son de Corralcucho (La Ramada, Cutervo, Cajamarca).
 * Se detecta por NOMBRE del centro poblado.
 */
export function tieneDataReal(geoId, nombre = '') {
  const n = (nombre || geoId || '').toLowerCase().trim();
  return NOMBRES_REALES.some(real => n.includes(real));
}

// ─── Indicadores ────────────────────────────────────────────
export async function getIndicadores() {
  await delay();
  return INDICADORES;
}

// ─── Series de encuesta real ──────────────────────────────────
/**
 * Devuelve las series temporales del indicador.
 * Si hay datos reales (Corralcucho) → usa DATOS.xlsx
 * Si no → datos simulados
 *
 * @returns {SeriesResult | null}
 * SeriesResult: {
 *   fuente:   "real" | "simulado"
 *   fechas:   string[]        // ["25/05/2026", "26/05/2026"]
 *   desde:    string
 *   hasta:    string
 *   n:        number
 *   preguntas: PreguntaItem[]
 *   geoNombre: string
 * }
 * PreguntaItem: { codigo, texto, valores: number[], promedio, n }
 */
export async function getIndicadorData(geoId, indicadorId, geoNombre = '') {
  await delay(280);
  const esReal = tieneDataReal(geoId, geoNombre);

  if (esReal) {
    const indData = encuestaSeries.indicadores[indicadorId];
    if (!indData) return null;

    // indData tiene { preguntas: [...], promedioTotal: number }
    const preguntas  = indData.preguntas ?? indData; // compatibilidad con formato anterior
    const promedioTotal = indData.promedioTotal ??
      +(preguntas.map(p => p.promedio).filter(Boolean).reduce((s,v,_,a)=>s+v/a.length,0)).toFixed(2);

    return {
      fuente:        'real',
      fechas:        encuestaSeries.fechas,
      desde:         encuestaSeries.desde,
      hasta:         encuestaSeries.hasta,
      n:             encuestaSeries.n,
      preguntas,
      promedioTotal, // promedio de TODAS las preguntas = valor para el mapa
      geoNombre:     GEO_REAL.centroPoblado,
    };
  }

  // Datos simulados — genera series ficticias
  if (!geoId || geoId === 'SIN_DATOS') return null;
  const sim = getSeriesTemporales(geoId ?? 'PERU', indicadorId);
  if (!sim) return null;

  const n_sim = Math.floor(Math.random() * 40) + 20;
  const pregsSim = sim.series.map(s => {
    const prom = +(s.valores.reduce((a,v)=>a+v,0)/s.valores.length).toFixed(2);
    return { codigo: s.pregunta, texto: s.label, valores: s.valores, promedio: prom, n: n_sim };
  });
  // promedioTotal = promedio de todos los promedios de las preguntas
  const promedioTotal = +(pregsSim.reduce((s,p)=>s+p.promedio,0)/pregsSim.length).toFixed(2);

  return {
    fuente:        'simulado',
    fechas:        sim.periodos,
    desde:         sim.desde,
    hasta:         sim.hasta,
    n:             n_sim,
    preguntas:     pregsSim,
    promedioTotal,
    geoNombre:     'Simulado',
  };
}

// ─── Valor real para Corralcucho en el mapa ──────────────────
// = promedio de TODAS las respuestas de TODAS las preguntas del indicador
export function getValorRealUltimoMes(indicadorId) {
  const indData = encuestaSeries.indicadores[indicadorId];
  if (!indData) return null;
  // Si el nuevo formato tiene promedioTotal, úsalo directamente
  if (indData.promedioTotal !== undefined) return indData.promedioTotal;
  // Fallback: calcula del array de preguntas
  const preguntas = indData.preguntas ?? indData;
  const vals = preguntas.map(p => p.promedio).filter(v => v !== null && !Number.isNaN(v));
  if (!vals.length) return null;
  return +(vals.reduce((s,v) => s+v,0) / vals.length).toFixed(2);
}

// ─── Mapa (coropletas) ────────────────────────────────────────
export async function getValoresMapa(indicadorId) {
  await delay(250);
  const { DEPT_CENTROIDS } = await import("../data/simulatedData.js");
  return Object.keys(DEPT_CENTROIDS).map(code => ({
    deptCode: code,
    valor:    getValorDept(code, indicadorId),
    esReal:   false,
  }));
}

// ─── Exportar ────────────────────────────────────────────────
export async function exportarData(geoId, indicadorId, formato = 'xlsx') {
  await delay(500);
  return { url: `#exportar?geo=${geoId}&ind=${indicadorId}&fmt=${formato}`, mensaje: 'Simulado' };
}

export function getMetadataReal() {
  return { totalRegistros: encuestaSeries.n, geoReal: GEO_REAL,
           desde: encuestaSeries.desde, hasta: encuestaSeries.hasta };
}
