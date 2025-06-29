// SVG graph generation utility for K.A.N.A. backend
// Usage: generateSVGGraph(data, title, xLabel, yLabel)

function generateSVGGraph(data, title = '', xLabel = 'x', yLabel = 'y') {
  // data: { x: number[], y: number[] }
  if (!data || !Array.isArray(data.x) || !Array.isArray(data.y) || data.x.length !== data.y.length) {
    return null;
  }
  const width = 500;
  const height = 300;
  const padding = 50;
  const points = data.x.map((x, i) => ({ x, y: data.y[i] }));
  // Find min/max
  const minX = Math.min(...data.x);
  const maxX = Math.max(...data.x);
  const minY = Math.min(...data.y);
  const maxY = Math.max(...data.y);
  // Scale functions
  const scaleX = x => padding + ((x - minX) / (maxX - minX || 1)) * (width - 2 * padding);
  const scaleY = y => height - padding - ((y - minY) / (maxY - minY || 1)) * (height - 2 * padding);
  // Polyline points
  const polyline = points.map(p => `${scaleX(p.x)},${scaleY(p.y)}`).join(' ');
  // Axes
  const xAxisY = scaleY(minY);
  const yAxisX = scaleX(minX);
  // SVG
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#181c24" />
  <g>
    <line x1="${padding}" y1="${xAxisY}" x2="${width-padding}" y2="${xAxisY}" stroke="#aaa" stroke-width="2" />
    <line x1="${yAxisX}" y1="${padding}" x2="${yAxisX}" y2="${height-padding}" stroke="#aaa" stroke-width="2" />
    <polyline fill="none" stroke="#6c5ce7" stroke-width="3" points="${polyline}" />
    <text x="${width/2}" y="${padding/2}" text-anchor="middle" fill="#fff" font-size="18">${title}</text>
    <text x="${width/2}" y="${height-10}" text-anchor="middle" fill="#fff" font-size="14">${xLabel}</text>
    <text x="15" y="${height/2}" text-anchor="middle" fill="#fff" font-size="14" transform="rotate(-90 15,${height/2})">${yLabel}</text>
  </g>
</svg>`;
}

module.exports = { generateSVGGraph };
