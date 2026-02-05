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

Si quieres que yo haga commits finales y corra `npx expo start` desde este entorno, indícamelo y lo ejecuto.