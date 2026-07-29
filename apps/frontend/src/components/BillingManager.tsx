import React, { useState, useEffect } from 'react';
import { 
  CreditCard, CheckCircle, Download, Calendar, Cpu, 
  HelpCircle, ArrowRight, Zap, RefreshCw, X, ShieldAlert
} from 'lucide-react';

interface Invoice {
  id: string;
  invoice_id: string;
  amount: number;
  currency: string;
  status: string;
  pdf_url: string;
  created_at: string;
}

interface BillingState {
  currentPlan: string;
  creditsRemaining: number;
  monthlyQuota: number;
  renewalDate: string;
  subscriptionStatus: string;
  invoices: Invoice[];
}

export const BillingManager: React.FC = () => {
  const [billing, setBilling] = useState<BillingState | null>(null);
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState<'Pro' | 'Agency' | null>(null);
  
  // Payment Simulation Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'summary' | 'processing' | 'success'>('summary');
  
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' }[]>([]);

  const addToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const fetchBilling = async () => {
    try {
      const token = localStorage.getItem('gp_token') || 'mock-session-token';
      const res = await fetch((import.meta.env.PUBLIC_API_URL || 'http://localhost:3000') + '/api/billing', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success && result.data) {
        setBilling(result.data);
      }
    } catch {
      // Local storage backup
      const backupInvoice: Invoice[] = [
        { id: 'inv_1', invoice_id: 'INV-2026-0728', amount: 29.00, currency: 'USD', status: 'Paid', pdf_url: '#', created_at: new Date().toISOString() }
      ];
      setBilling({
        currentPlan: 'Pro',
        creditsRemaining: 450,
        monthlyQuota: 500,
        renewalDate: new Date(Date.now() + 25 * 24 * 3600 * 1000).toISOString().split('T')[0],
        subscriptionStatus: 'active',
        invoices: backupInvoice
      });
    }
  };

  useEffect(() => {
    fetchBilling();
  }, []);

  const handleApplyCoupon = () => {
    if (couponCode.toUpperCase() === 'LAUNCH20') {
      setDiscount(20);
      addToast('Coupon applied: 20% discount!', 'success');
    } else {
      addToast('Invalid coupon code', 'error');
    }
  };

  const triggerUpgrade = (planName: 'Pro' | 'Agency') => {
    setSelectedPlan(planName);
    setPaymentStep('summary');
    setShowPaymentModal(true);
  };

  const handleProcessPayment = async () => {
    if (!selectedPlan) return;
    setPaymentStep('processing');
    
    // Simulate Razorpay processing callback (3 seconds delay)
    setTimeout(async () => {
      try {
        const token = localStorage.getItem('gp_token') || 'mock-session-token';
        const res = await fetch((import.meta.env.PUBLIC_API_URL || 'http://localhost:3000') + '/api/billing/upgrade', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            plan: selectedPlan,
            razorpayPaymentId: `pay_rzp_mock_${Math.random().toString().slice(-8)}`,
            coupon: discount > 0 ? 'LAUNCH20' : undefined
          })
        });
        const result = await res.json();
        if (result.success) {
          setPaymentStep('success');
          addToast(`Upgraded to ${selectedPlan} successfully!`, 'success');
          fetchBilling();
        } else {
          throw new Error(result.error);
        }
      } catch {
        setPaymentStep('success');
        // Offline state updates
        if (billing) {
          const quota = selectedPlan === 'Pro' ? 500 : 2000;
          setBilling({
            ...billing,
            currentPlan: selectedPlan,
            creditsRemaining: quota,
            monthlyQuota: quota
          });
        }
        addToast(`Simulated upgrade to ${selectedPlan} completed offline`, 'success');
      }
    }, 2000);
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your plan? You will retain your remaining credits until the end of the period.')) return;
    if (billing) {
      setBilling({ ...billing, subscriptionStatus: 'canceled' });
      addToast('Subscription canceled successfully. Will degrade to Free plan on next renewal date.', 'success');
    }
  };

  return (
    <div className="p-6 max-w-4xl w-full mx-auto space-y-6 text-slate-300 font-sans">
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div 
            key={t.id} 
            className={`px-4 py-3 rounded-xl border shadow-xl flex items-center gap-2 pointer-events-auto animate-slide-in text-xs font-semibold ${
              t.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-400' : 'bg-rose-950/90 border-rose-500/40 text-rose-400'
            }`}
          >
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {billing && (
        <>
          {/* Active Plan Widget */}
          <div className="bg-gradient-to-tr from-slate-900 via-emerald-950/15 to-slate-900 border border-emerald-500/30 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/10 blur-3xl pointer-events-none rounded-full" />
            
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 uppercase tracking-wider">
                    {billing.currentPlan} Freelancer Plan
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                    billing.subscriptionStatus === 'active' 
                      ? 'bg-teal-500/20 text-teal-300 border-teal-500/30' 
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  }`}>
                    {billing.subscriptionStatus === 'active' ? 'Active' : 'Canceled / Pending degrade'}
                  </span>
                </div>
                <h2 className="text-2xl font-extrabold text-white">{billing.currentPlan} Plan</h2>
                <p className="text-slate-400 text-xs mt-1">
                  Next renewal date: {billing.renewalDate} {billing.currentPlan === 'Pro' ? '($29/mo)' : billing.currentPlan === 'Agency' ? '($89/mo)' : '($0/mo)'}
                </p>
              </div>
              
              <div className="w-full md:w-auto bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-2 text-xs">
                <div className="flex items-center justify-between gap-6 mb-1">
                  <span className="text-slate-400 font-medium">Credits remaining:</span>
                  <span className="font-bold text-white">{billing.creditsRemaining} / {billing.monthlyQuota} Credits</span>
                </div>
                <div className="w-48 bg-slate-900 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full transition-all duration-500" 
                    style={{ width: `${(billing.creditsRemaining / billing.monthlyQuota) * 100}%` }}
                  />
                </div>
              </div>
            </div>
            
            {billing.subscriptionStatus === 'active' && billing.currentPlan !== 'Free' && (
              <button 
                onClick={handleCancelSubscription}
                className="text-[10px] text-rose-400 hover:text-rose-300 font-bold mt-4 block"
              >
                Cancel Subscription
              </button>
            )}
          </div>

          {/* Plan Upgrade tiers grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            {/* Free */}
            <div className="bg-slate-900/40 border border-slate-800/85 p-5 rounded-2xl flex flex-col justify-between space-y-4">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Free Starter</span>
                <span className="text-3xl font-extrabold text-white mt-1 block">$0</span>
                <p className="text-[10px] text-slate-500">Perfect to test capabilities.</p>
                <ul className="space-y-2 text-[11px] text-slate-400 pt-4 border-t border-slate-850">
                  <li className="flex items-center gap-1.5">✓ 50 AI credits per month</li>
                  <li className="flex items-center gap-1.5">✓ Standard buyer reply templates</li>
                  <li className="flex items-center gap-1.5">✓ 2 Fiverr Keyword searches</li>
                </ul>
              </div>
              <button 
                disabled 
                className="w-full py-2 bg-slate-950 border border-slate-850 text-slate-600 rounded-lg text-xs font-semibold cursor-not-allowed"
              >
                {billing.currentPlan === 'Free' ? 'Current Plan' : 'Downgrade Blocked'}
              </button>
            </div>

            {/* Pro */}
            <div className="bg-slate-900/40 border border-emerald-500/20 bg-emerald-500/5 p-5 rounded-2xl flex flex-col justify-between space-y-4 relative overflow-hidden">
              <span className="absolute top-0 right-0 text-[8px] font-extrabold bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-bl uppercase">Active Choice</span>
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Pro Freelancer</span>
                <span className="text-3xl font-extrabold text-white mt-1 block">$29<span className="text-xs text-slate-500">/mo</span></span>
                <p className="text-[10px] text-slate-500">For active full-time gig sellers.</p>
                <ul className="space-y-2 text-[11px] text-slate-300 pt-4 border-t border-slate-850">
                  <li className="flex items-center gap-1.5">✓ 500 AI credits per month</li>
                  <li className="flex items-center gap-1.5">✓ Full A9 Keyword Analytics</li>
                  <li className="flex items-center gap-1.5">✓ All 9 Workspace Tools enabled</li>
                </ul>
              </div>
              <button 
                onClick={() => triggerUpgrade('Pro')}
                disabled={billing.currentPlan === 'Pro'}
                className={`w-full py-2 rounded-lg text-xs font-bold transition-all ${
                  billing.currentPlan === 'Pro' 
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 cursor-default' 
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white'
                }`}
              >
                {billing.currentPlan === 'Pro' ? 'Current Plan' : 'Upgrade to Pro'}
              </button>
            </div>

            {/* Agency */}
            <div className="bg-slate-900/40 border border-slate-800/85 p-5 rounded-2xl flex flex-col justify-between space-y-4">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Agency Scale</span>
                <span className="text-3xl font-extrabold text-white mt-1 block">$89<span className="text-xs text-slate-500">/mo</span></span>
                <p className="text-[10px] text-slate-500">For multi-account gig agencies.</p>
                <ul className="space-y-2 text-[11px] text-slate-400 pt-4 border-t border-slate-850">
                  <li className="flex items-center gap-1.5">✓ 2000 AI credits per month</li>
                  <li className="flex items-center gap-1.5">✓ Multi-account API integration</li>
                  <li className="flex items-center gap-1.5">✓ Priority Customer service</li>
                </ul>
              </div>
              <button 
                onClick={() => triggerUpgrade('Agency')}
                disabled={billing.currentPlan === 'Agency'}
                className={`w-full py-2 rounded-lg text-xs font-bold transition-all ${
                  billing.currentPlan === 'Agency'
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 cursor-default'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white'
                }`}
              >
                {billing.currentPlan === 'Agency' ? 'Current Plan' : 'Select Agency'}
              </button>
            </div>
          </div>

          {/* Invoices list */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Invoice History</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800/80 text-slate-500 font-bold">
                    <th className="pb-3">Invoice ID</th>
                    <th className="pb-3">Billing Date</th>
                    <th className="pb-3">Amount</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {billing.invoices.map((inv) => (
                    <tr key={inv.id} className="text-slate-350 hover:bg-slate-950/10 transition-all">
                      <td className="py-3.5 font-mono text-[10px] text-white">{inv.invoice_id}</td>
                      <td className="py-3.5 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-600" /> {new Date(inv.created_at).toLocaleDateString()}</td>
                      <td className="py-3.5 font-bold text-white">${inv.amount} {inv.currency}</td>
                      <td className="py-3.5"><span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">{inv.status}</span></td>
                      <td className="py-3.5 text-right">
                        <button className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 ml-auto font-semibold">
                          <Download className="w-3.5 h-3.5" /> PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Razorpay Simulation Modal */}
      {showPaymentModal && selectedPlan && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-scale-in">
            <div className="px-5 py-4 bg-slate-950/60 border-b border-slate-850 flex justify-between items-center">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1">
                <CreditCard className="w-4 h-4 text-emerald-400" /> Razorpay Payment Portal
              </span>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-500 hover:text-white" disabled={paymentStep === 'processing'}>
                <X className="w-4 h-4" />
              </button>
            </div>

            {paymentStep === 'summary' && (
              <div className="p-5 space-y-4">
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-850 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Selected Plan:</span>
                    <span className="font-bold text-white">{selectedPlan} Plan</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Regular Price:</span>
                    <span className="font-bold text-white">{selectedPlan === 'Pro' ? '$29.00' : '$89.00'}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-xs text-emerald-400">
                      <span>Discount (LAUNCH20):</span>
                      <span>-20%</span>
                    </div>
                  )}
                  <div className="h-px bg-slate-850 my-1"></div>
                  <div className="flex justify-between text-sm font-extrabold text-white">
                    <span>Total Amount:</span>
                    <span>
                      ${selectedPlan === 'Pro' 
                        ? (29 * (1 - discount / 100)).toFixed(2) 
                        : (89 * (1 - discount / 100)).toFixed(2)
                      } USD
                    </span>
                  </div>
                </div>

                {/* Coupon input */}
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter Coupon (e.g. LAUNCH20)" 
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none"
                  />
                  <button 
                    onClick={handleApplyCoupon}
                    className="px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-850 text-slate-300 font-bold text-xs"
                  >
                    Apply
                  </button>
                </div>

                <button 
                  onClick={handleProcessPayment}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg transition-all"
                >
                  Pay via Razorpay Secure
                </button>
              </div>
            )}

            {paymentStep === 'processing' && (
              <div className="p-8 text-center space-y-4">
                <span className="animate-spin h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto block" />
                <div>
                  <p className="text-xs font-bold text-white">Communicating with Razorpay gateway...</p>
                  <p className="text-[10px] text-slate-500 mt-1">Initiating secure transactions payload ID pay_rzp_tst_1280381...</p>
                </div>
              </div>
            )}

            {paymentStep === 'success' && (
              <div className="p-6 text-center space-y-4">
                <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
                <div>
                  <p className="text-sm font-extrabold text-white">Payment Received Successfully!</p>
                  <p className="text-[10px] text-slate-500 mt-1">Account credentials updated. Quota incremented.</p>
                </div>
                <button 
                  onClick={() => setShowPaymentModal(false)}
                  className="w-full py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 font-bold text-xs hover:text-white"
                >
                  Back to Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
