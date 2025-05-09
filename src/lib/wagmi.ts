import { http } from 'viem'
import { createConfig } from 'wagmi'
import { base } from 'wagmi/chains'
import { coinbaseWallet, walletConnect } from 'wagmi/connectors'

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
if (!projectId) throw new Error('Missing NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID')

const baseRpcUrl = process.env.NEXT_PUBLIC_BASE_RPC_URL
if (!baseRpcUrl) throw new Error('Missing NEXT_PUBLIC_BASE_RPC_URL')

export const config = createConfig({
  chains: [base],
  connectors: [
    coinbaseWallet({
      appName: 'CredExium Votes',
      appLogoUrl: '/logo.png',
    }),
    walletConnect({
      projectId,
      metadata: {
        name: 'CredExium Votes',
        description: 'Extend your MAV votes',
        url: 'https://votes.credexium.com',
        icons: ['/logo.png']
      },
      showQrModal: true,
      qrModalOptions: {
        themeMode: 'dark',
        themeVariables: {
          '--wcm-font-family': 'Inter, system-ui, sans-serif',
          '--wcm-accent-color': '#0052FF',
          '--wcm-background-color': '#000000',
          '--wcm-background-border-radius': '12px',
        }
      }
    })
  ],
  transports: {
    [base.id]: http(baseRpcUrl)
  }
}) 