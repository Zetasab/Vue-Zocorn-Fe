<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useBookmarkedMovies } from '../composables/useBookmarkedMovies'
import { useBookmarkedSeries } from '../composables/useBookmarkedSeries'

interface MovieItem {
  id: number
  title: string
  overview: string
  original_title?: string
  poster_path?: string
  posterPath?: string
  backdrop_path?: string
  backdropPath?: string
  release_date: string
  vote_average: number
  vote_count?: number
  popularity?: number
  original_language?: string
  genre_ids?: number[]
  adult?: boolean
  video?: boolean
}

const props = defineProps<{
  movies: MovieItem[]
  layout?: 'scroller' | 'grid'
  mediaType?: 'movie' | 'tv'
}>()

const isGridLayout = computed(() => props.layout === 'grid')
const isMovieMedia = computed(() => (props.mediaType ?? 'movie') === 'movie')

const imageBaseUrl = 'https://image.tmdb.org/t/p'
const scrollerRef = ref<HTMLDivElement | null>(null)
const isDragging = ref(false)
const dragStartX = ref(0)
const startScrollLeft = ref(0)
const didDrag = ref(false)
const suppressPosterClick = ref(false)
const pendingScrollTimeoutId = ref<number | null>(null)
const pendingScrollLeft = ref<number | null>(null)

const DRAG_THRESHOLD_PX = 6
const SCROLL_DELAY_MS = 70
const isMobileViewport = ref(false)
const loadedPosterIds = ref<Set<number>>(new Set())

const { isBookmarked: isMovieBookmarked, toggleBookmark: toggleMovieBookmark } = useBookmarkedMovies()
const { isBookmarked: isSeriesBookmarked, toggleBookmark: toggleSeriesBookmark } = useBookmarkedSeries()

function isBookmarked(id: number): boolean {
  return isMovieMedia.value ? isMovieBookmarked(id) : isSeriesBookmarked(id)
}

function onBookmarkClick(event: MouseEvent, movie: MovieItem): void {
  event.preventDefault()
  event.stopPropagation()

  const bookmarkPayload = {
    id: movie.id,
    title: movie.title,
    poster_path: movie.poster_path,
    posterPath: movie.posterPath,
    release_date: movie.release_date,
    vote_average: movie.vote_average
  }

  if (isMovieMedia.value) {
    toggleMovieBookmark(bookmarkPayload)
  } else {
    toggleSeriesBookmark(bookmarkPayload)
  }
}

function getPosterUrl(path?: string): string {
  if (!path) {
    return ''
  }

  return `${imageBaseUrl}/w342${path}`
}

function formatYear(date: string): string {
  if (!date) {
    return '—'
  }

  return date.slice(0, 4)
}

function formatRating(voteAverage: number): string {
  return voteAverage.toFixed(1)
}

function isPosterLoaded(movieId: number): boolean {
  return loadedPosterIds.value.has(movieId)
}

function markPosterAsLoaded(movieId: number): void {
  loadedPosterIds.value = new Set(loadedPosterIds.value).add(movieId)
}

function onPosterContextMenu(event: MouseEvent): void {
  if (isMobileViewport.value) {
    event.preventDefault()
  }
}

function onPosterClick(event: MouseEvent): void {
  if (suppressPosterClick.value) {
    event.preventDefault()
    event.stopPropagation()
  }
}

function onDragStart(event: MouseEvent): void {
  if (isGridLayout.value) {
    return
  }

  const container = scrollerRef.value
  if (!container) {
    return
  }

  isDragging.value = true
  didDrag.value = false
  dragStartX.value = event.clientX
  startScrollLeft.value = container.scrollLeft
}

function onDragMove(event: MouseEvent): void {
  if (isGridLayout.value) {
    return
  }

  const container = scrollerRef.value
  if (!container || !isDragging.value) {
    return
  }

  const deltaX = event.clientX - dragStartX.value

  if (!didDrag.value && Math.abs(deltaX) < DRAG_THRESHOLD_PX) {
    return
  }

  if (!didDrag.value) {
    didDrag.value = true
    suppressPosterClick.value = true
  }

  event.preventDefault()
  scheduleScrollPosition(startScrollLeft.value - deltaX * 1.25)
}

function onDragEnd(): void {
  if (isGridLayout.value) {
    return
  }

  flushPendingScrollPosition()
  isDragging.value = false
  if (didDrag.value) {
    window.setTimeout(() => {
      suppressPosterClick.value = false
    }, 0)
  }
}

function scheduleScrollPosition(nextScrollLeft: number): void {
  const container = scrollerRef.value
  if (!container) {
    return
  }

  pendingScrollLeft.value = nextScrollLeft

  if (pendingScrollTimeoutId.value !== null) {
    window.clearTimeout(pendingScrollTimeoutId.value)
  }

  pendingScrollTimeoutId.value = window.setTimeout(() => {
    if (!scrollerRef.value || pendingScrollLeft.value === null) {
      pendingScrollTimeoutId.value = null
      return
    }

    scrollerRef.value.scrollLeft = pendingScrollLeft.value
    pendingScrollTimeoutId.value = null
    pendingScrollLeft.value = null
  }, SCROLL_DELAY_MS)
}

function flushPendingScrollPosition(): void {
  if (pendingScrollTimeoutId.value !== null) {
    window.clearTimeout(pendingScrollTimeoutId.value)
    pendingScrollTimeoutId.value = null
  }

  if (scrollerRef.value && pendingScrollLeft.value !== null) {
    scrollerRef.value.scrollLeft = pendingScrollLeft.value
  }

  pendingScrollLeft.value = null
}

function updateViewport(): void {
  isMobileViewport.value = window.matchMedia('(max-width: 768px)').matches
}

onMounted(() => {
  updateViewport()
  window.addEventListener('resize', updateViewport)
})

onBeforeUnmount(() => {
  flushPendingScrollPosition()
  window.removeEventListener('resize', updateViewport)
})

watch(
  () => props.movies,
  (nextMovies) => {
    const nextIds = new Set(nextMovies.map((movie) => movie.id))
    loadedPosterIds.value = new Set([...loadedPosterIds.value].filter((id) => nextIds.has(id)))
  },
  { immediate: true }
)
</script>

<template>
  <div
    ref="scrollerRef"
    class="movies-scroller"
    :class="{
      'is-dragging': !isGridLayout && isDragging,
      'movies-scroller--grid': isGridLayout
    }"
    @mousedown="onDragStart"
    @mousemove="onDragMove"
    @mouseup="onDragEnd"
    @mouseleave="onDragEnd"
    @dragstart.prevent
  >
    <div v-for="movie in props.movies" :key="movie.id" class="movie-card">
      <button
        type="button"
        class="movie-bookmark-btn"
        :class="{ 'is-bookmarked': isBookmarked(movie.id) }"
        :aria-label="isBookmarked(movie.id) ? `Quitar ${movie.title} de guardados` : `Guardar ${movie.title}`"
        @click="onBookmarkClick($event, movie)"
        @mousedown.stop
      >
        <v-icon :icon="isBookmarked(movie.id) ? 'mdi-bookmark' : 'mdi-bookmark-outline'" size="18" />
      </button>

      <RouterLink
        class="movie-poster-link"
        :to="{
          name: isMovieMedia ? 'detailed-movie' : 'detailed-series',
          params: { idtmdb: movie.id }
        }"
        :aria-label="`Ver detalle de ${movie.title}`"
        @click="onPosterClick"
        @contextmenu="onPosterContextMenu"
      >
        <v-skeleton-loader
          v-if="getPosterUrl(movie.poster_path ?? movie.posterPath) && !isPosterLoaded(movie.id)"
          type="image"
          class="movie-poster-skeleton"
        />
        <img
          v-if="getPosterUrl(movie.poster_path ?? movie.posterPath)"
          :src="getPosterUrl(movie.poster_path ?? movie.posterPath)"
          :alt="movie.title"
          class="movie-poster"
          :class="{ 'is-loaded': isPosterLoaded(movie.id) }"
          loading="lazy"
          @load="markPosterAsLoaded(movie.id)"
          @error="markPosterAsLoaded(movie.id)"
        />
        <div v-else class="movie-poster movie-poster--fallback">
          <v-icon icon="mdi-image-off-outline" size="26" />
        </div>
      </RouterLink>

      <div class="movie-base-info">
        <h3 class="movie-title">{{ movie.title }}</h3>
        <p class="movie-meta">{{ formatYear(movie.release_date) }}</p>
      </div>

      <div class="movie-hover-info">
        <p class="movie-hover-rating">⭐ {{ formatRating(movie.vote_average) }}</p>
        <p class="movie-overview">{{ movie.overview }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.movies-scroller {
  margin-top: 1rem;
  display: flex;
  gap: 0.95rem;
  overflow-x: auto;
  overflow-y: hidden;
  cursor: grab;
  user-select: none;
  touch-action: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-x: contain;
  scroll-behavior: smooth;
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.movies-scroller::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

.movies-scroller.is-dragging {
  cursor: grabbing;
}

.movies-scroller--grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(11.5rem, 1fr));
  overflow: visible;
  cursor: default;
  user-select: auto;
  touch-action: manipulation;
}

.movies-scroller--grid .movie-card {
  flex: initial;
  min-width: 0;
  cursor: pointer;
}

.movie-card {
  position: relative;
  flex: 0 0 clamp(11.5rem, 18vw, 14rem);
  overflow: hidden;
  border-radius: 0.9rem;
  background: #091321;
  transition: transform 0.25s ease;
}

.movie-card:hover {
  transform: translateY(-5px);
}

.movie-poster {
  position: relative;
  z-index: 1;
  width: 100%;
  aspect-ratio: 2 / 3;
  object-fit: cover;
  display: block;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.movie-poster.is-loaded {
  opacity: 1;
}

.movie-poster--fallback {
  display: grid;
  place-items: center;
  background: linear-gradient(160deg, #0c1b31, #081425);
  color: #b6cbe8;
  opacity: 1;
}

.movie-bookmark-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  z-index: 3;
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 50%;
  background: rgba(2, 10, 22, 0.65);
  color: #f6fbff;
  cursor: pointer;
  opacity: 0;
  transform: translateY(-4px);
  transition: opacity 0.2s ease, transform 0.2s ease, background 0.2s ease;
}

.movie-card:hover .movie-bookmark-btn,
.movie-card:focus-within .movie-bookmark-btn,
.movie-bookmark-btn.is-bookmarked {
  opacity: 1;
  transform: translateY(0);
}

.movie-bookmark-btn:hover {
  background: rgba(2, 10, 22, 0.9);
}

.movie-bookmark-btn.is-bookmarked {
  color: #ffd166;
}

@media (max-width: 768px) {
  .movie-bookmark-btn {
    opacity: 1;
    transform: none;
  }
}

.movie-poster-link {
  position: relative;
  display: block;
  -webkit-touch-callout: none;
  cursor: inherit;
}

.movie-poster-skeleton {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.movie-base-info {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  padding: 0.75rem 0.7rem;
  background: linear-gradient(to top, rgba(0, 8, 18, 0.96), rgba(0, 8, 18, 0.62), transparent);
}

.movie-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1.35;
  color: #f6fbff;
}

.movie-meta {
  margin: 0.22rem 0 0;
  font-size: 0.78rem;
  color: #cdd9ea;
}

.movie-hover-info {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 0.45rem;
  padding: 0.7rem;
  background: linear-gradient(to top, rgba(2, 10, 22, 0.98), rgba(2, 10, 22, 0.84), rgba(2, 10, 22, 0.2));
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 0.22s ease, transform 0.22s ease;
  pointer-events: none;
}

.movie-card:hover .movie-hover-info,
.movie-card:focus-within .movie-hover-info {
  opacity: 1;
  transform: translateY(0);
}

.movie-hover-rating {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 600;
  color: #d9e7fb;
}

.movie-overview {
  margin: 0;
  display: -webkit-box;
  line-clamp: 5;
  -webkit-line-clamp: 5;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: 0.78rem;
  line-height: 1.42;
  color: #d7e2f1;
}

@media (max-width: 768px) {
  .movies-scroller--grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.8rem;
  }

  .movie-card {
    flex-basis: 10.8rem;
  }

  .movie-card:hover {
    transform: none;
  }

  .movie-hover-info {
    opacity: 0;
    transform: translateY(8px);
    pointer-events: none;
    gap: 0.6rem;
  }

  .movie-card:hover .movie-hover-info,
  .movie-card:focus-within .movie-hover-info {
    opacity: 0;
    transform: translateY(8px);
  }

  .movie-hover-rating {
    font-size: 0.75rem;
  }
}
</style>
