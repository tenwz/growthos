export const CHANNEL_COLORS = [
  "#c6ff3d",
  "#5eead4",
  "#7dd3fc",
  "#f0abfc",
  "#fbbf24",
  "#fb7185",
  "#a3a3a3",
  "#fde68a",
];

export interface BarDatum {
  label: string;
  value: number;
  segments?: { label: string; value: number; color: string }[];
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function barChart(data: BarDatum[], width = 620, height = 190): string {
  const padding = { top: 12, right: 8, bottom: 28, left: 8 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const max = Math.max(1, ...data.map((datum) => datum.value));
  const slot = chartWidth / Math.max(1, data.length);
  const barWidth = Math.min(44, slot * 0.62);

  const bars = data
    .map((datum, index) => {
      const x = padding.left + slot * index + (slot - barWidth) / 2;
      const totalHeight = (datum.value / max) * chartHeight;
      let y = padding.top + chartHeight - totalHeight;
      const segments =
        datum.segments && datum.segments.length > 0
          ? datum.segments
          : [{ label: datum.label, value: datum.value, color: "#c6ff3d" }];
      const segmentTotal = segments.reduce((sum, segment) => sum + segment.value, 0) || 1;
      const parts = segments
        .filter((segment) => segment.value > 0)
        .map((segment) => {
          const h = (segment.value / segmentTotal) * totalHeight;
          const rect = `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barWidth.toFixed(
            1,
          )}" height="${Math.max(1, h).toFixed(1)}" rx="2" fill="${segment.color}"><title>${escapeXml(
            `${datum.label} · ${segment.label}: ${segment.value}`,
          )}</title></rect>`;
          y += h;
          return rect;
        })
        .join("");
      return `${parts}<text x="${(x + barWidth / 2).toFixed(1)}" y="${
        padding.top + chartHeight + 18
      }" text-anchor="middle" fill="#8b949e" font-size="10" font-family="ui-monospace, monospace">${escapeXml(
        datum.label,
      )}</text><text x="${(x + barWidth / 2).toFixed(1)}" y="${
        padding.top + chartHeight - totalHeight - 5
      }" text-anchor="middle" fill="#e6edf3" font-size="10" font-family="ui-monospace, monospace">${
        datum.value || ""
      }</text>`;
    })
    .join("");

  return `<svg viewBox="0 0 ${width} ${height}" width="100%" role="img" aria-label="Signal volume by week">
  <line x1="${padding.left}" y1="${padding.top + chartHeight}" x2="${
    width - padding.right
  }" y2="${padding.top + chartHeight}" stroke="#30363d" stroke-width="1"/>
  ${bars}
</svg>`;
}

export function donut(percent: number, size = 132, label = ""): string {
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, percent));
  const dash = circumference * clamped;
  return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="${escapeXml(
    label,
  )}">
  <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="none" stroke="#21262d" stroke-width="${stroke}"/>
  <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="none" stroke="#c6ff3d" stroke-width="${stroke}"
    stroke-linecap="round" stroke-dasharray="${dash.toFixed(1)} ${circumference.toFixed(
      1,
    )}" transform="rotate(-90 ${size / 2} ${size / 2})"/>
  <text x="${size / 2}" y="${size / 2 + 2}" text-anchor="middle" fill="#e6edf3" font-size="24" font-weight="700" font-family="ui-monospace, monospace">${Math.round(
    clamped * 100,
  )}%</text>
  <text x="${size / 2}" y="${size / 2 + 22}" text-anchor="middle" fill="#8b949e" font-size="10" font-family="ui-monospace, monospace">${escapeXml(
    label,
  )}</text>
</svg>`;
}

export function progressBars(
  data: { label: string; earned: number; points: number }[],
  width = 620,
): string {
  const rowHeight = 34;
  const labelWidth = 170;
  const height = data.length * rowHeight + 8;
  const rows = data
    .map((datum, index) => {
      const y = index * rowHeight + 4;
      const ratio = datum.points === 0 ? 0 : datum.earned / datum.points;
      return `<text x="0" y="${y + 14}" fill="#c9d1d9" font-size="12" font-family="ui-sans-serif, system-ui">${escapeXml(
        datum.label,
      )}</text>
      <rect x="${labelWidth}" y="${y + 3}" width="${width - labelWidth - 52}" height="14" rx="7" fill="#21262d"/>
      <rect x="${labelWidth}" y="${y + 3}" width="${((width - labelWidth - 52) * ratio).toFixed(
        1,
      )}" height="14" rx="7" fill="#c6ff3d"/>
      <text x="${width - 4}" y="${y + 14}" text-anchor="end" fill="#8b949e" font-size="11" font-family="ui-monospace, monospace">${datum.earned}/${datum.points}</text>`;
    })
    .join("");
  return `<svg viewBox="0 0 ${width} ${height}" width="100%" role="img" aria-label="Score breakdown">${rows}</svg>`;
}

export function sparkline(values: number[], width = 160, height = 40): string {
  if (values.length === 0) return "";
  const max = Math.max(1, ...values);
  const step = width / Math.max(1, values.length - 1);
  const points = values
    .map(
      (value, index) =>
        `${(index * step).toFixed(1)},${(height - (value / max) * height).toFixed(1)}`,
    )
    .join(" ");
  return `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="Trend"><polyline points="${points}" fill="none" stroke="#c6ff3d" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
}
