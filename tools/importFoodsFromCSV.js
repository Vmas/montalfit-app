#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Usage: node tools/importFoodsFromCSV.js path/to/foods.csv
// The CSV should have a header row. Supported header names (case-insensitive):
// nombre,name, calorias,kcal, p,protein, c,carbs, g,grasas, porcion, serving

const csvPath = process.argv[2] || path.join(__dirname, 'foods.csv');
const targetPath = path.join(__dirname, '..', 'src', 'data', 'alimentos.json');

if (!fs.existsSync(csvPath)) {
  console.error('CSV no encontrado en', csvPath);
  console.error('Coloca tu archivo CSV en tools/foods.csv o pasa la ruta como argumento.');
  process.exit(1);
}

const raw = fs.readFileSync(csvPath, 'utf8');
const lines = raw.split(/\r?\n/).filter(Boolean);
if (lines.length < 1) {
  console.error('CSV vacío');
  process.exit(1);
}

const headers = lines.shift().split(',').map(h => h.trim().toLowerCase());
const rows = lines.map(l => l.split(',').map(c => c.trim()));

const normalize = (row) => {
  const obj = {};
  headers.forEach((h, i) => obj[h] = row[i] || '');

  const nombre = obj.nombre || obj.name || obj.food || '';
  const calorias = Number(obj.calorias || obj.kcal || obj.energy) || 0;
  const p = Number(obj.p || obj.proteina || obj.protein) || 0;
  const c = Number(obj.c || obj.carbs || obj.carbohidratos) || 0;
  const g = Number(obj.g || obj.grasas || obj.fat) || 0;
  const porcion = obj.porcion || obj.serving || '100g';

  return { nombre, calorias, p, c, g, porcion };
};

const items = rows.map(normalize).filter(it => it.nombre && (it.calorias || it.p || it.c || it.g));

let existing = [];
if (fs.existsSync(targetPath)) {
  try {
    existing = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
    if (!Array.isArray(existing)) existing = [];
  } catch (e) {
    console.error('No se pudo leer alimentos existentes, se sobrescribirá. Error:', e.message);
    existing = [];
  }
}

// Merge: avoid duplicates by `nombre` (case-insensitive)
const indexByName = new Map();
existing.forEach(it => indexByName.set((it.nombre || '').toLowerCase(), it));

let added = 0;
items.forEach(it => {
  const key = (it.nombre || '').toLowerCase();
  if (!indexByName.has(key)) {
    existing.push(it);
    indexByName.set(key, it);
    added++;
  }
});

fs.writeFileSync(targetPath, JSON.stringify(existing, null, 2), 'utf8');
console.log(`Import terminado. Registros leídos: ${items.length}. Nuevos agregados: ${added}. Archivo destino: ${targetPath}`);
