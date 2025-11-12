export const gachaGameAbi = [
  {
    type: 'function',
    name: 'buyTicket',
    stateMutability: 'payable',
    inputs: [
      { name: '_merkleRoot', type: 'bytes32', internalType: 'bytes32' },
      { name: '_sessionId', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'claimPrize',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_sessionId', type: 'uint256', internalType: 'uint256' },
      { name: '_merkleProof', type: 'bytes32[]', internalType: 'bytes32[]' },
      { name: '_prizeId', type: 'bytes32', internalType: 'bytes32' },
      { name: '_prizeTier', type: 'uint256', internalType: 'uint256' },
      { name: '_cellId', type: 'uint8', internalType: 'uint8' },
      { name: '_salt', type: 'bytes32', internalType: 'bytes32' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'ticketPrice',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
  },
] as const
