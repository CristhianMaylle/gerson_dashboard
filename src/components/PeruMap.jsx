import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { MapContainer, TileLayer, GeoJSON, Marker, Tooltip, CircleMarker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import geojsonDepts from "../data/peru_depts.json";
import geojsonProvs from "../data/peru_provs.json";
import distGid3Map from "../data/dist_gid3_map.json";
import cajaBounds  from "../data/cajamarca_bounds.json";
import { DEPT_CENTROIDS, GEO_BOUNDS } from "../data/simulatedData.js";
import { getValoresMapa, tieneDataReal, getMetadataReal, getValorRealUltimoMes } from "../api/contract.js";
import styles from "./PeruMap.module.css";

// Ubigeo de La Ramada (donde hay datos reales del Excel)
const UBIGEO_REAL = '060605'; // La Ramada, Cutervo, Cajamarca
const metaReal = getMetadataReal();

// Carga lazy de la jerarquía CP→Caserío de Cajamarca (datos reales OSM, 244KB)
let _cajaCpCache = null;
async function loadCajaCpCaserios() {
  if (_cajaCpCache) return _cajaCpCache;
  const m = await import("../data/cajamarca_cp_caserios.json");
  _cajaCpCache = m.default;
  return _cajaCpCache;
}

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// ── Gradiente azul (idéntico al de DATASS) ───────────────────
const BLUE_STOPS = [
  { t: 0.00, hex: "#deebf7" }, // azul muy pálido
  { t: 0.25, hex: "#9ecae1" }, // azul claro
  { t: 0.50, hex: "#4292c6" }, // azul medio
  { t: 0.75, hex: "#2171b5" }, // azul
  { t: 1.00, hex: "#084594" }, // azul marino
];

function lerpColor(hexA, hexB, t) {
  const p = h => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
  const [r1,g1,b1] = p(hexA), [r2,g2,b2] = p(hexB);
  return `rgb(${Math.round(r1+(r2-r1)*t)},${Math.round(g1+(g2-g1)*t)},${Math.round(b1+(b2-b1)*t)})`;
}

function valueToBlue(v) {
  if (v === undefined || v === null) return "#e8f0f7";
  const t = Math.max(0, Math.min(1, (v - 1) / 4));
  const n = BLUE_STOPS.length - 1;
  for (let i = 0; i < n; i++) {
    if (t <= BLUE_STOPS[i+1].t) {
      const seg = (t - BLUE_STOPS[i].t) / (BLUE_STOPS[i+1].t - BLUE_STOPS[i].t);
      return lerpColor(BLUE_STOPS[i].hex, BLUE_STOPS[i+1].hex, seg);
    }
  }
  return BLUE_STOPS[n].hex;
}

// ── Estilos de feature ───────────────────────────────────────

// Opacidad según nivel geográfico:
// - nacional/dept: 0.52 (cubre bien el área, no se necesita ver labels)
// - prov:          0.42 (se empiezan a ver más labels)
// - dist:          0.28 (muy transparente — los labels del mapa deben leerse)
const FILL_OPACITY = { national: 0.52, dept: 0.52, prov: 0.42, dist: 0.28, caserio: 0.22 };

function activeStyle(valor, nivel = 'national') {
  return {
    fillColor:   valueToBlue(valor),
    fillOpacity: FILL_OPACITY[nivel] ?? 0.45,
    color:       "#4a7096",
    weight:      nivel === 'dist' || nivel === 'caserio' ? 0.7 : 0.9,
  };
}

// Área NO seleccionada: solo borde oficial, sin relleno de color
const BORDER_ONLY_STYLE = {
  fillColor:   "transparent",
  fillOpacity: 0,
  color:       "#94a3b8",     // borde gris claro
  weight:      0.6,
};

// Overlay de selección — borde azul oscuro encima de todo
const SELECTION_OVERLAY = {
  fillColor:   "transparent",
  fillOpacity: 0,
  color:       "#1e40af",
  weight:      2.5,
  dashArray:   null,
};

// ── Burbuja: azul normal (simulado) o verde con estrella (real) ──
function makeBubbleIcon(valor, nombre, size = 46, esReal = false) {
  const label = nombre.length > 12 ? nombre.slice(0, 11) + "…" : nombre;
  // Real → verde oscuro con borde dorado; simulado → azul
  const bg     = esReal ? "#15803d" : "#2563eb";
  const border = esReal ? "2.5px solid #fbbf24" : "2.5px solid #fff";
  const shadow = esReal ? "0 2px 10px rgba(21,128,61,0.5)" : "0 2px 8px rgba(0,0,0,0.35)";
  const star   = esReal ? '<span style="position:absolute;top:-5px;right:-5px;font-size:10px">⭐</span>' : '';
  return L.divIcon({
    className: "",
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;width:${size+40}px;margin-left:-${(size+40)/2}px">
        <div style="position:relative">
          <div style="
            background:${bg};
            color:#fff;
            border-radius:50%;
            width:${size}px;height:${size}px;
            display:flex;align-items:center;justify-content:center;
            font-weight:800;font-size:${size <= 34 ? 10 : 12}px;
            border:${border};
            box-shadow:${shadow};
          ">${valor !== undefined ? valor.toFixed(1) : "—"}</div>
          ${star}
        </div>
        <div style="
          font-size:9.5px;font-weight:700;
          color:#1e293b;
          margin-top:3px;
          white-space:nowrap;
          text-shadow:0 0 3px #fff,0 0 3px #fff,0 0 3px #fff;
          letter-spacing:0.3px;
        ">${label.toUpperCase()}</div>
      </div>`,
    iconSize:   [size + 40, size + 20],
    iconAnchor: [(size + 40) / 2, size / 2],
  });
}

// ── Zoom controller ──────────────────────────────────────────
function MapController({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) map.fitBounds(bounds, { animate: true, duration: 0.7, padding: [20, 20] });
  }, [JSON.stringify(bounds)]);
  return null;
}

// ── Centroide de un feature ──────────────────────────────────
function centroidOf(feature) {
  try {
    const coords = feature.geometry.type === "MultiPolygon"
      ? feature.geometry.coordinates[0][0]
      : feature.geometry.coordinates[0];
    const ring = Array.isArray(coords[0][0]) ? coords[0] : coords;
    const n = ring.length;
    let lngS = 0, latS = 0;
    ring.forEach(([lng, lat]) => { lngS += lng; latS += lat; });
    return [latS / n, lngS / n];
  } catch { return null; }
}

// ── Bounding box ─────────────────────────────────────────────
function bboxOf(feature) {
  try {
    const all = [];
    function collect(c) {
      if (typeof c[0] === "number") all.push(c);
      else c.forEach(collect);
    }
    collect(feature.geometry.coordinates);
    const lngs = all.map(c=>c[0]), lats = all.map(c=>c[1]);
    return [[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]];
  } catch { return null; }
}

// ── Valores simulados ────────────────────────────────────────
const _cache = {};
function seededVal(key, ind) {
  const s = (key+ind).split("").reduce((a,c)=>a+c.charCodeAt(0),0);
  const x = Math.sin(s*9301+49297)*233280;
  return +(1.5+((x-Math.floor(x))*3.5)).toFixed(2);
}
function getVal(id, indId) {
  const k=`${id}_${indId}`;
  return _cache[k] ?? (_cache[k]=seededVal(id,indId));
}

// ============================================================
export default function PeruMap({ geo, indicador }) {
  const [valoresDepts,  setValoresDepts]  = useState({});
  const [geojsonDists,  setGeojsonDists]  = useState(null);
  const [cajaByDist,    setCajaByDist]    = useState(null); // lazy

  const nivel = geo.caserio    ? "caserio"
    : geo.distrito    ? "dist"
    : geo.provincia   ? "prov"
    : geo.departamento ? "dept"
    : "national";

  // Carga lazy de distritos
  useEffect(() => {
    if ((nivel === "prov" || nivel === "dist" || nivel === "caserio") && !geojsonDists) {
      import("../data/peru_dists.json")
        .then(m => setGeojsonDists(m.default))
        .catch(() => {});
    }
  }, [nivel]);

  // Carga lazy de CP→Caserío de Cajamarca cuando se selecciona distrito
  useEffect(() => {
    if (geo.deptCode === "06" && geo.distrito && !cajaByDist) {
      loadCajaCpCaserios().then(setCajaByDist);
    }
  }, [geo.deptCode, geo.distrito]);

  // Valores de indicador por dept
  useEffect(() => {
    if (!indicador) return;
    getValoresMapa(indicador.id).then(arr => {
      const m = {};
      arr.forEach(({ deptCode, valor }) => { m[deptCode] = valor; });
      setValoresDepts(m);
    });
  }, [indicador?.id]);

  // ── Bounds para caserío (debe ir ANTES de activeBounds) ─────
  const caserioSelBounds = useMemo(() => {
    if (!geo.caserioLat || !geo.caserioLng) return null;
    const d = 0.03;
    return [
      [geo.caserioLat - d, geo.caserioLng - d],
      [geo.caserioLat + d, geo.caserioLng + d],
    ];
  }, [geo.caserioLat, geo.caserioLng]);

  // ── Bounds activos ───────────────────────────────────────────
  const activeBounds = useMemo(() => {
    if (caserioSelBounds) return caserioSelBounds;
    if (!geo.departamento) return GEO_BOUNDS.default;
    const db = GEO_BOUNDS.departamentos[geo.departamento] ?? GEO_BOUNDS.default;

    // Distrito: prioriza bounds DATASS (más precisos)
    if (geo.distrito) {
      const distB = cajaBounds.distritos[geo.distrito];
      if (distB) return distB;
      const gid3 = distGid3Map[geo.distrito];
      const df = gid3 && geojsonDists?.features?.find(f => f.properties.GID_3 === gid3);
      if (df) return bboxOf(df) ?? db;
    }

    // Provincia: prioriza bounds DATASS
    if (geo.provinciaId) {
      const provB = cajaBounds.provincias[geo.provinciaId];
      if (provB) return provB;
    }
    if (geo.provincia) {
      const pf = geojsonProvs.features.find(f => f.properties.GID_2 === geo.provincia);
      if (pf) return bboxOf(pf) ?? db;
    }

    return db;
  }, [geo.departamento, geo.provincia, geo.provinciaId, geo.distrito, caserioSelBounds, geojsonDists]);

  // ── Feature seleccionado para overlay ────────────────────────
  const selectionOverlay = useMemo(() => {
    if (geo.provincia) {
      const f = geojsonProvs.features.find(f => f.properties.GID_2 === geo.provincia);
      return f ? { type:"FeatureCollection", features:[f] } : null;
    }
    if (geo.departamento) {
      const f = geojsonDepts.features.find(f => f.properties.CODE === geo.departamento);
      return f ? { type:"FeatureCollection", features:[f] } : null;
    }
    return null;
  }, [geo.departamento, geo.provincia]);

  // ── GeoJSON filtrados ────────────────────────────────────────
  const filteredProvs = useMemo(() => {
    if (!geo.departamento) return null;
    const feats = geojsonProvs.features.filter(f => f.properties.DEPT_CODE === geo.departamento);
    return feats.length ? { type:"FeatureCollection", features:feats } : null;
  }, [geo.departamento]);

  const filteredDists = useMemo(() => {
    if (!geojsonDists || !geo.provincia) return null;
    const feats = geojsonDists.features.filter(f => f.properties.GID_2 === geo.provincia);
    return feats.length ? { type:"FeatureCollection", features:feats } : null;
  }, [geojsonDists, geo.provincia]);

  // ── Puntos CP/Caserío a mostrar en el mapa ──────────────────
  const caseriosData = useMemo(() => {
    if (!geo.distrito || !cajaByDist) return [];
    if (geo.deptCode !== "06") return [];

    const gid3 = distGid3Map[geo.distrito];
    if (!gid3) return [];
    const cps = cajaByDist[gid3] ?? [];

    // DATASS: todos los items como CPs (capital + caseríos tratados como CP)
    const isDatassDistrict = cps.length > 0 && cps.every(cp => cp.source === 'datass');

    if (isDatassDistrict) {
      // Muestra TODOS los CPs (el seleccionado se resalta con rojo en el render)
      return cps.filter(cp => cp.lat && cp.lng);
    }

    // OSM: CP seleccionado → muestra sus caseríos; sin selección → muestra todos los CPs
    if (geo.centroPoblado) {
      // Primero busca si el centroPoblado es directamente un caserío de la lista
      const directMatch = cps.find(c => c.id === geo.centroPoblado);
      if (directMatch) return cps.filter(c => c.lat && c.lng); // muestra todos, resalta el seleccionado

      const cp = cps.find(c => c.id === geo.centroPoblado);
      return (cp?.caserios ?? []).filter(c => c.lat && c.lng);
    }
    // Solo distrito: muestra todos los CPs y caseríos
    const all = [];
    cps.forEach(cp => { if (cp.lat) all.push({ ...cp, isVillage: true }); });
    cps.forEach(cp => { cp.caserios?.forEach(c => all.push(c)); });
    return all;
  }, [geo.distrito, geo.deptCode, geo.centroPoblado, geo.caserio, cajaByDist]);


  // ── Estilo departamentos ─────────────────────────────────────
  const deptStyle = useCallback((feature) => {
    const code  = feature?.properties?.CODE;
    const valor = valoresDepts[code];
    if (geo.departamento) {
      return code === geo.departamento
        ? activeStyle(valor, nivel)   // nivel actual (dept/prov/dist)
        : BORDER_ONLY_STYLE;
    }
    return activeStyle(valor, 'national');
  }, [valoresDepts, geo.departamento, nivel]);

  const deptOnEach = useCallback((feature, layer) => {
    const code  = feature?.properties?.CODE;
    const name  = feature?.properties?.name ?? feature?.properties?.NOMBDEP ?? "";
    const valor = valoresDepts[code];
    layer.bindTooltip(
      `<div style="font-size:12px;min-width:130px">
        <strong style="color:#1e3a8a">${name}</strong><br/>
        Indicador: <strong>${valor !== undefined ? valor.toFixed(2) : "—"} / 5</strong>
        <br/><em style="color:#64748b;font-size:10px">Departamento</em>
      </div>`,
      { sticky: true, opacity: 0.97 }
    );
    const base = () => deptStyle(feature);
    layer.on({
      mouseover: e => e.target.setStyle({ ...base(), weight: 1.5, color: "#1e3a8a" }),
      mouseout:  e => e.target.setStyle(base()),
    });
  }, [valoresDepts, geo.departamento, deptStyle]);

  // ── Estilo provincias ─────────────────────────────────────────
  const provStyle = useCallback((feature) => {
    const gid2  = feature?.properties?.GID_2;
    const valor = indicador ? getVal(gid2, indicador.id) : undefined;
    if (geo.provincia) {
      // Prov seleccionada: semi-transparente; resto: solo borde
      return gid2 === geo.provincia ? activeStyle(valor, 'prov') : BORDER_ONLY_STYLE;
    }
    return activeStyle(valor, 'prov');
  }, [indicador?.id, geo.provincia]);

  const provOnEach = useCallback((feature, layer) => {
    const name  = feature?.properties?.name ?? feature?.properties?.NOMBPROV ?? "";
    const gid2  = feature?.properties?.GID_2;
    const valor = indicador ? getVal(gid2, indicador.id) : undefined;
    layer.bindTooltip(
      `<div style="font-size:12px;min-width:130px">
        <strong style="color:#1e3a8a">${name}</strong><br/>
        Indicador: <strong>${valor !== undefined ? valor.toFixed(2) : "—"} / 5</strong>
        <br/><em style="color:#64748b;font-size:10px">Provincia</em>
      </div>`,
      { sticky: true, opacity: 0.97 }
    );
    const base = () => provStyle(feature);
    layer.on({
      mouseover: e => e.target.setStyle({ ...base(), weight: 1.5, color: "#1e3a8a" }),
      mouseout:  e => e.target.setStyle(base()),
    });
  }, [indicador?.id, geo.provincia, provStyle]);

  // ── Estilo distritos — opacidad baja para ver nombres del mapa ──
  const distStyle = useCallback((feature) => {
    const valor = indicador ? getVal(feature?.properties?.GID_3, indicador.id) : undefined;
    return activeStyle(valor, 'dist');   // fillOpacity: 0.28
  }, [indicador?.id]);

  const distOnEach = useCallback((feature, layer) => {
    const name  = feature?.properties?.name ?? "Distrito";
    const valor = indicador ? getVal(feature?.properties?.GID_3, indicador.id) : undefined;
    layer.bindTooltip(
      `<div style="font-size:12px;min-width:130px">
        <strong style="color:#1e3a8a">${name}</strong><br/>
        Indicador: <strong>${valor !== undefined ? valor.toFixed(2) : "—"} / 5</strong>
        <br/><em style="color:#64748b;font-size:10px">Distrito</em>
      </div>`,
      { sticky: true, opacity: 0.97 }
    );
    layer.on({
      mouseover: e => e.target.setStyle({ ...activeStyle(valor, 'dist'), weight: 1.5, color: "#1e3a8a", fillOpacity: 0.40 }),
      mouseout:  e => e.target.setStyle(distStyle(feature)),
    });
  }, [indicador?.id, distStyle]);

  // ── Burbujas ─────────────────────────────────────────────────
  const bubbles = useMemo(() => {
    if (!indicador) return [];

    if (nivel === "national") {
      return Object.entries(DEPT_CENTROIDS).map(([code, c]) => ({
        key: `d-${code}`, lat: c.lat, lng: c.lng,
        nombre: c.nombre, valor: valoresDepts[code], size: 46,
      }));
    }

    if (nivel === "dept" && filteredProvs) {
      return filteredProvs.features.map(f => {
        const ct = centroidOf(f);
        if (!ct) return null;
        return { key: `p-${f.properties.GID_2}`, lat: ct[0], lng: ct[1],
          nombre: f.properties.name ?? "", valor: getVal(f.properties.GID_2, indicador.id), size: 40 };
      }).filter(Boolean);
    }

    if ((nivel === "prov" || nivel === "dist") && filteredDists) {
      return filteredDists.features.map(f => {
        const ct = centroidOf(f);
        if (!ct) return null;
        return { key: `d-${f.properties.GID_3}`, lat: ct[0], lng: ct[1],
          nombre: f.properties.name ?? "", valor: getVal(f.properties.GID_3, indicador.id), size: 34 };
      }).filter(Boolean);
    }

    if (nivel === "prov" && filteredProvs) {
      return filteredProvs.features.map(f => {
        const ct = centroidOf(f);
        if (!ct) return null;
        return { key: `p-${f.properties.GID_2}`, lat: ct[0], lng: ct[1],
          nombre: f.properties.name ?? "", valor: getVal(f.properties.GID_2, indicador.id), size: 38 };
      }).filter(Boolean);
    }

    return [];
  }, [nivel, indicador?.id, valoresDepts, filteredProvs, filteredDists]);

  // ── Badge con nombre del área y cantidad ─────────────────────
  const badge = useMemo(() => {
    if (nivel === "caserio" && geo.caserioNombre) {
      return `🏘️ ${geo.caserioNombre} — ${geo.distritoNombre ?? "Distrito"}`;
    }
    if (nivel === "dept" && filteredProvs) {
      const d = geojsonDepts.features.find(f => f.properties.CODE === geo.departamento);
      return `${d?.properties?.name ?? "Departamento"} — ${filteredProvs.features.length} Provincias`;
    }
    if ((nivel === "prov" || nivel === "dist") && filteredDists) {
      const p = geojsonProvs.features.find(f => f.properties.GID_2 === geo.provincia);
      const count = caseriosData.length;
      return `${p?.properties?.name ?? "Provincia"} — ${filteredDists.features.length} Distritos${count > 0 ? ` · ${count} caseríos` : ""}`;
    }
    if (nivel === "dist" && caseriosData.length > 0) {
      return `${geo.distritoNombre ?? "Distrito"} — ${caseriosData.length} caseríos`;
    }
    if (nivel === "prov" && filteredProvs) {
      const p = geojsonProvs.features.find(f => f.properties.GID_2 === geo.provincia);
      return `${p?.properties?.name ?? "Provincia"}`;
    }
    return null;
  }, [nivel, geo.departamento, geo.provincia, geo.caserioNombre, geo.distritoNombre, filteredProvs, filteredDists, caseriosData.length]);

  const hasValues = Object.keys(valoresDepts).length > 0;

  return (
    <div className={styles.mapWrapper}>

      {/* Badge de contexto */}
      {badge && <div className={styles.nivelBadge}>📍 {badge}</div>}

      {/* Badge: datos reales solo si Corralcucho o Llushcapampa seleccionado */}
      {(geo.caserioNombre?.toLowerCase().includes('corralcucho') ||
        geo.caserioNombre?.toLowerCase().includes('llushcapampa')) && (
        <div className={styles.realBadge}>
          ⭐ Datos reales: {geo.caserioNombre} · n={metaReal?.totalRegistros} encuestados
        </div>
      )}

      <MapContainer
        bounds={GEO_BOUNDS.default}
        style={{ height: "100%", width: "100%" }}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        {/* Mapa base visible — se ve a través de los polígonos semi-transparentes */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          opacity={0.75}
        />

        {/* ── Capa base: departamentos siempre visible ── */}
        {hasValues && (
          <GeoJSON
            key={`depts-${indicador?.id}-${geo.departamento}`}
            data={geojsonDepts}
            style={deptStyle}
            onEachFeature={deptOnEach}
          />
        )}

        {/* ── Provincias del departamento elegido ── */}
        {filteredProvs && indicador && (
          <GeoJSON
            key={`provs-${geo.departamento}-${indicador?.id}-${geo.provincia}`}
            data={filteredProvs}
            style={provStyle}
            onEachFeature={provOnEach}
          />
        )}

        {/* ── Distritos de la provincia elegida ── */}
        {filteredDists && indicador && (
          <GeoJSON
            key={`dists-${geo.provincia}-${indicador?.id}`}
            data={filteredDists}
            style={distStyle}
            onEachFeature={distOnEach}
          />
        )}

        {/* ── Overlay de selección: borde azul oscuro encima ── */}
        {selectionOverlay && (
          <GeoJSON
            key={`sel-${geo.departamento}-${geo.provincia}`}
            data={selectionOverlay}
            style={() => SELECTION_OVERLAY}
            interactive={false}
          />
        )}

        {/* ── Burbujas depts/provs/distritos (verde=real, azul=simulado) ── */}
        {bubbles.map(b => {
          // La burbuja es "real" si corresponde a La Ramada (060605) o su área
          const esReal = b.key?.includes('060605') || b.distId === UBIGEO_REAL;
          return (
            <Marker
              key={b.key}
              position={[b.lat, b.lng]}
              icon={makeBubbleIcon(b.valor, b.nombre, b.size, esReal)}
              interactive={true}
            >
              <Tooltip direction="top" offset={[0, -b.size/2 - 6]} opacity={0.97}>
                <div style={{ fontSize:12, minWidth:170 }}>
                  <div style={{ fontWeight:700, color:"#1e3a8a", marginBottom:3 }}>{b.nombre}</div>
                  <div>Valor indicador: <strong>{b.valor !== undefined ? b.valor.toFixed(2) : "—"}</strong> / 5</div>
                  <div style={{ color:"#64748b", fontSize:10, marginTop:2 }}>
                    {b.valor >= 4.0 ? "🟢 Alto" : b.valor >= 3.0 ? "🟡 Medio" : "🔴 Bajo"}
                  </div>
                  {esReal && <div style={{color:"#15803d",fontSize:10,fontWeight:600,marginTop:2}}>⭐ Datos reales (Excel)</div>}
                  {!esReal && <div style={{color:"#92400e",fontSize:10,marginTop:2}}>🟡 Datos simulados</div>}
                </div>
              </Tooltip>
            </Marker>
          );
        })}

        {/* ── Marcadores de CPs y Caseríos ── */}
        {caseriosData.length > 0 && indicador && caseriosData.map(c => {
          if (!c.lat || !c.lng) return null;

          // Para Corralcucho → usa el promedio del ÚLTIMO MES real (para el mapa)
          const esRealMarker = tieneDataReal(c.id, c.nombre);
          const valorReal    = esRealMarker ? getValorRealUltimoMes(indicador.id) : null;
          const valor        = valorReal !== null ? valorReal : getVal(c.id, indicador.id);

          // El punto rojo persiste siempre que el CP/caserío esté seleccionado
          const isSelected = geo.centroPoblado === c.id || geo.caserio === c.id ||
                             (geo.cpNombre && geo.cpNombre === c.nombre);
          const isDatass   = c.source === 'datass';
          const isCapital  = c.type === 'capital_datass';
          const isVillage  = c.isVillage === true || isCapital;

          // Capital DATASS → naranja; CP DATASS → verde teal; OSM village → verde; caserío → morado; selec → rojo
          const color = isSelected  ? "#dc2626"
            : isCapital             ? "#d97706"   // naranja ámbar = capital distrital
            : isDatass              ? "#0891b2"   // teal = CP DATASS
            : isVillage             ? "#15803d"   // verde = OSM village
            : "#7c3aed";                          // morado = caserío OSM
          const radius = isSelected ? 11 : isCapital ? 9 : isVillage ? 8 : 5;

          const tipoLabel = isCapital  ? "🏛️ Capital Distrital"
            : isDatass                 ? "🏘️ C. Poblado (DATASS)"
            : isVillage                ? "🏘️ C. Poblado"
            : "🏡 Caserío";

          return (
            <CircleMarker
              key={c.id}
              center={[c.lat, c.lng]}
              radius={radius}
              pathOptions={{
                fillColor: color, fillOpacity: 0.9,
                color: "#fff", weight: isSelected ? 3 : 1.5,
              }}
            >
              <Tooltip direction="top" offset={[0, -radius - 3]} opacity={0.97}>
                <div style={{ fontSize:12, minWidth:170 }}>
                  <div style={{ fontWeight:700, color:"#1e3a8a", marginBottom:3 }}>
                    {c.nombre}
                  </div>
                  <div style={{ fontSize:10, color, marginBottom:3 }}>{tipoLabel}</div>
                  <div>
                    Indicador: <strong>{valor.toFixed(2)}</strong> / 5
                    {esRealMarker && <span style={{color:"#15803d",fontSize:9,marginLeft:4}}>(último mes)</span>}
                  </div>
                  <div style={{ color:"#64748b", fontSize:10 }}>
                    {valor >= 4.0 ? "🟢 Alto" : valor >= 3.0 ? "🟡 Medio" : "🔴 Bajo"}
                  </div>
                  {esRealMarker && <div style={{color:"#15803d",fontSize:9,marginTop:2}}>⭐ Dato real (Excel)</div>}
                  {isSelected && <div style={{color:"#dc2626",fontSize:10,fontWeight:700,marginTop:2}}>✓ Seleccionado</div>}
                  {isDatass && !esRealMarker && <div style={{color:"#0891b2",fontSize:9,marginTop:2}}>Fuente: DATASS</div>}
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}

        <MapController bounds={activeBounds} />
      </MapContainer>

      {/* ── Leyenda ── */}
      <div className={styles.legend}>
        <div className={styles.legendTitle}>Cobertura</div>
        <div className={styles.legendItem}>
          <span className={styles.legendColor} style={{ background:"#e8f0f7", border:"1px solid #cbd5e1" }} />
          <span>Sin información</span>
        </div>
        {[
          { color: "#deebf7", label: "[1.0 – 2.0)" },
          { color: "#9ecae1", label: "[2.0 – 3.0)" },
          { color: "#4292c6", label: "[3.0 – 4.0)" },
          { color: "#2171b5", label: "[4.0 – 4.5)" },
          { color: "#084594", label: "[4.5 – 5.0]" },
        ].map(({ color, label }) => (
          <div key={label} className={styles.legendItem}>
            <span className={styles.legendColor} style={{ background: color }} />
            <span>{label}</span>
          </div>
        ))}

        {/* Burbujas reales vs simuladas */}
        <div className={styles.legendSep} />
        <div style={{ fontSize:10, fontWeight:700, color:"#374151", marginBottom:3 }}>Burbujas</div>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background:"#15803d", width:12, height:12, border:"2px solid #fbbf24" }} />
          <span>⭐ Datos reales (Excel)</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background:"#2563eb", width:12, height:12 }} />
          <span>Datos simulados</span>
        </div>

        {/* Leyenda de marcadores CP/Caserío */}
        {caseriosData.length > 0 && (
          <>
            <div className={styles.legendSep} />
            {[
              { color:"#d97706", size:9,  label:"Capital distrital" },
              { color:"#0891b2", size:8,  label:"C. Poblado (DATASS)" },
              { color:"#15803d", size:8,  label:"C. Poblado (OSM)" },
              { color:"#7c3aed", size:5,  label:"Caserío" },
              { color:"#dc2626", size:10, label:"Seleccionado" },
            ].map(({ color, size, label }) => (
              <div key={label} className={styles.legendItem}>
                <span className={styles.legendDot}
                  style={{ background:color, width:size+2, height:size+2 }} />
                <span>{label}</span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
