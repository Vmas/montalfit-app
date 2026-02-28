# Play Store Checklist para MontalFit

Antes de crear el AAB y subir a Google Play, completa estos pasos:

1. Assets y gráficos
- Icono: `assets/icon.png` (512x512 PNG) y `adaptive-icon.png` para Android.
- Splash: `assets/splash-icon.png` (1024x1024 o similar) y configurar background en `app.json`.
- Screenshots: prepara 4-8 capturas en alta resolución (por ejemplo 1080x1920) para las distintas orientaciones y tamaños.

2. Metadatos en `app.json`
- Verifica `expo.android.package` (ya configurado: `com.victormas.MontalFit`).
- Actualiza `expo.version` y `expo.android.versionCode` cuando vayas a publicar nueva versión.

3. Keystore y firma
- EAS puede manejar el keystore por ti (recomendado). Si prefieres usar tu propio keystore, genera uno y súbelo a EAS.

4. Build (producción)
- Crear un AAB listo para Play Store:
```bash
eas build -p android --profile production
```
- Descargar el AAB desde la URL que EAS te proporcione.

5. Subir a Play Console
- Usar `eas submit -p android --latest` o subir manualmente el `.aab` en Google Play Console.
- Completa la ficha: título, descripción, icono, screenshots, categoría, política de privacidad.

6. Privacidad y cumplimiento
- Añade una política de privacidad si tu app guarda datos locales o envía datos a servidores.
- Revisa las políticas de Google Play sobre salud/fitness si aplican.

7. Tests
- Probar el AAB en un dispositivo real antes de publicar.

8. Versionado
- Incrementa `expo.version` y `android.versionCode` antes de cada publicación mayor.

Si quieres, puedo:
- Generar screenshots de ejemplo (si me indicas pantallas a capturar).
- Ejecutar el build de producción cuando confirmes.
- Ayudarte a subir el AAB a Play Console usando `eas submit`.
