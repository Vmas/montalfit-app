# MontalFit - Instrucciones rápidas

Pasos para configurar y ejecutar la app localmente:

1. Instalar dependencias:
```bash
npm install
```

2. Ajustes recomendados:
- Configurar la clave de la API USDA si quieres búsquedas externas. Añade la clave en `app.json` dentro de `expo.extra.USDA_API_KEY`:

```json
"extra": {
  "USDA_API_KEY": "TU_CLAVE_AQUI"
}
```

- Alternativamente usa herramientas de build (EAS) para inyectar variables en `expo.manifest.extra`.

3. Ejecutar la app con Expo:
```bash
npx expo start
```

4. Flujos a probar manualmente:
- Registro: completar `RegistroScreen` y asegurarte que el perfil se guarda.
- Dashboard: buscar alimentos locales, añadir manualmente, verificar que las macros y la barra no crashen.
- Progreso: registrar peso y probar exportar PDF cuando la gráfica sea visible.
- Perfil: probar "BORRAR PERFIL Y REINICIAR" y "LIMPIAR REGISTROS DIARIOS".

5. Notas de seguridad y mantenimiento:
- Evita dejar `USDA_API_KEY` hardcodeada en repositorios públicos.
- `AsyncStorage.clear()` fue reemplazado por eliminación selectiva para evitar borrar datos no relacionados.

---

## Construcción y despliegue web (PWA)
1. Genera la versión web:
   ```bash
   npm run build:web   # crea carpeta `dist/`
   ```
2. Prueba localmente con un servidor estático:
   ```bash
   npx serve dist
   ```
   Visita http://localhost:5000 y verifica que funciona offline y que aparece el banner "Instalar" en móviles.
3. **Despliegue en Vercel** (recomendado):
   - Sube el repo a GitHub/GitLab y conecta el proyecto en vercel.com.
   - Build command: `npm run build:web`, output: `dist`.
   - Añade variables de entorno (`USDA_API_KEY` etc.) en Settings → Environment Variables.
   - Después de cada push la web se redeploya automáticamente.
4. Verifica la aplicación en la URL proporcionada por Vercel. Prueba también con DevTools en modo offline para confirmar el service worker.

## Código QR para promoción
Una vez tu sitio esté en línea (por ejemplo https://montalfit.vercel.app) puedes generar un código QR usando cualquier generador. Ejemplo:

```
https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://montalfit.vercel.app
```

Este enlace descarga una imagen QR que redirige al dominio; úsalo en folletos, carteles o pantallas de gimnasios.

---

Si quieres que yo haga commits finales y corra `npx expo start` desde este entorno, indícamelo y lo ejecuto.