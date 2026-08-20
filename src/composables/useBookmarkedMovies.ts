import { ref } from 'vue'
import { useToast } from './useToast'

export interface BookmarkedMovie {
  id: number
  title: string
  poster_path?: string
  posterPath?: string
  release_date: string
  vote_average: number
}

const STORAGE_KEY = 'bookmarked-movies'
const MAX_BOOKMARKS = 20

function readFromStorage(): BookmarkedMovie[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

const bookmarkedMovies = ref<BookmarkedMovie[]>(readFromStorage())

function persist(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarkedMovies.value))
}

function isBookmarked(movieId: number): boolean {
  return bookmarkedMovies.value.some((movie) => movie.id === movieId)
}

function addBookmark(movie: BookmarkedMovie): void {
  if (isBookmarked(movie.id)) {
    return
  }

  if (bookmarkedMovies.value.length >= MAX_BOOKMARKS) {
    useToast().showToast(`No puedes guardar más de ${MAX_BOOKMARKS} películas.`)
    return
  }

  bookmarkedMovies.value = [movie, ...bookmarkedMovies.value]
  persist()
}

function removeBookmark(movieId: number): void {
  bookmarkedMovies.value = bookmarkedMovies.value.filter((movie) => movie.id !== movieId)
  persist()
}

function toggleBookmark(movie: BookmarkedMovie): void {
  if (isBookmarked(movie.id)) {
    removeBookmark(movie.id)
  } else {
    addBookmark(movie)
  }
}

function clearBookmarks(): void {
  bookmarkedMovies.value = []
  persist()
}

export function useBookmarkedMovies() {
  return {
    bookmarkedMovies,
    isBookmarked,
    addBookmark,
    removeBookmark,
    toggleBookmark,
    clearBookmarks
  }
}
