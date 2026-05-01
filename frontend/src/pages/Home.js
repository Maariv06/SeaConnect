import "./Home.css";
import centerImage from "../assets/center.png";
import { useNavigate } from "react-router-dom";

function Home() {

  const navigate = useNavigate();

  return (
    <div className="home">

      {/* HERO SECTION */}
      <section className="hero">

        <img src={centerImage} alt="SeaConnect" className="hero-bg" />

        <div className="hero-content">
          <div className="hero-text-box">
            <h1>🐟 SeaConnect</h1>
            <p>
              A Web-Based Fish Trading Platform Connecting
              Fish Sellers and Buyers.
            </p>
          </div>
        </div>

      </section>

      {/* HOW IT WORKS */}
      <section className="how-it-works">

        <h2>How It Works</h2>

        <div className="steps">

          <div className="step">
            <h3>1️⃣ Register</h3>
            <p>Create an account.</p>
          </div>

          <div className="step">
            <h3>2️⃣ Post Fish</h3>
            <p>Sellers post fish details or auction mode.</p>
          </div>

          <div className="step">
            <h3>3️⃣ Admin Approval</h3>
            <p>Warehouse verifies and approves.</p>
          </div>

          <div className="step">
            <h3>4️⃣ Browse & Buy</h3>
            <p>Buyers browse or bid in auction.</p>
          </div>

          <div className="step">
            <h3>5️⃣ Delivery</h3>
            <p>Fish delivery tracking.</p>
          </div>

        </div>

      </section>

      {/* PLATFORM FEATURES */}
      <section className="features">

        <h2>Platform Features</h2>

        <div className="feature-grid">

          <div 
            className="feature-card"
            onClick={() => navigate("/sellfish")}
          >
            <h3>🐟 Sell Fish</h3>
            <p>List fish with price or auction mode.</p>
          </div>

          <div 
            className="feature-card"
            onClick={() => navigate("/browse")}
          >
            <h3>🛒 Browse Fish</h3>
            <p>Buyers can explore fresh fish listings.</p>
          </div>

          <div 
            className="feature-card"
            onClick={() => navigate("/auction")}
          >
            <h3>🔴 Live Auction</h3>
            <p>Real-time bidding approved by admin.</p>
          </div>

          

        </div>

      </section>

      {/* FOOTER */}
      <footer className="footer">

        <div className="footer-container">

          <div>
            <h3>SeaConnect</h3>
            <p>- Fish Trading Platform</p>
          </div>

          <div>
            <p>Contact: seaconnect@gmail.com</p>
            <p>9812763450</p>
            <p>© 2026 SeaConnect</p>
          </div>

        </div>

      </footer>

    </div>
  );
}

export default Home;