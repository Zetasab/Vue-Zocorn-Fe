<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import MoviesScroller from '../../components/MoviesScroller.vue'
import { useBookmarkedMovies } from '../../composables/useBookmarkedMovies'

const { bookmarkedMovies, clearBookmarks } = useBookmarkedMovies()

const searchQuery = ref('')
const isClearDialogOpen = ref(false)

const filteredMovies = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) {
    return bookmarkedMovies.value
  }

  return bookmarkedMovies.value.filter((movie) => movie.title.toLowerCase().includes(query))
})

const scrollerMovies = computed(() =>
  filteredMovies.value.map((movie) => ({
    id: movie.id,
    title: movie.title,
    overview: '',
    poster_path: movie.poster_path,
    posterPath: movie.posterPath,
    release_date: movie.release_date,
    vote_average: movie.vote_average
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
      <h1 class="my-movies-title">Mis películas</h1>

      <div v-if="bookmarkedMovies.length" class="my-movies-toolbar">
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

    <p v-if="!bookmarkedMovies.length" class="my-movies-empty">
      Aún no has guardado ninguna película.
      <RouterLink to="/" class="my-movies-empty-link">Explora el inicio</RouterLink>
      y pulsa el icono de bookmark en una película para guardarla aquí.
    </p>

    <p v-else-if="!filteredMovies.length" class="my-movies-empty">
      No hay películas guardadas que coincidan con "{{ searchQuery }}".
    </p>

    <MoviesScroller v-else :movies="scrollerMovies" layout="grid" />

    <v-dialog v-model="isClearDialogOpen" max-width="420">
      <v-card class="my-movies-clear-dialog">
        <v-card-title>Borrar todas las películas</v-card-title>
        <v-card-text>
          Esto eliminará las {{ bookmarkedMovies.length }} películas guardadas. Esta acción no se puede deshacer.
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

<style scoped src="./MyMovies.css"></style>
