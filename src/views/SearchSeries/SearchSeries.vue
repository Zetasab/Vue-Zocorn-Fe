<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MoviesScroller from '../../components/MoviesScroller.vue'
import { tmdbTvApiService } from '../../services/tmdbApiService'

type TmdbSearchSeriesItem = {
  id: number
  name: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  first_air_date: string
  vote_average: number
}

type TmdbSearchResponse = {
  page: number
  total_pages: number
  results: TmdbSearchSeriesItem[]
}

type ScrollerSeriesItem = {
  id: number
  title: string
  overview: string
  poster_path: string
  backdrop_path: string
  release_date: string
  vote_average: number
}

type SeriesListFilter = 'on_the_air' | 'popular' | 'top_rated' | 'airing_today'

type SeriesListOption = {
  label: string
  value: SeriesListFilter
}

type TmdbGenre = {
  id: number
  name: string
}

type TmdbGenresResponse = {
  genres: TmdbGenre[]
}

type SortOption = {
  label: string
  value: string
}

type AdvancedFilters = {
  genreId: number | null
  year: number | null
  minRating: number | null
  originalLanguage: string
  sortBy: string
}

const query = ref('')
const selectedList = ref<SeriesListFilter>('popular')
const currentPage = ref(1)
const totalPages = ref(1)
const series = ref<ScrollerSeriesItem[]>([])
const isLoading = ref(false)
const errorMessage = ref('')
const route = useRoute()
const router = useRouter()

const QUERY_PARAM_KEY = 'q'
const PAGE_PARAM_KEY = 'page'
const LIST_PARAM_KEY = 'list'
const GENRE_PARAM_KEY = 'genre'
const YEAR_PARAM_KEY = 'year'
const RATING_PARAM_KEY = 'rating'
const LANG_PARAM_KEY = 'lang'
const SORT_PARAM_KEY = 'sort'
const FILTERS_PANEL_STORAGE_KEY = 'search-series-filters-panel-open'

const seriesListOptions: SeriesListOption[] = [
  { label: 'Del momento', value: 'on_the_air' },
  { label: 'Populares', value: 'popular' },
  { label: 'Mejor valoradas', value: 'top_rated' },
  { label: 'Estreno', value: 'airing_today' }
]

const sortOptions: SortOption[] = [
  { label: 'Popularidad (desc)', value: 'popularity.desc' },
  { label: 'Popularidad (asc)', value: 'popularity.asc' },
  { label: 'Valoración (desc)', value: 'vote_average.desc' },
  { label: 'Valoración (asc)', value: 'vote_average.asc' },
  { label: 'Fecha de estreno (desc)', value: 'first_air_date.desc' },
  { label: 'Fecha de estreno (asc)', value: 'first_air_date.asc' }
]

const languageOptions = [
  { label: 'Cualquier idioma', value: '' },
  { label: 'Inglés', value: 'en' },
  { label: 'Español', value: 'es' },
  { label: 'Francés', value: 'fr' },
  { label: 'Japonés', value: 'ja' },
  { label: 'Coreano', value: 'ko' },
  { label: 'Italiano', value: 'it' },
  { label: 'Alemán', value: 'de' }
]

function defaultAdvancedFilters(): AdvancedFilters {
  return {
    genreId: null,
    year: null,
    minRating: null,
    originalLanguage: '',
    sortBy: 'popularity.desc'
  }
}

function readFiltersPanelOpenFromStorage(): boolean {
  try {
    return localStorage.getItem(FILTERS_PANEL_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

const genreOptions = ref<TmdbGenre[]>([])
const isFiltersPanelOpen = ref(readFiltersPanelOpenFromStorage())
const useAdvancedFilters = ref(false)
const advancedFilters = ref<AdvancedFilters>(defaultAdvancedFilters())
const draftFilters = ref<AdvancedFilters>(defaultAdvancedFilters())

const draftMinRating = computed<number>({
  get: () => draftFilters.value.minRating ?? 0,
  set: (value) => {
    draftFilters.value.minRating = value > 0 ? value : null
  }
})

const activeFilterCount = computed(() => {
  if (!useAdvancedFilters.value) {
    return 0
  }

  const filters = advancedFilters.value
  let count = 0
  if (filters.genreId !== null) count += 1
  if (filters.year !== null) count += 1
  if (filters.minRating !== null) count += 1
  if (filters.originalLanguage) count += 1
  if (filters.sortBy !== 'popularity.desc') count += 1
  return count
})

const skeletonCardCount = 8
const SEARCH_DEBOUNCE_MS = 400
let searchDebounceTimeoutId: number | undefined

async function loadGenreOptions(): Promise<void> {
  try {
    const response = await tmdbTvApiService.get<TmdbGenresResponse>('genres', { language: 'es-ES' })
    genreOptions.value = response.genres
  } catch {
    genreOptions.value = []
  }
}

onMounted(() => {
  void loadGenreOptions()
})

function normalizeSeries(item: TmdbSearchSeriesItem): ScrollerSeriesItem {
  return {
    id: item.id,
    title: item.name,
    overview: item.overview,
    poster_path: item.poster_path ?? '',
    backdrop_path: item.backdrop_path ?? '',
    release_date: item.first_air_date,
    vote_average: item.vote_average
  }
}

function parseRouteText(value: unknown): string {
  const rawValue = Array.isArray(value) ? value[0] : value
  return String(rawValue ?? '').trim()
}

function parseRoutePage(value: unknown): number {
  const rawValue = Array.isArray(value) ? value[0] : value
  const parsed = Number(rawValue)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1
}

function parseRouteList(value: unknown): SeriesListFilter {
  const rawValue = Array.isArray(value) ? value[0] : value
  const parsed = String(rawValue ?? '').trim() as SeriesListFilter

  if (seriesListOptions.some((item) => item.value === parsed)) {
    return parsed
  }

  return 'popular'
}

function parseRouteNumber(value: unknown): number | null {
  const rawValue = Array.isArray(value) ? value[0] : value
  if (rawValue === undefined || rawValue === null || rawValue === '') {
    return null
  }

  const parsed = Number(rawValue)
  return Number.isFinite(parsed) ? parsed : null
}

function parseRouteLanguage(value: unknown): string {
  const rawValue = Array.isArray(value) ? value[0] : value
  const parsed = String(rawValue ?? '').trim()
  return languageOptions.some((item) => item.value === parsed) ? parsed : ''
}

function parseRouteSort(value: unknown): string {
  const rawValue = Array.isArray(value) ? value[0] : value
  const parsed = String(rawValue ?? '').trim()
  return sortOptions.some((item) => item.value === parsed) ? parsed : 'popularity.desc'
}

function parseRouteFilters(routeQuery: Record<string, unknown>): AdvancedFilters {
  return {
    genreId: parseRouteNumber(routeQuery[GENRE_PARAM_KEY]),
    year: parseRouteNumber(routeQuery[YEAR_PARAM_KEY]),
    minRating: parseRouteNumber(routeQuery[RATING_PARAM_KEY]),
    originalLanguage: parseRouteLanguage(routeQuery[LANG_PARAM_KEY]),
    sortBy: parseRouteSort(routeQuery[SORT_PARAM_KEY])
  }
}

function hasAnyFilterParam(routeQuery: Record<string, unknown>): boolean {
  return [GENRE_PARAM_KEY, YEAR_PARAM_KEY, RATING_PARAM_KEY, LANG_PARAM_KEY, SORT_PARAM_KEY].some(
    (key) => routeQuery[key] !== undefined
  )
}

async function updateRouteQuery(
  text: string,
  page: number,
  list: SeriesListFilter,
  filters: AdvancedFilters | null = null
): Promise<boolean> {
  const normalizedText = text.trim()
  const normalizedPage = Number.isInteger(page) && page > 0 ? page : 1
  const normalizedList = parseRouteList(list)
  const currentText = parseRouteText(route.query[QUERY_PARAM_KEY])
  const currentPageFromRoute = parseRoutePage(route.query[PAGE_PARAM_KEY])
  const currentListFromRoute = parseRouteList(route.query[LIST_PARAM_KEY])
  const currentFilters = parseRouteFilters(route.query as Record<string, unknown>)

  const filtersUnchanged =
    filters === null
      ? !hasAnyFilterParam(route.query as Record<string, unknown>)
      : filters.genreId === currentFilters.genreId
        && filters.year === currentFilters.year
        && filters.minRating === currentFilters.minRating
        && filters.originalLanguage === currentFilters.originalLanguage
        && filters.sortBy === currentFilters.sortBy

  if (
    normalizedText === currentText
    && normalizedPage === currentPageFromRoute
    && normalizedList === currentListFromRoute
    && filtersUnchanged
  ) {
    return false
  }

  const nextQuery = { ...route.query }

  if (normalizedText) {
    nextQuery[QUERY_PARAM_KEY] = normalizedText
  } else {
    delete nextQuery[QUERY_PARAM_KEY]
  }

  if (normalizedPage > 1) {
    nextQuery[PAGE_PARAM_KEY] = String(normalizedPage)
  } else {
    delete nextQuery[PAGE_PARAM_KEY]
  }

  nextQuery[LIST_PARAM_KEY] = normalizedList

  if (filters?.genreId !== null && filters?.genreId !== undefined) {
    nextQuery[GENRE_PARAM_KEY] = String(filters.genreId)
  } else {
    delete nextQuery[GENRE_PARAM_KEY]
  }

  if (filters?.year !== null && filters?.year !== undefined) {
    nextQuery[YEAR_PARAM_KEY] = String(filters.year)
  } else {
    delete nextQuery[YEAR_PARAM_KEY]
  }

  if (filters?.minRating !== null && filters?.minRating !== undefined) {
    nextQuery[RATING_PARAM_KEY] = String(filters.minRating)
  } else {
    delete nextQuery[RATING_PARAM_KEY]
  }

  if (filters?.originalLanguage) {
    nextQuery[LANG_PARAM_KEY] = filters.originalLanguage
  } else {
    delete nextQuery[LANG_PARAM_KEY]
  }

  if (filters && filters.sortBy !== 'popularity.desc') {
    nextQuery[SORT_PARAM_KEY] = filters.sortBy
  } else {
    delete nextQuery[SORT_PARAM_KEY]
  }

  await router.replace({ query: nextQuery })
  return true
}

async function searchSeries(text: string, page = 1, list: SeriesListFilter = 'popular'): Promise<void> {
  const normalizedText = text.trim()
  const normalizedPage = Number.isInteger(page) && page > 0 ? page : 1
  const normalizedList = parseRouteList(list)

  isLoading.value = true
  errorMessage.value = ''

  try {
    let response: TmdbSearchResponse

    if (normalizedText) {
      response = await tmdbTvApiService.get<TmdbSearchResponse>('search', {
        query: normalizedText,
        language: 'es-ES',
        include_adult: false,
        page: normalizedPage
      })
    } else if (useAdvancedFilters.value) {
      const filters = advancedFilters.value
      response = await tmdbTvApiService.get<TmdbSearchResponse>('discover', {
        language: 'es-ES',
        page: normalizedPage,
        sort_by: filters.sortBy,
        ...(filters.genreId !== null ? { with_genres: filters.genreId } : {}),
        ...(filters.year !== null ? { first_air_date_year: filters.year } : {}),
        ...(filters.minRating !== null ? { 'vote_average.gte': filters.minRating } : {}),
        ...(filters.originalLanguage ? { with_original_language: filters.originalLanguage } : {})
      })
    } else {
      response = await tmdbTvApiService.get<TmdbSearchResponse>(normalizedList, {
        language: 'es-ES',
        page: normalizedPage
      })
    }

    series.value = response.results.map(normalizeSeries)
    currentPage.value = response.page
    totalPages.value = Math.max(1, Math.min(response.total_pages, 500))
  } catch {
    series.value = []
    totalPages.value = 1
    currentPage.value = 1
    errorMessage.value = 'No se pudieron cargar resultados desde la API.'
  } finally {
    isLoading.value = false
  }
}

function clearSearchDebounce(): void {
  if (searchDebounceTimeoutId !== undefined) {
    window.clearTimeout(searchDebounceTimeoutId)
    searchDebounceTimeoutId = undefined
  }
}

async function onSearchClick(): Promise<void> {
  clearSearchDebounce()
  const text = query.value.trim()
  const didChangeRoute = await updateRouteQuery(
    text,
    1,
    selectedList.value,
    useAdvancedFilters.value ? advancedFilters.value : null
  )

  if (!didChangeRoute) {
    await searchSeries(text, 1, selectedList.value)
  }
}

function onQueryInput(value: string): void {
  query.value = value
  clearSearchDebounce()
  searchDebounceTimeoutId = window.setTimeout(() => {
    searchDebounceTimeoutId = undefined
    void onSearchClick()
  }, SEARCH_DEBOUNCE_MS)
}

function onPageChange(page: number): void {
  void updateRouteQuery(
    query.value.trim(),
    page,
    selectedList.value,
    useAdvancedFilters.value ? advancedFilters.value : null
  )
}

function onQuickListClick(list: SeriesListFilter): void {
  clearSearchDebounce()
  query.value = ''
  selectedList.value = list
  useAdvancedFilters.value = false
  void updateRouteQuery('', 1, list, null)
}

function toggleFiltersPanel(): void {
  if (!isFiltersPanelOpen.value) {
    draftFilters.value = { ...advancedFilters.value }
  }

  isFiltersPanelOpen.value = !isFiltersPanelOpen.value
}

function closeFiltersPanel(): void {
  isFiltersPanelOpen.value = false
}

function applyFilters(): void {
  clearSearchDebounce()
  advancedFilters.value = { ...draftFilters.value }
  useAdvancedFilters.value = true
  query.value = ''

  const didChangeRoute = updateRouteQuery('', 1, selectedList.value, advancedFilters.value)
  void didChangeRoute.then((changed) => {
    if (!changed) {
      void searchSeries('', 1, selectedList.value)
    }
  })
}

function clearFilters(): void {
  draftFilters.value = defaultAdvancedFilters()
  advancedFilters.value = defaultAdvancedFilters()
  useAdvancedFilters.value = false

  const didChangeRoute = updateRouteQuery(query.value.trim(), 1, selectedList.value, null)
  void didChangeRoute.then((changed) => {
    if (!changed) {
      void searchSeries(query.value.trim(), 1, selectedList.value)
    }
  })
}

watch(
  () => [
    route.query[QUERY_PARAM_KEY],
    route.query[PAGE_PARAM_KEY],
    route.query[LIST_PARAM_KEY],
    route.query[GENRE_PARAM_KEY],
    route.query[YEAR_PARAM_KEY],
    route.query[RATING_PARAM_KEY],
    route.query[LANG_PARAM_KEY],
    route.query[SORT_PARAM_KEY]
  ],
  () => {
    const parsedText = parseRouteText(route.query[QUERY_PARAM_KEY])
    const parsedPage = parseRoutePage(route.query[PAGE_PARAM_KEY])
    const parsedList = parseRouteList(route.query[LIST_PARAM_KEY])
    const parsedFilters = parseRouteFilters(route.query as Record<string, unknown>)
    const filtersActive = hasAnyFilterParam(route.query as Record<string, unknown>)

    query.value = parsedText
    selectedList.value = parsedList
    advancedFilters.value = parsedFilters
    draftFilters.value = parsedFilters
    useAdvancedFilters.value = filtersActive

    void searchSeries(parsedText, parsedPage, parsedList)
  },
  { immediate: true }
)

watch(isFiltersPanelOpen, (isOpen) => {
  try {
    localStorage.setItem(FILTERS_PANEL_STORAGE_KEY, String(isOpen))
  } catch {
    // localStorage unavailable, ignore
  }
})

onBeforeUnmount(() => {
  clearSearchDebounce()
})
</script>

<template>
  <main class="search-page">
    <section class="search-header">
      <h1 class="search-title">Buscar series</h1>
      <p class="search-subtitle">Busca por nombre o por listas disponibles.</p>
    </section>

    <section class="search-form">
      <v-text-field
        :model-value="query"
        label="Nombre de serie"
        placeholder="Ej: Breaking Bad"
        variant="outlined"
        density="comfortable"
        hide-details
        clearable
        prepend-inner-icon="mdi-magnify"
        @update:model-value="onQueryInput"
        @keyup.enter="onSearchClick"
      />

      <v-btn
        variant="tonal"
        :color="isFiltersPanelOpen ? 'primary' : undefined"
        prepend-icon="mdi-tune-variant"
        @click="toggleFiltersPanel"
      >
        Más filtros
        <v-badge v-if="activeFilterCount" :content="activeFilterCount" color="primary" inline />
      </v-btn>
    </section>

    <section class="search-suggestions">
      <p class="search-suggestions-label">Búsqueda rápida</p>
      <div class="search-suggestions-list">
        <v-btn
          v-for="option in seriesListOptions"
          :key="option.value"
          size="small"
          rounded="pill"
          :variant="!query.trim() && selectedList === option.value ? 'flat' : 'tonal'"
          :color="!query.trim() && selectedList === option.value ? 'primary' : undefined"
          @click="onQuickListClick(option.value)"
        >
          {{ option.label }}
        </v-btn>
      </div>
    </section>

    <section class="search-body" :class="{ 'search-body--no-panel': !isFiltersPanelOpen }">
      <aside v-if="isFiltersPanelOpen" class="search-filters-panel">
        <div class="search-filters-panel-header">
          <h2 class="search-filters-panel-title">Filtros</h2>
          <button
            type="button"
            class="search-filters-panel-close"
            aria-label="Cerrar filtros"
            @click="closeFiltersPanel"
          >
            <v-icon icon="mdi-close" size="18" />
          </button>
        </div>
        <p class="search-filters-panel-subtitle">Filtros avanzados vía TheMovieDB (discover)</p>

        <div class="search-filters-fields">
          <v-select
            v-model="draftFilters.genreId"
            :items="genreOptions"
            item-title="name"
            item-value="id"
            label="Género"
            variant="outlined"
            density="comfortable"
            clearable
            hide-details
          />

          <v-text-field
            v-model.number="draftFilters.year"
            label="Año de estreno"
            type="number"
            variant="outlined"
            density="comfortable"
            clearable
            hide-details
          />

          <div class="search-filters-rating">
            <span class="search-filters-rating-label">
              Valoración mínima: {{ draftFilters.minRating ?? 0 }}
            </span>
            <v-slider
              v-model="draftMinRating"
              :min="0"
              :max="10"
              :step="0.5"
              thumb-label
              hide-details
            />
          </div>

          <v-select
            v-model="draftFilters.originalLanguage"
            :items="languageOptions"
            item-title="label"
            item-value="value"
            label="Idioma original"
            variant="outlined"
            density="comfortable"
            hide-details
          />

          <v-select
            v-model="draftFilters.sortBy"
            :items="sortOptions"
            item-title="label"
            item-value="value"
            label="Ordenar por"
            variant="outlined"
            density="comfortable"
            hide-details
          />
        </div>

        <div class="search-filters-panel-actions">
          <v-btn variant="text" @click="clearFilters">Limpiar</v-btn>
          <v-btn color="primary" variant="flat" @click="applyFilters">Aplicar filtros</v-btn>
        </div>
      </aside>

      <section class="search-results">
        <p v-if="!isLoading && !errorMessage" class="search-results-summary">
          {{ series.length }} resultado(s) · Página {{ currentPage }} de {{ totalPages }}
        </p>

        <v-alert v-if="errorMessage" type="error" variant="tonal" density="comfortable">
          {{ errorMessage }}
        </v-alert>

        <div v-else-if="isLoading" class="search-results-list" aria-label="Resultados cargando">
          <article
            v-for="index in skeletonCardCount"
            :key="`skeleton-${index}`"
            class="search-result-item search-result-item--skeleton"
            aria-hidden="true"
          >
            <v-skeleton-loader class="search-result-poster-skeleton" type="image" />
            <div class="search-result-content search-result-content--skeleton">
              <v-skeleton-loader type="heading" />
              <v-skeleton-loader type="text" />
              <v-skeleton-loader type="paragraph" />
            </div>
          </article>
        </div>

        <v-alert v-else-if="!series.length" type="info" variant="tonal" density="comfortable">
          {{ query.trim() ? 'No se encontraron series para esa búsqueda.' : 'No se encontraron resultados para la lista seleccionada.' }}
        </v-alert>

        <template v-else>
          <MoviesScroller :movies="series" layout="grid" media-type="tv" />

          <div v-if="totalPages > 1" class="search-pagination">
            <v-pagination
              :model-value="currentPage"
              :length="totalPages"
              :total-visible="7"
              density="comfortable"
              @update:model-value="onPageChange"
            />
          </div>
        </template>
      </section>
    </section>
  </main>
</template>

<style scoped src="../Search/Search.css"></style>
