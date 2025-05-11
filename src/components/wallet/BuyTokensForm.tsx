import React, { useState } from 'react';
import { CreditCard, Lock } from 'lucide-react';
interface BuyTokensFormProps {
  onPurchase: (amount: number) => void;
}
export const BuyTokensForm = ({
  onPurchase
}: BuyTokensFormProps) => {
  const [amount, setAmount] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [processing, setProcessing] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    // Simulate payment processing
    setTimeout(() => {
      onPurchase(Number(amount));
      setProcessing(false);
      // Reset form
      setAmount('');
      setCardNumber('');
      setExpiry('');
      setCvc('');
    }, 2000);
  };
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };
  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    return v;
  };
  const calculateUSDAmount = () => {
    const tokenAmount = Number(amount) || 0;
    return (tokenAmount * 0.1).toFixed(2); // Assuming 1 INK = $0.10
  };
  return <div className="bg-dark/50 border border-primary/20 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-pixel text-primary text-sm">Buy INK Tokens</h3>
        <div className="flex items-center text-gray-400">
          <Lock size={14} className="mr-1" />
          <span className="text-xs">Secure Payment</span>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Amount Selection */}
        <div>
          <label className="block text-gray-400 text-xs mb-1">Amount</label>
          <div className="grid grid-cols-3 gap-2 mb-2">
            {[100, 500, 1000].map(value => <button key={value} type="button" onClick={() => setAmount(String(value))} className={`px-3 py-2 rounded border ${amount === String(value) ? 'bg-primary/20 border-primary text-primary' : 'border-primary/20 text-gray-400 hover:bg-primary/10'}`}>
                {value} INK
              </button>)}
          </div>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Custom amount" className="w-full bg-dark border border-primary/30 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary" />
          {amount && <div className="text-right mt-1">
              <span className="text-xs text-gray-400">
                ≈ ${calculateUSDAmount()} USD
              </span>
            </div>}
        </div>
        {/* Card Details */}
        <div>
          <label className="block text-gray-400 text-xs mb-1">
            Card Number
          </label>
          <div className="relative">
            <input type="text" value={cardNumber} onChange={e => setCardNumber(formatCardNumber(e.target.value))} maxLength={19} placeholder="1234 5678 9012 3456" className="w-full bg-dark border border-primary/30 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary" />
            <CreditCard size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-400 text-xs mb-1">
              Expiry Date
            </label>
            <input type="text" value={expiry} onChange={e => setExpiry(formatExpiry(e.target.value))} maxLength={5} placeholder="MM/YY" className="w-full bg-dark border border-primary/30 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-gray-400 text-xs mb-1">CVC</label>
            <input type="text" value={cvc} onChange={e => setCvc(e.target.value.replace(/\D/g, ''))} maxLength={3} placeholder="123" className="w-full bg-dark border border-primary/30 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary" />
          </div>
        </div>
        <button type="submit" disabled={processing || !amount || !cardNumber || !expiry || !cvc} className="w-full px-4 py-2 bg-primary/20 text-primary border border-primary/30 rounded hover:bg-primary/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
          {processing ? <>
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></div>
              Processing...
            </> : `Buy ${amount || '0'} INK Tokens`}
        </button>
      </form>
    </div>;
};