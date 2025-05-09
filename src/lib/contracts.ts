import { Address } from 'viem'

export const MAV_TOKEN_ADDRESS = '0x64b88c73A5DfA78D1713fE1b4c69a22d7E0faAa7' as Address
export const VOTING_CONTRACT_ADDRESS = '0x05b1b801191B41a21B9C0bFd4c4ef8952eb28cd9' as Address

export const MAV_TOKEN_ABI = [
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const

export const VOTING_CONTRACT_ABI = [
  {
    inputs: [
      { name: 'lockupId', type: 'uint256' },
      { name: 'duration', type: 'uint256' },
      { name: 'amount', type: 'uint128' }
    ],
    name: 'extendForSender',
    outputs: [
      {
        components: [
          { name: 'amount', type: 'uint128' },
          { name: 'end', type: 'uint128' },
          { name: 'votes', type: 'uint256' }
        ],
        name: 'newLockup',
        type: 'tuple'
      }
    ],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'staker', type: 'address' },
      { name: 'index', type: 'uint256' }
    ],
    name: 'getLockup',
    outputs: [
      {
        components: [
          { name: 'amount', type: 'uint128' },
          { name: 'end', type: 'uint128' },
          { name: 'votes', type: 'uint256' }
        ],
        name: 'lockup',
        type: 'tuple'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'delegates',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getUserLockups',
    outputs: [
      {
        components: [
          { name: 'amount', type: 'uint128' },
          { name: 'end', type: 'uint128' },
          { name: 'votes', type: 'uint256' }
        ],
        name: '',
        type: 'tuple[]'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'delegator', type: 'address' }],
    name: 'getDelegations',
    outputs: [
      {
        components: [
          { name: 'delegatee', type: 'address' },
          { name: 'votes', type: 'uint256' }
        ],
        name: '',
        type: 'tuple[]'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'delegatee', type: 'address' }],
    name: 'getDelegatedVotes',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint256[]',
        name: 'lockupIds',
        type: 'uint256[]'
      }
    ],
    name: 'merge',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
] as const

// Constants for the contract interaction
export const LOCKUP_ID = 0n // Immutable lockupId
export const DURATION = 126144000n // 4 years in seconds (4 * 365 * 24 * 60 * 60) 