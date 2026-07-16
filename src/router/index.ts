import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../views/HomePage.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomePage,
  },
  {
    path: '/networks',
    name: 'networks-list',
    component: () => import('../views/NetworksList.vue'),
  },
  {
    path: '/networks/create',
    name: 'networks-create',
    component: () => import('../views/NetworkCreate.vue'),
  },
  {
    path: '/networks/:id',
    name: 'networks-detail',
    component: () => import('../views/NetworkDetail.vue'),
  },
  {
    path: '/networks/:id/connections/add',
    name: 'networks-add-connection',
    component: () => import('../views/NetworkAddConnection.vue'),
  },
  {
    path: '/networks/:id/connections/:connId',
    name: 'networks-connection-detail',
    component: () => import('../views/ConnectionDetail.vue'),
  },
  {
    path: '/networks/:id/dns/:dnsId',
    name: 'networks-dns-detail',
    component: () => import('../views/DnsDetail.vue'),
  },
  {
    path: '/networks/:id/test',
    name: 'networks-test-endpoint',
    component: () => import('../views/TestEndpoint.vue'),
  },
  {
    path: '/gateways/create',
    name: 'gateway-create',
    component: () => import('../views/GatewayCreate.vue'),
  },
  {
    path: '/gateways/overview',
    name: 'gateway-overview',
    component: () => import('../views/ControlPlaneOverview.vue'),
  },
  {
    path: '/gateways/data-plane-nodes',
    name: 'data-plane-nodes',
    component: () => import('../views/DataPlaneNodes.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
