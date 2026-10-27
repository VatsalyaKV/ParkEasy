import React, { useState } from 'react';
import { CreditCard, Smartphone, Building, Leaf, Lock, CheckCircle, Loader2, X } from 'lucide-react';
import api from '../services/api';

const PaymentModal = ({ isOpen, onClose, bookingDetails, onPaymentSuccess }) => {
  const [selectedMethod, setSelectedMethod] = useState('UPI');
  const [upiId, setUpiId] = useState('user@okaxis');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('789');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen || !bookingDetails) return null;

  const { amount, bookingId, evDiscount = 0, pointsDiscount = 0 } = bookingDetails;

  const handlePay = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // Simulate realistic payment gateway latency (1.5 seconds)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const res = await api.post('/payments', {
        bookingId,
        amount,
        method: selectedMethod,
      });

      setIsProcessing(false);
      setIsSuccess(true);

      setTimeout(() => {
        setIsSuccess(false);
        onPaymentSuccess(res.data.data);
      }, 1000);
    } catch (err) {
      console.error('Payment simulation error:', err);
      setIsProcessing(false);
      alert('Payment processing failed. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 text-brand-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Lock className="w-3.5 h-3.5" />
              <span>Simulated Payment Gateway</span>
            </div>
            <h3 className="text-xl font-bold">Complete Reservation</h3>
            <p className="text-xs text-slate-400">Total Payable: ₹{amount}</p>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h4 className="text-xl font-bold text-slate-900">Payment Successful!</h4>
            <p className="text-sm text-slate-500">
              Generating your unique digital QR entry gate pass...
            </p>
          </div>
        ) : (
          <form onSubmit={handlePay} className="p-6 space-y-6">
            {/* Payment Method Selector */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedMethod('UPI')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold gap-1.5 transition-all ${
                  selectedMethod === 'UPI'
                    ? 'border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-500/20'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Smartphone className="w-5 h-5 text-indigo-500" />
                <span>UPI / QR</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('Card')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold gap-1.5 transition-all ${
                  selectedMethod === 'Card'
                    ? 'border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-500/20'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CreditCard className="w-5 h-5 text-emerald-500" />
                <span>Card</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('NetBanking')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold gap-1.5 transition-all ${
                  selectedMethod === 'NetBanking'
                    ? 'border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-500/20'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Building className="w-5 h-5 text-amber-500" />
                <span>Net Banking</span>
              </button>
            </div>

            {/* Method Inputs */}
            {selectedMethod === 'UPI' && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700">Virtual Payment Address (VPA / UPI ID)</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="e.g. username@okhdfcbank"
                  required
                />
                <p className="text-[11px] text-slate-400">Mock verification will authorize instantly.</p>
              </div>
            )}

            {selectedMethod === 'Card' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Card Number</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Expiry (MM/YY)</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">CVV</label>
                    <input
                      type="password"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {selectedMethod === 'NetBanking' && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700">Select Bank</label>
                <select className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option>HDFC Bank</option>
                  <option>State Bank of India</option>
                  <option>ICICI Bank</option>
                  <option>Axis Bank</option>
                </select>
              </div>
            )}

            {/* Price breakdown summary */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
              {evDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span className="flex items-center gap-1">
                    <Leaf className="w-3.5 h-3.5" /> EcoPark EV Incentive:
                  </span>
                  <span>- ₹{evDiscount}</span>
                </div>
              )}
              {pointsDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Eco Points Discount:</span>
                  <span>- ₹{pointsDiscount}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-900 font-bold text-sm pt-1 border-t border-slate-200">
                <span>Final Payable:</span>
                <span>₹{amount}</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-3 px-4 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Authorizing Payment...</span>
                </>
              ) : (
                <span>Pay ₹{amount} Securely</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;
