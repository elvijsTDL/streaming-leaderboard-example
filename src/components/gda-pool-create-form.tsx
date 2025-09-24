import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Button } from './ui/button';
import { TOKEN_ADDRESS } from '../lib/superfluid';

interface GDAPoolCreateFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export function GDAPoolCreateForm({ onClose, onSuccess }: GDAPoolCreateFormProps) {
  const { address } = useAccount();
  const [isCreating, setIsCreating] = useState(false);
  const [poolConfig, setPoolConfig] = useState({
    transferabilityForUnitsOwner: false,
    distributionFromAnyAddress: true,
  });
  
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Handle transaction success
  if (isSuccess && isCreating) {
    setIsCreating(false);
    onSuccess?.();
    onClose();
  }

  const handleCreatePool = async () => {
    if (!address) return;
    
    setIsCreating(true);
    
    try {
      // GDA contract address for Base mainnet
      const GDA_ADDRESS = '0xfE6c87BE05feDB2059d2EC41bA0A09826C9FD7aa';
      
      // Call the createPool function on the GDA contract
      writeContract({
        address: GDA_ADDRESS as `0x${string}`,
        abi: [
          {
            type: 'function',
            name: 'createPool',
            inputs: [
              { name: 'token', type: 'address' },
              { name: 'admin', type: 'address' },
              { 
                name: 'config',
                type: 'tuple',
                components: [
                  { name: 'transferabilityForUnitsOwner', type: 'bool' },
                  { name: 'distributionFromAnyAddress', type: 'bool' }
                ]
              }
            ],
            outputs: [{ name: 'pool', type: 'address' }],
            stateMutability: 'nonpayable'
          }
        ],
        functionName: 'createPool',
        args: [
          TOKEN_ADDRESS as `0x${string}`,
          address as `0x${string}`,
          {
            transferabilityForUnitsOwner: poolConfig.transferabilityForUnitsOwner,
            distributionFromAnyAddress: poolConfig.distributionFromAnyAddress
          }
        ],
      });
      
    } catch (error) {
      console.error('Error creating pool:', error);
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="theme-card-bg theme-border rounded-xl p-6 w-full max-w-lg" style={{borderWidth: '1px'}}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold theme-text-primary">Create GDA Pool</h2>
          <button
            onClick={onClose}
            className="theme-text-secondary hover:theme-text-primary text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium theme-text-primary mb-2">
              Token
            </label>
            <div className="px-3 py-2 theme-card-bg theme-border rounded-lg font-mono text-sm theme-text-secondary">
              {TOKEN_ADDRESS}
            </div>
            <p className="text-xs theme-text-secondary mt-1">
              Pool will be created for the current token
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium theme-text-primary mb-2">
              Admin Address
            </label>
            <div className="px-3 py-2 theme-card-bg theme-border rounded-lg font-mono text-sm theme-text-secondary">
              {address || 'Not connected'}
            </div>
            <p className="text-xs theme-text-secondary mt-1">
              You will be the admin of this pool
            </p>
          </div>

          <div className="theme-card-bg theme-border rounded-lg p-4" style={{borderWidth: '1px'}}>
            <h3 className="font-semibold theme-text-primary mb-3">Pool Configuration</h3>
            <div className="space-y-4">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={poolConfig.transferabilityForUnitsOwner}
                  onChange={(e) => setPoolConfig(prev => ({ ...prev, transferabilityForUnitsOwner: e.target.checked }))}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div>
                  <div className="text-sm theme-text-primary font-medium">Transferable Units</div>
                  <div className="text-xs theme-text-secondary">Allow members to transfer their units to others</div>
                </div>
              </label>
              
              <div className="border-t theme-border pt-4" style={{borderWidth: '1px'}}>
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={poolConfig.distributionFromAnyAddress}
                    onChange={(e) => setPoolConfig(prev => ({ ...prev, distributionFromAnyAddress: e.target.checked }))}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div>
                    <div className="text-sm theme-text-primary font-medium">Open Distribution</div>
                    <div className="text-xs theme-text-secondary">Allow anyone to distribute to this pool (recommended)</div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="theme-card-bg theme-border rounded-lg p-4" style={{borderWidth: '1px'}}>
            <h3 className="font-semibold theme-text-primary mb-2">Pool Admin Permissions</h3>
            <div className="text-sm theme-text-secondary space-y-1">
              <p>• Add/remove members and set their units</p>
              <p>• Update member units at any time</p>
              <p>• Distribute tokens to pool members</p>
              <p>• Transfer admin rights to another address</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            onClick={onClose}
            className="flex-1 bg-transparent theme-text-primary theme-border hover:theme-card-bg"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreatePool}
            disabled={!address || isCreating || isPending || isConfirming}
            className="flex-1"
          >
            {isCreating || isPending || isConfirming ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                Creating...
              </div>
            ) : (
              'Create Pool'
            )}
          </Button>
        </div>

        {!address && (
          <p className="text-center text-sm theme-text-secondary mt-4">
            Please connect your wallet to create a pool
          </p>
        )}
      </div>
    </div>
  );
}
