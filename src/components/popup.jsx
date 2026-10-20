import { useState } from 'react';

const API_BASE_URL = 'http://localhost:5000/api';

function Popup({ onClose }) {
  const [step, setStep] = useState(1); // 1: Plan, 2: Customer Details, 3: Payment, 4: License Key
  const [selectedPlan, setSelectedPlan] = useState('yearly');

  // Customer state (NO password needed on portfolio!)
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [authError, setAuthError] = useState('');

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardNumber, setCardNumber] = useState('•••• •••• •••• 4242');
  const [upiId, setUpiId] = useState('restaurant@upi');
  const [payLoading, setPayLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');

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

  // Step 2: Validate Customer Details
  const handleCustomerDetails = (e) => {
    e.preventDefault();
    setAuthError('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!name.trim()) {
      setAuthError('Please enter your full name or restaurant name.');
      return;
    }
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setAuthError('Please enter a valid email address for receipt delivery.');
      return;
    }

    setStep(3); // Proceed to Payment
  };

  // Step 3: Interactive Payment Gateway Simulation (Supports Success & Failure)
  const handlePayment = async (outcome = 'SUCCESS') => {
    setPayLoading(true);
    setPaymentError('');

    try {
      // 1. Create Gateway Order
      const orderRes = await fetch(`${API_BASE_URL}/payment/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          planId: selectedPlan,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.message || 'Payment order initiation failed.');
      }

      // 2. Gateway Verification (Simulates Success or Decline)
      const verifyRes = await fetch(`${API_BASE_URL}/payment/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderData.data.orderId,
          transactionId: orderData.data.transactionId,
          status: outcome,
          failureReason: outcome === 'FAILED' ? 'Bank transaction declined (ERR_INSUFFICIENT_FUNDS)' : null,
          paymentMethod,
        }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok || !verifyData.success) {
        setPaymentError(verifyData.message || 'Transaction was declined by issuing bank. No license code issued.');
        return;
      }

      // Payment Success: Store generated license details and move to Step 4
      setGeneratedLicense(verifyData.data);
      setStep(4);
    } catch (err) {
      console.error('Payment error:', err);
      setPaymentError(err.message || 'Payment gateway connection error.');
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
        className="popup-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: '24px',
          padding: '36px',
          width: '100%',
          maxWidth: '540px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.3)',
          position: 'relative',
          textAlign: 'center',
          fontFamily: "'Inter', sans-serif"
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: '#f3f4f6',
            border: 'none',
            fontSize: '18px',
            cursor: 'pointer',
            color: '#666',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ✕
        </button>

        {/* Step Indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px', alignItems: 'center' }}>
          {[
            { num: 1, label: 'Plan' },
            { num: 2, label: 'Customer' },
            { num: 3, label: 'Payment' },
            { num: 4, label: 'License' }
          ].map((s) => (
            <div key={s.num} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: step >= s.num ? '#ff6b00' : '#e5e7eb',
                  color: step >= s.num ? '#fff' : '#666',
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
              Select a subscription voucher to activate or recharge your Restaurant360 POS license:
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
              Next: Customer Details →
            </button>
          </div>
        )}

        {/* ================= STEP 2: CUSTOMER DETAILS (NO PASSWORD) ================= */}
        {step === 2 && (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#111', marginBottom: '4px' }}>
              Voucher & <span style={{ color: '#ff6b00' }}>Customer Details</span>
            </h2>
            <p style={{ color: '#666', fontSize: '13.5px', marginBottom: '16px' }}>
              Where should we send your license key and invoice receipt?
            </p>

            <form onSubmit={handleCustomerDetails} style={{ textAlign: 'left' }}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#333', marginBottom: '6px' }}>
                  Full Name / Restaurant Name:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Royal Spice Bistro / Rohit Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
                  Email Address (Receipt & Voucher Delivery):
                </label>
                <input
                  type="email"
                  placeholder="e.g. owner@royalspice.com"
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

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#333', marginBottom: '6px' }}>
                  Phone / WhatsApp (Optional):
                </label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
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
                  style={{
                    flex: '2',
                    background: 'linear-gradient(135deg, #ff6b00, #ff8c00)',
                    color: '#fff',
                    padding: '13px',
                    borderRadius: '50px',
                    fontSize: '14px',
                    fontWeight: '700',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 8px 18px rgba(255, 107, 0, 0.25)'
                  }}
                >
                  Continue to Payment Window →
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ================= STEP 3: PAYMENT GATEWAY WINDOW ================= */}
        {step === 3 && (
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', background: '#ecfdf5', borderRadius: '20px', color: '#047857', fontSize: '12px', fontWeight: '700', marginBottom: '10px' }}>
              🔒 256-Bit SSL Encrypted Payment Gateway
            </div>

            <h2 style={{ fontSize: '23px', fontWeight: '800', color: '#111', margin: '0 0 4px' }}>
              Payment <span style={{ color: '#ff6b00' }}>Verification Window</span>
            </h2>
            <p style={{ color: '#666', fontSize: '13px', marginBottom: '16px' }}>
              Choose payment mode and verify transaction to unlock your software license key:
            </p>

            {/* Order Summary Box */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px 18px', textAlign: 'left', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>Recipient:</span>
                <strong style={{ fontSize: '13px', color: '#1e293b' }}>{name} ({email})</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>Selected Plan:</span>
                <strong style={{ fontSize: '13px', color: '#1e293b' }}>{currentPlanObj.name} ({currentPlanObj.duration})</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '8px', marginTop: '4px' }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>Amount Payable:</span>
                <strong style={{ fontSize: '17px', fontWeight: '800', color: '#ff6b00' }}>${currentPlanObj.rawPrice}.00 USD</strong>
              </div>
            </div>

            {/* Payment Failure Alert */}
            {paymentError && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1.5px solid #ef4444',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  color: '#991b1b',
                  fontSize: '12.5px',
                  textAlign: 'left',
                  marginBottom: '16px',
                  lineHeight: '1.4'
                }}
              >
                <strong>⚠️ Payment Gateway Error:</strong> {paymentError}
              </div>
            )}

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
                  fontSize: '12.5px',
                  cursor: 'pointer'
                }}
              >
                💳 Debit / Credit Card
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
                  fontSize: '12.5px',
                  cursor: 'pointer'
                }}
              >
                ⚡ UPI / Instant QR
              </button>
            </div>

            <div style={{ textAlign: 'left', marginBottom: '18px' }}>
              {paymentMethod === 'card' ? (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#4b5563', marginBottom: '5px' }}>
                    Card Number (Demo Checkout):
                  </label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1.5px solid #d1d5db',
                      fontSize: '13.5px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              ) : (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#4b5563', marginBottom: '5px' }}>
                    UPI Virtual Payment Address:
                  </label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1.5px solid #d1d5db',
                      fontSize: '13.5px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              )}
            </div>

            {/* Dual Gateway Action Buttons: SUCCESS vs FAILURE SIMULATION */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
              <button
                type="button"
                disabled={payLoading}
                onClick={() => handlePayment('SUCCESS')}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#fff',
                  padding: '13px',
                  borderRadius: '50px',
                  fontSize: '14.5px',
                  fontWeight: '700',
                  border: 'none',
                  cursor: payLoading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 8px 18px rgba(16, 185, 129, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {payLoading ? 'Verifying Transaction with Bank...' : `✓ Pay $${currentPlanObj.rawPrice} (Verify & Issue License)`}
              </button>

              <button
                type="button"
                disabled={payLoading}
                onClick={() => handlePayment('FAILED')}
                style={{
                  width: '100%',
                  background: '#fef2f2',
                  color: '#dc2626',
                  border: '1.5px solid #fca5a5',
                  padding: '10px',
                  borderRadius: '50px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: payLoading ? 'not-allowed' : 'pointer'
                }}
              >
                ✕ Simulate Bank Failure / Card Decline
              </button>
            </div>

            <div style={{ marginTop: '14px' }}>
              <button
                type="button"
                onClick={() => setStep(2)}
                style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '13px', cursor: 'pointer' }}
              >
                ← Back to Details
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 4: RECHARGE VOUCHER / LICENSE KEY ================= */}
        {step === 4 && (
          <div>
            <div style={{ fontSize: '42px', marginBottom: '8px' }}>🎉</div>
            <h2 style={{ fontSize: '23px', fontWeight: '800', color: '#111', marginBottom: '4px' }}>
              Payment Verified & <span style={{ color: '#ff6b00' }}>License Issued!</span>
            </h2>
            <p style={{ color: '#666', fontSize: '13.5px', marginBottom: '18px' }}>
              Your 12-character cryptographic license key has been generated and signed.
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
                CRYPTOGRAPHIC VOUCHER • {generatedLicense?.durationDays || 365} DAYS
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

            {/* Instructions */}
            <div style={{ textAlign: 'left', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px 16px', fontSize: '12.5px', color: '#475569', marginBottom: '20px' }}>
              <strong style={{ color: '#0f172a', display: 'block', marginBottom: '6px' }}>
                How to activate on Restaurant360:
              </strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <div>1. Click the button below to launch the <strong>Restaurant360</strong> portal.</div>
                <div>2. Choose <strong>Register Restaurant</strong> to create your owner credentials.</div>
                <div>3. Your license key will automatically be verified & applied, instantly unlocking your POS!</div>
              </div>
            </div>

            {/* Direct Action Link with Key pre-filled in URL */}
            <a
              href={`http://localhost:5173/login?key=${generatedLicense?.licenseKey}&mode=register`}
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
              Launch Restaurant360 to Register & Activate →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default Popup;
