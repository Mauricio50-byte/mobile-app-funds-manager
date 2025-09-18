# 📱 Documento Técnico - Aplicación de Fondos de Pantalla

## 1. Descripción del Proyecto
Un cliente ha solicitado el desarrollo de una aplicación móvil en **Ionic + Angular**, que permita a los usuarios configurar fondos de pantalla tanto en la **pantalla de inicio** como en la **pantalla de bloqueo**.  
El proyecto integrará:
- **Firebase** para autenticación y gestión de datos de usuarios.  
- **Supabase** para almacenamiento de imágenes.  
- **Soporte multilenguaje** (español e inglés).  

---

## 2. Objetivos del Proyecto
- Crear una aplicación con soporte multilenguaje (es/en).  
- Implementar autenticación y base de datos en Firebase.  
- Usar Supabase Storage para almacenar imágenes.  
- Crear un **plugin personalizado en Java** para cambiar fondos de pantalla.  
- Construir **Core Module** y **Shared Module**.  
- Integrar **componentes reutilizables**.  
- Relacionar usuarios con su **UID de Firebase Authentication**.  
- Garantizar que cada usuario solo vea **sus propios wallpapers**.  

---

## 3. Integraciones Principales
1. **Firebase** (Authentication y Firestore).  
   - Datos de usuario guardados en Firestore con relación al UID.  
   - Cada wallpaper se referencia al usuario que lo subió.  
2. **Supabase** (Storage de wallpapers).  
   - Generación de **URLs firmadas** para mostrar imágenes en la app.  
3. **Ngx-Translate** (multilenguaje).  
4. **Plugins externos**:  
   - Toast  
   - Preferences  
   - File Picker  
   - Action Sheet  
5. **Custom Plugin (Java)**:  
   - `setWallpaperHomeScreen`  
   - `setWallpaperLockScreen`  

---

## 4. Arquitectura de la App
La aplicación está organizada en **Core Module** y **Shared Module**:

- **Core Module**  
  - Firebase  
  - Ngx-Translate  
  - Servicios base:  
    - Auth  
    - Query  
    - Toast  
    - Preferences  
    - Loading  
    - Uploader  
    - File Picker  

- **Shared Module**  
  - Componentes: Input, Toggle Translate, Button, Floating Button, Card, Link  
  - Action Sheet  
  - Servicios: User Service, Wallpaper Service  

---

## 5. Páginas
- **Login**  
- **Register**  
- **Home**  
- **Update User Info**  

---

## 6. Custom Plugin en Java
- El plugin se implementa en **Java**, extendiendo de la clase `Plugin`.  
- Se crea una clase adicional (`Wallpy` o `Wallpapers`) donde estará la lógica.  
- Métodos principales:  
  - `setWallpaperHomeScreen`  
  - `setWallpaperLockScreen`  

---

## 7. Guards de Autenticación
Protegen el acceso a páginas privadas, verificando la sesión activa en **Firebase Auth**.  

---

## 8. Multilenguaje
- Se usa **@ngx-translate/core**.  
- Archivos: `es.json` y `en.json`.  
- Idioma por defecto: **inglés** si no es español o inglés.  

---

## 9. Servicios Clave
- **Auth Service**: registro/login/logout.  
- **Query Service**: consultas Firestore.  
- **Uploader Service**: subir imágenes a Supabase.  
- **Wallpaper Service**: integración con el plugin.  
- **Translate Service**: manejo dinámico de idioma.  
- **Loading Service**: loaders en UI.  
- **Toast Service**: notificaciones rápidas.  
- **Preferences Service**: configuración de usuario.  

---

## 10. Flujo del Usuario
1. Usuario abre la app → se detecta idioma.  
2. Si no está logueado → **Login/Register**.  
3. Autenticación con Firebase.  
4. Acceso a Home con sus wallpapers.  
5. Usuario aplica wallpaper (inicio/bloqueo).  
6. Puede editar datos de usuario.  
7. Persistencia de configuración.  
8. Cada usuario ve solo **sus propios wallpapers** (relación UID en Firestore).  

---

## 11. Entregables
- App Ionic con soporte **es/en**.  
- Core y Shared Modules.  
- Firebase Auth + Firestore con relación UID.  
- Supabase conectado y URLs firmadas.  
- Guards de autenticación.  
- Custom Plugin en Java.  
- Componentes UI reutilizables.  
- **Documentación técnica** (este documento).  

---

## 12. Reglas del Taller
- Tiempo de entrega: **1 semana**.  
- Trabajo **individual** (1 persona).  
- La app debe compilar y ejecutarse en **dispositivos móviles o máquinas virtuales**.  
- El plugin debe desarrollarse en **Java**.  
- Se evaluará: integración Firebase, Firestore y Supabase.  
