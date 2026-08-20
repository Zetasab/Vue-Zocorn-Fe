<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MoviesScroller from '../../components/MoviesScroller.vue'
import { tmdbTvApiService } from '../../services/tmdbApiService'
import { useYoutubeLoopingBackground } from '../../composables/useYoutubeLoopingBackground'
import { useBookmarkedSeries } from '../../composables/useBookmarkedSeries'

type SeriesGenre = {
	id: number
	name: string
}

type SeriesNetwork = {
	id: number
	logo_path: string | null
	name: string
	origin_country: string
}

type ProductionCountry = {
	iso_3166_1: string
	name: string
}

type SpokenLanguage = {
	english_name: string
	iso_639_1: string
	name: string
}

type DetailedSeriesData = {
	id: number
	name: string
	original_name: string
	tagline: string
	first_air_date: string
	episode_run_time: number[]
	number_of_seasons: number
	number_of_episodes: number
	in_production: boolean
	vote_average: number
	vote_count: number
	popularity: number
	status: string
	original_language: string
	overview: string
	poster_path: string | null
	backdrop_path: string | null
	homepage: string | null
	genres: SeriesGenre[]
	networks: SeriesNetwork[]
	production_countries: ProductionCountry[]
	spoken_languages: SpokenLanguage[]
}

type SeriesCastMember = {
	id: number
	name: string
	character: string
	profile_path: string | null
}

type SeriesCreditsResponse = {
	cast: SeriesCastMember[]
}

type SeriesImageFile = {
	file_path: string
	aspect_ratio: number
	width: number
	height: number
}

type SeriesImagesResponse = {
	backdrops: SeriesImageFile[]
	posters: SeriesImageFile[]
}

type SeriesVideo = {
	id: string
	key: string
	name: string
	site: string
	type: string
	official: boolean
}

type SeriesVideosResponse = {
	results: SeriesVideo[]
}

type TmdbSeriesListItem = {
	id: number
	name: string
	overview: string
	poster_path: string | null
	backdrop_path: string | null
	first_air_date: string
	vote_average: number
}

type TmdbSeriesListResponse = {
	results: TmdbSeriesListItem[]
}

type ReviewAuthorDetails = {
	name: string | null
	username: string
	avatar_path: string | null
	rating: number | null
}

type SeriesReviewItem = {
	id: string
	author: string
	author_details: ReviewAuthorDetails
	content: string
	created_at: string
	updated_at: string
	url: string
}

type SeriesReviewsResponse = {
	results: SeriesReviewItem[]
}

type ScrollerSeriesItem = {
	id: number
	title: string
	overview: string
	poster_path?: string
	backdrop_path?: string
	release_date: string
	vote_average: number
}

const route = useRoute()
const router = useRouter()
const imageBaseUrl = 'https://image.tmdb.org/t/p'
const series = ref<DetailedSeriesData | null>(null)
const castMembers = ref<SeriesCastMember[]>([])
const seriesVideos = ref<SeriesVideo[]>([])
const galleryImages = ref<SeriesImageFile[]>([])
const recommendedSeries = ref<ScrollerSeriesItem[]>([])
const similarSeries = ref<ScrollerSeriesItem[]>([])
const seriesReviews = ref<SeriesReviewItem[]>([])
const showHeaderVideo = ref(false)
const headerVideoDelayProgress = ref(0)
const isLoadingSeries = ref(false)
const seriesLoadError = ref('')
const isImageDialogOpen = ref(false)
const selectedImagePath = ref<string | null>(null)
let headerVideoTimeoutId: number | undefined
let headerVideoProgressIntervalId: number | undefined
const HEADER_VIDEO_DELAY_MS = 5000

const seriesIdParam = computed(() => String(route.params.idtmdb ?? ''))
const parsedSeriesId = computed(() => Number(seriesIdParam.value))
const isSeriesIdValid = computed(() => Number.isInteger(parsedSeriesId.value) && parsedSeriesId.value > 0)
const currentYear = new Date().getFullYear()
const backdropUrl = computed(() => {
	if (!series.value?.backdrop_path) {
		return ''
	}

	return `${imageBaseUrl}/original${series.value.backdrop_path}`
})
const watchUrl = computed(() => {
	if (!series.value?.id) {
		return ''
	}

	return `https://www.themoviedb.org/tv/${series.value.id}/watch?locale=ES`
})
const websiteUrl = computed(() => series.value?.homepage?.trim() ?? '')
const maxStatsValue = computed(() =>
	Math.max(series.value?.number_of_seasons ?? 0, series.value?.number_of_episodes ?? 0, 1)
)
const seasonsPercent = computed(() => ((series.value?.number_of_seasons ?? 0) / maxStatsValue.value) * 100)
const episodesPercent = computed(() => ((series.value?.number_of_episodes ?? 0) / maxStatsValue.value) * 100)
const ratingPercent = computed(() => Math.max(0, Math.min((series.value?.vote_average ?? 0) * 10, 100)))
const formattedRatingPercent = computed(() => `${Math.round(ratingPercent.value)}%`)
const ratingToneClass = computed(() => {
	if (ratingPercent.value < 40) {
		return 'is-low'
	}

	if (ratingPercent.value < 70) {
		return 'is-mid'
	}

	return 'is-high'
})
const selectedImageUrl = computed(() => {
	if (!selectedImagePath.value) {
		return ''
	}

	return `${imageBaseUrl}/original${selectedImagePath.value}`
})
const featuredVideo = computed(() => {
	const youtubeVideos = seriesVideos.value.filter((video) => video.site === 'YouTube' && video.key)
	if (!youtubeVideos.length) {
		return null
	}

	const officialTrailer = youtubeVideos.find((video) => video.type === 'Trailer' && video.official)
	if (officialTrailer) {
		return officialTrailer
	}

	const anyTrailer = youtubeVideos.find((video) => video.type === 'Trailer')
	if (anyTrailer) {
		return anyTrailer
	}

	return youtubeVideos[0]
})
const featuredVideoEmbedUrl = computed(() => {
	if (!featuredVideo.value) {
		return ''
	}

	return `https://www.youtube.com/embed/${featuredVideo.value.key}`
})
const headerPlayerElementId = computed(() => {
	if (!featuredVideo.value || !showHeaderVideo.value) {
		return ''
	}

	return `detailed-series-header-yt-${featuredVideo.value.key}`
})

const headerPlayerVideoId = computed(() => {
	if (!featuredVideo.value || !showHeaderVideo.value) {
		return null
	}

	return featuredVideo.value.key
})

useYoutubeLoopingBackground(headerPlayerElementId, headerPlayerVideoId)

const { isBookmarked, toggleBookmark } = useBookmarkedSeries()

function onBookmarkClick(): void {
	if (!series.value) {
		return
	}

	toggleBookmark({
		id: series.value.id,
		title: series.value.name,
		poster_path: series.value.poster_path ?? undefined,
		release_date: series.value.first_air_date,
		vote_average: series.value.vote_average
	})
}

const formattedEpisodeRuntime = computed(() => {
	const runtimeMinutes = series.value?.episode_run_time?.[0] ?? 0
	if (!runtimeMinutes) {
		return 'Sin datos'
	}

	return `${runtimeMinutes} min / episodio`
})

function companyLogoUrl(logoPath: string | null): string {
	if (!logoPath) {
		return ''
	}

	return `${imageBaseUrl}/w92${logoPath}`
}

function castImageUrl(profilePath: string | null): string {
	if (!profilePath) {
		return ''
	}

	return `${imageBaseUrl}/w185${profilePath}`
}

function galleryThumbUrl(filePath: string): string {
	return `${imageBaseUrl}/w342${filePath}`
}

function openImageDialog(filePath: string): void {
	selectedImagePath.value = filePath
	isImageDialogOpen.value = true
}

function formatReviewDate(value: string): string {
	if (!value) {
		return ''
	}

	const parsedDate = new Date(value)
	if (Number.isNaN(parsedDate.getTime())) {
		return value
	}

	return new Intl.DateTimeFormat('es-ES', {
		day: '2-digit',
		month: 'short',
		year: 'numeric'
	}).format(parsedDate)
}

function reviewAvatarUrl(avatarPath: string | null | undefined): string {
	if (!avatarPath) {
		return 'https://www.gravatar.com/avatar/?d=mp&s=64'
	}

	if (avatarPath.startsWith('/http')) {
		return avatarPath.slice(1)
	}

	if (avatarPath.startsWith('http')) {
		return avatarPath
	}

	return `${imageBaseUrl}/w45${avatarPath}`
}

function mapScrollerSeries(items: TmdbSeriesListItem[] | undefined): ScrollerSeriesItem[] {
	return (items ?? [])
		.filter((item) => item?.id)
		.map((item) => ({
			id: item.id,
			title: item.name ?? 'Sin título',
			overview: item.overview ?? '',
			poster_path: item.poster_path ?? undefined,
			backdrop_path: item.backdrop_path ?? undefined,
			release_date: item.first_air_date ?? '',
			vote_average: item.vote_average ?? 0
		}))
}

function mapReviews(reviews: SeriesReviewItem[] | undefined): SeriesReviewItem[] {
	return (reviews ?? [])
		.filter((review) => Boolean(review?.id && review?.content?.trim()))
		.map((review) => ({
			id: review.id,
			author: review.author ?? '',
			author_details: {
				name: review.author_details?.name ?? null,
				username: review.author_details?.username ?? review.author ?? 'Anónimo',
				avatar_path: review.author_details?.avatar_path ?? null,
				rating: review.author_details?.rating ?? null
			},
			content: review.content,
			created_at: review.created_at ?? '',
			updated_at: review.updated_at ?? review.created_at ?? '',
			url: review.url ?? ''
		}))
		.slice(0, 6)
}

function clearHeaderVideoTimer(): void {
	if (typeof window === 'undefined') {
		return
	}

	if (headerVideoTimeoutId !== undefined) {
		window.clearTimeout(headerVideoTimeoutId)
		headerVideoTimeoutId = undefined
	}

	if (headerVideoProgressIntervalId !== undefined) {
		window.clearInterval(headerVideoProgressIntervalId)
		headerVideoProgressIntervalId = undefined
	}

	headerVideoDelayProgress.value = 0
}

function startHeaderVideoDelayProgress(): void {
	if (typeof window === 'undefined') {
		return
	}

	const startedAt = Date.now()
	headerVideoDelayProgress.value = 0
	headerVideoProgressIntervalId = window.setInterval(() => {
		const elapsedMs = Date.now() - startedAt
		const progress = Math.min((elapsedMs / HEADER_VIDEO_DELAY_MS) * 100, 100)
		headerVideoDelayProgress.value = progress

		if (progress >= 100 && headerVideoProgressIntervalId !== undefined) {
			window.clearInterval(headerVideoProgressIntervalId)
			headerVideoProgressIntervalId = undefined
		}
	}, 60)
}

function scheduleHeaderVideo(): void {
	clearHeaderVideoTimer()
	showHeaderVideo.value = false

	if (!featuredVideo.value || typeof window === 'undefined') {
		return
	}

	startHeaderVideoDelayProgress()

	headerVideoTimeoutId = window.setTimeout(() => {
		showHeaderVideo.value = true
		headerVideoTimeoutId = undefined
		headerVideoDelayProgress.value = 100
	}, HEADER_VIDEO_DELAY_MS)
}

async function loadSeriesDetails(): Promise<void> {
	if (!isSeriesIdValid.value) {
		series.value = null
		castMembers.value = []
		recommendedSeries.value = []
		similarSeries.value = []
		seriesReviews.value = []
		seriesLoadError.value = 'Id de serie inválido.'
		return
	}

	isLoadingSeries.value = true
	seriesLoadError.value = ''
	series.value = null
	castMembers.value = []
	seriesVideos.value = []
	galleryImages.value = []
	recommendedSeries.value = []
	similarSeries.value = []
	seriesReviews.value = []
	showHeaderVideo.value = false
	clearHeaderVideoTimer()
	selectedImagePath.value = null
	isImageDialogOpen.value = false

	try {
		const [seriesData, credits, videos, images, recommendations, similar] = await Promise.all([
			tmdbTvApiService.get<DetailedSeriesData>(`${parsedSeriesId.value}`, { language: 'es-ES' }),
			tmdbTvApiService.get<SeriesCreditsResponse>(`${parsedSeriesId.value}/credits`, { language: 'es-ES' }),
			tmdbTvApiService.get<SeriesVideosResponse>(`${parsedSeriesId.value}/videos`, { language: 'es-ES' }),
			tmdbTvApiService.get<SeriesImagesResponse>(`${parsedSeriesId.value}/images`),
			tmdbTvApiService.get<TmdbSeriesListResponse>(`${parsedSeriesId.value}/recommendations`, { language: 'es-ES' }),
			tmdbTvApiService.get<TmdbSeriesListResponse>(`${parsedSeriesId.value}/similar`, { language: 'es-ES' })
		])

		series.value = seriesData
		castMembers.value = credits.cast ?? []
		seriesVideos.value = videos.results ?? []
		const uniqueImages = [...(images.backdrops ?? []), ...(images.posters ?? [])].filter(
			(img, index, arr) => arr.findIndex((candidate) => candidate.file_path === img.file_path) === index
		)
		galleryImages.value = uniqueImages.slice(0, 24)
		recommendedSeries.value = mapScrollerSeries(recommendations.results)
		similarSeries.value = mapScrollerSeries(similar.results)

		let loadedReviews: SeriesReviewItem[] = []

		try {
			const reviewsEs = await tmdbTvApiService.get<SeriesReviewsResponse>(`${parsedSeriesId.value}/reviews`, {
				language: 'es-ES'
			})
			loadedReviews = reviewsEs.results ?? []

			if (!loadedReviews.length) {
				const reviewsEn = await tmdbTvApiService.get<SeriesReviewsResponse>(`${parsedSeriesId.value}/reviews`, {
					language: 'en-US'
				})
				loadedReviews = reviewsEn.results ?? []
			}
		} catch {
			loadedReviews = []
		}

		seriesReviews.value = mapReviews(loadedReviews)
	} catch {
		seriesLoadError.value = 'No se pudo cargar el detalle de la serie.'
	} finally {
		isLoadingSeries.value = false
	}
}

function goBack(): void {
	if (typeof window !== 'undefined' && window.history.length > 1) {
		window.history.back()
		return
	}

	router.push('/')
}

watch(
	featuredVideo,
	() => {
		scheduleHeaderVideo()
	},
	{ immediate: true }
)

watch(
	() => route.params.idtmdb,
	() => {
		void loadSeriesDetails()
	},
	{ immediate: true }
)

onBeforeUnmount(() => {
	clearHeaderVideoTimer()
})
</script>

<template>
	<main v-if="isLoadingSeries" class="detailed-movie-page detailed-movie-skeleton-page">
		<v-skeleton-loader type="image" class="detailed-movie-header-skeleton" />

		<section class="detailed-movie-container">
			<section class="detailed-movie-highlight">
				<article class="detailed-movie-highlight-main">
					<v-skeleton-loader type="text" class="detailed-movie-skeleton-line detailed-movie-skeleton-line--short" />
					<v-skeleton-loader type="text" class="detailed-movie-skeleton-line" />
					<v-skeleton-loader type="text" class="detailed-movie-skeleton-line" />
					<v-skeleton-loader type="text" class="detailed-movie-skeleton-line detailed-movie-skeleton-line--medium" />
					<v-skeleton-loader type="button" class="detailed-movie-skeleton-watch" />
					<div class="detailed-movie-genres">
						<v-skeleton-loader v-for="n in 4" :key="n" type="chip" class="detailed-movie-skeleton-chip" />
					</div>
				</article>

				<article class="detailed-movie-chart">
					<div class="detailed-movie-chart-top-row">
						<v-skeleton-loader type="avatar" class="detailed-movie-skeleton-bookmark" />
						<v-skeleton-loader type="avatar" class="detailed-movie-skeleton-rating" />
					</div>
					<v-skeleton-loader type="text" class="detailed-movie-skeleton-line" />
					<v-skeleton-loader type="text" class="detailed-movie-skeleton-line" />
				</article>
			</section>

			<section class="detailed-movie-cast">
				<v-skeleton-loader type="text" class="detailed-movie-skeleton-line detailed-movie-skeleton-line--short" />
				<div class="detailed-movie-cast-scroll">
					<v-skeleton-loader v-for="n in 8" :key="n" type="avatar" class="detailed-movie-skeleton-cast-avatar" />
				</div>
			</section>
		</section>
	</main>

	<main v-else-if="series" class="detailed-movie-page">
		<section class="detailed-movie-header">
			<img v-if="series.backdrop_path" :src="backdropUrl" :alt="`Backdrop de ${series.name}`"
				class="detailed-movie-header-image"
				:class="{ 'is-hidden': showHeaderVideo && Boolean(featuredVideo) }" />
			<div v-else class="detailed-movie-header-image detailed-movie-header-image--fallback"
				:class="{ 'is-hidden': showHeaderVideo && Boolean(featuredVideo) }" aria-hidden="true"></div>
			<div v-if="featuredVideo && showHeaderVideo" :key="featuredVideo.key" class="detailed-movie-header-video"
				aria-hidden="true">
				<div :id="headerPlayerElementId"></div>
			</div>
			<div class="detailed-movie-header-tools">
				<a href="#" class="detailed-movie-go-back" @click.prevent="goBack">
					<v-icon icon="mdi-arrow-left" size="16" />
					<span>Volver atras</span>
				</a>
			</div>
			<div class="detailed-movie-title-row" @click.stop>
				<div class="detailed-movie-title-stack">
					<h1 class="detailed-movie-header-title">{{ series.name }}</h1>
					<div v-if="featuredVideo && !showHeaderVideo" class="detailed-movie-header-delay-slider"
						aria-hidden="true">
						<div class="detailed-movie-header-delay-slider-label">Trailer</div>
						<div class="detailed-movie-header-delay-slider-track">
							<span class="detailed-movie-header-delay-slider-fill"
								:style="{ width: `${Math.round(headerVideoDelayProgress)}%` }"></span>
						</div>
					</div>
				</div>

			</div>
		</section>

		<section class="detailed-movie-container">
			<section class="detailed-movie-highlight">
				<article class="detailed-movie-highlight-main">
					<div class="detailed-movie-meta-row">
						<div class="detailed-movie-date-group">
							<v-icon icon="mdi-calendar-month-outline" size="18" />
							<p class="detailed-movie-date">{{ series.first_air_date }}</p>
						</div>
						<div class="detailed-movie-duration-group">
							<v-icon icon="mdi-timer-outline" size="18" />
							<p class="detailed-movie-date">{{ formattedEpisodeRuntime }}</p>
						</div>
					</div>
					<p class="detailed-movie-description">{{ series.overview }}</p>
					<a class="detailed-movie-watch" :href="watchUrl" target="_blank" rel="noopener noreferrer">Ver
						serie</a>

					<div class="detailed-movie-genres">
						<span v-for="genre in series.genres" :key="genre.id" class="genre-chip">{{ genre.name }}</span>
					</div>
				</article>

				<article class="detailed-movie-chart" aria-label="Comparación temporadas y episodios">
					<div class="detailed-movie-chart-top-row">
						<button type="button" class="detailed-movie-bookmark-btn"
							:class="{ 'is-bookmarked': isBookmarked(series.id) }"
							:aria-label="isBookmarked(series.id) ? `Quitar ${series.name} de guardados` : `Guardar ${series.name}`"
							@click="onBookmarkClick">
							<v-icon :icon="isBookmarked(series.id) ? 'mdi-bookmark' : 'mdi-bookmark-outline'" size="20" />
						</button>

						<div class="detailed-movie-chart-header">
							<div class="detailed-movie-rating">
								<div class="detailed-movie-rating-circle" :class="ratingToneClass"
									:style="{ '--rating-percent': String(ratingPercent) }" role="img"
									aria-label="Puntuación de la serie">
									<span>{{ formattedRatingPercent }}</span>
								</div>
								<p class="detailed-movie-rating-votes">{{ series.vote_count }} votos</p>
							</div>

							<a v-if="websiteUrl" class="detailed-movie-site-link" :href="websiteUrl" target="_blank"
								rel="noopener noreferrer" aria-label="Website" title="Website">
								<v-icon icon="mdi-web" size="18" />
								<span>Website</span>
							</a>
						</div>
					</div>

					<div class="chart-row">
						<div class="chart-label-row">
							<span>Temporadas</span>
							<strong>{{ series.number_of_seasons }}</strong>
						</div>
						<div class="chart-track">
							<span class="chart-bar chart-bar--budget" :style="{ width: `${seasonsPercent}%` }"></span>
						</div>
					</div>

					<div class="chart-row">
						<div class="chart-label-row">
							<span>Episodios</span>
							<strong>{{ series.number_of_episodes }}</strong>
						</div>
						<div class="chart-track">
							<span class="chart-bar chart-bar--revenue" :style="{ width: `${episodesPercent}%` }"></span>
						</div>
					</div>

					<ul class="detailed-movie-companies">
						<li v-for="network in series.networks" :key="network.id"
							class="detailed-movie-company-item">
							<img v-if="network.logo_path" :src="companyLogoUrl(network.logo_path)" :alt="network.name"
								class="company-logo" />
							<span v-else class="company-logo company-logo--fallback">
								<v-icon icon="mdi-domain" size="13" />
							</span>
							<span class="company-name">{{ network.name }}</span>
						</li>
					</ul>
				</article>
			</section>

			<section v-if="castMembers.length" class="detailed-movie-cast">
				<h2 class="detailed-movie-cast-title">Reparto</h2>
				<div class="detailed-movie-cast-scroll">
					<article v-for="actor in castMembers" :key="actor.id" class="detailed-movie-cast-card">
						<img v-if="actor.profile_path" :src="castImageUrl(actor.profile_path)" :alt="actor.name"
							class="detailed-movie-cast-image" />
						<span v-else class="detailed-movie-cast-image detailed-movie-cast-image--fallback">
							<v-icon icon="mdi-account" size="18" />
						</span>
						<p class="detailed-movie-cast-name">{{ actor.name }}</p>
						<p class="detailed-movie-cast-character">{{ actor.character || 'Sin personaje' }}</p>
					</article>
				</div>
			</section>
		</section>

		<section class="detailed-movie-container">

			<section v-if="featuredVideo" class="detailed-movie-video">
				<h2 class="detailed-movie-scroller-title">Trailer</h2>
				<div class="detailed-movie-video-shell">
					<iframe :src="featuredVideoEmbedUrl" :title="featuredVideo.name" class="detailed-movie-video-frame"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
						allowfullscreen></iframe>
				</div>
			</section>

			<section v-if="galleryImages.length" class="detailed-movie-gallery">
				<h2 class="detailed-movie-gallery-title">Imágenes</h2>
				<div class="detailed-movie-gallery-grid">
					<button v-for="image in galleryImages" :key="image.file_path" class="detailed-movie-gallery-item"
						type="button" @click="openImageDialog(image.file_path)">
						<img :src="galleryThumbUrl(image.file_path)" alt="Imagen de la serie"
							class="detailed-movie-gallery-img" />
					</button>
				</div>
			</section>
		</section>

		<section class="detailed-movie-container">
			<section v-if="recommendedSeries.length" class="detailed-movie-scroller-section mt-15">
				<h2 class="detailed-movie-scroller-title">Recomendadas</h2>
				<MoviesScroller :movies="recommendedSeries" media-type="tv" />
			</section>

			<section v-if="similarSeries.length" class="detailed-movie-scroller-section mt-15">
				<h2 class="detailed-movie-scroller-title">Similares</h2>
				<MoviesScroller :movies="similarSeries" media-type="tv" />
			</section>

			<section class="detailed-movie-reviews mt-15">
				<h2 class="detailed-movie-reviews-title">Reviews</h2>

				<p v-if="!seriesReviews.length" class="detailed-movie-reviews-empty">Aún no hay reviews para esta
					serie.</p>

				<div v-else class="detailed-movie-reviews-grid">
					<article v-for="review in seriesReviews" :key="review.id" class="detailed-movie-review-card">
						<div class="detailed-movie-review-header">
							<div class="detailed-movie-review-author-block">
								<img :src="reviewAvatarUrl(review.author_details.avatar_path)"
									:alt="`Avatar de ${review.author_details.username || review.author}`"
									class="detailed-movie-review-avatar" loading="lazy" referrerpolicy="no-referrer" />
								<div>
									<h3 class="detailed-movie-review-author">
										{{ review.author_details.name || review.author_details.username || review.author
										}}
									</h3>
									<p class="detailed-movie-review-username">@{{ review.author_details.username ||
										review.author }}</p>
								</div>
								<p class="detailed-movie-review-date">{{ formatReviewDate(review.updated_at ||
									review.created_at) }}</p>
							</div>
							<span v-if="review.author_details.rating !== null" class="detailed-movie-review-rating">
								⭐ {{ Number(review.author_details.rating).toFixed(1) }}
							</span>
						</div>

						<p class="detailed-movie-review-content">{{ review.content }}</p>

						<a class="detailed-movie-review-link" :href="review.url" target="_blank"
							rel="noopener noreferrer">
							Leer review completa
						</a>
					</article>
				</div>
			</section>
		</section>

		<footer class="detailed-movie-footer">
			<div class="detailed-movie-footer-content">
				<p class="detailed-movie-footer-copy">© {{ currentYear }} Zeta Movies</p>
				<div class="detailed-movie-footer-links">
					<a :href="watchUrl" target="_blank" rel="noopener noreferrer">Watch</a>
					<a :href="`https://www.themoviedb.org/tv/${series.id}`" target="_blank"
						rel="noopener noreferrer">TMDB</a>
				</div>
			</div>
		</footer>
	</main>

	<main v-else class="detailed-movie-page detailed-movie-page--not-found">
		<section class="not-found-shell">
			<h1>{{ seriesLoadError || 'No se encontró el detalle de esta serie' }}</h1>
			<p>Id solicitada: {{ seriesIdParam }}</p>
			<a href="#" class="detailed-movie-back" @click.prevent="goBack">
				<v-icon icon="mdi-arrow-left" size="16" />
				<span>Volver</span>
			</a>
		</section>
	</main>

	<v-dialog v-model="isImageDialogOpen" max-width="1320">
		<v-card class="detailed-movie-image-dialog">
			<v-card-text class="detailed-movie-image-dialog-content">
				<img v-if="selectedImageUrl" :src="selectedImageUrl" alt="Imagen ampliada"
					class="detailed-movie-image-full" />
			</v-card-text>
			<v-card-actions>
				<v-spacer />
				<v-btn variant="text" @click="isImageDialogOpen = false">Cerrar</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<style scoped src="../DetailedMovie/DetailedMovie.css"></style>
