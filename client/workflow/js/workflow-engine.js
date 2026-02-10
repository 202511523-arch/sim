/**
 * Workflow Execution Engine
 * ORANGE-like data processing with real statistical operations.
 * All operations run client-side with tabular data.
 */

// ===========================
// Data Frame Helper
// ===========================
class DataFrame {
    constructor(columns = [], rows = []) {
        this.columns = columns; // string[]
        this.rows = rows;       // array of objects { colName: value }
    }

    static fromCSV(text, hasHeader = true, delimiter = ',') {
        const lines = text.trim().split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length === 0) return new DataFrame();

        let columns;
        let startRow;
        if (hasHeader) {
            columns = lines[0].split(delimiter).map(c => c.trim().replace(/^"(.*)"$/, '$1'));
            startRow = 1;
        } else {
            const nCols = lines[0].split(delimiter).length;
            columns = Array.from({ length: nCols }, (_, i) => `col_${i}`);
            startRow = 0;
        }

        const rows = [];
        for (let i = startRow; i < lines.length; i++) {
            const values = lines[i].split(delimiter).map(v => v.trim().replace(/^"(.*)"$/, '$1'));
            const row = {};
            columns.forEach((col, idx) => {
                const val = values[idx] || '';
                const num = Number(val);
                row[col] = val !== '' && !isNaN(num) ? num : val;
            });
            rows.push(row);
        }
        return new DataFrame(columns, rows);
    }

    static fromManualInput(colStr, rowStr, typeStr = '') {
        const columns = colStr.split(',').map(c => c.trim()).filter(c => c);
        const types = typeStr ? typeStr.split(',').map(t => t.trim().toLowerCase()) : [];

        const rows = [];
        const lines = rowStr.trim().split('\n').filter(l => l.trim());
        for (const line of lines) {
            const values = line.split(',').map(v => v.trim());
            const row = {};
            columns.forEach((col, idx) => {
                let val = values[idx] || '';
                const type = types[idx] || 'auto';
                if (type === 'number' || type === 'auto') {
                    const num = Number(val);
                    row[col] = val !== '' && !isNaN(num) ? num : val;
                } else {
                    row[col] = val;
                }
            });
            rows.push(row);
        }
        return new DataFrame(columns, rows);
    }

    getColumn(name) {
        return this.rows.map(r => r[name]);
    }

    getNumericColumn(name) {
        return this.rows.map(r => Number(r[name])).filter(v => !isNaN(v));
    }

    clone() {
        return new DataFrame([...this.columns], this.rows.map(r => ({ ...r })));
    }

    head(n = 10) {
        return new DataFrame([...this.columns], this.rows.slice(0, n));
    }

    get length() {
        return this.rows.length;
    }

    toHTML(maxRows = 50, title = '') {
        const displayRows = this.rows.slice(0, maxRows);
        let html = title ? `<h4 style="margin:0 0 8px 0; color:#60a5fa;">${title}</h4>` : '';
        html += `<div style="overflow-x:auto; max-height:400px; overflow-y:auto; border-radius:8px; border:1px solid #334155;">`;
        html += `<table style="width:100%; border-collapse:collapse; font-size:12px; font-family:monospace;">`;
        html += `<thead><tr>`;
        this.columns.forEach(col => {
            html += `<th style="padding:6px 10px; background:#1e293b; color:#94a3b8; border-bottom:2px solid #475569; text-align:left; position:sticky; top:0;">${col}</th>`;
        });
        html += `</tr></thead><tbody>`;
        displayRows.forEach((row, i) => {
            const bg = i % 2 === 0 ? '#0f172a' : '#1e293b';
            html += `<tr>`;
            this.columns.forEach(col => {
                const val = row[col];
                const display = typeof val === 'number' ? (Number.isInteger(val) ? val : val.toFixed(4)) : (val ?? '');
                html += `<td style="padding:4px 10px; background:${bg}; color:#e2e8f0; border-bottom:1px solid #1e293b;">${display}</td>`;
            });
            html += `</tr>`;
        });
        html += `</tbody></table></div>`;
        if (this.rows.length > maxRows) {
            html += `<div style="font-size:11px; color:#64748b; margin-top:4px;">Showing ${maxRows} of ${this.rows.length} rows</div>`;
        }
        return html;
    }
}

// ===========================
// Statistics Functions
// ===========================
function mean(arr) {
    return arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
}

function median(arr) {
    if (!arr.length) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function variance(arr) {
    const m = mean(arr);
    return arr.length ? arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length : 0;
}

function stdDev(arr) {
    return Math.sqrt(variance(arr));
}

function percentile(arr, p) {
    const sorted = [...arr].sort((a, b) => a - b);
    const idx = (p / 100) * (sorted.length - 1);
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    return lo === hi ? sorted[lo] : sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

function correlationMatrix(df) {
    const numCols = df.columns.filter(c => df.getNumericColumn(c).length === df.length);
    const matrix = {};
    numCols.forEach(col1 => {
        matrix[col1] = {};
        const a1 = df.getNumericColumn(col1);
        const m1 = mean(a1);
        numCols.forEach(col2 => {
            const a2 = df.getNumericColumn(col2);
            const m2 = mean(a2);
            let sum = 0, s1 = 0, s2 = 0;
            for (let i = 0; i < a1.length; i++) {
                const d1 = a1[i] - m1, d2 = a2[i] - m2;
                sum += d1 * d2;
                s1 += d1 * d1;
                s2 += d2 * d2;
            }
            matrix[col1][col2] = s1 && s2 ? sum / Math.sqrt(s1 * s2) : 0;
        });
    });
    return { numCols, matrix };
}

// ===========================
// Random Data Generator
// ===========================
function generateRandomData(config) {
    const n = parseInt(config.n_samples) || 100;
    const nFeats = parseInt(config.n_features) || 2;
    const dist = config.distribution || 'Normal';
    const mu = parseFloat(config.mean) || 0;
    const sigma = parseFloat(config.std) || 1;

    const columns = Array.from({ length: nFeats }, (_, i) => `Feature_${i + 1}`);
    const rows = [];

    for (let i = 0; i < n; i++) {
        const row = {};
        columns.forEach(col => {
            if (dist === 'Normal') {
                // Box-Muller transform
                const u1 = Math.random(), u2 = Math.random();
                row[col] = mu + sigma * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
            } else if (dist === 'Uniform') {
                row[col] = mu + (Math.random() - 0.5) * sigma * 2;
            } else if (dist === 'Exponential') {
                row[col] = -Math.log(1 - Math.random()) * sigma;
            } else if (dist === 'Poisson') {
                const L = Math.exp(-Math.abs(mu || 3));
                let k = 0, p = 1;
                do { k++; p *= Math.random(); } while (p > L);
                row[col] = k - 1;
            }
        });
        rows.push(row);
    }
    return new DataFrame(columns, rows);
}

// ===========================
// Linear Regression
// ===========================
function linearRegression(x, y) {
    const n = x.length;
    const mx = mean(x), my = mean(y);
    let num = 0, den = 0;
    for (let i = 0; i < n; i++) {
        num += (x[i] - mx) * (y[i] - my);
        den += (x[i] - mx) ** 2;
    }
    const slope = den ? num / den : 0;
    const intercept = my - slope * mx;

    // R-squared
    const predicted = x.map(v => slope * v + intercept);
    const ssTot = y.reduce((s, v) => s + (v - my) ** 2, 0);
    const ssRes = y.reduce((s, v, i) => s + (v - predicted[i]) ** 2, 0);
    const rSquared = ssTot ? 1 - ssRes / ssTot : 0;

    return { slope, intercept, rSquared, predicted };
}

// ===========================
// K-Means Clustering
// ===========================
function kMeans(data, k, maxIter = 100) {
    const n = data.length;
    const d = data[0].length;

    // Init centroids randomly
    const centroids = [];
    const used = new Set();
    while (centroids.length < k) {
        const idx = Math.floor(Math.random() * n);
        if (!used.has(idx)) {
            centroids.push([...data[idx]]);
            used.add(idx);
        }
    }

    let labels = new Array(n).fill(0);

    for (let iter = 0; iter < maxIter; iter++) {
        // Assign
        const newLabels = data.map(point => {
            let minDist = Infinity, best = 0;
            centroids.forEach((c, ci) => {
                let dist = 0;
                for (let j = 0; j < d; j++) dist += (point[j] - c[j]) ** 2;
                if (dist < minDist) { minDist = dist; best = ci; }
            });
            return best;
        });

        // Check convergence
        if (newLabels.every((l, i) => l === labels[i])) break;
        labels = newLabels;

        // Update centroids
        for (let ci = 0; ci < k; ci++) {
            const members = data.filter((_, i) => labels[i] === ci);
            if (members.length > 0) {
                for (let j = 0; j < d; j++) {
                    centroids[ci][j] = mean(members.map(m => m[j]));
                }
            }
        }
    }

    return { labels, centroids };
}

// ===========================
// PCA (simple 2D reduction)
// ===========================
function simplePCA(data) {
    const n = data.length;
    const d = data[0].length;
    const means = Array(d).fill(0);
    data.forEach(row => row.forEach((v, j) => means[j] += v));
    means.forEach((_, j) => means[j] /= n);

    // Center
    const centered = data.map(row => row.map((v, j) => v - means[j]));

    // Covariance
    const cov = Array.from({ length: d }, () => Array(d).fill(0));
    for (let i = 0; i < d; i++) {
        for (let j = 0; j <= i; j++) {
            let s = 0;
            centered.forEach(row => s += row[i] * row[j]);
            cov[i][j] = s / (n - 1);
            cov[j][i] = cov[i][j];
        }
    }

    // Power iteration for top 2 eigenvectors (simplified)
    function powerIteration(mat, nIter = 50) {
        let vec = Array(d).fill(0).map(() => Math.random());
        for (let iter = 0; iter < nIter; iter++) {
            const newVec = Array(d).fill(0);
            for (let i = 0; i < d; i++)
                for (let j = 0; j < d; j++) newVec[i] += mat[i][j] * vec[j];
            const norm = Math.sqrt(newVec.reduce((s, v) => s + v * v, 0));
            vec = newVec.map(v => v / norm);
        }
        return vec;
    }

    const pc1 = powerIteration(cov);
    // Project
    const projected = centered.map(row => ({
        PC1: row.reduce((s, v, j) => s + v * pc1[j], 0),
        PC2: row.reduce((s, v, j) => s + v * (j === 0 ? -pc1[1] : pc1[0]) / Math.sqrt(pc1[0] ** 2 + pc1[1] ** 2), 0)
    }));

    return { projected, pc1 };
}

// ===========================
// Chart Rendering (Canvas-based)
// ===========================
function renderChart(config, data, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const chartDiv = document.createElement('div');
    chartDiv.style.cssText = 'margin-top:10px; background:#0f172a; border-radius:10px; padding:16px; border:1px solid #334155;';

    const title = config.title || config.chart_type + ' Chart';
    chartDiv.innerHTML = `<h4 style="margin:0 0 12px 0; color:#60a5fa; font-size:14px;">${title}</h4>`;

    const canvas = document.createElement('canvas');
    canvas.width = 500;
    canvas.height = 300;
    canvas.style.cssText = 'width:100%; height:auto; border-radius:6px;';
    chartDiv.appendChild(canvas);
    container.appendChild(chartDiv);

    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const plotW = W - padding.left - padding.right;
    const plotH = H - padding.top - padding.bottom;

    // Clear
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, W, H);

    const chartType = config.chart_type || 'Line';
    const color = config.color || '#3b82f6';

    if (!data || !data.rows || data.rows.length === 0) {
        ctx.fillStyle = '#64748b';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('No data available', W / 2, H / 2);
        return;
    }

    const xCol = config.x_column || data.columns[0];
    const yCol = config.y_column || data.columns[1] || data.columns[0];

    if (chartType === 'Scatter' || chartType === 'Line') {
        const xData = data.getNumericColumn(xCol);
        const yData = data.getNumericColumn(yCol);
        if (xData.length === 0 || yData.length === 0) return;

        const xMin = Math.min(...xData), xMax = Math.max(...xData);
        const yMin = Math.min(...yData), yMax = Math.max(...yData);
        const xRange = xMax - xMin || 1;
        const yRange = yMax - yMin || 1;

        const toPixel = (x, y) => ({
            px: padding.left + ((x - xMin) / xRange) * plotW,
            py: padding.top + plotH - ((y - yMin) / yRange) * plotH
        });

        // Grid
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= 5; i++) {
            const y = padding.top + (i / 5) * plotH;
            ctx.beginPath(); ctx.moveTo(padding.left, y); ctx.lineTo(padding.left + plotW, y); ctx.stroke();
        }

        // Axes labels
        ctx.fillStyle = '#64748b';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(xCol, W / 2, H - 5);
        ctx.save();
        ctx.translate(12, H / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(yCol, 0, 0);
        ctx.restore();

        if (chartType === 'Scatter') {
            // Draw points
            for (let i = 0; i < Math.min(xData.length, yData.length); i++) {
                const { px, py } = toPixel(xData[i], yData[i]);
                ctx.beginPath();
                ctx.arc(px, py, 3, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.globalAlpha = 0.7;
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        } else {
            // Line chart
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let i = 0; i < Math.min(xData.length, yData.length); i++) {
                const { px, py } = toPixel(xData[i], yData[i]);
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.stroke();
        }
    } else if (chartType === 'Bar' || chartType === 'Histogram') {
        const values = data.getNumericColumn(yCol || xCol);
        const labels = xCol !== yCol ? data.getColumn(xCol).map(String) : values.map((_, i) => String(i));

        const maxVal = Math.max(...values) || 1;
        const barWidth = plotW / values.length * 0.8;
        const gap = plotW / values.length * 0.2;

        values.forEach((val, i) => {
            const x = padding.left + i * (barWidth + gap);
            const barH = (val / maxVal) * plotH;
            const y = padding.top + plotH - barH;

            ctx.fillStyle = color;
            ctx.globalAlpha = 0.8;
            ctx.fillRect(x, y, barWidth, barH);
            ctx.globalAlpha = 1;

            // Label
            if (values.length <= 20) {
                ctx.fillStyle = '#94a3b8';
                ctx.font = '9px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(String(labels[i]).substring(0, 8), x + barWidth / 2, padding.top + plotH + 14);
            }
        });
    } else if (chartType === 'Pie') {
        const values = data.getNumericColumn(yCol || xCol);
        const labels = xCol !== yCol ? data.getColumn(xCol).map(String) : values.map((_, i) => `Slice ${i}`);
        const total = values.reduce((s, v) => s + Math.abs(v), 0) || 1;

        const cx = W / 2, cy = H / 2;
        const radius = Math.min(plotW, plotH) * 0.4;
        const colors = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

        let angle = -Math.PI / 2;
        values.forEach((val, i) => {
            const sliceAngle = (Math.abs(val) / total) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, radius, angle, angle + sliceAngle);
            ctx.closePath();
            ctx.fillStyle = colors[i % colors.length];
            ctx.fill();

            // Label
            const mid = angle + sliceAngle / 2;
            const lx = cx + Math.cos(mid) * (radius * 0.7);
            const ly = cy + Math.sin(mid) * (radius * 0.7);
            ctx.fillStyle = 'white';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'center';
            if (sliceAngle > 0.2) ctx.fillText(String(labels[i]).substring(0, 10), lx, ly);

            angle += sliceAngle;
        });
    }
}

// ===========================
// Node Execution Functions
// ===========================
async function executeNodeLogic(node, context, connections) {
    const data = node.data || {};

    // Get input data from connected nodes
    const getInput = (portName) => {
        const conn = connections.find(c => c.target === node.id);
        if (conn && context[conn.source]) {
            const srcOutput = context[conn.source];
            if (srcOutput instanceof DataFrame) return srcOutput;
            if (srcOutput.data instanceof DataFrame) return srcOutput.data;
            if (srcOutput.filtered_data instanceof DataFrame) return srcOutput.filtered_data;
            if (srcOutput.merged_data instanceof DataFrame) return srcOutput.merged_data;
            if (srcOutput.simulation_data instanceof DataFrame) return srcOutput.simulation_data;
            if (srcOutput.results) return srcOutput.results;
            return srcOutput;
        }
        return null;
    };

    const getInputAll = () => {
        const inputs = {};
        connections.filter(c => c.target === node.id).forEach(conn => {
            if (context[conn.source]) {
                inputs[conn.source] = context[conn.source];
            }
        });
        return inputs;
    };

    switch (node.type) {
        // ============ INPUT NODES ============
        case 'input-data': {
            // CSV File: try to parse from path/URL
            if (data.path) {
                try {
                    const response = await fetch(data.path);
                    const text = await response.text();
                    const delimiter = data.source_type === 'TSV' ? '\t' : ',';
                    const df = DataFrame.fromCSV(text, data.has_header !== 'No', delimiter);
                    return { data: df, rows: df.length, columns: df.columns.length, info: `Loaded ${df.length} rows × ${df.columns.length} columns` };
                } catch (e) {
                    // Fallback: generate sample data
                    const sampleCSV = `Name,Age,Score,City\nAlice,25,92,Seoul\nBob,30,85,Busan\nCharlie,22,78,Daegu\nDiana,28,95,Seoul\nEve,35,88,Busan\nFrank,27,72,Incheon\nGrace,31,91,Seoul\nHenry,24,67,Daegu\nIvy,29,83,Busan\nJack,33,76,Incheon`;
                    const df = DataFrame.fromCSV(sampleCSV);
                    return { data: df, rows: df.length, columns: df.columns.length, info: `Sample data (${df.length} rows). Set a valid URL to load real data.` };
                }
            }
            // Default sample data
            const sampleCSV = `ID,Temperature,Pressure,Humidity,Wind_Speed\n1,23.5,1013.2,65,12.3\n2,25.1,1012.8,58,15.1\n3,21.8,1014.1,72,8.7\n4,27.3,1011.5,45,20.2\n5,22.9,1013.7,68,10.5\n6,26.4,1012.1,52,17.8\n7,20.5,1014.8,78,6.2\n8,28.7,1010.9,40,22.1\n9,24.2,1013.0,62,13.9\n10,25.8,1012.4,55,16.4`;
            const df = DataFrame.fromCSV(sampleCSV);
            return { data: df, rows: df.length, columns: df.columns.length, info: `Default dataset: ${df.length} rows × ${df.columns.length} cols` };
        }

        case 'input-datatable': {
            if (data.columns && data.rows) {
                const df = DataFrame.fromManualInput(data.columns, data.rows, data.types);
                return { data: df, rows: df.length, columns: df.columns.length, info: `Manual table: ${df.length} rows × ${df.columns.length} cols` };
            }
            return { data: new DataFrame(), info: 'No data entered. Set columns and rows in properties.' };
        }

        case 'input-params': {
            return {
                params: { [data.param_name || 'param']: parseFloat(data.default_value) || 0 },
                info: `Parameter: ${data.param_name} = ${data.default_value}`
            };
        }

        case 'input-random': {
            const df = generateRandomData(data);
            return { data: df, rows: df.length, columns: df.columns.length, info: `${data.distribution} distribution: ${df.length} samples × ${df.columns.length} features` };
        }

        // ============ PROCESSING NODES ============
        case 'process-filter': {
            const input = getInput('data');
            if (!(input instanceof DataFrame)) return { data: new DataFrame(), info: 'No input data' };

            const col = data.column || input.columns[0];
            const cond = data.condition || 'Greater Than';
            const thresh = data.threshold;
            const thresh2 = data.threshold2;
            const threshNum = parseFloat(thresh);

            const passed = [], rejected = [];
            input.rows.forEach(row => {
                const val = row[col];
                let match = false;
                switch (cond) {
                    case 'Greater Than': match = Number(val) > threshNum; break;
                    case 'Less Than': match = Number(val) < threshNum; break;
                    case 'Equals': match = String(val) === String(thresh); break;
                    case 'Not Equals': match = String(val) !== String(thresh); break;
                    case 'Contains': match = String(val).includes(thresh); break;
                    case 'Between': match = Number(val) >= threshNum && Number(val) <= parseFloat(thresh2); break;
                }
                if (match) passed.push({ ...row }); else rejected.push({ ...row });
            });

            return {
                filtered_data: new DataFrame([...input.columns], passed),
                rejected_data: new DataFrame([...input.columns], rejected),
                data: new DataFrame([...input.columns], passed), // alias
                info: `Passed: ${passed.length}, Rejected: ${rejected.length}`
            };
        }

        case 'process-select-columns': {
            const input = getInput('data');
            if (!(input instanceof DataFrame)) return { data: new DataFrame(), info: 'No input data' };

            const selectedCols = (data.columns || '').split(',').map(c => c.trim()).filter(c => c);
            const mode = data.mode || 'Keep';

            let finalCols;
            if (mode === 'Keep') {
                finalCols = selectedCols.filter(c => input.columns.includes(c));
            } else {
                finalCols = input.columns.filter(c => !selectedCols.includes(c));
            }

            const newRows = input.rows.map(row => {
                const newRow = {};
                finalCols.forEach(c => newRow[c] = row[c]);
                return newRow;
            });

            return { data: new DataFrame(finalCols, newRows), info: `Selected ${finalCols.length} columns` };
        }

        case 'process-sort': {
            const input = getInput('data');
            if (!(input instanceof DataFrame)) return { data: new DataFrame(), info: 'No input data' };

            const col = data.column || input.columns[0];
            const asc = data.order !== 'Descending';
            const sorted = [...input.rows].sort((a, b) => {
                const va = a[col], vb = b[col];
                if (typeof va === 'number' && typeof vb === 'number') return asc ? va - vb : vb - va;
                return asc ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
            });

            return { data: new DataFrame([...input.columns], sorted), info: `Sorted by ${col} (${data.order || 'Ascending'})` };
        }

        case 'process-formula': {
            const input = getInput('data');
            if (!(input instanceof DataFrame)) return { data: new DataFrame(), info: 'No input data' };

            const newCol = data.new_column || 'computed';
            const formula = data.formula || '0';
            const newColumns = [...input.columns];
            if (!newColumns.includes(newCol)) newColumns.push(newCol);

            const newRows = input.rows.map(row => {
                const newRow = { ...row };
                try {
                    // Create variables from row
                    const vars = Object.entries(row).map(([k, v]) => `const ${k.replace(/[^a-zA-Z0-9_]/g, '_')} = ${typeof v === 'number' ? v : 0};`).join('\n');
                    newRow[newCol] = new Function(vars + '\nreturn ' + formula.replace(/[A-Za-z_]\w*/g, (match) => {
                        return row.hasOwnProperty(match) ? match.replace(/[^a-zA-Z0-9_]/g, '_') : match;
                    }))();
                } catch (e) {
                    newRow[newCol] = NaN;
                }
                return newRow;
            });

            return { data: new DataFrame(newColumns, newRows), info: `Added column "${newCol}" with formula` };
        }

        case 'process-group': {
            const input = getInput('data');
            if (!(input instanceof DataFrame)) return { data: new DataFrame(), info: 'No input data' };

            const groupCol = data.group_column || input.columns[0];
            const aggCol = data.agg_column || input.columns[1] || input.columns[0];
            const aggFunc = data.aggregation || 'Mean';

            const groups = {};
            input.rows.forEach(row => {
                const key = String(row[groupCol]);
                if (!groups[key]) groups[key] = [];
                groups[key].push(Number(row[aggCol]) || 0);
            });

            const resultRows = Object.entries(groups).map(([key, values]) => {
                let result;
                switch (aggFunc) {
                    case 'Sum': result = values.reduce((s, v) => s + v, 0); break;
                    case 'Mean': result = mean(values); break;
                    case 'Count': result = values.length; break;
                    case 'Min': result = Math.min(...values); break;
                    case 'Max': result = Math.max(...values); break;
                    case 'Median': result = median(values); break;
                    case 'Std Dev': result = stdDev(values); break;
                    default: result = mean(values);
                }
                return { [groupCol]: key, [`${aggFunc}_${aggCol}`]: result, Count: values.length };
            });

            const cols = [groupCol, `${aggFunc}_${aggCol}`, 'Count'];
            return { data: new DataFrame(cols, resultRows), info: `${Object.keys(groups).length} groups (${aggFunc} of ${aggCol})` };
        }

        case 'process-merge': {
            const allInputs = getInputAll();
            const dfs = Object.values(allInputs).map(v => {
                if (v instanceof DataFrame) return v;
                if (v && v.data instanceof DataFrame) return v.data;
                return null;
            }).filter(Boolean);

            if (dfs.length < 2) {
                return { data: dfs[0] || new DataFrame(), info: 'Need 2 inputs to merge' };
            }

            const joinType = data.join_type || 'Concatenate';
            if (joinType === 'Concatenate') {
                const allCols = [...new Set([...dfs[0].columns, ...dfs[1].columns])];
                const allRows = [...dfs[0].rows, ...dfs[1].rows].map(row => {
                    const newRow = {};
                    allCols.forEach(c => newRow[c] = row[c] ?? null);
                    return newRow;
                });
                return { merged_data: new DataFrame(allCols, allRows), data: new DataFrame(allCols, allRows), info: `Concatenated: ${allRows.length} rows` };
            }

            // Key-based join
            const keyCol = data.key_column || dfs[0].columns[0];
            const allCols = [...new Set([...dfs[0].columns, ...dfs[1].columns])];
            const result = [];
            const map2 = {};
            dfs[1].rows.forEach(r => {
                const k = String(r[keyCol]);
                if (!map2[k]) map2[k] = [];
                map2[k].push(r);
            });

            dfs[0].rows.forEach(r1 => {
                const k = String(r1[keyCol]);
                const matches = map2[k];
                if (matches) {
                    matches.forEach(r2 => result.push({ ...r1, ...r2 }));
                    delete map2[k]; // Mark as used for outer
                } else if (joinType === 'Left' || joinType === 'Outer') {
                    const row = { ...r1 };
                    dfs[1].columns.forEach(c => { if (!(c in row)) row[c] = null; });
                    result.push(row);
                }
            });

            if (joinType === 'Right' || joinType === 'Outer') {
                Object.values(map2).flat().forEach(r2 => {
                    const row = { ...r2 };
                    dfs[0].columns.forEach(c => { if (!(c in row)) row[c] = null; });
                    result.push(row);
                });
            }

            return { merged_data: new DataFrame(allCols, result), data: new DataFrame(allCols, result), info: `${joinType} join: ${result.length} rows` };
        }

        // ============ ANALYSIS NODES ============
        case 'process-statistics': {
            const input = getInput('data');
            if (!(input instanceof DataFrame)) return { results: 'No input data', info: 'Connect a data source' };

            const metrics = data.metrics || 'Descriptive (Mean, Median, Std)';
            let html = '';

            if (metrics === 'All' || metrics.includes('Descriptive')) {
                html += '<h4 style="color:#60a5fa; margin:8px 0;">Descriptive Statistics</h4>';
                html += '<table style="width:100%; border-collapse:collapse; font-size:12px; font-family:monospace;">';
                html += '<tr><th style="padding:4px 8px; text-align:left; color:#94a3b8; border-bottom:1px solid #334155;">Column</th><th style="padding:4px; color:#94a3b8;">Count</th><th style="padding:4px; color:#94a3b8;">Mean</th><th style="padding:4px; color:#94a3b8;">Median</th><th style="padding:4px; color:#94a3b8;">Std</th><th style="padding:4px; color:#94a3b8;">Min</th><th style="padding:4px; color:#94a3b8;">Max</th></tr>';

                input.columns.forEach(col => {
                    const vals = input.getNumericColumn(col);
                    if (vals.length > 0) {
                        html += `<tr>
                            <td style="padding:4px 8px; color:#e2e8f0;">${col}</td>
                            <td style="padding:4px; color:#e2e8f0; text-align:center;">${vals.length}</td>
                            <td style="padding:4px; color:#e2e8f0; text-align:center;">${mean(vals).toFixed(4)}</td>
                            <td style="padding:4px; color:#e2e8f0; text-align:center;">${median(vals).toFixed(4)}</td>
                            <td style="padding:4px; color:#e2e8f0; text-align:center;">${stdDev(vals).toFixed(4)}</td>
                            <td style="padding:4px; color:#e2e8f0; text-align:center;">${Math.min(...vals).toFixed(4)}</td>
                            <td style="padding:4px; color:#e2e8f0; text-align:center;">${Math.max(...vals).toFixed(4)}</td>
                        </tr>`;
                    }
                });
                html += '</table>';
            }

            if (metrics === 'All' || metrics.includes('Correlation')) {
                const { numCols, matrix } = correlationMatrix(input);
                html += '<h4 style="color:#60a5fa; margin:16px 0 8px;">Correlation Matrix</h4>';
                html += '<table style="width:100%; border-collapse:collapse; font-size:11px; font-family:monospace;">';
                html += '<tr><th style="padding:4px;"></th>' + numCols.map(c => `<th style="padding:4px; color:#94a3b8;">${c}</th>`).join('') + '</tr>';
                numCols.forEach(c1 => {
                    html += `<tr><td style="padding:4px; color:#94a3b8;">${c1}</td>`;
                    numCols.forEach(c2 => {
                        const val = matrix[c1][c2];
                        const intensity = Math.abs(val);
                        const bg = val > 0 ? `rgba(59,130,246,${intensity * 0.5})` : `rgba(239,68,68,${intensity * 0.5})`;
                        html += `<td style="padding:4px; text-align:center; color:#e2e8f0; background:${bg};">${val.toFixed(3)}</td>`;
                    });
                    html += '</tr>';
                });
                html += '</table>';
            }

            if (metrics === 'All' || metrics.includes('Frequency')) {
                html += '<h4 style="color:#60a5fa; margin:16px 0 8px;">Frequency Tables</h4>';
                input.columns.forEach(col => {
                    const vals = input.getColumn(col);
                    const freq = {};
                    vals.forEach(v => freq[v] = (freq[v] || 0) + 1);
                    if (Object.keys(freq).length <= 20) {
                        html += `<div style="margin:8px 0;"><strong style="color:#cbd5e1;">${col}</strong>`;
                        html += '<table style="width:auto; border-collapse:collapse; font-size:11px; margin:4px 0;">';
                        Object.entries(freq).sort((a, b) => b[1] - a[1]).forEach(([val, count]) => {
                            const pct = ((count / vals.length) * 100).toFixed(1);
                            html += `<tr><td style="padding:2px 8px; color:#e2e8f0;">${val}</td><td style="padding:2px 8px; color:#94a3b8;">${count} (${pct}%)</td></tr>`;
                        });
                        html += '</table></div>';
                    }
                });
            }

            return { results: html, data: input, info: `Statistics computed for ${input.columns.length} columns` };
        }

        case 'process-analyze': {
            const input = getInput('data');
            if (!(input instanceof DataFrame)) return { results: 'No input data', info: 'Connect a data source' };

            const algo = data.algorithm || 'Linear Regression';
            let html = '';

            if (algo === 'Linear Regression') {
                const targetCol = data.target_column || input.columns[input.columns.length - 1];
                const featureCol = input.columns.find(c => c !== targetCol && input.getNumericColumn(c).length > 0) || input.columns[0];
                const x = input.getNumericColumn(featureCol);
                const y = input.getNumericColumn(targetCol);

                if (x.length && y.length) {
                    const result = linearRegression(x, y);
                    html += `<h4 style="color:#60a5fa;">Linear Regression</h4>`;
                    html += `<div style="font-family:monospace; font-size:13px; color:#e2e8f0; padding:8px; background:#1e293b; border-radius:6px;">`;
                    html += `<div>y = ${result.slope.toFixed(4)}x + ${result.intercept.toFixed(4)}</div>`;
                    html += `<div style="margin-top:4px;">R² = ${result.rSquared.toFixed(6)}</div>`;
                    html += `<div style="margin-top:4px; color:#94a3b8;">Features: ${featureCol} → ${targetCol}</div>`;
                    html += `</div>`;

                    return { results: html, model: { type: 'linear', slope: result.slope, intercept: result.intercept, rSquared: result.rSquared }, data: input, info: `R² = ${result.rSquared.toFixed(4)}` };
                }
            }

            if (algo === 'K-Means Clustering') {
                const numCols = input.columns.filter(c => input.getNumericColumn(c).length === input.length);
                if (numCols.length >= 2) {
                    const dataPoints = input.rows.map(r => numCols.map(c => Number(r[c])));
                    const k = parseInt(data.n_clusters) || 3;
                    const result = kMeans(dataPoints, k);

                    // Add cluster labels to data
                    const newRows = input.rows.map((r, i) => ({ ...r, Cluster: result.labels[i] }));
                    const newCols = [...input.columns, 'Cluster'];

                    html += `<h4 style="color:#60a5fa;">K-Means Clustering (K=${k})</h4>`;
                    html += `<div style="font-family:monospace; font-size:12px; color:#e2e8f0; padding:8px; background:#1e293b; border-radius:6px;">`;
                    result.centroids.forEach((c, i) => {
                        const count = result.labels.filter(l => l === i).length;
                        html += `<div>Cluster ${i}: ${count} points, centroid=[${c.map(v => v.toFixed(2)).join(', ')}]</div>`;
                    });
                    html += `</div>`;

                    return { results: html, data: new DataFrame(newCols, newRows), model: { type: 'kmeans', centroids: result.centroids }, info: `${k} clusters formed` };
                }
            }

            if (algo === 'PCA') {
                const numCols = input.columns.filter(c => input.getNumericColumn(c).length === input.length);
                if (numCols.length >= 2) {
                    const dataPoints = input.rows.map(r => numCols.map(c => Number(r[c])));
                    const result = simplePCA(dataPoints);

                    const newRows = result.projected.map((p, i) => ({ ...input.rows[i], PC1: p.PC1, PC2: p.PC2 }));
                    const newCols = [...input.columns, 'PC1', 'PC2'];

                    html += `<h4 style="color:#60a5fa;">PCA (2D Projection)</h4>`;
                    html += `<div style="font-family:monospace; font-size:12px; color:#e2e8f0;">Projected ${input.length} points from ${numCols.length}D to 2D</div>`;

                    return { results: html, data: new DataFrame(newCols, newRows), info: `PCA: ${numCols.length}D → 2D` };
                }
            }

            return { results: 'Algorithm not applicable to this data', info: 'Check algorithm and data compatibility' };
        }

        case 'process-distributions': {
            const input = getInput('data');
            if (!(input instanceof DataFrame)) return { results: 'No input data' };

            const col = data.column || input.columns[0];
            const vals = input.getNumericColumn(col);
            const nBins = parseInt(data.bins) || 10;

            if (vals.length === 0) return { results: `No numeric values in column "${col}"` };

            // Create histogram bins
            const min = Math.min(...vals), max = Math.max(...vals);
            const binWidth = (max - min) / nBins || 1;
            const bins = Array(nBins).fill(0);
            vals.forEach(v => {
                const idx = Math.min(Math.floor((v - min) / binWidth), nBins - 1);
                bins[idx]++;
            });

            const histData = new DataFrame(
                ['Bin_Start', 'Bin_End', 'Count', 'Frequency'],
                bins.map((count, i) => ({
                    Bin_Start: min + i * binWidth,
                    Bin_End: min + (i + 1) * binWidth,
                    Count: count,
                    Frequency: count / vals.length
                }))
            );

            let html = `<h4 style="color:#60a5fa;">Distribution: ${col}</h4>`;
            html += `<div style="font-family:monospace; font-size:12px; color:#e2e8f0; padding:8px; background:#1e293b; border-radius:6px;">`;
            html += `<div>N: ${vals.length} | Mean: ${mean(vals).toFixed(4)} | Std: ${stdDev(vals).toFixed(4)}</div>`;
            html += `<div>Skewness: ${(vals.reduce((s, v) => s + ((v - mean(vals)) / stdDev(vals)) ** 3, 0) / vals.length).toFixed(4)}</div>`;
            html += `<div>Kurtosis: ${(vals.reduce((s, v) => s + ((v - mean(vals)) / stdDev(vals)) ** 4, 0) / vals.length - 3).toFixed(4)}</div>`;
            html += `</div>`;

            return { results: html, data: histData, info: `${nBins} bins for "${col}"` };
        }

        // ============ SIMULATION NODES ============
        case 'process-simulate': {
            const model = data.model || 'Physics Engine';
            const steps = parseInt(data.steps) || 100;
            const dt = parseFloat(data.dt) || 0.01;

            const cols = ['Step', 'Time'];
            const rows = [];

            if (model === 'Physics Engine') {
                cols.push('Position', 'Velocity', 'Acceleration');
                let pos = 0, vel = 10, acc = -9.81;
                for (let i = 0; i < steps; i++) {
                    rows.push({ Step: i, Time: +(i * dt).toFixed(4), Position: +pos.toFixed(4), Velocity: +vel.toFixed(4), Acceleration: +acc.toFixed(4) });
                    vel += acc * dt;
                    pos += vel * dt;
                }
            } else if (model === 'Chemical Reaction') {
                cols.push('Reactant_A', 'Reactant_B', 'Product_C');
                let A = 100, B = 80, C = 0;
                const k = 0.01;
                for (let i = 0; i < steps; i++) {
                    rows.push({ Step: i, Time: +(i * dt).toFixed(4), Reactant_A: +A.toFixed(2), Reactant_B: +B.toFixed(2), Product_C: +C.toFixed(2) });
                    const rate = k * A * B;
                    A -= rate * dt;
                    B -= rate * dt;
                    C += rate * dt;
                    A = Math.max(0, A);
                    B = Math.max(0, B);
                }
            } else if (model === 'Biological Growth') {
                cols.push('Population', 'Growth_Rate', 'Carrying_Capacity');
                let pop = 10;
                const K = 1000, r = 0.5;
                for (let i = 0; i < steps; i++) {
                    const growthRate = r * (1 - pop / K);
                    rows.push({ Step: i, Time: +(i * dt * 10).toFixed(2), Population: +pop.toFixed(2), Growth_Rate: +growthRate.toFixed(4), Carrying_Capacity: K });
                    pop += pop * growthRate * dt * 10;
                    pop = Math.max(0, pop);
                }
            } else if (model === 'Monte Carlo') {
                cols.push('Trial', 'Result', 'Running_Mean');
                let sum = 0;
                for (let i = 0; i < steps; i++) {
                    const val = Math.random() * 2 - 1;
                    const val2 = Math.random() * 2 - 1;
                    const inside = (val * val + val2 * val2 <= 1) ? 1 : 0;
                    sum += inside;
                    rows.push({ Step: i, Time: i, Trial: i + 1, Result: inside, Running_Mean: +((sum / (i + 1)) * 4).toFixed(6) });
                }
            }

            const df = new DataFrame(cols, rows);
            return { simulation_data: df, data: df, info: `${model}: ${steps} steps simulated` };
        }

        // ============ SCRIPT NODE ============
        case 'process-script': {
            const input = getInput('input');
            const code = data.code || 'return data;';
            try {
                const fn = new Function('data', code);
                const result = fn(input);
                if (result instanceof DataFrame) return { data: result, output: result, info: 'Script executed' };
                if (typeof result === 'object') return { output: result, data: result, info: 'Script executed' };
                return { output: result, info: `Result: ${result}` };
            } catch (e) {
                return { output: null, info: `Script error: ${e.message}` };
            }
        }

        // ============ OUTPUT NODES ============
        case 'output-chart': {
            const input = getInput('data');
            // Return config for rendering later
            return {
                chartConfig: { ...data, inputData: input instanceof DataFrame ? input : null },
                data: input,
                info: input ? `Chart: ${data.chart_type || 'Line'} (${input.length} data points)` : 'No data for chart'
            };
        }

        case 'output-boxplot': {
            const input = getInput('data');
            if (!(input instanceof DataFrame)) return { info: 'No input data' };

            const colNames = (data.columns || '').split(',').map(c => c.trim()).filter(c => c && input.columns.includes(c));
            const useCols = colNames.length > 0 ? colNames : input.columns.filter(c => input.getNumericColumn(c).length > 0);

            let html = `<h4 style="color:#60a5fa;">${data.title || 'Box Plot Summary'}</h4>`;
            html += '<div style="font-family:monospace; font-size:12px;">';
            useCols.forEach(col => {
                const vals = input.getNumericColumn(col);
                if (vals.length === 0) return;
                const q1 = percentile(vals, 25);
                const q3 = percentile(vals, 75);
                const iqr = q3 - q1;
                html += `<div style="margin:6px 0; padding:6px; background:#1e293b; border-radius:4px; color:#e2e8f0;">`;
                html += `<strong>${col}</strong>: Min=${Math.min(...vals).toFixed(2)} | Q1=${q1.toFixed(2)} | Med=${median(vals).toFixed(2)} | Q3=${q3.toFixed(2)} | Max=${Math.max(...vals).toFixed(2)} | IQR=${iqr.toFixed(2)}`;
                html += `</div>`;
            });
            html += '</div>';

            return { results: html, data: input, info: `Box plot for ${useCols.length} columns` };
        }

        case 'output-table': {
            const input = getInput('data');
            if (!(input instanceof DataFrame)) return { info: 'No input data' };
            const maxRows = parseInt(data.max_rows) || 50;
            const html = input.toHTML(maxRows, data.title || 'Data Table');
            return { results: html, data: input, info: `Table: ${input.length} rows × ${input.columns.length} cols` };
        }

        case 'output-report': {
            const input = getInput('results');
            let html = '<h4 style="color:#60a5fa;">Report Generated</h4>';
            if (typeof input === 'string') {
                html += input;
            } else if (input && typeof input === 'object') {
                if (input.results) html += input.results;
                if (input.data instanceof DataFrame) html += input.data.toHTML(20);
                if (input.info) html += `<div style="margin-top:8px; color:#94a3b8; font-size:12px;">${input.info}</div>`;
            }
            return { results: html, info: 'Report generated' };
        }

        default:
            return { status: 'done', info: `Unknown node type: ${node.type}` };
    }
}

export { DataFrame, executeNodeLogic, renderChart, mean, median, stdDev, variance, percentile, correlationMatrix, linearRegression, kMeans };
