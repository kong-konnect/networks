// Shared provider + region display helpers so icons and formatting are consistent
// across the whole prototype (list, detail, create flow).
import type { Component } from 'vue'
import {
  AwsIcon,
  GoogleCloudIcon,
  AzureIcon,
  CloudIcon,
  FlagUsIcon,
  FlagIeIcon,
  FlagSgIcon,
  FlagBeIcon,
  FlagNlIcon,
  LocationIcon,
} from '@kong/icons'
import type { CloudProvider } from '@/types'

const REGION_NAMES: Record<string, string> = {
  'us-east-1': 'US East (N. Virginia)',
  'us-east-2': 'US East (Ohio)',
  'us-west-1': 'US West (N. California)',
  'us-west-2': 'US West (Oregon)',
  'eu-west-1': 'Europe (Ireland)',
  'ap-southeast-1': 'Asia Pacific (Singapore)',
  'us-central1': 'US Central (Iowa)',
  'us-east1': 'US East (S. Carolina)',
  'us-west1': 'US West (Oregon)',
  'europe-west1': 'Europe (Belgium)',
  'asia-southeast1': 'Asia (Singapore)',
  eastus: 'East US',
  eastus2: 'East US 2',
  westus: 'West US',
  westeurope: 'West Europe',
  southeastasia: 'Southeast Asia',
}

const REGION_FLAGS: Record<string, Component> = {
  'us-east-1': FlagUsIcon,
  'us-east-2': FlagUsIcon,
  'us-west-1': FlagUsIcon,
  'us-west-2': FlagUsIcon,
  'us-central1': FlagUsIcon,
  'us-east1': FlagUsIcon,
  'us-west1': FlagUsIcon,
  eastus: FlagUsIcon,
  eastus2: FlagUsIcon,
  westus: FlagUsIcon,
  'eu-west-1': FlagIeIcon,
  'ap-southeast-1': FlagSgIcon,
  'asia-southeast1': FlagSgIcon,
  'europe-west1': FlagBeIcon,
  westeurope: FlagNlIcon,
}

const PROVIDER_ICONS: Record<string, Component> = {
  aws: AwsIcon,
  gcp: GoogleCloudIcon,
  azure: AzureIcon,
}

const PROVIDER_LABELS: Record<string, string> = { aws: 'AWS', gcp: 'GCP', azure: 'Azure' }

export const regionName = (code: string): string => REGION_NAMES[code] ?? code
export const regionFlag = (code: string): Component => REGION_FLAGS[code] ?? LocationIcon
// Reference format: "US East (Ohio) (us-east-2)" — full name followed by the code.
export const regionLabel = (code: string): string => (code ? `${regionName(code)} (${code})` : '')
export const providerIcon = (p: string): Component => PROVIDER_ICONS[p] ?? CloudIcon
export const providerLabel = (p: string): string => PROVIDER_LABELS[p] ?? p.toUpperCase()
export type { CloudProvider }
