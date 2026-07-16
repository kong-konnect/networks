import { ref, computed } from 'vue'
import type { Network, Connection, Gateway, CloudProvider, ConnectionType, ConnectionFamily, ConnectionDirection } from '@/types'

// ── Mock data ───────────────────────────────────────────────────────────────

const now = new Date()
const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString()
const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()
const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()
const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
const tenMinsAgo = new Date(now.getTime() - 10 * 60 * 1000).toISOString()
const fiveMinsAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString()
const thirtyMinsAgo = new Date(now.getTime() - 30 * 60 * 1000).toISOString()

const initialNetworks: Network[] = [
  {
    id: 'net-1',
    name: 'aws-us-east',
    cloud: 'aws',
    regions: [
      { region: 'us-east-1', cidr: '10.0.0.0/16', zones: ['use1-az1', 'use1-az2'] },
      { region: 'us-west-2', cidr: '10.1.0.0/16' },
    ],
    status: 'ready',
    createdAt: sevenDaysAgo,
    lastCheckedAt: fiveMinsAgo,
    attachedGatewayCount: 2,
    connectionCount: 4,
    providerNetworkId: 'vpc-0a1b2c3d4e5f67890',
    dnsConfigs: [
      {
        id: 'dns-1',
        name: 'payments.internal.company.com',
        type: 'private-hosted-zone',
        status: 'ready',
        usedFor: 'Upstream services',
        resolverDetails: 'Private hosted zone Z0A1B2C3D4E5F6 resolving payments.internal.company.com to the network endpoints.',
        relatedConnectionId: 'conn-7',
        events: [
          { time: sevenDaysAgo, event: 'Private hosted zone created', result: 'Success' },
          { time: fiveMinsAgo, event: 'Resolution check passed', result: 'Success' },
        ],
      },
      {
        id: 'dns-2',
        name: 'shared.internal.company.com',
        type: 'outbound-resolver',
        status: 'error',
        usedFor: 'Shared services',
        lastCheckedAt: thirtyMinsAgo,
        resolverDetails: 'Route 53 outbound resolver endpoint rslvr-out-0a1b2c3 is unreachable from the network.',
        events: [
          { time: sevenDaysAgo, event: 'Outbound resolver created', result: 'Success' },
          { time: thirtyMinsAgo, event: 'Resolver reachability check failed', result: 'Error' },
        ],
      },
      {
        id: 'dns-3',
        name: 'ml.internal.company.com',
        type: 'private-hosted-zone',
        status: 'pending',
        usedFor: 'AI Gateway upstreams',
        lastCheckedAt: fiveMinsAgo,
        resolverDetails: 'Private hosted zone is being associated with the network.',
        events: [
          { time: fiveMinsAgo, event: 'Private hosted zone association requested', result: 'Pending' },
        ],
      },
    ],
    events: [
      { time: sevenDaysAgo, resource: 'aws-rep-ingress-api', event: 'RAM share created', actor: 'Kong', result: 'Success' },
      { time: fiveDaysAgo, resource: 'aws-vpc-peer-prod', event: 'Connection ready', actor: 'Kong', result: 'Success' },
      { time: thirtyMinsAgo, resource: 'Route 53 outbound resolver', event: 'Resolver reachability check failed', actor: 'Kong', result: 'Error' },
      { time: fiveMinsAgo, resource: 'aws-rep-ingress-api', event: 'Waiting for customer to accept RAM share', actor: 'Kong', result: 'Pending' },
    ],
  },
  {
    id: 'net-2',
    name: 'gcp-us-central',
    cloud: 'gcp',
    regions: [
      { region: 'us-central1', cidr: '10.2.0.0/16' },
    ],
    status: 'ready',
    createdAt: fiveDaysAgo,
    lastCheckedAt: tenMinsAgo,
    attachedGatewayCount: 0,
    connectionCount: 0,
    providerNetworkId: 'kong-network-us-central1-abc123',
  },
  {
    id: 'net-3',
    name: 'azure-eastus',
    cloud: 'azure',
    regions: [
      { region: 'eastus', cidr: '10.3.0.0/16' },
    ],
    status: 'initialising',
    createdAt: twoHoursAgo,
    lastCheckedAt: thirtyMinsAgo,
    attachedGatewayCount: 0,
    connectionCount: 0,
  },
  {
    id: 'net-4',
    name: 'aws-apac',
    cloud: 'aws',
    regions: [
      { region: 'ap-southeast-1', cidr: '10.4.0.0/16' },
    ],
    status: 'ready',
    createdAt: threeDaysAgo,
    lastCheckedAt: fiveMinsAgo,
    attachedGatewayCount: 1,
    connectionCount: 1,
    providerNetworkId: 'vpc-0f1e2d3c4b5a69871',
  },
  {
    id: 'net-5',
    name: 'gcp-europe-west',
    cloud: 'gcp',
    regions: [
      { region: 'europe-west1', cidr: '10.5.0.0/16' },
    ],
    status: 'ready',
    createdAt: fiveDaysAgo,
    lastCheckedAt: tenMinsAgo,
    attachedGatewayCount: 1,
    connectionCount: 2,
    providerNetworkId: 'kong-network-europe-west1-def456',
  },
  // Legacy per-region "default" placeholder networks. These are inactive
  // artifacts of an old workaround, not real networks — a region whose only
  // network is a "default" placeholder should read as having no real network
  // yet. Detected by name === 'default' (mirrors production ConfigureCluster).
  {
    id: 'net-default-use2',
    name: 'default',
    cloud: 'aws',
    regions: [
      { region: 'us-east-2', cidr: '10.0.0.0/16' },
    ],
    status: 'ready',
    createdAt: thirtyMinsAgo,
    lastCheckedAt: fiveMinsAgo,
    attachedGatewayCount: 0,
    connectionCount: 0,
  },
  {
    id: 'net-default-usw2',
    name: 'default',
    cloud: 'aws',
    regions: [
      { region: 'us-west-2', cidr: '10.0.0.0/16' },
    ],
    status: 'ready',
    createdAt: sevenDaysAgo,
    lastCheckedAt: fiveMinsAgo,
    attachedGatewayCount: 0,
    connectionCount: 0,
  },
]

const initialConnections: Connection[] = [
  // net-1 connections
  {
    id: 'conn-1',
    networkId: 'net-1',
    name: 'aws-vpc-peer-prod',
    type: 'aws-vpc-peering',
    family: 'peering',
    direction: 'egress',
    status: 'ready',
    cloud: 'aws',
    allowedConsumers: ['123456789012', '234567890123'],
    createdAt: sevenDaysAgo,
    lastCheckedAt: fiveMinsAgo,
    peerAccountId: '123456789012',
    peerVpcId: 'vpc-abcdef1234567890',
    peerRegion: 'us-east-1',
    scope: 'network-level',
    events: [
      { time: sevenDaysAgo, event: 'Connection created', result: 'Success' },
      { time: sevenDaysAgo, event: 'Peering accepted', result: 'Success' },
      { time: fiveMinsAgo, event: 'Status check passed', result: 'Success' },
    ],
  },
  {
    id: 'conn-2',
    networkId: 'net-1',
    name: 'aws-rep-ingress-api',
    type: 'aws-rep-ingress',
    family: 'private-endpoint',
    direction: 'ingress',
    status: 'pending-user-action',
    cloud: 'aws',
    allowedConsumers: ['123456789012'],
    createdAt: sevenDaysAgo,
    lastCheckedAt: fiveMinsAgo,
    kongEndpointId: 'vpce-svc-0a1b2c3d4e5f67890',
    kongServiceName: 'com.amazonaws.vpce.us-east-1.vpce-svc-0a1b2c3d4e5f67890',
    scope: 'service-level',
    setupValues: {
      ramShareArn: 'arn:aws:ram:us-east-1:123456789012:resource-share/rs-0a1b2c3d4e5f67890',
      resourceConfigArn: 'arn:aws:vpc-lattice:us-east-1:123456789012:resourceconfiguration/rcfg-0a1b2c3d4e5f67890',
      allowedAccountId: '123456789012',
      customFqdn: 'ai.internal.example.com',
    },
    events: [
      { time: sevenDaysAgo, event: 'Connection created', result: 'Success' },
      { time: sevenDaysAgo, event: 'RAM share created', result: 'Success' },
      { time: fiveMinsAgo, event: 'Waiting for customer to accept RAM share', result: 'Pending' },
    ],
  },
  {
    id: 'conn-3',
    networkId: 'net-1',
    name: 'aws-tgw-shared',
    type: 'aws-transit-gateway',
    family: 'peering',
    direction: 'egress',
    status: 'ready',
    cloud: 'aws',
    allowedConsumers: ['345678901234'],
    createdAt: sevenDaysAgo,
    lastCheckedAt: fiveMinsAgo,
    scope: 'network-level',
    events: [
      { time: sevenDaysAgo, event: 'Connection created', result: 'Success' },
      { time: sevenDaysAgo, event: 'Transit Gateway attachment accepted', result: 'Success' },
      { time: fiveMinsAgo, event: 'Status check passed', result: 'Success' },
    ],
  },
  {
    id: 'conn-7',
    networkId: 'net-1',
    name: 'internal-upstreams',
    type: 'aws-rep-egress',
    family: 'private-endpoint',
    direction: 'egress',
    status: 'ready',
    cloud: 'aws',
    allowedConsumers: ['123456789012'],
    createdAt: sevenDaysAgo,
    lastCheckedAt: fiveMinsAgo,
    scope: 'service-level',
    events: [
      { time: sevenDaysAgo, event: 'Connection created', result: 'Success' },
      { time: fiveMinsAgo, event: 'Status check passed', result: 'Success' },
    ],
  },
  // net-4 connections
  {
    id: 'conn-4',
    networkId: 'net-4',
    name: 'aws-rep-egress-backend',
    type: 'aws-rep-egress',
    family: 'private-endpoint',
    direction: 'egress',
    status: 'error',
    cloud: 'aws',
    allowedConsumers: [],
    createdAt: threeDaysAgo,
    lastCheckedAt: fiveMinsAgo,
    errorMessage: 'Connection refused: target VPC endpoint not found',
    scope: 'service-level',
    setupValues: {
      resourceConfigArn: 'arn:aws:vpc-lattice:ap-southeast-1:210987654321:resourceconfiguration/rcfg-9f8e7d6c5b4a3210',
      allowedAccountId: '210987654321',
    },
    events: [
      { time: threeDaysAgo, event: 'Connection created', result: 'Success' },
      { time: fiveMinsAgo, event: 'Endpoint reachability check failed', result: 'Error' },
    ],
  },
  // net-5 connections
  {
    id: 'conn-5',
    networkId: 'net-5',
    name: 'gcp-psc-ingress-api',
    type: 'gcp-psc-ingress',
    family: 'private-endpoint',
    direction: 'ingress',
    status: 'pending-user-action',
    cloud: 'gcp',
    allowedConsumers: [],
    createdAt: fiveDaysAgo,
    lastCheckedAt: tenMinsAgo,
    kongEndpointId: 'kong-psc-endpoint-europe-west1-abc',
    kongServiceName: 'projects/kong-prod/regions/europe-west1/serviceAttachments/kong-sa-abc',
  },
  {
    id: 'conn-6',
    networkId: 'net-5',
    name: 'gcp-psc-egress-services',
    type: 'gcp-psc-egress',
    family: 'private-endpoint',
    direction: 'egress',
    status: 'ready',
    cloud: 'gcp',
    allowedConsumers: ['my-gcp-project-prod'],
    createdAt: fiveDaysAgo,
    lastCheckedAt: tenMinsAgo,
  },
]

const initialGateways: Gateway[] = [
  {
    id: 'gw-1',
    name: 'prod-gateway-us-east-1',
    networkId: 'net-1',
    region: 'us-east-1',
  },
  {
    id: 'gw-2',
    name: 'prod-gateway-us-west-2',
    networkId: 'net-1',
    region: 'us-west-2',
  },
  {
    id: 'gw-3',
    name: 'apac-gateway-singapore',
    networkId: 'net-4',
    region: 'ap-southeast-1',
  },
  {
    id: 'gw-4',
    name: 'europe-gateway-belgium',
    networkId: 'net-5',
    region: 'europe-west1',
  },
]

// ── Singleton store ─────────────────────────────────────────────────────────

const networks = ref<Network[]>(initialNetworks)
const connections = ref<Connection[]>(initialConnections)
const gateways = ref<Gateway[]>(initialGateways)

// Configuration captured by the gateway-creation wizard, surfaced on the
// control-plane overview after creation (so captured config isn't thrown away).
export interface GatewayConfig {
  name: string
  dataPlaneType: string
  gatewayVersion: string
  apiAccess: string
  envVars: { scope: string; key: string; value: string }[]
  deployments: { provider: CloudProvider; region: string; networkName: string }[]
}
const gatewayConfig = ref<GatewayConfig | null>(null)

let nextNetworkIdx = 6
let nextConnectionIdx = 7

export function useNetworksStore() {
  const getNetworks = () => networks.value

  const getNetworkById = (id: string) =>
    networks.value.find(n => n.id === id)

  const getConnectionsByNetworkId = (networkId: string) =>
    connections.value.filter(c => c.networkId === networkId)

  const getGatewaysByNetworkId = (networkId: string) =>
    gateways.value.filter(g => g.networkId === networkId)

  // "default"-named networks are inactive per-region placeholders from a legacy
  // workaround — treat them as if no real network exists (mirrors production).
  const isPlaceholderNetwork = (network: Network) => network.name === 'default'

  // Real, selectable networks in a region: exclude the legacy "default"
  // placeholders and terminating networks. A network can span regions, so match
  // any region entry.
  const getSelectableNetworksByRegion = (region: string) =>
    networks.value.filter(n =>
      n.regions.some(r => r.region === region) &&
      !isPlaceholderNetwork(n) &&
      n.status !== 'terminating',
    )

  // All real, selectable networks — the legacy "default" placeholders and
  // terminating networks are never selectable.
  const getSelectableNetworks = () =>
    networks.value.filter(n =>
      !isPlaceholderNetwork(n) &&
      n.status !== 'terminating',
    )

  const getConnectionById = (id: string) =>
    connections.value.find(c => c.id === id)

  const createNetwork = (data: {
    name: string
    cloud: CloudProvider
    regions: { region: string; cidr: string; zones?: string[] }[]
    queuedConnections?: { type: ConnectionType; name: string; allowedConsumers: string[] }[]
  }) => {
    const newId = `net-${nextNetworkIdx++}`
    const newNetwork: Network = {
      id: newId,
      name: data.name,
      cloud: data.cloud,
      regions: data.regions,
      status: 'initialising',
      createdAt: new Date().toISOString(),
      lastCheckedAt: new Date().toISOString(),
      attachedGatewayCount: 0,
      connectionCount: data.queuedConnections?.length ?? 0,
    }
    networks.value.push(newNetwork)

    if (data.queuedConnections) {
      for (const qc of data.queuedConnections) {
        const familyMap: Record<ConnectionType, ConnectionFamily> = {
          'aws-vpc-peering': 'peering',
          'aws-transit-gateway': 'peering',
          'aws-rep-egress': 'private-endpoint',
          'aws-rep-ingress': 'private-endpoint',
          'gcp-vpc-peering': 'peering',
          'gcp-psc-ingress': 'private-endpoint',
          'gcp-psc-egress': 'private-endpoint',
          'azure-vnet-peering': 'peering',
          'azure-virtual-hub': 'peering',
          'azure-private-link-ingress': 'private-endpoint',
          'azure-private-endpoint-egress': 'private-endpoint',
        }
        const directionMap: Record<ConnectionType, ConnectionDirection> = {
          'aws-vpc-peering': 'egress',
          'aws-transit-gateway': 'egress',
          'aws-rep-egress': 'egress',
          'aws-rep-ingress': 'ingress',
          'gcp-vpc-peering': 'egress',
          'gcp-psc-ingress': 'ingress',
          'gcp-psc-egress': 'egress',
          'azure-vnet-peering': 'egress',
          'azure-virtual-hub': 'egress',
          'azure-private-link-ingress': 'ingress',
          'azure-private-endpoint-egress': 'egress',
        }
        connections.value.push({
          id: `conn-${nextConnectionIdx++}`,
          networkId: newId,
          name: qc.name,
          type: qc.type,
          family: familyMap[qc.type],
          direction: directionMap[qc.type],
          status: 'created',
          cloud: data.cloud,
          allowedConsumers: qc.allowedConsumers,
          createdAt: new Date().toISOString(),
          lastCheckedAt: new Date().toISOString(),
        })
      }
    }

    return newNetwork
  }

  const deleteNetwork = (id: string) => {
    networks.value = networks.value.filter(n => n.id !== id)
    connections.value = connections.value.filter(c => c.networkId !== id)
    gateways.value = gateways.value.filter(g => g.networkId !== id)
  }

  const addConnection = (data: {
    networkId: string
    name: string
    type: ConnectionType
    family: ConnectionFamily
    direction: ConnectionDirection
    cloud: CloudProvider
    allowedConsumers: string[]
  }) => {
    const newConn: Connection = {
      id: `conn-${nextConnectionIdx++}`,
      networkId: data.networkId,
      name: data.name,
      type: data.type,
      family: data.family,
      direction: data.direction,
      status: 'initialising',
      cloud: data.cloud,
      allowedConsumers: data.allowedConsumers,
      createdAt: new Date().toISOString(),
      lastCheckedAt: new Date().toISOString(),
    }
    connections.value.push(newConn)
    const network = networks.value.find(n => n.id === data.networkId)
    if (network) {
      network.connectionCount++
    }
    return newConn
  }

  const deleteConnection = (id: string) => {
    const conn = connections.value.find(c => c.id === id)
    if (conn) {
      const network = networks.value.find(n => n.id === conn.networkId)
      if (network && network.connectionCount > 0) {
        network.connectionCount--
      }
    }
    connections.value = connections.value.filter(c => c.id !== id)
  }

  const updateConnectionAllowedConsumers = (id: string, consumers: string[]) => {
    const conn = connections.value.find(c => c.id === id)
    if (conn) {
      conn.allowedConsumers = consumers
    }
  }

  // ── Private DNS ──────────────────────────────────────────────────────────
  let nextDnsIdx = 100
  const addDnsConfig = (networkId: string, data: { name: string; type: import('@/types').DnsType; usedFor: string; resolverDetails?: string }) => {
    const network = networks.value.find(n => n.id === networkId)
    if (!network) return
    if (!network.dnsConfigs) network.dnsConfigs = []
    network.dnsConfigs.push({
      id: `dns-${nextDnsIdx++}`,
      name: data.name,
      type: data.type,
      status: 'pending',
      usedFor: data.usedFor,
      lastCheckedAt: new Date().toISOString(),
      resolverDetails: data.resolverDetails,
      events: [{ time: new Date().toISOString(), event: 'DNS configuration created', result: 'Pending' }],
    })
  }
  const getDnsConfig = (networkId: string, id: string) =>
    networks.value.find(n => n.id === networkId)?.dnsConfigs?.find(d => d.id === id)
  const updateDnsConfig = (networkId: string, id: string, patch: Partial<import('@/types').DnsConfig>) => {
    const cfg = getDnsConfig(networkId, id)
    if (cfg) Object.assign(cfg, patch)
  }
  const deleteDnsConfig = (networkId: string, id: string) => {
    const network = networks.value.find(n => n.id === networkId)
    if (network?.dnsConfigs) network.dnsConfigs = network.dnsConfigs.filter(d => d.id !== id)
  }

  const setGatewayConfig = (cfg: GatewayConfig) => { gatewayConfig.value = cfg }
  const getGatewayConfig = () => gatewayConfig.value

  return {
    setGatewayConfig,
    getGatewayConfig,
    getNetworks,
    getNetworkById,
    getConnectionsByNetworkId,
    getGatewaysByNetworkId,
    getConnectionById,
    isPlaceholderNetwork,
    getSelectableNetworksByRegion,
    getSelectableNetworks,
    createNetwork,
    deleteNetwork,
    addConnection,
    deleteConnection,
    updateConnectionAllowedConsumers,
    addDnsConfig,
    getDnsConfig,
    updateDnsConfig,
    deleteDnsConfig,
  }
}
