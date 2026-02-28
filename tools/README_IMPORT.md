Importador de alimentos (CSV)

Coloca un archivo CSV con encabezado en `tools/foods.csv` o pásalo como argumento.

Encabezados recomendados (case-insensitive):
- nombre o name
- calorias o kcal
- p o proteina o protein
- c o carbs o carbohidratos
- g o grasas o fat
- porcion o serving

Uso:

```
node tools/importFoodsFromCSV.js tools/foods.csv
```

El script combinará los registros con `src/data/alimentos.json` evitando duplicados por nombre.
