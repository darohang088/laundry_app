import { useState, useEffect, useRef } from "react";

const STATUS_FLOW = {
  PENDING: { label: "Pending", color: "#f59e0b", bg: "#fef3c7", step: 1 },
  ACCEPTED: { label: "Accepted", color: "#10b981", bg: "#d1fae5", step: 2 },
  REJECTED: { label: "Rejected", color: "#ef4444", bg: "#fee2e2", step: 2 },
  PICKUP_ASSIGNED: { label: "Pickup Assigned", color: "#6366f1", bg: "#ede9fe", step: 3 },
  OUT_FOR_PICKUP: { label: "Out for Pickup", color: "#8b5cf6", bg: "#ede9fe", step: 4 },
  PICKED_UP: { label: "Picked Up", color: "#0ea5e9", bg: "#e0f2fe", step: 5 },
  DELIVERED_TO_SHOP: { label: "Delivered to Shop", color: "#0284c7", bg: "#e0f2fe", step: 6 },
  WASHING: { label: "Washing", color: "#06b6d4", bg: "#cffafe", step: 7 },
  READY_FOR_DELIVERY: { label: "Ready for Delivery", color: "#10b981", bg: "#d1fae5", step: 8 },
  DELIVERY_ASSIGNED: { label: "Delivery Assigned", color: "#6366f1", bg: "#ede9fe", step: 9 },
  OUT_FOR_DELIVERY: { label: "Out for Delivery", color: "#8b5cf6", bg: "#ede9fe", step: 10 },
  DELIVERED: { label: "Delivered", color: "#16a34a", bg: "#dcfce7", step: 11 },
};

const STEPS = [
  { key: "PENDING", label: "Order Placed" },
  { key: "ACCEPTED", label: "Accepted" },
  { key: "PICKUP_ASSIGNED", label: "Driver Assigned" },
  { key: "OUT_FOR_PICKUP", label: "Out for Pickup" },
  { key: "PICKED_UP", label: "Picked Up" },
  { key: "DELIVERED_TO_SHOP", label: "At Shop" },
  { key: "WASHING", label: "Washing" },
  { key: "READY_FOR_DELIVERY", label: "Ready" },
  { key: "DELIVERY_ASSIGNED", label: "Driver Assigned" },
  { key: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
  { key: "DELIVERED", label: "Delivered" },
];

let orderIdCounter = 1001;

function generateId() {
  return `ORD-${orderIdCounter++}`;
}

const CLOTHES_TYPES = ["Shirts", "Pants", "Dresses", "Jackets", "Bedsheets", "Towels", "Uniforms", "Mixed"];
const SAMPLE_CUSTOMERS = ["Daro Sok", "Srey Lin", "Bopha Chan", "Virak Pich"];
const SAMPLE_ADDRESSES = ["Street 271, BKK1", "Street 63, Chamkarmon", "Street 178, Daun Penh", "Toul Kork, PP"];

export default function LaundryApp() {
  const [role, setRole] = useState("customer");
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState({ customer: [], shop: [], driver: [] });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [newOrder, setNewOrder] = useState({ clothesType: "Shirts", quantity: 1, address: "", notes: "" });
  const [toast, setToast] = useState(null);
  const notifRef = useRef();

  const addNotif = (roles, msg, orderId) => {
    setNotifications(prev => {
      const updated = { ...prev };
      roles.forEach(r => {
        updated[r] = [{ id: Date.now() + Math.random(), msg, orderId, time: new Date().toLocaleTimeString(), read: false }, ...updated[r]].slice(0, 20);
      });
      return updated;
    });
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const updateOrderStatus = (orderId, status, extra = {}) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status, ...extra, history: [...o.history, { status, time: new Date().toLocaleTimeString(), ...extra }] } : o));
    if (selectedOrder?.id === orderId) {
      setSelectedOrder(prev => ({ ...prev, status, ...extra, history: [...prev.history, { status, time: new Date().toLocaleTimeString(), ...extra }] }));
    }
  };

  const createOrder = () => {
    if (!newOrder.address.trim()) { showToast("Please enter your address", "error"); return; }
    const order = {
      id: generateId(),
      customer: SAMPLE_CUSTOMERS[0],
      address: newOrder.address,
      clothesType: newOrder.clothesType,
      quantity: newOrder.quantity,
      notes: newOrder.notes,
      status: "PENDING",
      createdAt: new Date().toLocaleTimeString(),
      driver: null,
      history: [{ status: "PENDING", time: new Date().toLocaleTimeString() }],
    };
    setOrders(prev => [order, ...prev]);
    addNotif(["shop"], `New order ${order.id} from ${order.customer}`, order.id);
    addNotif(["customer"], `Order ${order.id} created successfully — awaiting confirmation`, order.id);
    showToast(`Order ${order.id} placed successfully!`);
    setShowCreateModal(false);
    setNewOrder({ clothesType: "Shirts", quantity: 1, address: "", notes: "" });
  };

  const shopAction = (orderId, action) => {
    if (action === "accept") {
      updateOrderStatus(orderId, "ACCEPTED");
      addNotif(["customer"], `Your order ${orderId} has been ACCEPTED by the laundry shop`, orderId);
      addNotif(["shop"], `Order ${orderId} marked as ACCEPTED`, orderId);
      showToast("Order accepted!");
    } else {
      updateOrderStatus(orderId, "REJECTED");
      addNotif(["customer"], `Your order ${orderId} was REJECTED by the laundry shop`, orderId);
      showToast("Order rejected", "error");
    }
  };

  const assignPickupDriver = (orderId) => {
    const driver = "Dara Meas";
    updateOrderStatus(orderId, "PICKUP_ASSIGNED", { driver });
    addNotif(["driver"], `You have been assigned for PICKUP of order ${orderId}`, orderId);
    addNotif(["shop"], `Driver ${driver} assigned for pickup of ${orderId}`, orderId);
    showToast(`Driver assigned for pickup!`);
  };

  const driverPickupAction = (orderId, action) => {
    if (action === "accept") {
      updateOrderStatus(orderId, "OUT_FOR_PICKUP");
      addNotif(["customer"], `Driver is heading to pick up your order ${orderId}`, orderId);
      addNotif(["shop"], `Driver accepted pickup for order ${orderId}`, orderId);
      showToast("Pickup accepted — heading out!");
    } else {
      updateOrderStatus(orderId, "ACCEPTED", { driver: null });
      addNotif(["shop"], `Driver rejected pickup for order ${orderId}. Please reassign.`, orderId);
      showToast("Pickup rejected", "error");
    }
  };

  const driverPickedUp = (orderId) => {
    updateOrderStatus(orderId, "PICKED_UP");
    addNotif(["customer"], `Your clothes have been picked up for order ${orderId}`, orderId);
    addNotif(["shop"], `Order ${orderId} clothes picked up — en route to shop`, orderId);
    showToast("Marked as picked up!");
  };

  const driverDeliveredToShop = (orderId) => {
    updateOrderStatus(orderId, "DELIVERED_TO_SHOP");
    addNotif(["shop"], `Order ${orderId} delivered to shop. Start washing!`, orderId);
    showToast("Delivered to shop!");
  };

  const shopStartWashing = (orderId) => {
    updateOrderStatus(orderId, "WASHING");
    addNotif(["customer"], `Your laundry for order ${orderId} is now being washed`, orderId);
    showToast("Washing started!");
  };

  const shopReadyForDelivery = (orderId) => {
    updateOrderStatus(orderId, "READY_FOR_DELIVERY");
    addNotif(["customer"], `Your laundry order ${orderId} is ready for delivery!`, orderId);
    addNotif(["shop"], `Order ${orderId} ready — assign delivery driver`, orderId);
    showToast("Order ready for delivery!");
  };

  const assignDeliveryDriver = (orderId) => {
    const driver = "Dara Meas";
    updateOrderStatus(orderId, "DELIVERY_ASSIGNED", { driver });
    addNotif(["driver"], `You have been assigned for DELIVERY of order ${orderId}`, orderId);
    addNotif(["shop"], `Driver assigned for delivery of ${orderId}`, orderId);
    showToast("Delivery driver assigned!");
  };

  const driverDeliveryAction = (orderId, action) => {
    if (action === "accept") {
      updateOrderStatus(orderId, "OUT_FOR_DELIVERY");
      addNotif(["customer"], `Driver is on the way to deliver your order ${orderId}`, orderId);
      addNotif(["shop"], `Driver accepted delivery for order ${orderId}`, orderId);
      showToast("Delivery accepted — heading out!");
    } else {
      updateOrderStatus(orderId, "READY_FOR_DELIVERY", { driver: null });
      addNotif(["shop"], `Driver rejected delivery for order ${orderId}. Please reassign.`, orderId);
      showToast("Delivery rejected", "error");
    }
  };

  const driverArrivedAtCustomer = (orderId) => {
    updateOrderStatus(orderId, "OUT_FOR_DELIVERY");
    addNotif(["customer"], `Driver has arrived at your location for order ${orderId}!`, orderId);
    addNotif(["shop"], `Driver arrived at customer location for order ${orderId}`, orderId);
    showToast("Arrived at customer!");
  };

  const driverDelivered = (orderId) => {
    updateOrderStatus(orderId, "DELIVERED");
    addNotif(["customer"], `Order ${orderId} successfully delivered. Thank you!`, orderId);
    addNotif(["shop"], `Order ${orderId} has been DELIVERED. Payment collected.`, orderId);
    showToast("Order delivered successfully! 🎉");
  };

  const currentNotifs = notifications[role] || [];
  const unreadCount = currentNotifs.filter(n => !n.read).length;

  const markRead = () => {
    setNotifications(prev => ({ ...prev, [role]: prev[role].map(n => ({ ...n, read: true })) }));
  };

  const getOrdersForRole = () => {
    if (role === "customer") return orders;
    if (role === "shop") return orders.filter(o => o.status !== "REJECTED");
    if (role === "driver") return orders.filter(o => ["PICKUP_ASSIGNED", "OUT_FOR_PICKUP", "PICKED_UP", "DELIVERED_TO_SHOP", "DELIVERY_ASSIGNED", "OUT_FOR_DELIVERY"].includes(o.status));
    return orders;
  };

  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#f0f4f8", minHeight: "100vh", color: "#1e293b" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Fraunces:wght@400;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <header style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, background: "linear-gradient(135deg, #0ea5e9, #6366f1)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 18 }}>👕</span>
            </div>
            <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 20, color: "#0f172a" }}>FreshFold</span>
            <span style={{ fontSize: 11, background: "#e0f2fe", color: "#0284c7", padding: "2px 8px", borderRadius: 20, fontWeight: 600 }}>Laundry System</span>
          </div>

          {/* Role Switcher */}
          <div style={{ display: "flex", background: "#f1f5f9", borderRadius: 12, padding: 4, gap: 2 }}>
            {[
              { id: "customer", icon: "👤", label: "Customer" },
              { id: "shop", icon: "🏪", label: "Laundry Shop" },
              { id: "driver", icon: "🚗", label: "Driver" },
            ].map(r => (
              <button key={r.id} onClick={() => { setRole(r.id); setSelectedOrder(null); }}
                style={{ padding: "6px 14px", borderRadius: 9, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s",
                  background: role === r.id ? "#fff" : "transparent",
                  color: role === r.id ? "#0f172a" : "#64748b",
                  boxShadow: role === r.id ? "0 1px 4px rgba(0,0,0,0.1)" : "none"
                }}>
                {r.icon} {r.label}
              </button>
            ))}
          </div>

          {/* Notification Bell */}
          <div ref={notifRef} style={{ position: "relative" }}>
            <button onClick={() => { setShowNotif(!showNotif); markRead(); }}
              style={{ background: showNotif ? "#e0f2fe" : "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, width: 40, height: 40, cursor: "pointer", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
              🔔
              {unreadCount > 0 && (
                <span style={{ position: "absolute", top: -4, right: -4, background: "#ef4444", color: "#fff", borderRadius: 20, fontSize: 10, fontWeight: 700, minWidth: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>
                  {unreadCount}
                </span>
              )}
            </button>
            {showNotif && (
              <div style={{ position: "absolute", right: 0, top: 48, width: 340, background: "#fff", borderRadius: 16, boxShadow: "0 8px 32px rgba(0,0,0,0.12)", border: "1px solid #e2e8f0", overflow: "hidden", zIndex: 200 }}>
                <div style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9", fontWeight: 700, fontSize: 14, color: "#0f172a" }}>Notifications</div>
                {currentNotifs.length === 0 ? (
                  <div style={{ padding: 24, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>No notifications yet</div>
                ) : (
                  <div style={{ maxHeight: 320, overflowY: "auto" }}>
                    {currentNotifs.map(n => (
                      <div key={n.id} onClick={() => { const o = orders.find(o => o.id === n.orderId); if (o) setSelectedOrder(o); setShowNotif(false); }}
                        style={{ padding: "12px 16px", borderBottom: "1px solid #f8fafc", cursor: "pointer", background: n.read ? "#fff" : "#f0f9ff", transition: "background 0.15s" }}>
                        <div style={{ fontSize: 13, color: "#334155", fontWeight: n.read ? 400 : 600 }}>{n.msg}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{n.time}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 20px", display: "grid", gridTemplateColumns: selectedOrder ? "1fr 420px" : "1fr", gap: 20 }}>

        {/* Left Panel */}
        <div>
          {/* Top bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 700, margin: 0, color: "#0f172a" }}>
                {role === "customer" && "My Orders"}
                {role === "shop" && "Shop Dashboard"}
                {role === "driver" && "Driver Dashboard"}
              </h1>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>
                {getOrdersForRole().length} order{getOrdersForRole().length !== 1 ? "s" : ""}
              </p>
            </div>
            {role === "customer" && (
              <button onClick={() => setShowCreateModal(true)}
                style={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)", color: "#fff", border: "none", borderRadius: 12, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "'DM Sans', sans-serif", boxShadow: "0 4px 12px rgba(14,165,233,0.3)" }}>
                + New Order
              </button>
            )}
          </div>

          {/* Stats row for shop */}
          {role === "shop" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
              {[
                { label: "Pending", status: "PENDING", icon: "⏳", color: "#f59e0b", bg: "#fef9ee" },
                { label: "Washing", status: "WASHING", icon: "🫧", color: "#06b6d4", bg: "#f0fdfe" },
                { label: "Ready", status: "READY_FOR_DELIVERY", icon: "✅", color: "#10b981", bg: "#f0fdf4" },
                { label: "Delivered", status: "DELIVERED", icon: "📦", color: "#6366f1", bg: "#f5f3ff" },
              ].map(stat => (
                <div key={stat.status} style={{ background: stat.bg, borderRadius: 12, padding: "14px 16px", border: `1px solid ${stat.color}22` }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{stat.icon}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: stat.color }}>{orders.filter(o => o.status === stat.status).length}</div>
                  <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Orders list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {getOrdersForRole().length === 0 ? (
              <div style={{ background: "#fff", borderRadius: 16, padding: 48, textAlign: "center", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>👕</div>
                <div style={{ fontWeight: 600, color: "#334155", fontSize: 16 }}>No orders yet</div>
                <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 4 }}>
                  {role === "customer" ? "Create your first laundry order!" : "Orders will appear here"}
                </div>
              </div>
            ) : (
              getOrdersForRole().map(order => {
                const st = STATUS_FLOW[order.status] || {};
                const isSelected = selectedOrder?.id === order.id;
                return (
                  <div key={order.id} onClick={() => setSelectedOrder(isSelected ? null : order)}
                    style={{ background: "#fff", borderRadius: 16, padding: 16, border: isSelected ? "2px solid #0ea5e9" : "1px solid #e2e8f0", cursor: "pointer", transition: "all 0.2s", boxShadow: isSelected ? "0 4px 20px rgba(14,165,233,0.12)" : "0 1px 4px rgba(0,0,0,0.04)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <span style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>{order.id}</span>
                          <span style={{ background: st.bg, color: st.color, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>{st.label}</span>
                        </div>
                        <div style={{ fontSize: 13, color: "#64748b" }}>
                          <span>🧺 {order.clothesType}</span>
                          <span style={{ margin: "0 8px" }}>•</span>
                          <span>×{order.quantity} pcs</span>
                          <span style={{ margin: "0 8px" }}>•</span>
                          <span>📍 {order.address}</span>
                        </div>
                        {order.driver && (
                          <div style={{ fontSize: 12, color: "#6366f1", marginTop: 4, fontWeight: 500 }}>🚗 Driver: {order.driver}</div>
                        )}
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>{order.createdAt}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{order.customer}</div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div style={{ marginTop: 12 }}>
                      <div style={{ height: 4, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ height: "100%", background: `linear-gradient(90deg, #0ea5e9, #6366f1)`, borderRadius: 4, width: `${((st.step || 1) / 11) * 100}%`, transition: "width 0.5s ease" }} />
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div onClick={e => e.stopPropagation()} style={{ marginTop: 12 }}>
                      <ActionButtons order={order} role={role} handlers={{ shopAction, assignPickupDriver, driverPickupAction, driverPickedUp, driverDeliveredToShop, shopStartWashing, shopReadyForDelivery, assignDeliveryDriver, driverDeliveryAction, driverArrivedAtCustomer, driverDelivered }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel - Order Detail */}
        {selectedOrder && (
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden", alignSelf: "flex-start", position: "sticky", top: 80, boxShadow: "0 4px 20px rgba(0,0,0,0.07)" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", background: "linear-gradient(135deg, #f0f9ff, #f5f3ff)" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: "#0f172a" }}>{selectedOrder.id}</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>Order Details</div>
              </div>
              <button onClick={() => setSelectedOrder(null)} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>

            <div style={{ padding: 20 }}>
              {/* Info */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
                {[
                  { label: "Customer", value: selectedOrder.customer },
                  { label: "Clothes", value: `${selectedOrder.clothesType} ×${selectedOrder.quantity}` },
                  { label: "Address", value: selectedOrder.address },
                  { label: "Driver", value: selectedOrder.driver || "Not assigned" },
                ].map(item => (
                  <div key={item.label} style={{ background: "#f8fafc", borderRadius: 10, padding: "10px 12px" }}>
                    <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>{item.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#334155", marginTop: 2 }}>{item.value}</div>
                  </div>
                ))}
              </div>

              {selectedOrder.notes && (
                <div style={{ background: "#fef9c3", borderRadius: 10, padding: "10px 12px", marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: "#854d0e", fontWeight: 600 }}>NOTES</div>
                  <div style={{ fontSize: 13, color: "#713f12" }}>{selectedOrder.notes}</div>
                </div>
              )}

              {/* Timeline */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>Order Timeline</div>
                <div style={{ position: "relative" }}>
                  {selectedOrder.history.map((h, i) => {
                    const st = STATUS_FLOW[h.status] || {};
                    const isLast = i === selectedOrder.history.length - 1;
                    return (
                      <div key={i} style={{ display: "flex", gap: 12, marginBottom: isLast ? 0 : 16, position: "relative" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                          <div style={{ width: 10, height: 10, borderRadius: "50%", background: isLast ? st.color || "#0ea5e9" : "#cbd5e1", flexShrink: 0, marginTop: 3 }} />
                          {!isLast && <div style={{ width: 2, flex: 1, background: "#e2e8f0", marginTop: 2 }} />}
                        </div>
                        <div style={{ paddingBottom: isLast ? 0 : 4 }}>
                          <div style={{ fontSize: 13, fontWeight: isLast ? 700 : 500, color: isLast ? st.color || "#0f172a" : "#475569" }}>{st.label || h.status}</div>
                          <div style={{ fontSize: 11, color: "#94a3b8" }}>{h.time}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Steps progress */}
              <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>Progress</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {STEPS.filter((_, i) => i < 7).map((step, i) => {
                    const curStep = STATUS_FLOW[selectedOrder.status]?.step || 1;
                    const done = curStep > i + 1;
                    const active = curStep === i + 1;
                    return (
                      <div key={step.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 20, height: 20, borderRadius: "50%", background: done ? "#10b981" : active ? "#0ea5e9" : "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {done ? <span style={{ color: "#fff", fontSize: 10 }}>✓</span> : <span style={{ width: 6, height: 6, borderRadius: "50%", background: active ? "#fff" : "#cbd5e1", display: "block" }} />}
                        </div>
                        <span style={{ fontSize: 12, color: done ? "#10b981" : active ? "#0ea5e9" : "#94a3b8", fontWeight: active ? 700 : 500 }}>{step.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Order Modal */}
      {showCreateModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 480, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", background: "linear-gradient(135deg, #f0f9ff, #f5f3ff)" }}>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 700, color: "#0f172a" }}>New Laundry Order</div>
              <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>Fill in your order details</div>
            </div>
            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Clothes Type</label>
                <select value={newOrder.clothesType} onChange={e => setNewOrder(p => ({ ...p, clothesType: e.target.value }))}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 14, background: "#fff", color: "#0f172a", fontFamily: "'DM Sans', sans-serif" }}>
                  {CLOTHES_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Quantity (pieces)</label>
                <input type="number" min={1} value={newOrder.quantity} onChange={e => setNewOrder(p => ({ ...p, quantity: parseInt(e.target.value) || 1 }))}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 14, fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Pickup Address *</label>
                <input type="text" placeholder="e.g. Street 271, BKK1, Phnom Penh" value={newOrder.address} onChange={e => setNewOrder(p => ({ ...p, address: e.target.value }))}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 14, fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Special Instructions (optional)</label>
                <textarea value={newOrder.notes} onChange={e => setNewOrder(p => ({ ...p, notes: e.target.value }))} rows={2} placeholder="e.g. Handle with care, no bleach..."
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 14, fontFamily: "'DM Sans', sans-serif", resize: "vertical", boxSizing: "border-box" }} />
              </div>
            </div>
            <div style={{ padding: "16px 24px", borderTop: "1px solid #f1f5f9", display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setShowCreateModal(false)}
                style={{ padding: "10px 20px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", color: "#64748b" }}>
                Cancel
              </button>
              <button onClick={createOrder}
                style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #0ea5e9, #6366f1)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", boxShadow: "0 4px 12px rgba(14,165,233,0.3)" }}>
                Place Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: toast.type === "error" ? "#fef2f2" : "#f0fdf4", border: `1px solid ${toast.type === "error" ? "#fca5a5" : "#86efac"}`, color: toast.type === "error" ? "#b91c1c" : "#15803d", borderRadius: 12, padding: "12px 20px", fontSize: 14, fontWeight: 600, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 999, whiteSpace: "nowrap" }}>
          {toast.type === "error" ? "❌" : "✅"} {toast.msg}
        </div>
      )}
    </div>
  );
}

function ActionButtons({ order, role, handlers }) {
  const { status } = order;
  const btn = (label, onClick, color = "#0ea5e9", bg = "#e0f2fe") => (
    <button onClick={onClick}
      style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: bg, color, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s", whiteSpace: "nowrap" }}>
      {label}
    </button>
  );

  const actions = [];

  if (role === "shop") {
    if (status === "PENDING") {
      actions.push(btn("✅ Accept", () => handlers.shopAction(order.id, "accept"), "#10b981", "#d1fae5"));
      actions.push(btn("❌ Reject", () => handlers.shopAction(order.id, "reject"), "#ef4444", "#fee2e2"));
    }
    if (status === "ACCEPTED") actions.push(btn("🚗 Assign Pickup Driver", () => handlers.assignPickupDriver(order.id), "#6366f1", "#ede9fe"));
    if (status === "DELIVERED_TO_SHOP") actions.push(btn("🫧 Start Washing", () => handlers.shopStartWashing(order.id), "#06b6d4", "#cffafe"));
    if (status === "WASHING") actions.push(btn("✅ Ready for Delivery", () => handlers.shopReadyForDelivery(order.id), "#10b981", "#d1fae5"));
    if (status === "READY_FOR_DELIVERY") actions.push(btn("🚗 Assign Delivery Driver", () => handlers.assignDeliveryDriver(order.id), "#6366f1", "#ede9fe"));
  }

  if (role === "driver") {
    if (status === "PICKUP_ASSIGNED") {
      actions.push(btn("✅ Accept Pickup", () => handlers.driverPickupAction(order.id, "accept"), "#10b981", "#d1fae5"));
      actions.push(btn("❌ Reject Pickup", () => handlers.driverPickupAction(order.id, "reject"), "#ef4444", "#fee2e2"));
    }
    if (status === "OUT_FOR_PICKUP") actions.push(btn("📦 Mark Picked Up", () => handlers.driverPickedUp(order.id), "#0ea5e9", "#e0f2fe"));
    if (status === "PICKED_UP") actions.push(btn("🏪 Delivered to Shop", () => handlers.driverDeliveredToShop(order.id), "#0284c7", "#e0f2fe"));
    if (status === "DELIVERY_ASSIGNED") {
      actions.push(btn("✅ Accept Delivery", () => handlers.driverDeliveryAction(order.id, "accept"), "#10b981", "#d1fae5"));
      actions.push(btn("❌ Reject Delivery", () => handlers.driverDeliveryAction(order.id, "reject"), "#ef4444", "#fee2e2"));
    }
    if (status === "OUT_FOR_DELIVERY") {
      actions.push(btn("📍 Arrived at Customer", () => handlers.driverArrivedAtCustomer(order.id), "#8b5cf6", "#ede9fe"));
      actions.push(btn("✅ Mark Delivered", () => handlers.driverDelivered(order.id), "#10b981", "#d1fae5"));
    }
  }

  if (actions.length === 0) return null;
  return <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{actions}</div>;
}
