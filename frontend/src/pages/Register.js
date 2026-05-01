import React, { useState } from "react";
import axios from "axios";
import "./Register.css";

function Register({ close }) {

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    location: "",
    role: ""
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/register",
        formData
      );

      alert(response.data.message);
      close(); // close modal

    } catch (error) {
      alert(error.response?.data?.message || "Registration Failed");
    }
  };

  return (
    <div className="modal-overlay" onClick={close}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>

        <span className="close-btn" onClick={close}>✖</span>

        <h2>Create Your Account</h2>

        <form onSubmit={handleSubmit}>

          <input
            type="text"
            name="fullName"
            placeholder="Full Name"
            onChange={handleChange}
            required
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            onChange={handleChange}
            required
          />

          <input
            type="tel"
            name="phone"
            placeholder="Phone Number"
            pattern="[0-9]{10}"
            title="Enter 10 digit phone number"
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="location"
            placeholder="Location (Optional)"
            onChange={handleChange}
          />

          <select
            name="role"
            onChange={handleChange}
            required
          >
            <option value="">Select Role</option>
            <option value="seller">Seller</option>
            <option value="buyer">Buyer</option>
          </select>

          <button type="submit" className="register-btn">
            Register
          </button>

        </form>

      </div>
    </div>
  );
}

export default Register;