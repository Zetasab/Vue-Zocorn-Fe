import { ref } from 'vue'
import { useToast } from './useToast'

export interface BookmarkedSeries {
  id: number
  title: string
  poster_path?: string
  posterPath?: string
  release_date: string
  vote_average: number
}

const STORAGE_KEY = 'bookmarked-series'
const MAX_BOOKMARKS = 20

function readFromStorage(): BookmarkedSeries[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

const bookmarkedSeries = ref<BookmarkedSeries[]>(readFromStorage())

function persist(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarkedSeries.value))
}

function isBookmarked(seriesId: number): boolean {
  return bookmarkedSeries.value.some((series) => series.id === seriesId)
}

function addBookmark(series: BookmarkedSeries): void {
  if (isBookmarked(series.id)) {
    return
  }

  if (bookmarkedSeries.value.length >= MAX_BOOKMARKS) {
    useToast().showToast(`No puedes guardar más de ${MAX_BOOKMARKS} series.`)
    return
  }

  bookmarkedSeries.value = [series, ...bookmarkedSeries.value]
  persist()
}

function removeBookmark(seriesId: number): void {
  bookmarkedSeries.value = bookmarkedSeries.value.filter((series) => series.id !== seriesId)
  persist()
}

function toggleBookmark(series: BookmarkedSeries): void {
  if (isBookmarked(series.id)) {
    removeBookmark(series.id)
  } else {
    addBookmark(series)
  }
}

function clearBookmarks(): void {
  bookmarkedSeries.value = []
  persist()
}

export function useBookmarkedSeries() {
  return {
    bookmarkedSeries,
    isBookmarked,
    addBookmark,
    removeBookmark,
    toggleBookmark,
    clearBookmarks
  }
}
