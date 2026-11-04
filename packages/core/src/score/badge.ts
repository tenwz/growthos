import type { Badge, ScoreResult } from "./types.js";

export function badgeFor(result: ScoreResult): Badge {
  const suffix = result.synthetic ? " · demo" : "";
  return {
    schemaVersion: 1,
    label: result.label,
    message: `${result.score}/100${suffix}`,
    color: result.color,
    cacheSeconds: 3600,
  };
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function badgeSvg(result: ScoreResult): string {
  const label = "growthOS";
  const message = `${result.score}/100`;
  const labelWidth = 78;
  const messageWidth = 62;
  const width = labelWidth + messageWidth;
  const color =
    result.score >= 90
      ? "#3ddc84"
      : result.score >= 80
        ? "#7ee787"
        : result.score >= 60
          ? "#f2cc60"
          : result.score >= 40
            ? "#ffa657"
            : "#ff7b72";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="28" role="img" aria-label="${label}: ${message}">
  <title>${label}: ${message}</title>
  <rect width="${width}" height="28" rx="6" fill="#0b0d10"/>
  <rect x="0" y="0" width="${labelWidth}" height="28" rx="6" fill="#171a1f"/>
  <rect x="${labelWidth}" y="0" width="${messageWidth}" height="28" rx="6" fill="#0b0d10"/>
  <g transform="translate(10 7)">
    <rect x="0" y="9" width="3" height="5" rx="1" fill="#c6ff3d"/>
    <rect x="5" y="5" width="3" height="9" rx="1" fill="#c6ff3d"/>
    <rect x="10" y="1" width="3" height="13" rx="1" fill="#c6ff3d"/>
  </g>
  <text x="${labelWidth - 8}" y="18" fill="#e6edf3" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="11" text-anchor="end">${escapeXml(label)}</text>
  <text x="${labelWidth + messageWidth / 2}" y="18" fill="${color}" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="11" font-weight="700" text-anchor="middle">${escapeXml(message)}</text>
</svg>`;
}
