# CredExium Votes

A Next.js application for extending MAV votes on Base.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmrpapawheelie%2Fvotes)

## Setup

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory with the following variables:
```env
# WalletConnect Project ID - Get yours at https://cloud.walletconnect.com/
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Base RPC URL - Replace with your own if needed
NEXT_PUBLIC_BASE_RPC_URL=your_base_rpc_url_here
```

4. Get your WalletConnect Project ID:
   - Go to https://cloud.walletconnect.com/
   - Sign up/Login
   - Create a new project
   - Copy the Project ID
   - Add your domain to the project settings

5. Run the development server:
```bash
npm run dev
```

## Environment Variables

- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`: Your WalletConnect Project ID
- `NEXT_PUBLIC_BASE_RPC_URL`: Your Base RPC URL (get one at [portal.coinbase.com](https://portal.coinbase.com))

## Features

- Connect with Coinbase Wallet and WalletConnect
- View MAV balance and staking information
- Extend votes to 4 years
- Merge and extend all lockups
- Dark mode support

## Tech Stack

- Next.js 14
- TypeScript
- TailwindCSS
- ShadCN UI
- Wagmi & Viem
- WalletConnect v2

## Contract Details

- MAV Token Address: `0x64b88c73A5DfA78D1713fE1b4c69a22d7E0faAa7`
- Voting Contract Address: `0x05b1b801191B41a21B9C0bFd4c4ef8952eb28cd9`
- Network: Base
- RPC URL: `https://api.developer.coinbase.com/rpc/v1/base/otTSFZZLGKBf5LKfGh7ufrvCzHtM6PH2`

## Deployment

The application can be deployed to Vercel:

1. Push your code to GitHub
2. Import the project in Vercel:
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Select the repository

3. Configure environment variables in Vercel:
   - In your project settings, go to the "Environment Variables" tab
   - Add the following variables:
     ```
     NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
     NEXT_PUBLIC_BASE_RPC_URL=your_base_rpc_url_here
     ```
   - Click "Save"

4. Configure WalletConnect:
   - Go to https://cloud.walletconnect.com/
   - Select your project
   - Add your Vercel deployment URL to the "Redirect URLs"
   - Add your Vercel deployment URL to the "App URLs"
   - Save changes

5. Deploy:
   - Click "Deploy" in Vercel
   - Wait for the deployment to complete
   - Your app will be available at your Vercel URL

## License

MIT
