export const Layout = () => import('@/layout/index.vue')

const constantRoutes = [
  {
    path: '/',
    name: 'Layout',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: '/dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        name: 'dashboard',
        meta: {title: '工作台', icon: 'HomeFilled', requiresAuth: true},
      },
      {
        path: '/sector/list',
        component: () => import('@/views/sector/index.vue'),
        name: 'sector-list',
        meta: {title: '板块模块', icon: 'DataBoard', requiresAuth: true},
      },
      {
        path: '/stock/list',
        component: () => import('@/views/stock/index.vue'),
        name: 'stock-list',
        meta: {title: '全股模块', icon: 'TrendCharts', requiresAuth: true},
      },
      {
        path: '/stock-detail',
        component: () => import('@/views/stock/detail.vue'),
        name: 'stock-detail',
        meta: {title: '个股详情', icon: 'DataLine', requiresAuth: true, hidden: true},
      },
      {
        path: '/watchlist',
        component: () => import('@/views/watchlist/index.vue'),
        name: 'watchlist',
        meta: {title: '自选股', icon: 'Star', requiresAuth: true},
      },
      {
        path: '/recalc',
        component: () => import('@/views/recalc/index.vue'),
        name: 'recalc',
        meta: {title: '重计算模块', icon: 'Refresh', requiresAuth: true},
      },
    ],
  },
  {
    path: '/login',
    component: () => import('@/views/login/index.vue'),
    name: 'login',
    meta: {title: '登录'},
  },
  {
    path: '/:pathMatch(.*)*',
    name: '404',
    component: () => import('@/views/login/index.vue'),
    meta: {title: '404', hidden: true},
  },
]

export default constantRoutes
