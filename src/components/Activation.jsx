const steps = [
  {
    number: "1",
    title: "Choose your plan",
    desc: "Select the package that fits your restaurant size and staff."
  },
  {
    number: "2",
    title: "Secure Payment",
    desc: "SSL encrypted payment for complete security."
  },
  {
    number: "3",
    title: "Receive Access",
    desc: "Get your login credentials instantly by email."
  }
];

function Activation() {
  return (
    <section className="activation" id="activation-section">
      <h2>How to Activate</h2>
      <p>Set up and running in minutes, not days.</p>

      <div className="steps">
        {steps.map((step) => (
          <div className="step" key={step.number}>
            <div className="circle">{step.number}</div>
            <h3>{step.title}</h3>
            <p>{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Activation;