import { useEffect, useRef, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ReferenceLine, ResponsiveContainer,
} from "recharts";
import { getIndicadorData, exportarData, tieneDataReal } from "../api/contract.js";
import styles from "./ImpactChart.module.css";

const PALETTE = ["#1d4ed8","#dc2626","#d97706","#16a34a","#7c3aed","#0891b2","#be185d","#15803d"];

const DIM_META = {
  Social:    { color: "#1d4ed8", bg: "#dbeafe" },
  Económico: { color: "#16a34a", bg: "#dcfce7" },
  Técnico:   { color: "#b45309", bg: "#fef3c7" },
  Economico: { color: "#16a34a", bg: "#dcfce7" },
  Tecnico:   { color: "#b45309", bg: "#fef3c7" },
};

const FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSc4D5j-wrJujJ4wkVBBEsjskCihYx22OBhUBMMQlnd_5FqD8g/viewform?usp=header";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipLabel}>{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color, margin: '2px 0', fontSize: 11 }}>
          {p.dataKey}: <strong>{Number(p.value).toFixed(2)}</strong>
        </p>
      ))}
    </div>
  );
};

export default function ImpactChart({ geo, indicador }) {
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(false);
  const [exporting, setExporting] = useState(false);
  const wrapperRef = useRef(null);
  const [chartW, setChartW]       = useState(320);

  // Mide el ancho real del wrapper para pasarlo al LineChart
  useEffect(() => {
    if (!wrapperRef.current) return;
    const obs = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect?.width;
      if (w && w > 50) setChartW(Math.floor(w) - 4);
    });
    obs.observe(wrapperRef.current);
    return () => obs.disconnect();
  }, []);

  const geoActivo = geo.centroPoblado || geo.distrito || geo.provincia || geo.departamento || null;
  const cpNombre  = geo.cpNombre || geo.caserioNombre || '';
  const esReal    = tieneDataReal(geoActivo, cpNombre);

  // Jerarquía completa
  const geoPartes = [
    geo.departamento ? (geo.departamento === '06' ? 'Cajamarca' : geo.departamento) : null,
    geo.provinciaNombre || null,
    geo.distritoNombre  || null,
    geo.cpNombre        || null,
  ].filter(Boolean);
  const geoLabel = geoPartes.length > 0 ? geoPartes.join(' / ') : 'Nacional';

  useEffect(() => {
    if (!indicador) return;
    setLoading(true);
    setData(null);
    getIndicadorData(geoActivo ?? 'PERU', indicador.id, cpNombre)
      .then(setData)
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geoActivo, indicador?.id, cpNombre]);

  const meta = indicador ? (DIM_META[indicador.dimension] ?? DIM_META.Social) : DIM_META.Social;

  // Construye datos para el LineChart: una fila por mes, una columna por pregunta
  const lineData = (data?.fechas ?? []).map((fecha, idx) => {
    const row = { fecha };
    (data?.preguntas ?? []).forEach(p => {
      const v = p.valores?.[idx];
      row[p.codigo] = (v !== null && v !== undefined && !Number.isNaN(v)) ? v : null;
    });
    return row;
  });

  const handleExportar = async () => {
    setExporting(true);
    try { await exportarData(geoActivo ?? 'PERU', indicador?.id, 'xlsx'); alert('Exportación lista.'); }
    finally { setExporting(false); }
  };

  return (
    <div className={styles.panel}>

      <div className={styles.dimHeader} style={{ background: meta.color }}>
        {indicador
          ? `${indicador.dimension.toUpperCase()} — ${indicador.dimLabel}`
          : 'IMPACTOS SOCIOECONÓMICOS'}
      </div>

      {!indicador ? (
        <div className={styles.empty}>
          <span>📊</span><p>Selecciona un indicador</p>
        </div>
      ) : (
        <>
          {/* Tarjeta indicador */}
          <div className={styles.indCard} style={{ borderLeftColor: meta.color, background: meta.bg }}>
            <div className={styles.indNombre}>{indicador.nombre}</div>
            <div className={styles.indMeta}>
              <span className={styles.badge} style={{ background: meta.color }}>{indicador.dimension}</span>
              <span className={styles.geoLabel}>📍 {geoLabel}</span>
              {data && (
                <span className={`${styles.fuenteBadge} ${data.fuente === 'real' ? styles.real : styles.sim}`}>
                  {data.fuente === 'real' ? '🟢 Datos reales' : '🟡 Datos simulados'}
                </span>
              )}
            </div>
          </div>

          {!loading && data === null && (
            <div className={styles.sinDatos}>
              <div className={styles.sinDatosIcon}>🔍</div>
              <p>No hay registros para esta ubicación.</p>
              <small>Selecciona un C. Poblado para ver datos.</small>
            </div>
          )}

          {loading && <div className={styles.loading}>Cargando datos…</div>}

          {/* ── Gráfico multi-línea temporal ── */}
          {!loading && data && (
            <div className={styles.chartBox}>
              <div className={styles.chartTitle}>
                Promedio mensual por pregunta — {data.desde} → {data.hasta}
                {data.fuente === 'real' && <span className={styles.chartRealTag}> ⭐ datos reales</span>}
              </div>
              <div className={styles.chartMeta}>n = {data.n} encuestados</div>

              {/* Wrapper aislado de Leaflet CSS */}
              <div className={styles.rechartWrapper} ref={wrapperRef}>
                <LineChart
                  width={chartW}
                  height={210}
                  data={lineData}
                  margin={{ top:8, right:14, left:-10, bottom:4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="fecha"
                    tick={{ fontSize: 10, fill: "#6b7280" }}
                    angle={lineData.length > 6 ? -30 : 0}
                    textAnchor={lineData.length > 6 ? "end" : "middle"}
                    height={lineData.length > 6 ? 40 : 20}
                  />
                  <YAxis
                    domain={[0, 5]}
                    ticks={[1, 2, 3, 4, 5]}
                    tick={{ fontSize: 10, fill: "#6b7280" }}
                  />
                  <ReferenceLine y={3} stroke="#e2e8f0" strokeDasharray="4 3" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 10, paddingTop: 4 }} />
                  {(data.preguntas ?? []).map((p, i) => (
                    <Line
                      key={p.codigo}
                      type="monotone"
                      dataKey={p.codigo}
                      name={p.codigo}
                      stroke={PALETTE[i % PALETTE.length]}
                      strokeWidth={2}
                      dot={{ r: 4, fill: PALETTE[i % PALETTE.length], strokeWidth: 0 }}
                      activeDot={{ r: 6 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </div>
            </div>
          )}

          {/* Tabla de preguntas */}
          {!loading && (data?.preguntas?.length ?? 0) > 0 && (
            <div className={styles.pregTable}>
              <div className={styles.pregTableHeader}>
                <span>Cód.</span><span>Pregunta</span><span>Prom.</span><span>n</span>
              </div>
              {data.preguntas.map((p, i) => (
                <div key={p.codigo} className={styles.pregTableRow}>
                  <span className={styles.pregCodigo} style={{ color: PALETTE[i%PALETTE.length] }}>
                    {p.codigo}
                  </span>
                  <span className={styles.pregTexto} title={p.texto}>{p.texto}</span>
                  <span className={styles.pregPromedio}>{p.promedio?.toFixed(2)}</span>
                  <span className={styles.pregN}>{p.n}</span>
                </div>
              ))}
            </div>
          )}

          {/* Escala Likert */}
          <div className={styles.likertCard}>
            <div className={styles.likertHeader}>Escala de medición: Escala Likert (1-5)</div>
            <div className={styles.likertBody}>
              {[['1','Muy en desacuerdo'],['2','En desacuerdo'],['3','Neutral'],
                ['4','De acuerdo'],['5','Muy de acuerdo.']].map(([n, label]) => (
                <div key={n} className={styles.likertItem}>
                  <span className={styles.likertNum}>{n}</span> = {label}
                </div>
              ))}
            </div>
          </div>

          {/* Botones */}
          <div className={styles.buttons}>
            <button className={styles.btnExport} onClick={handleExportar} disabled={exporting || !data}>
              {exporting ? 'Exportando…' : 'Exportar data'}
            </button>
            <button
              className={styles.btnCuest}
              onClick={() => window.open(FORM_URL, '_blank')}
            >
              Cuestionario
            </button>
          </div>
        </>
      )}
    </div>
  );
}
