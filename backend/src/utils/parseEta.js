function parseEta(str) {
  // "15-25" => {etaMin:15, etaMax:25}
  const parts = String(str || "")
    .split("-")
    .map((s) => parseInt(s.trim(), 10));

  if (parts.length !== 2 || Number.isNaN(parts[0]) || Number.isNaN(parts[1])) {
    return { etaMin: 0, etaMax: 0 };
  }
  return { etaMin: parts[0], etaMax: parts[1] };
}

module.exports = { parseEta };
