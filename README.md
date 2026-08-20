<h1 align="center">
  <span style="color:#E50914">🎬</span>
  <span style="color:#FFFFFF"> CesarSob</span><span style="color:#E50914">Movies</span>
</h1>

<p align="center">
  Por si quieres ver — <a href="https://zocorn.vercel.app"><strong>Live Demo</strong></a>
</p>

<p align="center">
  <img src="videoproject.gif" alt="Demo del proyecto" width="100%" />
</p>

---

## ¿Qué es este proyecto?

**Zocorn** es una aplicación web personal (sin fines comerciales) para explorar películas y series de TV. Permite:

- Ver un inicio con hero destacado, tendencias, populares, mejor valoradas y próximos estrenos, tanto de **películas** como de **series**.
- Buscar películas o series por nombre, con debounce automático (sin botón "Buscar"), listas rápidas (Del momento / Populares / Mejor valoradas / Estreno) y un panel de **filtros avanzados** (género, año, valoración mínima, idioma, orden) que consulta el endpoint `discover` de TMDB.
- Ver el detalle de cada película o serie: backdrop con trailer autoreproducido, reparto, galería de imágenes, recomendadas/similares y reviews.
- Guardar películas y series como favoritas (**bookmark**, máx. 20 de cada tipo) directamente desde las cards o la página de detalle, persistido en `localStorage` del navegador.
- Consultar "Mis películas" y "Mis series": listas guardadas, con filtro por título y opción de borrarlas todas (con confirmación).

No hay sistema de cuentas ni backend propio de usuarios: **no existe login, registro ni base de datos**. Todo el estado del usuario (favoritos, filtros abiertos, aviso leído) vive en `localStorage`, en el propio navegador.

Los datos de películas y series se obtienen de la **API de TMDB**, consumida a través de funciones serverless propias (carpeta `api/`) que ocultan el token de TMDB al cliente.

---

## Tecnologías utilizadas

| Categoría | Tecnología |
|---|---|
| Framework | Vue 3 (Composition API, `<script setup>`) |
| Lenguaje | TypeScript |
| Build tool | Vite |
| UI | Vuetify 3 |
| Routing | Vue Router 4 (modo `history`) |
| Tipografías | Montserrat, Roboto (@fontsource) |
| Iconos | Material Design Icons (@mdi/font) |
| Backend | Funciones serverless (`@vercel/node`) que hacen de proxy a la API de TMDB |
| Deploy | Vercel |

---

## Estructura del proyecto

```
api/                        # Funciones serverless (proxy a TMDB, ocultan el token)
├── _lib/tmdb.ts             # Helper común: fetch a TMDB con el bearer token
├── movies/                  # Endpoints de películas (popular, top_rated, search, discover, genres...)
│   ├── [movieId]/           # Detalle, créditos, vídeos, imágenes, recomendadas, similares, reviews
│   └── trending/[timeWindow].ts
├── tv/                      # Mismos endpoints que movies/, pero para series (TMDB tv)
│   └── [seriesId]/
└── people/trending/[timeWindow].ts

src/
├── assets/                  # Logos, imágenes y recursos estáticos
├── components/              # Componentes reutilizables
│   ├── PrimeNavbar.vue       # Navbar con menús desplegables "Películas" / "Series"
│   └── MoviesScroller.vue    # Card/scroller de póster reutilizado en toda la app (movies y tv)
├── composables/              # Lógica reutilizable con estado compartido (Composition API)
│   ├── useBookmarkedMovies.ts   # Favoritos de películas en localStorage (máx. 20)
│   ├── useBookmarkedSeries.ts   # Favoritos de series en localStorage (máx. 20)
│   ├── useToast.ts              # Snackbar global de notificaciones
│   └── useYoutubeLoopingBackground.ts # Trailer en bucle como fondo del header
├── router/                  # Configuración de rutas (Vue Router)
├── services/
│   └── tmdbApiService.ts     # Cliente HTTP hacia /api/movies y /api/tv
└── views/                   # Vistas de la app (cada una en su propia carpeta)
    ├── Home/                 # Inicio: hero, populares/tendencias de pelis y series, géneros...
    ├── Search/                # Buscador de películas (/buscarmovies)
    ├── SearchSeries/          # Buscador de series (/buscarseries)
    ├── DetailedMovie/         # Detalle de película (/movie/:idtmdb)
    ├── DetailedSeries/        # Detalle de serie (/tv_show/:idtmdb)
    ├── MyMovies/              # Películas guardadas (/mis-peliculas)
    ├── MySeries/              # Series guardadas (/mis-series)
    └── PrivacyPolicy/         # Aviso legal (/politica-privacidad-condiciones-uso)
```

Cada view sigue la misma estructura encapsulada:

```
src/views/NombreView/
├── NombreView.vue   # Template + estructura
└── NombreView.css   # Estilos propios
```

`DetailedSeries` y `SearchSeries` reutilizan el CSS de `DetailedMovie` y `Search` respectivamente (`<style scoped src="../Search/Search.css">`), ya que comparten exactamente la misma maquetación.

---

## Cómo iniciar el proyecto

### Requisitos previos

- Node.js 18+
- npm
- Un [token de lectura (v4) de TMDB](https://www.themoviedb.org/settings/api)

### Instalación

```bash
npm install
```

### Variables de entorno

Copia `.env.example` a `.env.local` y rellena el token de TMDB (solo se usa en las funciones serverless de `api/`, nunca se expone al cliente):

```bash
TMDB_BEARER_TOKEN=tu_token_aqui
```

### Desarrollo local

```bash
npm run dev
```

La app arranca en `http://localhost:5173` por defecto (sirve el frontend; para probar también las funciones de `api/` usa `vercel dev`, que arranca el proxy de TMDB junto con Vite).

### Build de producción

```bash
npm run build
```

### Preview del build

```bash
npm run preview
```

### Crear una nueva view

```bash
npm run new:view NombreView
```

Genera automáticamente la carpeta con `NombreView.vue` y `NombreView.css` en `src/views/`. Después, registra la ruta en `src/router/index.ts`.

---

## Deploy

El proyecto está pensado para desplegarse en **Vercel**: detecta automáticamente el framework Vite (build y fallback SPA para las rutas de `vue-router`) y las funciones serverless dentro de `api/`. Solo hace falta configurar la variable de entorno `TMDB_BEARER_TOKEN` en el dashboard del proyecto.

---

