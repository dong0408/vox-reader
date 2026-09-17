import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import IndexPage from '@/pages/index.vue'
import ReaderPage from '@/pages/reader.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: IndexPage,
  },
  {
    path: '/reader/:id',
    name: 'Reader',
    component: ReaderPage,
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})
