interface BlockchainProofProps {
  contractAddress: string | null;
  explorerUrl: string;
  onChainPromiseId: number | null;
  onChainTxHash: string | null;
  triggers: Array<{ summary?: string; onChainTxHash?: string | null }>;
  timeline: Array<{ eventType: string; title: string; txHash?: string | null }>;
}

export function BlockchainProof({
  contractAddress,
  explorerUrl,
  onChainPromiseId,
  onChainTxHash,
  triggers,
  timeline,
}: BlockchainProofProps) {
  const hasAnyProof =
    contractAddress ||
    onChainPromiseId != null ||
    onChainTxHash ||
    triggers.some((t) => t.onChainTxHash) ||
    timeline.some((e) => e.txHash);

  if (!hasAnyProof) return null;

  const txLink = (hash: string, label: string) => (
    <a
      href={`${explorerUrl}/tx/${hash}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-sm text-slate-700 underline-offset-4 hover:text-slate-900 hover:underline"
    >
      {label}
      <span className="font-mono text-xs text-slate-500">
        {hash.slice(0, 10)}...{hash.slice(-8)}
      </span>
      ↗
    </a>
  );

  return (
    <div className="mt-8 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">
        Blockchain proof
      </h2>
      <p className="mt-1 text-xs text-slate-500">
        Immutable records on Polygon Amoy testnet
      </p>
      <div className="mt-4 space-y-3">
        {contractAddress && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Contract:</span>
            <a
              href={`${explorerUrl}/address/${contractAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-sm text-slate-700 underline-offset-4 hover:text-slate-900 hover:underline"
            >
              {contractAddress.slice(0, 10)}...{contractAddress.slice(-8)} ↗
            </a>
          </div>
        )}
        {onChainPromiseId != null && contractAddress && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">
              Pledge ID on-chain:
            </span>
            <a
              href={`${explorerUrl}/address/${contractAddress}#readContract`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-sm text-slate-700 hover:underline"
            >
              #{onChainPromiseId}
            </a>
          </div>
        )}
        {onChainTxHash && (
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-500">
              Pledge recorded:
            </span>
            {txLink(onChainTxHash, 'View tx')}
          </div>
        )}
        {triggers
          .filter((t) => t.onChainTxHash)
          .map((t, i) => (
            <div key={i} className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-500">
                Evidence: {t.summary?.slice(0, 40)}...
              </span>
              {t.onChainTxHash && txLink(t.onChainTxHash, 'View tx')}
            </div>
          ))}
        {timeline
          .filter((e) => e.txHash && e.eventType !== 'PROMISE_RECORDED')
          .map((e, i) => (
            <div key={i} className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-500">
                {e.title}:
              </span>
              {e.txHash && txLink(e.txHash, 'View tx')}
            </div>
          ))}
      </div>
    </div>
  );
}
