import { Component, useState } from "react";
import GeographicFilter from "./components/GeographicFilter.jsx";
import IndicatorList from "./components/IndicatorList.jsx";
import PeruMap from "./components/PeruMap.jsx";
import ImpactChart from "./components/ImpactChart.jsx";
import styles from "./App.module.css";

// Error Boundary para capturar errores de PeruMap
class MapErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(e) { return { error: e }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 20, background: "#fef2f2", color: "#991b1b", fontSize: 13 }}>
          <strong>Error en PeruMap:</strong>
          <pre style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>
            {this.state.error?.message}
            {"\n"}
            {this.state.error?.stack?.split("\n").slice(0, 8).join("\n")}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const [geo, setGeo] = useState({
    departamento: "", deptCode: "",
    provincia: "", provinciaId: "", provinciaNombre: "",
    distrito: "", distritoNombre: "",
    centroPoblado: "",
    caserio: "", caserioNombre: "", caserioLat: null, caserioLng: null,
  });
  const [indicador, setIndicador] = useState(null);

  return (
    <div className={styles.layout}>
      <aside className={styles.leftPanel}>
        <GeographicFilter onGeoChange={setGeo} />
        <IndicatorList selectedId={indicador?.id} onSelect={setIndicador} />
      </aside>

      <main className={styles.mapPanel}>
        <MapErrorBoundary>
          <PeruMap geo={geo} indicador={indicador} />
        </MapErrorBoundary>
      </main>

      <aside className={styles.rightPanel}>
        <ImpactChart geo={geo} indicador={indicador} />
      </aside>
    </div>
  );
}

export default App;
