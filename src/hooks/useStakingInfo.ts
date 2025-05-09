import { useReadContract } from 'wagmi'
import { VOTING_CONTRACT_ADDRESS, VOTING_CONTRACT_ABI } from '@/lib/contracts'
import { useState, useEffect } from 'react'

export interface LockupSlot {
  amount: bigint
  end: bigint
  votes: bigint
}

export function useStakingInfo(address: `0x${string}` | undefined) {
  const [lockups, setLockups] = useState<LockupSlot[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [totalVotes, setTotalVotes] = useState<bigint>(0n)
  const [totalStaked, setTotalStaked] = useState<bigint>(0n)
  const [latestExpiration, setLatestExpiration] = useState<bigint>(0n)

  const { data: currentLockup, isLoading: isCurrentLoading } = useReadContract({
    address: VOTING_CONTRACT_ADDRESS,
    abi: VOTING_CONTRACT_ABI,
    functionName: 'getLockup',
    args: [address ?? '0x0000000000000000000000000000000000000000', BigInt(currentIndex)],
    query: {
      enabled: !!address && hasMore,
      refetchInterval: 2000
    }
  })

  useEffect(() => {
    if (currentLockup) {
      const slot = currentLockup as LockupSlot
      if (slot.amount > 0n) {
        setLockups(prev => [...prev, slot])
        setTotalVotes(prev => prev + slot.votes)
        setTotalStaked(prev => prev + slot.amount)
        setLatestExpiration(prev => slot.end > prev ? slot.end : prev)
        setCurrentIndex(prev => prev + 1)
      } else {
        setHasMore(false)
      }
    }
  }, [currentLockup])

  useEffect(() => {
    setLockups([])
    setCurrentIndex(0)
    setHasMore(true)
    setTotalVotes(0n)
    setTotalStaked(0n)
    setLatestExpiration(0n)
  }, [address])

  return {
    lockups,
    totalVotes,
    totalStaked,
    latestExpiration,
    isLoading: isCurrentLoading,
    hasMore,
    activeIndices: lockups
      .map((lockup, index) => ({ lockup, index }))
      .filter(({ lockup, index }) => lockup.amount > 0n && index > 0)
      .map(({ index }) => BigInt(index))
  }
} 