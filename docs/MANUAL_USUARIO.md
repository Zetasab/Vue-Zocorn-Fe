# Manual de Usuario — Zocorn Movies

## 1. ¿Qué es Zocorn?

Zocorn es una aplicación web gratuita y sin fines comerciales para explorar películas y series de TV: consultar información, tráilers, reparto e imágenes, y guardar tus títulos favoritos para encontrarlos rápido más adelante.

No necesitas registrarte ni crear una cuenta: la app funciona directamente desde el navegador y guarda tus favoritos en el propio dispositivo.

Puedes probarla en: **https://zocorn.vercel.app**

## 2. Página de inicio

Al entrar en Zocorn verás:

- Un **hero** destacado con una película o serie en tendencia (con su tráiler de fondo).
- Secciones de **películas** y **series**: en tendencia, populares, mejor valoradas y próximos estrenos.
- Un **menú de navegación** superior con los apartados "Películas" y "Series", cada uno con un desplegable de accesos rápidos.

Puedes desplazarte por cada sección horizontalmente y hacer clic en cualquier póster para ver su ficha de detalle.

## 3. Buscar películas o series

1. Ve al menú superior y entra en **Películas → Buscar** o **Series → Buscar** (rutas `/buscarmovies` y `/buscarseries`).
2. Escribe el título en el buscador: los resultados aparecen automáticamente mientras escribes, sin necesidad de pulsar ningún botón (búsqueda con "debounce").
3. Si dejas el buscador vacío, verás listas rápidas predefinidas: **Del momento**, **Populares**, **Mejor valoradas** y **Estreno**.

### Filtros avanzados

Junto al buscador hay un panel de **filtros avanzados** que te permite refinar los resultados por:

- **Género**
- **Año** de estreno
- **Valoración mínima**
- **Idioma original**
- **Orden** de los resultados (por popularidad, valoración, fecha, etc.)

Los filtros se aplican en tiempo real y consultan directamente el catálogo de TMDB.

## 4. Ficha de detalle

Al hacer clic en cualquier película o serie accedes a su ficha de detalle, donde encontrarás:

- Una imagen de fondo (*backdrop*) con el **tráiler reproduciéndose automáticamente**.
- Sinopsis, valoración, fecha de estreno/emisión y datos generales.
- **Reparto** principal.
- **Galería de imágenes**.
- Títulos **recomendados y similares**.
- **Reseñas** (reviews) de otros usuarios de TMDB.

Desde esta misma pantalla puedes guardar el título como favorito con el botón de marcador (icono de bookmark).

## 5. Guardar favoritos (bookmarks)

Puedes guardar cualquier película o serie como favorita:

- Desde su **card** en cualquier listado (icono de marcador sobre el póster), o
- Desde su **página de detalle**.

Al hacer clic, el icono cambia de estado para indicar que el título ya está guardado. Si vuelves a hacer clic, se elimina de tus favoritos.

> **Límite:** puedes guardar un máximo de **20 películas** y **20 series** de forma independiente. Si intentas superar el límite, aparecerá un aviso indicando que no puedes guardar más.

Tus favoritos se guardan en el **almacenamiento local del navegador** (`localStorage`), por lo que:

- Solo estarán disponibles en ese navegador y ese dispositivo.
- No se sincronizan entre dispositivos ni requieren conexión a un servidor propio.
- Si borras los datos de navegación del sitio, perderás tus favoritos guardados.

## 6. Mis películas / Mis series

En el menú de navegación encontrarás los apartados **Mis películas** (`/mis-peliculas`) y **Mis series** (`/mis-series`), donde puedes:

- Ver todos los títulos que has guardado como favoritos.
- **Filtrar** la lista escribiendo parte del título en el buscador de la propia página.
- **Borrar todos** los favoritos de golpe mediante el botón correspondiente. Esta acción pide **confirmación** antes de ejecutarse, ya que no se puede deshacer.
- Quitar un título individual haciendo clic de nuevo en su icono de marcador.

## 7. Política de privacidad

En el pie de página o menú encontrarás el enlace a la **Política de privacidad y condiciones de uso** (`/politica-privacidad-condiciones-uso`), donde se explica qué datos se almacenan (únicamente en tu navegador) y cómo se usa la información de TMDB.

## 8. Preguntas frecuentes

**¿Necesito crear una cuenta para usar Zocorn?**
No. La aplicación no tiene sistema de registro ni login; todo funciona sin cuenta de usuario.

**¿Dónde se guardan mis favoritos?**
En el almacenamiento local de tu propio navegador. No se envían ni almacenan en ningún servidor.

**¿Por qué no veo mis favoritos si cambio de navegador o dispositivo?**
Porque los favoritos son locales a cada navegador; no hay sincronización entre dispositivos.

**¿Cuántos favoritos puedo guardar?**
Hasta 20 películas y 20 series como máximo, de forma independiente.

**¿De dónde vienen los datos de películas y series?**
De la base de datos pública de **TMDB (The Movie Database)**.

**¿Puedo recuperar mis favoritos si los borro por error?**
No. La acción de borrar favoritos (individual o "borrar todo") es permanente una vez confirmada.
