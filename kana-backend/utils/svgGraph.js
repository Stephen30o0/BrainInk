// SVG graph generation utility for K.A.N.A. backend
// Usage: generateSVGGraph(data, title, xLabel, yLabel)

function generateSVGGraph(data, title = '', xLabel = 'x', yLabel = 'y') {
  // data: Array of {x: number, y: number} objects
  if (!data || !Array.isArray(data) || data.length === 0) {
    return null;
  }
  
  const width = 600;
  const height = 400;
  const padding = 80;
  
  // Extract x and y values from the data array
  const xValues = data.map(point => point.x);
  const yValues = data.map(point => point.y);
  
  // Find min/max with some padding
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);
  
  // Add some padding to the range
  const xRange = maxX - minX || 1;
  const yRange = maxY - minY || 1;
  const xPadding = xRange * 0.05;
  const yPadding = yRange * 0.1;
  
  const plotMinX = minX - xPadding;
  const plotMaxX = maxX + xPadding;
  const plotMinY = minY - yPadding;
  const plotMaxY = maxY + yPadding;
  
  // Scale functions
  const scaleX = x => padding + ((x - plotMinX) / (plotMaxX - plotMinX)) * (width - 2 * padding);
  const scaleY = y => height - padding - ((y - plotMinY) / (plotMaxY - plotMinY)) * (height - 2 * padding);
  
  // Calculate axis positions (at zero if possible, otherwise at edge)
  const xAxisY = scaleY(Math.max(plotMinY, Math.min(0, plotMaxY)));
  const yAxisX = scaleX(Math.max(plotMinX, Math.min(0, plotMaxX)));
  
  // Create smooth polyline points from the data array
  const polyline = data.map(point => `${scaleX(point.x)},${scaleY(point.y)}`).join(' ');
  
  // Generate grid lines and tick marks
  const numXTicks = 8;
  const numYTicks = 6;
  
  let gridLines = '';
  let tickMarks = '';
  
  // X-axis grid lines and ticks
  for (let i = 0; i <= numXTicks; i++) {
    const x = plotMinX + (i / numXTicks) * (plotMaxX - plotMinX);
    const pixelX = scaleX(x);
    gridLines += `<line x1="${pixelX}" y1="${padding}" x2="${pixelX}" y2="${height-padding}" stroke="#ddd" stroke-width="1" opacity="0.8"/>`;
    tickMarks += `<line x1="${pixelX}" y1="${xAxisY-5}" x2="${pixelX}" y2="${xAxisY+5}" stroke="#666" stroke-width="2"/>`;
    tickMarks += `<text x="${pixelX}" y="${xAxisY+20}" text-anchor="middle" fill="#444" font-size="12">${x.toFixed(1)}</text>`;
  }
  
  // Y-axis grid lines and ticks
  for (let i = 0; i <= numYTicks; i++) {
    const y = plotMinY + (i / numYTicks) * (plotMaxY - plotMinY);
    const pixelY = scaleY(y);
    gridLines += `<line x1="${padding}" y1="${pixelY}" x2="${width-padding}" y2="${pixelY}" stroke="#ddd" stroke-width="1" opacity="0.8"/>`;
    tickMarks += `<line x1="${yAxisX-5}" y1="${pixelY}" x2="${yAxisX+5}" y2="${pixelY}" stroke="#666" stroke-width="2"/>`;
    tickMarks += `<text x="${yAxisX-15}" y="${pixelY+5}" text-anchor="end" fill="#444" font-size="12">${y.toFixed(1)}</text>`;
  }
  
  // SVG
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .graph-bg { fill: #ffffff; }
      .grid-line { stroke: #ddd; stroke-width: 1; opacity: 0.8; }
      .axis-line { stroke: #333; stroke-width: 2; }
      .main-line { fill: none; stroke: #1f77b4; stroke-width: 2.5; }
      .title-text { fill: #333; font-size: 18px; font-weight: bold; font-family: Arial, sans-serif; }
      .axis-label { fill: #444; font-size: 14px; font-family: Arial, sans-serif; }
      .tick-label { fill: #444; font-size: 12px; font-family: Arial, sans-serif; }
    </style>
  </defs>
  
  <rect width="100%" height="100%" class="graph-bg" />
  
  <!-- Grid lines -->
  ${gridLines}
  
  <!-- Main axes -->
  <line x1="${padding}" y1="${xAxisY}" x2="${width-padding}" y2="${xAxisY}" class="axis-line" />
  <line x1="${yAxisX}" y1="${padding}" x2="${yAxisX}" y2="${height-padding}" class="axis-line" />
  
  <!-- Tick marks and labels -->
  ${tickMarks}
  
  <!-- Function curve -->
  <polyline points="${polyline}" class="main-line" />
  
  <!-- Labels -->
  <text x="${width/2}" y="30" text-anchor="middle" class="title-text">${title}</text>
  <text x="${width/2}" y="${height-15}" text-anchor="middle" class="axis-label">${xLabel}</text>
  <text x="25" y="${height/2}" text-anchor="middle" class="axis-label" transform="rotate(-90 25,${height/2})">${yLabel}</text>
</svg>`;
}

module.exports = { generateSVGGraph };
