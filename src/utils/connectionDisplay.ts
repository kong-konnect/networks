import type { Connection, ConnectionType, ConnectionStatus, ConnectionDirection } from '@/types'

// Human-readable connection type labels.
export const connectionTypeLabels: Record<ConnectionType, string> = {
  'aws-vpc-peering': 'VPC peering',
  'aws-transit-gateway': 'Transit Gateway',
  'aws-rep-egress': 'Resource endpoint egress',
  'aws-rep-ingress': 'Resource endpoint ingress',
  'gcp-vpc-peering': 'VPC peering',
  'gcp-psc-ingress': 'GCP PSC ingress',
  'gcp-psc-egress': 'GCP PSC egress',
  'azure-vnet-peering': 'VNet peering',
  'azure-virtual-hub': 'Virtual hub',
  'azure-private-link-ingress': 'Private Link ingress',
  'azure-private-endpoint-egress': 'Private endpoint egress',
}

export const connectionTypeLabel = (type: ConnectionType): string =>
  connectionTypeLabels[type] || type

const peeringTypes: ConnectionType[] = [
  'aws-vpc-peering',
  'aws-transit-gateway',
  'gcp-vpc-peering',
  'azure-vnet-peering',
  'azure-virtual-hub',
]

// Direction label mapping.
export const directionLabel = (conn: Pick<Connection, 'type' | 'direction'>): string => {
  if (peeringTypes.includes(conn.type)) return 'Bidirectional'
  if (conn.direction === 'ingress') return 'Customer → Kong'
  return 'Kong → upstream'
}

// Scope label mapping.
export const scopeLabel = (conn: Pick<Connection, 'type' | 'scope'>): string => {
  if (conn.scope === 'network-level') return 'Network-level'
  if (conn.scope === 'service-level') return 'Service-level'
  // Derive from type if scope not set.
  return peeringTypes.includes(conn.type) ? 'Network-level' : 'Service-level'
}

// Status label + KBadge appearance.
export const statusLabel = (status: ConnectionStatus): string => {
  switch (status) {
    case 'created':
    case 'initialising':
      return 'Creating'
    case 'pending-acceptance':
    case 'pending-user-action':
      return 'Pending customer action'
    case 'ready':
      return 'Ready'
    case 'terminating':
      return 'Deleting'
    case 'error':
      return 'Error'
    default:
      return status
  }
}

export const statusBadgeAppearance = (status: ConnectionStatus): string => {
  switch (status) {
    case 'ready':
      return 'success'
    case 'error':
      return 'danger'
    case 'pending-acceptance':
    case 'pending-user-action':
      return 'warning'
    default:
      return 'neutral'
  }
}

// Next action copy for non-ready connections.
export const nextActionText = (conn: Connection): string => {
  if (conn.status === 'ready') return 'No action needed'
  if (conn.status === 'error') return conn.errorMessage || 'Check the connection configuration'
  if (conn.status === 'pending-user-action' || conn.status === 'pending-acceptance') {
    if (conn.type === 'aws-rep-ingress') return 'Accept RAM share in AWS'
    if (conn.direction === 'ingress') return 'Complete the customer-side setup'
    return 'Complete the customer-side setup'
  }
  return 'Kong is setting this up'
}

// Owner label for non-ready / ingress connections.
export const ownerLabel = (conn: Connection): string => {
  if (conn.status === 'pending-user-action' || conn.status === 'pending-acceptance' || conn.direction === 'ingress') {
    return 'Customer cloud admin'
  }
  return 'Kong'
}

// "3 min ago" style relative time.
export const timeAgo = (isoDate: string): string => {
  const diffMs = Date.now() - new Date(isoDate).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export const directionOf = (type: ConnectionType): ConnectionDirection => {
  if (peeringTypes.includes(type)) return 'egress'
  return type.includes('ingress') ? 'ingress' : 'egress'
}
