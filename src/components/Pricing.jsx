function Pricing({ onOpenPopup }) {
  return (
    <section className="pricing" id="pricing-section">
      <div className="price-card">
        <div className="left">
          <h2>Start Your Free Trial</h2>
          <p style={{ color: '#666', marginTop: '6px', fontSize: '15px' }}>
            Get 14 days full access to Restaurant360. No credit card required.
          </p>
        </div>

        <button onClick={onOpenPopup}>
          Start Your Free Trial
        </button>
      </div>
    </section>
  );
}

export default Pricing;
