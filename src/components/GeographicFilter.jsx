import { useEffect, useMemo, useState } from "react";
import ubigeo from "../data/ubigeo.json";
import gid2Map from "../data/prov_gid2_map.json";
import distGid3Map from "../data/dist_gid3_map.json";
import styles from "./GeographicFilter.module.css";

const {
  departamentos,
  provincias:      provsByDept,
  distritos:       distsByProv,
  centrosPoblados: cpByDistSim,   // CP simulados para depts sin datos reales
} = ubigeo;

// ── Carga lazy de datos reales CP→Caserío de Cajamarca (OSM) ─
let _cajaCpCache = null;
async function loadCajaCpCaserios() {
  if (_cajaCpCache) return _cajaCpCache;
  const m = await import("../data/cajamarca_cp_caserios.json");
  _cajaCpCache = m.default;
  return _cajaCpCache;
}

// Nombres simulados para caseríos de otros departamentos
const NOMBRES_SIMULADOS = [
  "La Esperanza","El Porvenir","San José","El Carmen","La Unión",
  "El Molino","San Martín","La Victoria","Nueva Vida","El Progreso",
  "Los Ángeles","Santa Fe","El Milagro","La Palma","San Luis",
  "El Edén","La Merced","Nueva Era","El Bosque","San Roque",
  "La Laguna","El Tambo","Cruz Blanca","La Ramada","El Azufral",
];

function getSimCaserios(distId, n = 4) {
  const seed = distId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return Array.from({ length: n }, (_, i) => {
    const idx = (seed * (i + 1) * 17) % NOMBRES_SIMULADOS.length;
    return { id: `${distId}_CAS${i + 1}`, nombre: NOMBRES_SIMULADOS[idx], lat: null, lng: null };
  });
}

export default function GeographicFilter({ onGeoChange }) {
  const [selDept, setSelDept] = useState("");
  const [selProv, setSelProv] = useState(null);
  const [selDist, setSelDist] = useState(null);
  const [selCP,   setSelCP]   = useState("");
  const [selCas,  setSelCas]  = useState(null);
  const [cajaCpLoaded, setCajaCpLoaded] = useState(null); // CP→Caserío Cajamarca (lazy)

  // Carga datos Cajamarca cuando se selecciona ese departamento
  useEffect(() => {
    if (selDept === "06" && !cajaCpLoaded) {
      loadCajaCpCaserios().then(setCajaCpLoaded);
    }
  }, [selDept]);

  const provincias = useMemo(() => (selDept ? provsByDept[selDept] ?? [] : []), [selDept]);
  const distritos  = useMemo(() => {
    if (!selProv) return [];
    return distsByProv[selDept + selProv.provId] ?? [];
  }, [selDept, selProv?.provId]);

  // ── Centros Poblados ─────────────────────────────────────────
  // Cajamarca: TODOS los items del gid3 (CP principal + caseríos tratados como CP)
  // Otros depts: datos simulados
  const centrosPoblados = useMemo(() => {
    if (!selDist) return [];
    if (selDept === "06" && cajaCpLoaded) {
      const gid3 = distGid3Map[selDist.id];
      const cps  = gid3 ? (cajaCpLoaded[gid3] ?? []) : [];
      // Nivel 1: CPs principales
      const nivel1 = cps.map(cp => ({ id: cp.id, nombre: cp.nombre, lat: cp.lat, lng: cp.lng }));
      // Nivel 2: caseríos de cada CP también se muestran como CP (tratados igual)
      const nivel2 = cps.flatMap(cp =>
        (cp.caserios ?? []).map(c => ({ id: c.id, nombre: c.nombre, lat: c.lat, lng: c.lng }))
      );
      return [...nivel1, ...nivel2];
    }
    if (selDept === "06" && !cajaCpLoaded) {
      return [{ id: "_loading", nombre: "Cargando…" }];
    }
    return cpByDistSim[selDist.id] ?? [];
  }, [selDept, selDist?.id, cajaCpLoaded]);

  // ── Caserío: NO se usa (tratado como C. Poblado) ──────────────
  const caserios = [];

  const emit = (dept, prov, dist, cp, cpObj) => {
    const provGid2 = prov?.id ? (gid2Map[prov.id] ?? prov.id) : "";
    onGeoChange({
      departamento:     dept,
      deptCode:         dept,
      provincia:        provGid2,
      provinciaId:      prov?.id ?? "",
      provinciaNombre:  prov?.nombre ?? "",
      distrito:         dist?.id ?? "",
      distritoNombre:   dist?.nombre ?? "",
      centroPoblado:    cp,
      cpNombre:         cpObj?.nombre ?? "",   // nombre del CP para detección de datos reales
      cpLat:            cpObj?.lat ?? null,
      cpLng:            cpObj?.lng ?? null,
      // caserío ya no se usa — cp y caserio son el mismo nivel
      caserio:          cp,
      caserioNombre:    cpObj?.nombre ?? "",
      caserioLat:       cpObj?.lat ?? null,
      caserioLng:       cpObj?.lng ?? null,
    });
  };

  const handleDept = (val) => {
    setSelDept(val); setSelProv(null); setSelDist(null); setSelCP(""); setSelCas(null);
    emit(val, null, null, "", null);
  };
  const handleProv = (val) => {
    const p = provincias.find(p => p.id === val) ?? null;
    setSelProv(p); setSelDist(null); setSelCP(""); setSelCas(null);
    emit(selDept, p, null, "", null);
  };
  const handleDist = (val) => {
    const d = distritos.find(d => d.id === val) ?? null;
    setSelDist(d); setSelCP(""); setSelCas(null);
    emit(selDept, selProv, d, "", null);
  };
  const handleCas2 = (val) => {  // mantener para compatibilidad aunque no se use
    setSelCas(null);
  };
  const handleCP = (val) => {
    setSelCP(val); setSelCas(null);
    // El CP seleccionado también se pasa como caserioNombre para la detección de datos reales
    const cpObj = centrosPoblados.find(c => c.id === val);
    emit(selDept, selProv, selDist, val, cpObj ?? null);
  };
  // Caserío no se usa (todo está en C. Poblado)
  const handleCas = () => {};

  const Select = ({ label, options, value, onChange, disabled, badge }) => (
    <div className={styles.row}>
      <div className={styles.selectWrapper}>
        {badge && <span className={styles.badge}>{badge}</span>}
        <select
          className={styles.select}
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
        >
          <option value="">{label} - Todos</option>
          {options.map(o => (
            <option key={o.id} value={o.id}>{o.nombre}</option>
          ))}
        </select>
        <span className={styles.arrow}>▾</span>
      </div>
    </div>
  );

  return (
    <div className={styles.panel}>
      <div className={styles.title}>ÁMBITO GEOGRÁFICO</div>
      <Select label="Departamento" options={departamentos}    value={selDept}           onChange={handleDept} />
      <Select label="Provincia"    options={provincias}       value={selProv?.id ?? ""}  onChange={handleProv} disabled={!selDept} />
      <Select label="Distrito"     options={distritos}        value={selDist?.id ?? ""}  onChange={handleDist} disabled={!selProv} />
      <Select label="C. Poblado"   options={centrosPoblados}  value={selCP}              onChange={handleCP}   disabled={!selDist} />
      <Select
        label="Caserío"
        options={caserios}
        value={selCas?.id ?? ""}
        onChange={handleCas}
        disabled={!selCP}
        badge={selDept === "06" && selCP && caserios.length > 0 ? `${caserios.length} reales` : null}
      />
    </div>
  );
}
