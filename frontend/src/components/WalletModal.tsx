'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface WalletModalProps {
  wallet: {
    address: string | null;
    mode: string | null;
    error: string | null;
    connecting: boolean;
    connectWallet: () => void;
    connectLocal: (key?: string) => void;
    disconnect: () => void;
  };
  onClose: () => void;
}

export default function WalletModal({ wallet, onClose }: WalletModalProps) {
  const [importKey, setImportKey] = useState('');

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Connect wallet">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 className="modal-title">Connect Wallet</h2>
          <button onClick={onClose} aria-label="Close" data-control-id="wallet-close">
            <X size={20} />
          </button>
        </div>

        {wallet.error && <div className="error-msg">{wallet.error}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
          <button
            className="btn btn-primary"
            onClick={wallet.connectWallet}
            disabled={wallet.connecting}
            data-control-id="wallet-connect-metamask"
          >
            {wallet.connecting ? 'Connecting…' : 'MetaMask / Injected Wallet'}
          </button>

          <div style={{ borderTop: '1px solid var(--c-border)', paddingTop: 12 }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--c-muted)', marginBottom: 8 }}>
              Quick Wallet (recommended for StudioNet)
            </p>
            <button
              className="btn btn-secondary"
              onClick={() => wallet.connectLocal()}
              data-control-id="wallet-quick-connect"
            >
              Generate New Key
            </button>
          </div>

          <div style={{ borderTop: '1px solid var(--c-border)', paddingTop: 12 }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--c-muted)', marginBottom: 8 }}>
              Import Private Key
            </p>
            <input
              type="password"
              placeholder="0x…"
              value={importKey}
              onChange={(e) => setImportKey(e.target.value)}
              data-control-id="wallet-import-input"
              style={{ marginBottom: 8 }}
            />
            <button
              className="btn btn-secondary"
              onClick={() => {
                if (importKey.trim()) {
                  wallet.connectLocal(importKey);
                  setImportKey('');
                }
              }}
              disabled={!importKey.trim()}
              data-control-id="wallet-import-connect"
            >
              Import & Connect
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
