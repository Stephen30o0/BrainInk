// chartjsGraph.js
// ChartJS-based graph generation for K.A.N.A. backend (requires chartjs-node-canvas and canvas)
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const fs = require('fs');
const path = require('path');

async function generateChartJSGraph(data, title = '', xLabel = 'x', yLabel = 'y') {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return null;
  }
  
  const width = 500;
  const height = 300;
  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });
  
  // Extract x and y values from the data array
  const xValues = data.map(point => point.x);
  const yValues = data.map(point => point.y);
  
  const config = {
    type: 'line',
    data: {
      labels: xValues,
      datasets: [{
        label: title || 'y',
        data: yValues,
        borderColor: '#6c5ce7',
        backgroundColor: 'rgba(108,92,231,0.2)',
        fill: false,
        tension: 0.1,
        pointRadius: 0
      }]
    },
    options: {
      plugins: {
        legend: { display: false },
        title: { display: !!title, text: title, color: '#fff', font: { size: 18 } }
      },
      scales: {
        x: {
          title: { display: true, text: xLabel, color: '#fff', font: { size: 14 } },
          ticks: { color: '#fff' },
          grid: { color: '#444' }
        },
        y: {
          title: { display: true, text: yLabel, color: '#fff', font: { size: 14 } },
          ticks: { color: '#fff' },
          grid: { color: '#444' }
        }
      },
      backgroundColor: '#181c24',
      responsive: false
    }
  };
  const buffer = await chartJSNodeCanvas.renderToBuffer(config);
  const fileName = `graph_${Date.now()}.png`;
  const filePath = path.join(__dirname, '../uploads', fileName);
  fs.writeFileSync(filePath, buffer);
  return `/uploads/${fileName}`;
}

module.exports = { generateChartJSGraph };
