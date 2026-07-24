export type CloudProvider = 'aws' | 'gcp' | 'azure'
export type NetworkStatus = 'initialising' | 'ready' | 'error' | 'terminating'
export type ConnectionStatus = 'created' | 'initialising' | 'pending-acceptance' | 'pending-user-action' | 'ready' | 'terminating' | 'error'
export type ConnectionType =
  // AWS
  | 'aws-vpc-peering'
  | 'aws-transit-gateway'
  | 'aws-rep-egress'
  | 'aws-rep-ingress'
  // GCP
  | 'gcp-vpc-peering'
  | 'gcp-psc-ingress'
  | 'gcp-psc-egress'
  // Azure
  | 'azure-vnet-peering'
  | 'azure-virtual-hub'
  | 'azure-private-link-ingress'
  | 'azure-private-endpoint-egress'

export type ConnectionFamily = 'peering' | 'private-endpoint'
export type ConnectionDirection = 'ingress' | 'egress'

export interface NetworkRegion {
  region: string
  cidr: string
  zones?: string[]
}

export interface NetworkEvent {
  time: string
  resource: string
  event: string
  actor: string
  result: string
}

export type DnsType = 'private-hosted-zone' | 'outbound-resolver'
export type DnsStatus = 'ready' | 'error' | 'pending'

export interface DnsConfig {
  id: string
  name: string // domain / zone
  type: DnsType
  status: DnsStatus
  usedFor: string
  lastCheckedAt?: string
  resolverDetails?: string
  relatedConnectionId?: string
  events?: { time: string; event: string; result: 'Success' | 'Pending' | 'Error' }[]
}

export interface Network {
  id: string
  name: string
  cloud: CloudProvider
  regions: NetworkRegion[]
  status: NetworkStatus
  createdAt: string
  lastCheckedAt: string
  attachedGatewayCount: number
  connectionCount: number
  providerNetworkId?: string
  // Kong's own cloud-provider account ID, surfaced so the customer can reference it
  // when they share resources with Kong (e.g., an AWS RAM share).
  providerAccountId?: string
  events?: NetworkEvent[]
  dnsConfigs?: DnsConfig[]
}

export type ConnectionScope = 'service-level' | 'network-level'

export interface ConnectionSetupValues {
  ramShareArn?: string
  resourceConfigArn?: string
  allowedAccountId?: string
  customFqdn?: string
  pscServiceAttachmentUri?: string
  plsAlias?: string
}

export interface ConnectionEvent {
  time: string
  event: string
  result: 'Success' | 'Pending' | 'Error'
}

export interface Connection {
  id: string
  networkId: string
  name: string
  type: ConnectionType
  family: ConnectionFamily
  direction: ConnectionDirection
  status: ConnectionStatus
  cloud: CloudProvider
  allowedConsumers: string[]
  createdAt: string
  lastCheckedAt: string
  kongEndpointId?: string
  kongServiceName?: string
  errorMessage?: string
  peerAccountId?: string
  peerVpcId?: string
  peerRegion?: string
  scope?: ConnectionScope
  setupValues?: ConnectionSetupValues
  events?: ConnectionEvent[]
}

export interface Gateway {
  id: string
  name: string
  networkId: string
  region: string
}
