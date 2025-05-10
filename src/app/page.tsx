'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { MAV_TOKEN_ADDRESS, VOTING_CONTRACT_ADDRESS, MAV_TOKEN_ABI, VOTING_CONTRACT_ABI, LOCKUP_ID, DURATION } from '@/lib/contracts'
import { useAccount, useWriteContract, useReadContract, useConnect, useDisconnect, useSwitchChain } from 'wagmi'
import { base } from 'wagmi/chains'
import { parseEther, formatEther } from 'viem'
import { toast } from 'sonner'
import { useEffect, useState } from 'react'
import Image from 'next/image'

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

export default function Home() {
  const { address, isConnected, chain } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const { switchChain } = useSwitchChain()
  const [mounted, setMounted] = useState(false)
  const [delegateAddress, setDelegateAddress] = useState<`0x${string}` | null>(null)
  const [isApproving, setIsApproving] = useState(false)

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
        setIsApproving(false)
      },
      onError: () => {
        toast.error('Approval failed')
        setIsApproving(false)
      }
    }
  })

  const { writeContract: extendVotes } = useWriteContract({
    mutation: {
      onSuccess: () => {
        toast.success(
          <div>
            Votes increased successfully! 🎉 View your voting power on{' '}
            <a 
              href="https://www.goose.run/vote?chain=8453" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              Goose Run
            </a>
          </div>
        )
        refetchBalance()
        form.reset()
      },
      onError: () => {
        toast.error('Failed to increase votes')
      }
    }
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!address) return

    // Check if we're on Base
    if (chain?.id !== base.id) {
      try {
        await switchChain({ chainId: base.id })
      } catch {
        toast.error('Please switch to Base network')
        return
      }
    }

    const amount = parseEther(values.amount)

    // Check if we need approval
    if (!allowance || allowance < amount) {
      if (isApproving) return // Prevent multiple approvals
      setIsApproving(true)
      
      // Request approval with max amount to avoid future approvals
      approve({
        address: MAV_TOKEN_ADDRESS,
        abi: MAV_TOKEN_ABI,
        functionName: 'approve',
        args: [VOTING_CONTRACT_ADDRESS, 2n ** 256n - 1n] // Max uint256
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
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-24 bg-background relative">
      <Card className="w-full max-w-[400px] bg-card border-border">
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
              <div className="text-sm text-muted-foreground text-center p-4 border rounded-lg bg-muted/50">
                Check your voting power on{' '}
                <a 
                  href="https://www.goose.run/vote?chain=8453" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium"
                >
                  Goose Run
                </a>
              </div>
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
                    {(!allowance || allowance < parseEther(form.getValues().amount || '0')) ? 'Approve' : 'Increase Votes'}
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
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2">
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
          />
        </a>
      </div>
    </main>
  )
}
