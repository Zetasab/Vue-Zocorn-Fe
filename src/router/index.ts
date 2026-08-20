import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home/Home.vue'
import DetailedMovie from '../views/DetailedMovie/DetailedMovie.vue'
import Search from '../views/Search/Search.vue'
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
      path: '/buscar',
      name: 'search',
      component: Search
    },
    {
      path: '/movie/:idtmdb',
      name: 'detailed-movie',
      component: DetailedMovie
    },
    {
      path: '/politica-privacidad-condiciones-uso',
      name: 'privacy-policy',
      component: PrivacyPolicy
    }
  ]
})

export default router
