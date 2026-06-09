import { useEffect, useState } from "react";
import { getIndicadores } from "../api/contract.js";
import styles from "./IndicatorList.module.css";

export default function IndicatorList({ selectedId, onSelect }) {
  const [indicadores, setIndicadores] = useState([]);

  useEffect(() => {
    getIndicadores().then((data) => {
      setIndicadores(data);
      if (!selectedId && data.length > 0) onSelect(data[0]);
    });
  }, []);

  return (
    <div className={styles.panel}>
      <div className={styles.title}>INDICADORES</div>
      <ul className={styles.list}>
        {indicadores.map((ind, i) => (
          <li
            key={ind.id}
            className={`${styles.item} ${selectedId === ind.id ? styles.active : ""}`}
            onClick={() => onSelect(ind)}
          >
            <span className={styles.num}>{i + 1}</span>
            <span className={styles.nombre}>{ind.nombre}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
