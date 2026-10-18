import "../styles/Navbar.css";

function Navbar({ onOpenPopup }) {
  return (
    <nav className="navbar">
      <div className="logo">
        Restaurant<span>360</span>
      </div>

      <ul className="nav-links">
        <li><a href="#">Home</a></li>
        <li><a href="#activation-section">How to Activate</a></li>
        <li>
          <a
            href="#pricing-section"
            onClick={(e) => {
              e.preventDefault();
              if (onOpenPopup) onOpenPopup();
              document.getElementById("pricing-section")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Pricing
          </a>
        </li>
        <li><a href="#contact-section">Contact</a></li>
      </ul>

      <button
        onClick={onOpenPopup}
        className="nav-btn"
        style={{ border: "none", cursor: "pointer" }}
      >
        Renew / Get License
      </button>
    </nav>
  );
}

export default Navbar;