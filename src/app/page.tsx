'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { MAV_TOKEN_ADDRESS, VOTING_CONTRACT_ADDRESS, MAV_TOKEN_ABI, VOTING_CONTRACT_ABI, LOCKUP_ID, DURATION } from '@/lib/contracts'
import { useAccount, useWriteContract, useReadContract, useConnect, useDisconnect } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { toast } from 'sonner'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useStakingInfo } from '@/hooks/useStakingInfo'

const formSchema = z.object({
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'Please enter a valid amount'
  })
})

// Helper function to format numbers to 4 decimal places with commas
const formatNumber = (value: bigint | undefined) => {
  if (!value) return '0.0000'
  return Number(formatEther(value)).toLocaleString('en-US', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4
  })
}

// Helper function to format whole numbers with commas
const formatWholeNumber = (value: bigint | undefined) => {
  if (!value) return '0'
  return Number(formatEther(value)).toLocaleString('en-US', {
    maximumFractionDigits: 0
  })
}

// Helper function to format date
const formatDate = (timestamp: bigint) => {
  return new Date(Number(timestamp) * 1000).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export default function Home() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const [mounted, setMounted] = useState(false)
  const [delegateAddress, setDelegateAddress] = useState<`0x${string}` | null>(null)
  
  const { 
    lockups,
    totalVotes,
    totalStaked,
    latestExpiration,
    isLoading: isStakingLoading,
    activeIndices
  } = useStakingInfo(address)

  useEffect(() => {
    setMounted(true)
  }, [])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: ''
    }
  })

  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: MAV_TOKEN_ADDRESS,
    abi: MAV_TOKEN_ABI,
    functionName: 'balanceOf',
    args: [address ?? '0x0000000000000000000000000000000000000000'],
    query: {
      enabled: !!address,
      refetchInterval: 2000
    }
  })

  const { data: allowance } = useReadContract({
    address: MAV_TOKEN_ADDRESS,
    abi: MAV_TOKEN_ABI,
    functionName: 'allowance',
    args: [address ?? '0x0000000000000000000000000000000000000000', VOTING_CONTRACT_ADDRESS],
    query: {
      enabled: !!address,
      refetchInterval: 2000
    }
  })

  // Read delegation
  const { data: delegate } = useReadContract({
    address: VOTING_CONTRACT_ADDRESS,
    abi: VOTING_CONTRACT_ABI,
    functionName: 'delegates',
    args: [address ?? '0x0000000000000000000000000000000000000000'],
    query: {
      enabled: !!address
    }
  })

  useEffect(() => {
    if (delegate) {
      setDelegateAddress(delegate as `0x${string}`)
    }
  }, [delegate])

  const { writeContract: approve } = useWriteContract({
    mutation: {
      onSuccess: () => {
        toast.success('Approval successful')
      },
      onError: () => {
        toast.error('Approval failed')
      }
    }
  })

  const { writeContract: extendVotes } = useWriteContract({
    mutation: {
      onSuccess: () => {
        toast.success('Votes increased successfully')
        // Force immediate refetch of all data
        refetchBalance()
        form.reset()
      },
      onError: () => {
        toast.error('Failed to increase votes')
      }
    }
  })

  const { writeContract: merge } = useWriteContract({
    mutation: {
      onSuccess: () => {
        toast.success('Lockups merged successfully')
      },
      onError: () => {
        toast.error('Failed to merge lockups')
      }
    }
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!address) return

    const amount = parseEther(values.amount)

    // Check if we need approval
    if (!allowance || allowance < amount) {
      // Request approval with max amount to avoid future approvals
      approve({
        address: MAV_TOKEN_ADDRESS,
        abi: MAV_TOKEN_ABI,
        functionName: 'approve',
        args: [VOTING_CONTRACT_ADDRESS, 2n ** 256n - 1n] // Max uint256
      }, {
        onSuccess: () => {
          // After approval, immediately extend votes
          extendVotes({
            address: VOTING_CONTRACT_ADDRESS,
            abi: VOTING_CONTRACT_ABI,
            functionName: 'extendForSender',
            args: [LOCKUP_ID, DURATION, amount]
          })
        }
      })
    } else {
      // If already approved, just extend votes
      extendVotes({
        address: VOTING_CONTRACT_ADDRESS,
        abi: VOTING_CONTRACT_ABI,
        functionName: 'extendForSender',
        args: [LOCKUP_ID, DURATION, amount]
      })
    }
  }

  const handleMaxClick = () => {
    if (balance) {
      form.setValue('amount', formatEther(balance))
    }
  }

  const handleMergeAndExtend = () => {
    if (!address) return

    if (activeIndices.length === 0) {
      toast.error('No additional lockups to merge')
      return
    }

    // First merge all lockups into index 0
    merge({
      address: VOTING_CONTRACT_ADDRESS,
      abi: VOTING_CONTRACT_ABI,
      functionName: 'merge',
      args: [activeIndices]
    }, {
      onSuccess: () => {
        // After merge, extend with 0 amount to 4 years
        extendVotes({
          address: VOTING_CONTRACT_ADDRESS,
          abi: VOTING_CONTRACT_ABI,
          functionName: 'extendForSender',
          args: [LOCKUP_ID, DURATION, 0n]
        })
      }
    })
  }

  if (!mounted) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-background">
        <Card className="w-[400px] bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Increase Votes</CardTitle>
            <CardDescription className="text-muted-foreground">
              Add MAV to your votes and extend them to 4 years
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground text-center">
              Loading...
            </div>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-background relative">
      <Card className="w-[400px] bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Increase Votes</CardTitle>
          <CardDescription className="text-muted-foreground">
            Add MAV to your votes and extend them to 4 years
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isConnected ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Connect your wallet to continue
              </p>
              <div className="grid gap-2">
                {connectors.map((connector) => (
                  <Button
                    key={connector.uid}
                    onClick={() => connect({ connector })}
                    className="w-full h-12 flex items-center justify-center gap-2"
                    variant="outline"
                  >
                    {connector.name === 'Coinbase Wallet' && (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 24C18.6274 24 24 18.6274 24 12C24 5.37258 18.6274 0 12 0C5.37258 0 0 5.37258 0 12C0 18.6274 5.37258 24 12 24Z" fill="#0052FF"/>
                        <path d="M12.0002 6.75C8.82843 6.75 6.25024 9.32819 6.25024 12.5C6.25024 15.6718 8.82843 18.25 12.0002 18.25C15.172 18.25 17.7502 15.6718 17.7502 12.5C17.7502 9.32819 15.172 6.75 12.0002 6.75ZM12.0002 16.5C9.93286 16.5 8.25024 14.8174 8.25024 12.75C8.25024 10.6826 9.93286 9 12.0002 9C14.0676 9 15.7502 10.6826 15.7502 12.75C15.7502 14.8174 14.0676 16.5 12.0002 16.5Z" fill="white"/>
                      </svg>
                    )}
                    {connector.name === 'WalletConnect' && (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="#3B99FC"/>
                        <path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18C15.31 18 18 15.31 18 12C18 8.69 15.31 6 12 6ZM12 16C9.79 16 8 14.21 8 12C8 9.79 9.79 8 12 8C14.21 8 16 9.79 16 12C16 14.21 14.21 16 12 16Z" fill="#3B99FC"/>
                      </svg>
                    )}
                    {connector.name}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => disconnect()}
                >
                  Disconnect
                </Button>
              </div>
              {totalStaked > 0n && (
                <div className="space-y-3 pt-2 border-t border-border">
                  <div className="text-sm font-medium text-foreground">Current Staking</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-muted-foreground">Total Staked:</div>
                    <div className="text-right font-mono">{formatWholeNumber(totalStaked)} MAV</div>
                    <div className="text-muted-foreground">Voting Power:</div>
                    <div className="text-right font-mono">{formatWholeNumber(totalVotes)} votes</div>
                    <div className="text-muted-foreground">Current Expiration:</div>
                    <div className="text-right font-mono">{formatDate(latestExpiration)}</div>
                  </div>
                  {lockups.length > 1 && (
                    <div className="text-sm text-muted-foreground">
                      Found {lockups.length} lockup{lockups.length > 1 ? 's' : ''}
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground pt-2">
                    Adding more MAV will extend all votes to 4 years from now
                  </div>
                  {lockups.length > 1 && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleMergeAndExtend}
                    >
                      Merge & Extend All to 4 Years
                    </Button>
                  )}
                  {isStakingLoading && (
                    <div className="text-sm text-muted-foreground text-center">
                      Loading lockups...
                    </div>
                  )}
                </div>
              )}
              {!totalStaked && (
                <div className="text-sm text-muted-foreground text-center p-4 border rounded-lg bg-muted/50">
                  You need to first establish staking on{' '}
                  <a 
                    href="https://goose.run/votes" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    goose.run/votes
                  </a>
                  {' '}using ETH on Base.
                </div>
              )}
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4 border-t border-border">
                  <div className="space-y-4">
                    {balance !== undefined && (
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="text-muted-foreground">Available Balance:</div>
                        <div className="text-right font-mono">{formatNumber(balance)} MAV</div>
                      </div>
                    )}
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground">Amount to Add (MAV)</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input 
                                placeholder="Enter amount" 
                                {...field} 
                                className="font-mono"
                              />
                            </FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleMaxClick}
                            >
                              MAX
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full"
                  >
                    Increase Votes
                  </Button>
                </form>
              </Form>
              {delegateAddress && delegateAddress !== '0x0000000000000000000000000000000000000000' && (
                <div className="grid grid-cols-2 gap-2 text-sm pt-4 border-t border-border">
                  <div className="text-muted-foreground">Delegated To:</div>
                  <div className="text-right">
                    <a 
                      href={`https://basescan.org/address/${delegateAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-primary hover:underline"
                    >
                      {delegateAddress.slice(0, 6)}...{delegateAddress.slice(-4)}
                    </a>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
      <div className="fixed bottom-8 left-8">
        <a 
          href="https://x.com/credexium" 
          target="_blank" 
          rel="noopener noreferrer"
          className="hover:opacity-80 transition-opacity"
        >
          <Image
            src="/logo.png"
            alt="CredExium"
            width={32}
            height={32}
            className="dark:invert"
          />
        </a>
      </div>
    </main>
  )
}
