import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home/Home.vue'
import DetailedMovie from '../views/DetailedMovie/DetailedMovie.vue'
import DetailedSeries from '../views/DetailedSeries/DetailedSeries.vue'
import Search from '../views/Search/Search.vue'
import SearchSeries from '../views/SearchSeries/SearchSeries.vue'
import MyMovies from '../views/MyMovies/MyMovies.vue'
import MySeries from '../views/MySeries/MySeries.vue'
import PrivacyPolicy from '../views/PrivacyPolicy/PrivacyPolicy.vue'

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior() {
    return { top: 0, left: 0 }
  },
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/buscarmovies',
      name: 'search',
      component: Search
    },
    {
      path: '/buscarseries',
      name: 'search-series',
      component: SearchSeries
    },
    {
      path: '/mis-peliculas',
      name: 'my-movies',
      component: MyMovies
    },
    {
      path: '/mis-series',
      name: 'my-series',
      component: MySeries
    },
    {
      path: '/movie/:idtmdb',
      name: 'detailed-movie',
      component: DetailedMovie
    },
    {
      path: '/tv_show/:idtmdb',
      name: 'detailed-series',
      component: DetailedSeries
    },
    {
      path: '/politica-privacidad-condiciones-uso',
      name: 'privacy-policy',
      component: PrivacyPolicy
    }
  ]
})

export default router
