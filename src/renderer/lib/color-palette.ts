export const dossierColorChoices = [
  { value: "#d84a45", label: "Signal red" },
  { value: "#f07f2f", label: "Burnt orange" },
  { value: "#f0a52b", label: "Amber" },
  { value: "#d4bd3f", label: "Ochre" },
  { value: "#62a85b", label: "Field green" },
  { value: "#2a9d8f", label: "Teal" },
  { value: "#3386c5", label: "Map blue" },
  { value: "#8bc5e8", label: "Sky blue" },
  { value: "#5967c4", label: "Indigo" },
  { value: "#8264b5", label: "Violet" },
  { value: "#b45588", label: "Berry" },
  { value: "#e68aa2", label: "Rose" },
  { value: "#8b6548", label: "Earth" },
  { value: "#4f5963", label: "Slate" },
  { value: "#111111", label: "Black" },
  { value: "#ffffff", label: "White" },
] as const;

export const dossierColors = dossierColorChoices.map((choice) => choice.value);
