<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import MoviesScroller from '../../components/MoviesScroller.vue'
import { useBookmarkedSeries } from '../../composables/useBookmarkedSeries'

const { bookmarkedSeries, clearBookmarks } = useBookmarkedSeries()

const searchQuery = ref('')
const isClearDialogOpen = ref(false)

const filteredSeries = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) {
    return bookmarkedSeries.value
  }

  return bookmarkedSeries.value.filter((series) => series.title.toLowerCase().includes(query))
})

const scrollerSeries = computed(() =>
  filteredSeries.value.map((series) => ({
    id: series.id,
    title: series.title,
    overview: '',
    poster_path: series.poster_path,
    posterPath: series.posterPath,
    release_date: series.release_date,
    vote_average: series.vote_average
  }))
)

function openClearDialog(): void {
  isClearDialogOpen.value = true
}

function confirmClearBookmarks(): void {
  clearBookmarks()
  isClearDialogOpen.value = false
}
</script>

<template>
  <main class="my-movies-page">
    <div class="my-movies-header">
      <h1 class="my-movies-title">Mis series</h1>

      <div v-if="bookmarkedSeries.length" class="my-movies-toolbar">
        <v-text-field
          v-model="searchQuery"
          density="compact"
          variant="outlined"
          placeholder="Filtrar por título"
          prepend-inner-icon="mdi-magnify"
          hide-details
          clearable
          class="my-movies-search"
        />

        <v-btn color="error" variant="tonal" prepend-icon="mdi-delete-outline" @click="openClearDialog">
          Borrar todas
        </v-btn>
      </div>
    </div>

    <p v-if="!bookmarkedSeries.length" class="my-movies-empty">
      Aún no has guardado ninguna serie.
      <RouterLink to="/buscarseries" class="my-movies-empty-link">Explora series</RouterLink>
      y pulsa el icono de bookmark en una serie para guardarla aquí.
    </p>

    <p v-else-if="!filteredSeries.length" class="my-movies-empty">
      No hay series guardadas que coincidan con "{{ searchQuery }}".
    </p>

    <MoviesScroller v-else :movies="scrollerSeries" layout="grid" media-type="tv" />

    <v-dialog v-model="isClearDialogOpen" max-width="420">
      <v-card class="my-movies-clear-dialog">
        <v-card-title>Borrar todas las series</v-card-title>
        <v-card-text>
          Esto eliminará las {{ bookmarkedSeries.length }} series guardadas. Esta acción no se puede deshacer.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="isClearDialogOpen = false">Cancelar</v-btn>
          <v-btn color="error" variant="flat" @click="confirmClearBookmarks">Borrar todas</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </main>
</template>

<style scoped src="./MySeries.css"></style>
