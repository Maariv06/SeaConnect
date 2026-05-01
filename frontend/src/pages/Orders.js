import { useEffect, useState } from "react";
import API from "../services/api";

const Orders = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    API.get("/order/my")
      .then(res => setOrders(res.data))
      .catch(err => console.log(err));
  }, []);

  return (
    <div className="container">
      <h2>My Orders</h2>

      {orders.map(order => (
        <div key={order._id} className="card">
          <p><strong>Final Price:</strong> ₹{order.finalPrice}</p>
          <p><strong>Commission:</strong> ₹{order.commissionAmount}</p>
          <p><strong>Payment:</strong> {order.paymentStatus}</p>
          <p><strong>Order Status:</strong> {order.orderStatus}</p>
        </div>
      ))}
    </div>
  );
};

export default Orders;
