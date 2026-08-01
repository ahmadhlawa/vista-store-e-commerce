import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { CalculatorPage } from "../components/Pages.jsx";

// Resin volume helper kept from the original storefront: a purely local tool.
export default function CalculatorRoutePage() {
  const shell = useOutletContext();
  const [calc, setCalc] = useState({ shape: "round", dia: 20, side: 20, height: 2, layers: 1 });

  const volume =
    (calc.shape === "round"
      ? Math.PI * (Number(calc.dia) / 2) ** 2
      : Number(calc.side) ** 2) *
    Number(calc.height) *
    Number(calc.layers || 1);
  const grams = volume * 1.1 * 1.1;
  const update = (patch) => setCalc((current) => ({ ...current, ...patch }));

  const v = {
    ...shell,
    calc,
    isRound: calc.shape === "round",
    isSquare: calc.shape === "square",
    roundBg: calc.shape === "round" ? "#fff" : "transparent",
    roundColor: calc.shape === "round" ? "#1F4E4A" : "#7C766D",
    squareBg: calc.shape === "square" ? "#fff" : "transparent",
    squareColor: calc.shape === "square" ? "#1F4E4A" : "#7C766D",
    calcRound: () => update({ shape: "round" }),
    calcSquare: () => update({ shape: "square" }),
    setDia: (event) => update({ dia: event.target.value }),
    setSide: (event) => update({ side: event.target.value }),
    setHeight: (event) => update({ height: event.target.value }),
    setLayers: (event) => update({ layers: event.target.value }),
    calcTotal: `${grams > 0 ? Math.round(grams) : 0} غم`,
    calcResin: `${Math.round((grams * 2) / 3)} غم`,
    calcHard: `${Math.round(grams / 3)} غم`,
    calcVol: `${Math.round(volume)} سم³`,
  };

  return <CalculatorPage v={v} />;
}
