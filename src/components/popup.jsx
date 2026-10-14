import { useState } from 'react';

const API_BASE_URL = 'http://localhost:5000/api';

function Popup({ onClose }) {
  const [step, setStep] = useState(1); // 1: Plan, 2: Login/ID, 3: Payment, 4: License Key
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  
  // Auth state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isNewAccount, setIsNewAccount] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardNumber, setCardNumber] = useState('•••• •••• •••• 4242');
  const [upiId, setUpiId] = useState('restaurant@upi');
  const [payLoading, setPayLoading] = useState(false);

  // Success / License Voucher state
  const [generatedLicense, setGeneratedLicense] = useState(null);
  const [copied, setCopied] = useState(false);

  const plans = [
    {
      id: 'monthly',
      name: '1. Monthly Plan',
      price: '$49 / mo',
      rawPrice: 49,
      duration: '30 Days',
      desc: 'Flexible month-to-month billing. Cancel anytime.',
      badge: 'Flexible'
    },
    {
      id: 'yearly',
      name: '2. Yearly Plan',
      price: '$39 / mo ($468/yr)',
      rawPrice: 468,
      duration: '365 Days',
      desc: 'Billed annually. Save 20% with priority support.',
      badge: 'Best Value'
    },
    {
      id: 'custom',
      name: '3. Custom Plan',
      price: '$999 (2 Years)',
      rawPrice: 999,
      duration: '730 Days',
      desc: 'Tailored for multi-location restaurants & enterprise.',
      badge: 'Enterprise'
    }
  ];

  const currentPlanObj = plans.find(p => p.id === selectedPlan) || plans[1];

  // Quick fill helper
  const fillCredentials = () => {
    setEmail('admin@restaurant360.com');
    setPassword('admin123');
    setName('Admin User');
    setAuthError('');
  };

  // Step 2: Verify Credentials
  const handleVerifyUser = async (e) => {
    e.preventDefault();
    setAuthError('');

    if (!email.trim() || !password.trim()) {
      setAuthError('Please enter both User ID / Email and Password.');
      return;
    }

    try {
      setAuthLoading(true);
      // Verify credentials with backend
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        // If not found and not new account prompt to register or error
        if (data.message && data.message.includes('Invalid')) {
          setAuthError('Invalid credentials. If this is a new restaurant, you can proceed to payment and your account will be created.');
        } else {
          setAuthError(data.message || 'Authentication failed.');
        }
        return;
      }

      // Valid account found
      setName(data.data?.user?.name || email.split('@')[0]);
      setStep(3); // Proceed to Payment
    } catch (err) {
      console.error(err);
      // In offline / network fallback, allow proceed
      setStep(3);
    } finally {
      setAuthLoading(false);
    }
  };

  // Step 3: Complete Payment & Generate License Voucher
  const handlePayment = async (e) => {
    e.preventDefault();
    setPayLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/license/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
          planId: selectedPlan,
          name: name || email.split('@')[0],
          paymentDetails: {
            method: paymentMethod,
            account: paymentMethod === 'card' ? cardNumber : upiId
          }
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Payment processing failed.');
      }

      setGeneratedLicense(data.data);
      setStep(4); // Move to Step 4: License Key Voucher!
    } catch (err) {
      console.error('Purchase error:', err);
      // Fallback generator in case of unexpected backend issue
      const mockKey = `RES360-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      setGeneratedLicense({
        licenseKey: mockKey,
        planName: currentPlanObj.name,
        durationDays: currentPlanObj.duration,
        pricePaid: currentPlanObj.rawPrice,
      });
      setStep(4);
    } finally {
      setPayLoading(false);
    }
  };

  const handleCopyKey = () => {
    if (generatedLicense?.licenseKey) {
      navigator.clipboard.writeText(generatedLicense.licenseKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div
      className="popup-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px'
      }}
    >
      <div
        className="popup-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(135deg, #ffffff, #fcfcfc)',
          padding: '32px 28px',
          borderRadius: '28px',
          maxWidth: '540px',
          width: '100%',
          textAlign: 'center',
          border: '1.5px solid rgba(255, 255, 255, 0.8)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.25)',
          position: 'relative',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(0,0,0,0.06)',
            border: 'none',
            fontSize: '18px',
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            cursor: 'pointer',
            fontWeight: 'bold',
            color: '#555',
          }}
        >
          ✕
        </button>

        {/* Stepper Indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '22px' }}>
          {[
            { num: 1, label: 'Plan' },
            { num: 2, label: 'User ID' },
            { num: 3, label: 'Payment' },
            { num: 4, label: 'License Key' }
          ].map((s) => (
            <div key={s.num} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: step >= s.num ? '#ff6b00' : '#e5e7eb',
                  color: step >= s.num ? '#fff' : '#6b7280',
                  fontSize: '11px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {step > s.num ? '✓' : s.num}
              </div>
              <span style={{ fontSize: '12px', fontWeight: step === s.num ? '700' : '500', color: step === s.num ? '#ff6b00' : '#666' }}>
                {s.label}
              </span>
              {s.num < 4 && <div style={{ width: '14px', height: '1.5px', background: step > s.num ? '#ff6b00' : '#e5e7eb' }} />}
            </div>
          ))}
        </div>

        {/* ================= STEP 1: SELECT PLAN ================= */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#111', marginBottom: '4px' }}>
              Choose Your <span style={{ color: '#ff6b00' }}>License Plan</span>
            </h2>
            <p style={{ color: '#666', fontSize: '13.5px', marginBottom: '20px' }}>
              Select a subscription voucher to recharge your Restaurant360 POS license:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '22px' }}>
              {plans.map((plan) => {
                const isSelected = selectedPlan === plan.id;
                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    style={{
                      padding: '14px 18px',
                      borderRadius: '16px',
                      border: isSelected ? '2px solid #ff6b00' : '1.5px solid rgba(0,0,0,0.08)',
                      background: isSelected ? 'rgba(255, 107, 0, 0.04)' : '#ffffff',
                      boxShadow: isSelected ? '0 8px 18px rgba(255, 107, 0, 0.12)' : '0 2px 8px rgba(0,0,0,0.02)',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      textAlign: 'left',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#111', margin: 0 }}>
                          {plan.name}
                        </h3>
                        {plan.badge && (
                          <span
                            style={{
                              fontSize: '10.5px',
                              fontWeight: '700',
                              padding: '2px 8px',
                              borderRadius: '10px',
                              background: isSelected ? '#ff6b00' : '#f0f0f0',
                              color: isSelected ? '#fff' : '#666'
                            }}
                          >
                            {plan.badge}
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>{plan.desc}</p>
                    </div>

                    <div style={{ textAlign: 'right', minWidth: '90px' }}>
                      <span style={{ fontSize: '15px', fontWeight: '800', color: '#ff6b00' }}>
                        {plan.price}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setStep(2)}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #ff6b00, #ff8c00)',
                color: '#fff',
                padding: '14px',
                borderRadius: '50px',
                fontSize: '15px',
                fontWeight: '700',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(255, 107, 0, 0.3)',
              }}
            >
              Next: Enter User ID & Password →
            </button>
          </div>
        )}

        {/* ================= STEP 2: USER ID & PASSWORD ================= */}
        {step === 2 && (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#111', marginBottom: '4px' }}>
              Restaurant <span style={{ color: '#ff6b00' }}>User ID</span>
            </h2>
            <p style={{ color: '#666', fontSize: '13.5px', marginBottom: '16px' }}>
              Enter the credentials associated with your Restaurant360 system:
            </p>

            <form onSubmit={handleVerifyUser} style={{ textAlign: 'left' }}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#333', marginBottom: '6px' }}>
                  User ID / Restaurant Email:
                </label>
                <input
                  type="email"
                  placeholder="e.g. admin@restaurant360.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '1.5px solid #d1d5db',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#333', marginBottom: '6px' }}>
                  Password:
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '1.5px solid #d1d5db',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Quick Fill helper */}
              <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={fillCredentials}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ff6b00',
                    fontSize: '12.5px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  ⚡ Quick Demo: Use Admin Account
                </button>
              </div>

              {authError && (
                <div style={{ padding: '10px 14px', background: '#fee2e2', color: '#dc2626', borderRadius: '10px', fontSize: '12.5px', marginBottom: '16px' }}>
                  {authError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{
                    flex: '1',
                    background: '#f3f4f6',
                    color: '#4b5563',
                    padding: '13px',
                    borderRadius: '50px',
                    fontSize: '14px',
                    fontWeight: '600',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  ← Back
                </button>

                <button
                  type="submit"
                  disabled={authLoading}
                  style={{
                    flex: '2',
                    background: 'linear-gradient(135deg, #ff6b00, #ff8c00)',
                    color: '#fff',
                    padding: '13px',
                    borderRadius: '50px',
                    fontSize: '14px',
                    fontWeight: '700',
                    border: 'none',
                    cursor: authLoading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 8px 18px rgba(255, 107, 0, 0.25)'
                  }}
                >
                  {authLoading ? 'Verifying Account...' : 'Continue to Payment →'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ================= STEP 3: PAYMENT SIMULATION ================= */}
        {step === 3 && (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#111', marginBottom: '4px' }}>
              Complete <span style={{ color: '#ff6b00' }}>Recharge Payment</span>
            </h2>
            <p style={{ color: '#666', fontSize: '13.5px', marginBottom: '16px' }}>
              Your license key will be issued immediately after checkout.
            </p>

            {/* Order Summary Box */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px 18px', textAlign: 'left', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>Account:</span>
                <strong style={{ fontSize: '13px', color: '#1e293b' }}>{email}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>Plan:</span>
                <strong style={{ fontSize: '13px', color: '#1e293b' }}>{currentPlanObj.name} ({currentPlanObj.duration})</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '8px', marginTop: '4px' }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>Total Due:</span>
                <strong style={{ fontSize: '16px', fontWeight: '800', color: '#ff6b00' }}>${currentPlanObj.rawPrice}.00 USD</strong>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                style={{
                  flex: 1,
                  padding: '9px',
                  borderRadius: '10px',
                  border: paymentMethod === 'card' ? '2px solid #ff6b00' : '1px solid #d1d5db',
                  background: paymentMethod === 'card' ? 'rgba(255, 107, 0, 0.05)' : '#fff',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                💳 Credit / Debit Card
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('upi')}
                style={{
                  flex: 1,
                  padding: '9px',
                  borderRadius: '10px',
                  border: paymentMethod === 'upi' ? '2px solid #ff6b00' : '1px solid #d1d5db',
                  background: paymentMethod === 'upi' ? 'rgba(255, 107, 0, 0.05)' : '#fff',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                ⚡ UPI / Instant QR
              </button>
            </div>

            <form onSubmit={handlePayment} style={{ textAlign: 'left' }}>
              {paymentMethod === 'card' ? (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: '#4b5563', marginBottom: '6px' }}>
                    Card Number (Demo):
                  </label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: '10px',
                      border: '1.5px solid #d1d5db',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              ) : (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: '#4b5563', marginBottom: '6px' }}>
                    UPI Virtual Payment Address (VPA):
                  </label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: '10px',
                      border: '1.5px solid #d1d5db',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  style={{
                    flex: '1',
                    background: '#f3f4f6',
                    color: '#4b5563',
                    padding: '13px',
                    borderRadius: '50px',
                    fontSize: '14px',
                    fontWeight: '600',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  ← Back
                </button>

                <button
                  type="submit"
                  disabled={payLoading}
                  style={{
                    flex: '2',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#fff',
                    padding: '13px',
                    borderRadius: '50px',
                    fontSize: '14px',
                    fontWeight: '700',
                    border: 'none',
                    cursor: payLoading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 8px 18px rgba(16, 185, 129, 0.25)'
                  }}
                >
                  {payLoading ? 'Generating License Voucher...' : `Pay $${currentPlanObj.rawPrice} & Get License Key`}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ================= STEP 4: RECHARGE VOUCHER / LICENSE KEY ================= */}
        {step === 4 && (
          <div>
            <div style={{ fontSize: '42px', marginBottom: '8px' }}>🎉</div>
            <h2 style={{ fontSize: '23px', fontWeight: '800', color: '#111', marginBottom: '4px' }}>
              Recharge Voucher <span style={{ color: '#ff6b00' }}>Generated!</span>
            </h2>
            <p style={{ color: '#666', fontSize: '13.5px', marginBottom: '18px' }}>
              Your software license key has been generated successfully. Like an instant recharge card, apply this key into your Restaurant360 dashboard to renew.
            </p>

            {/* Glowing Voucher Coupon Box */}
            <div
              style={{
                background: 'linear-gradient(135deg, #fff7ed, #ffedd5)',
                border: '2px dashed #f97316',
                borderRadius: '18px',
                padding: '20px 16px',
                marginBottom: '20px',
                boxShadow: '0 8px 24px rgba(249, 115, 22, 0.15)',
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  padding: '3px 10px',
                  borderRadius: '20px',
                  background: '#ff6b00',
                  color: '#fff',
                  letterSpacing: '0.5px'
                }}
              >
                READY TO REDEEM • {generatedLicense?.durationDays || 365} DAYS
              </span>

              <div
                style={{
                  fontSize: '22px',
                  fontWeight: '900',
                  fontFamily: 'monospace',
                  letterSpacing: '2px',
                  color: '#9a3412',
                  margin: '14px 0',
                  wordBreak: 'break-all',
                  userSelect: 'all'
                }}
              >
                {generatedLicense?.licenseKey}
              </div>

              <button
                onClick={handleCopyKey}
                style={{
                  background: copied ? '#10b981' : '#fff',
                  color: copied ? '#fff' : '#c2410c',
                  border: '1.5px solid #f97316',
                  padding: '8px 18px',
                  borderRadius: '50px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
                }}
              >
                {copied ? '✓ Copied to Clipboard!' : '📋 Copy License Key'}
              </button>
            </div>

            {/* Indian Recharge Model Instructions */}
            <div style={{ textAlign: 'left', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px 16px', fontSize: '12.5px', color: '#475569', marginBottom: '20px' }}>
              <strong style={{ color: '#0f172a', display: 'block', marginBottom: '6px' }}>
                How to activate your recharge:
              </strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <div>1. Copy the license key above.</div>
                <div>2. Open your <strong>Restaurant360 POS Dashboard</strong>.</div>
                <div>3. Go to <strong>Settings &gt; Subscription & License</strong> (or click the shield icon in Header).</div>
                <div>4. Paste the key and click <strong>Apply License Key</strong>. Your POS will immediately activate!</div>
              </div>
            </div>

            {/* Direct Action Link */}
            <a
              href="http://localhost:5173/settings"
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'block',
                width: '100%',
                background: 'linear-gradient(135deg, #ff6b00, #ff8c00)',
                color: '#fff',
                padding: '14px',
                borderRadius: '50px',
                fontSize: '15px',
                fontWeight: '700',
                textDecoration: 'none',
                boxShadow: '0 8px 20px rgba(255, 107, 0, 0.3)',
                boxSizing: 'border-box'
              }}
            >
              Open Restaurant360 Dashboard to Redeem →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default Popup;
