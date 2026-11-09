import MainLayout from '../layouts/MainLayout.vue'
import IndexPage from '../pages/IndexPage.vue'
import LoginView from '../pages/LoginView.vue'

const routes = [
  // Send guests to login, while signed-in users land on the health dashboard.
  {
    path: '/welcome',
    component: LoginView,
    meta: { guestOnly: true }
  },
  {
    path: '/login',
    component: LoginView,
    meta: { guestOnly: true }
  },
  {
    path: '/',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      { path: '', component: IndexPage },
      { path: 'glucose', component: IndexPage },
      {
        path: 'pressure',
        component: () => import('../pages/BloodPressurePage.vue')
      },
      {
        path: 'medications',
        component: () => import('../pages/MedicationsPage.vue')
      },
      {
        path: 'reminders',
        component: () => import('../pages/RemindersPage.vue')
      },
      {
        path: 'nutrition',
        component: () => import('../pages/NutritionPage.vue')
      },
      {
        path: 'education',
        component: () => import('../pages/EducationPage.vue')
      },
      {
        path: 'reports',
        component: () => import('../pages/ReportsPage.vue')
      },
      {
        path: 'profile',
        component: () => import('../pages/ProfilePage.vue')
      }
    ]
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('../pages/ErrorNotFound.vue')
  }
]

export default routes
