import { useState, useEffect, useRef } from "react";

const STATUS_FLOW = {
  PENDING: { label: "Pending", color: "#d97706", bg: "#fef3c7", border: "#fcd34d", step: 1 },
  ACCEPTED: { label: "Accepted", color: "#059669", bg: "#d1fae5", border: "#6ee7b7", step: 2 },
  REJECTED: { label: "Rejected", color: "#dc2626", bg: "#fee2e2", border: "#fca5a5", step: 2 },
  PICKUP_ASSIGNED: { label: "Pickup Assigned", color: "#4f46e5", bg: "#ede9fe", border: "#a5b4fc", step: 3 },
  OUT_FOR_PICKUP: { label: "Out for Pickup", color: "#7c3aed", bg: "#ede9fe", border: "#a5b4fc", step: 4 },
  PICKED_UP: { label: "Picked Up", color: "#0369a1", bg: "#e0f2fe", border: "#7dd3fc", step: 5 },
  DELIVERED_TO_SHOP: { label: "At Shop", color: "#0284c7", bg: "#e0f2fe", border: "#7dd3fc", step: 6 },
  WASHING: { label: "Washing", color: "#0891b2", bg: "#cffafe", border: "#67e8f9", step: 7 },
  READY_FOR_DELIVERY: { label: "Ready", color: "#059669", bg: "#d1fae5", border: "#6ee7b7", step: 8 },
  DELIVERY_ASSIGNED: { label: "Delivery Assigned", color: "#4f46e5", bg: "#ede9fe", border: "#a5b4fc", step: 9 },
  OUT_FOR_DELIVERY: { label: "Out for Delivery", color: "#7c3aed", bg: "#ede9fe", border: "#a5b4fc", step: 10 },
  DELIVERED: { label: "Delivered", color: "#15803d", bg: "#dcfce7", border: "#86efac", step: 11 },
};

const STEPS = [
  { key: "PENDING", label: "Order Placed", icon: "📋" },
  { key: "ACCEPTED", label: "Accepted", icon: "✅" },
  { key: "PICKUP_ASSIGNED", label: "Driver Assigned", icon: "🚗" },
  { key: "OUT_FOR_PICKUP", label: "Out for Pickup", icon: "🛣️" },
  { key: "PICKED_UP", label: "Picked Up", icon: "📦" },
  { key: "DELIVERED_TO_SHOP", label: "At Shop", icon: "🏪" },
  { key: "WASHING", label: "Washing", icon: "🫧" },
  { key: "READY_FOR_DELIVERY", label: "Ready", icon: "✨" },
  { key: "DELIVERY_ASSIGNED", label: "Driver Assigned", icon: "🚗" },
  { key: "OUT_FOR_DELIVERY", label: "Out for Delivery", icon: "🛣️" },
  { key: "DELIVERED", label: "Delivered", icon: "🎉" },
];

let orderIdCounter = 1001;
function generateId() { return `ORD-${orderIdCounter++}`; }

const CLOTHES_TYPES = ["Shirts", "Pants", "Dresses", "Jackets", "Bedsheets", "Towels", "Uniforms", "Mixed"];

const ROLES = [
  { id: "customer", icon: "👤", label: "Customer" },
  { id: "shop", icon: "🏪", label: "Shop" },
  { id: "driver", icon: "🚗", label: "Driver" },
];

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
      customer: "Daro Sok",
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
    addNotif(["customer"], `Order ${order.id} created — awaiting confirmation`, order.id);
    showToast(`Order ${order.id} placed!`);
    setShowCreateModal(false);
    setNewOrder({ clothesType: "Shirts", quantity: 1, address: "", notes: "" });
  };

  const shopAction = (orderId, action) => {
    if (action === "accept") {
      updateOrderStatus(orderId, "ACCEPTED");
      addNotif(["customer"], `Your order ${orderId} has been ACCEPTED`, orderId);
      showToast("Order accepted!");
    } else {
      updateOrderStatus(orderId, "REJECTED");
      addNotif(["customer"], `Your order ${orderId} was REJECTED`, orderId);
      showToast("Order rejected", "error");
    }
  };

  const assignPickupDriver = (orderId) => {
    updateOrderStatus(orderId, "PICKUP_ASSIGNED", { driver: "Dara Meas" });
    addNotif(["driver"], `Assigned for PICKUP of ${orderId}`, orderId);
    showToast("Driver assigned for pickup!");
  };

  const driverPickupAction = (orderId, action) => {
    if (action === "accept") {
      updateOrderStatus(orderId, "OUT_FOR_PICKUP");
      addNotif(["customer"], `Driver heading to pick up ${orderId}`, orderId);
      showToast("Heading out for pickup!");
    } else {
      updateOrderStatus(orderId, "ACCEPTED", { driver: null });
      addNotif(["shop"], `Driver rejected pickup for ${orderId}. Reassign.`, orderId);
      showToast("Pickup rejected", "error");
    }
  };

  const driverPickedUp = (orderId) => {
    updateOrderStatus(orderId, "PICKED_UP");
    addNotif(["customer"], `Clothes picked up for ${orderId}`, orderId);
    showToast("Marked as picked up!");
  };

  const driverDeliveredToShop = (orderId) => {
    updateOrderStatus(orderId, "DELIVERED_TO_SHOP");
    addNotif(["shop"], `Order ${orderId} delivered to shop!`, orderId);
    showToast("Delivered to shop!");
  };

  const shopStartWashing = (orderId) => {
    updateOrderStatus(orderId, "WASHING");
    addNotif(["customer"], `Laundry for ${orderId} is being washed`, orderId);
    showToast("Washing started!");
  };

  const shopReadyForDelivery = (orderId) => {
    updateOrderStatus(orderId, "READY_FOR_DELIVERY");
    addNotif(["customer"], `Order ${orderId} is ready for delivery!`, orderId);
    showToast("Ready for delivery!");
  };

  const assignDeliveryDriver = (orderId) => {
    updateOrderStatus(orderId, "DELIVERY_ASSIGNED", { driver: "Dara Meas" });
    addNotif(["driver"], `Assigned for DELIVERY of ${orderId}`, orderId);
    showToast("Delivery driver assigned!");
  };

  const driverDeliveryAction = (orderId, action) => {
    if (action === "accept") {
      updateOrderStatus(orderId, "OUT_FOR_DELIVERY");
      addNotif(["customer"], `Driver on the way to deliver ${orderId}`, orderId);
      showToast("Heading out for delivery!");
    } else {
      updateOrderStatus(orderId, "READY_FOR_DELIVERY", { driver: null });
      addNotif(["shop"], `Driver rejected delivery for ${orderId}. Reassign.`, orderId);
      showToast("Delivery rejected", "error");
    }
  };

  const driverArrivedAtCustomer = (orderId) => {
    updateOrderStatus(orderId, "OUT_FOR_DELIVERY");
    addNotif(["customer"], `Driver arrived at your location for ${orderId}!`, orderId);
    showToast("Arrived at customer!");
  };

  const driverDelivered = (orderId) => {
    updateOrderStatus(orderId, "DELIVERED");
    addNotif(["customer"], `Order ${orderId} delivered. Thank you!`, orderId);
    showToast("Order delivered! 🎉");
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

  const handlers = { shopAction, assignPickupDriver, driverPickupAction, driverPickedUp, driverDeliveredToShop, shopStartWashing, shopReadyForDelivery, assignDeliveryDriver, driverDeliveryAction, driverArrivedAtCustomer, driverDelivered };

  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const visibleOrders = getOrdersForRole();

  return (
    <div style={{ width: 430, minHeight: 935, background: "#f8f7f4", fontFamily: "'Outfit', sans-serif", margin: "0 auto", position: "relative", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Playfair+Display:wght@600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #f1f0ed; }
        ::-webkit-scrollbar-thumb { background: #d4cfc8; border-radius: 3px; }
        .order-card { transition: all 0.2s ease; }
        .role-btn { transition: all 0.15s ease; }
        .action-btn { transition: all 0.15s ease; }
        .action-btn:hover { opacity: 0.85; }
        .modal-overlay { animation: fadeIn 0.2s ease; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .modal-content { animation: slideUp 0.25s ease; }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .toast { animation: toastIn 0.3s ease; }
        @keyframes toastIn { from { transform: translateX(-50%) translateY(20px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }
        input, select, textarea { outline: none; transition: border-color 0.2s; }
        input:focus, select:focus, textarea:focus { border-color: #6366f1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
      `}</style>

      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #ece9e4", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>
        {/* Top bar: Logo + Bell */}
        <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, background: "linear-gradient(135deg, #6366f1, #0ea5e9)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, boxShadow: "0 4px 12px rgba(99,102,241,0.3)" }}>👕</div>
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 18, color: "#1a1714", lineHeight: 1.1 }}>FreshFold</div>
              <div style={{ fontSize: 9, color: "#9ca3af", fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase" }}>Laundry System</div>
            </div>
          </div>

          {/* Bell */}
          <div ref={notifRef} style={{ position: "relative" }}>
            <button onClick={() => { setShowNotif(!showNotif); markRead(); }}
              style={{
                width: 38, height: 38, borderRadius: 10, border: "1px solid #ece9e4",
                background: showNotif ? "#f0f0ff" : "#fff", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, position: "relative",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              }}>
              🔔
              {unreadCount > 0 && (
                <span style={{
                  position: "absolute", top: -4, right: -4,
                  background: "#ef4444", color: "#fff",
                  borderRadius: 20, fontSize: 9, fontWeight: 700,
                  minWidth: 17, height: 17, display: "flex",
                  alignItems: "center", justifyContent: "center",
                  padding: "0 3px", border: "2px solid #fff",
                }}>{unreadCount}</span>
              )}
            </button>

            {showNotif && (
              <div style={{
                position: "absolute", right: 0, top: 46,
                width: 310, background: "#fff", borderRadius: 16,
                boxShadow: "0 12px 48px rgba(0,0,0,0.15)", border: "1px solid #ece9e4",
                overflow: "hidden", zIndex: 200,
              }}>
                <div style={{ padding: "12px 16px", borderBottom: "1px solid #f3f1ee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: "#1a1714" }}>Notifications</span>
                  <span style={{ fontSize: 10, color: "#9ca3af", textTransform: "capitalize" }}>{role}</span>
                </div>
                {currentNotifs.length === 0 ? (
                  <div style={{ padding: "28px 16px", textAlign: "center", color: "#9ca3af", fontSize: 12 }}>
                    <div style={{ fontSize: 28, marginBottom: 6 }}>🔕</div>
                    No notifications yet
                  </div>
                ) : (
                  <div style={{ maxHeight: 280, overflowY: "auto" }}>
                    {currentNotifs.map(n => (
                      <div key={n.id}
                        onClick={() => { const o = orders.find(o => o.id === n.orderId); if (o) setSelectedOrder(o); setShowNotif(false); }}
                        style={{
                          padding: "10px 16px", borderBottom: "1px solid #f8f7f4",
                          cursor: "pointer", background: n.read ? "#fff" : "#f5f4ff",
                        }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: n.read ? "#d4cfc8" : "#6366f1", marginTop: 4, flexShrink: 0 }} />
                          <div>
                            <div style={{ fontSize: 12, color: "#374151", fontWeight: n.read ? 400 : 600, lineHeight: 1.4 }}>{n.msg}</div>
                            <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>{n.time}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Role Switcher — below logo */}
        <div style={{ padding: "0 16px 12px" }}>
          <div style={{ display: "flex", background: "#f3f1ee", borderRadius: 12, padding: 4, gap: 2 }}>
            {ROLES.map(r => (
              <button key={r.id} className="role-btn"
                onClick={() => { setRole(r.id); setSelectedOrder(null); }}
                style={{
                  flex: 1, padding: "8px 4px", borderRadius: 9, border: "none", cursor: "pointer",
                  fontSize: 12, fontWeight: 600, fontFamily: "'Outfit', sans-serif",
                  background: role === r.id ? "#fff" : "transparent",
                  color: role === r.id ? "#1a1714" : "#6b7280",
                  boxShadow: role === r.id ? "0 1px 6px rgba(0,0,0,0.1)" : "none",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                  transition: "all 0.15s",
                }}>
                <span style={{ fontSize: 14 }}>{r.icon}</span>
                <span>{r.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: "16px 14px 100px" }}>

        {/* Detail Panel — slides in as top card */}
        {selectedOrder && (
          <div style={{ background: "#fff", borderRadius: 18, border: "1.5px solid #6366f1", overflow: "hidden", boxShadow: "0 4px 24px rgba(99,102,241,0.12)", marginBottom: 16 }}>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid #f3f1ee", background: "linear-gradient(135deg, #f5f4ff, #f0f9ff)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: "#1a1714" }}>Order Details</div>
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 1 }}>{selectedOrder.id}</div>
              </div>
              <button onClick={() => setSelectedOrder(null)}
                style={{ background: "#fff", border: "1px solid #ece9e4", borderRadius: 8, width: 30, height: 30, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}>
                ✕
              </button>
            </div>

            <div style={{ padding: "14px 16px" }}>
              {/* Status badge */}
              {(() => {
                const st = STATUS_FLOW[selectedOrder.status] || {};
                return (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: st.bg, border: `1px solid ${st.border}`, borderRadius: 8, padding: "6px 12px", marginBottom: 14 }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: st.color }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: st.color }}>{st.label}</span>
                  </div>
                );
              })()}

              {/* Info grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                {[
                  { label: "Customer", value: selectedOrder.customer, icon: "👤" },
                  { label: "Clothes", value: `${selectedOrder.clothesType} × ${selectedOrder.quantity}`, icon: "🧺" },
                  { label: "Address", value: selectedOrder.address, icon: "📍" },
                  { label: "Driver", value: selectedOrder.driver || "Not assigned", icon: "🚗" },
                ].map(item => (
                  <div key={item.label} style={{ background: "#f8f7f4", borderRadius: 9, padding: "8px 10px" }}>
                    <div style={{ fontSize: 9, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>{item.icon} {item.label}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{item.value}</div>
                  </div>
                ))}
              </div>

              {selectedOrder.notes && (
                <div style={{ background: "#fefce8", border: "1px solid #fef08a", borderRadius: 9, padding: "8px 12px", marginBottom: 14 }}>
                  <div style={{ fontSize: 9, color: "#854d0e", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>📝 Notes</div>
                  <div style={{ fontSize: 12, color: "#713f12" }}>{selectedOrder.notes}</div>
                </div>
              )}

              {/* Progress steps — horizontal scroll */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1a1714", marginBottom: 10 }}>Progress</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {STEPS.map((step, i) => {
                    const curStep = STATUS_FLOW[selectedOrder.status]?.step || 1;
                    const done = curStep > i + 1;
                    const active = curStep === i + 1;
                    const isLast = i === STEPS.length - 1;
                    return (
                      <div key={step.key} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                          <div style={{
                            width: 22, height: 22, borderRadius: "50%",
                            background: done ? "#6366f1" : active ? "#0ea5e9" : "#f3f1ee",
                            border: `2px solid ${done ? "#6366f1" : active ? "#0ea5e9" : "#e5e0d9"}`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: done ? 10 : 11, color: done || active ? "#fff" : "#c4bdb5",
                          }}>
                            {done ? "✓" : step.icon}
                          </div>
                          {!isLast && <div style={{ width: 2, height: 12, background: done ? "#6366f1" : "#e5e0d9", marginTop: 2, marginBottom: 2 }} />}
                        </div>
                        <div style={{ paddingTop: 2 }}>
                          <div style={{ fontSize: 12, fontWeight: active ? 700 : 400, color: done ? "#6366f1" : active ? "#0ea5e9" : "#9ca3af" }}>{step.label}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Activity Log */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1a1714", marginBottom: 10 }}>Activity Log</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[...selectedOrder.history].reverse().map((h, i) => {
                    const st = STATUS_FLOW[h.status] || {};
                    const isFirst = i === 0;
                    return (
                      <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: isFirst ? st.color || "#6366f1" : "#d4cfc8", flexShrink: 0, marginTop: 4 }} />
                        <div>
                          <div style={{ fontSize: 12, fontWeight: isFirst ? 700 : 400, color: isFirst ? st.color || "#1a1714" : "#374151" }}>{st.label || h.status}</div>
                          <div style={{ fontSize: 10, color: "#9ca3af" }}>{h.time}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Page header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: "#1a1714", marginBottom: 2 }}>
              {role === "customer" && "My Orders"}
              {role === "shop" && "Shop Dashboard"}
              {role === "driver" && "My Jobs"}
            </h1>
            <p style={{ fontSize: 12, color: "#6b7280" }}>{visibleOrders.length} order{visibleOrders.length !== 1 ? "s" : ""}</p>
          </div>
          {role === "customer" && (
            <button onClick={() => setShowCreateModal(true)}
              style={{
                background: "linear-gradient(135deg, #6366f1, #0ea5e9)",
                color: "#fff", border: "none", borderRadius: 10,
                padding: "10px 16px", fontSize: 13, fontWeight: 700,
                cursor: "pointer", fontFamily: "'Outfit', sans-serif",
                boxShadow: "0 4px 16px rgba(99,102,241,0.35)",
                display: "flex", alignItems: "center", gap: 6,
              }}>
              <span style={{ fontSize: 16 }}>+</span> New Order
            </button>
          )}
        </div>

        {/* Shop stats */}
        {role === "shop" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            {[
              { label: "Pending", status: "PENDING", icon: "⏳", color: "#d97706", bg: "#fef9ee", border: "#fcd34d" },
              { label: "Washing", status: "WASHING", icon: "🫧", color: "#0891b2", bg: "#f0fdfe", border: "#67e8f9" },
              { label: "Ready", status: "READY_FOR_DELIVERY", icon: "✨", color: "#059669", bg: "#f0fdf4", border: "#6ee7b7" },
              { label: "Delivered", status: "DELIVERED", icon: "📦", color: "#4f46e5", bg: "#f5f3ff", border: "#a5b4fc" },
            ].map(stat => (
              <div key={stat.status} style={{ background: stat.bg, borderRadius: 12, padding: "12px 14px", border: `1px solid ${stat.border}`, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ fontSize: 22 }}>{stat.icon}</div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: stat.color, lineHeight: 1 }}>{orders.filter(o => o.status === stat.status).length}</div>
                  <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 500, marginTop: 1 }}>{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Orders List */}
        {visibleOrders.length === 0 ? (
          <div style={{ background: "#fff", borderRadius: 16, padding: "48px 24px", textAlign: "center", border: "1px solid #ece9e4" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>👕</div>
            <div style={{ fontWeight: 700, color: "#374151", fontSize: 16, marginBottom: 4 }}>No orders yet</div>
            <div style={{ color: "#9ca3af", fontSize: 13 }}>
              {role === "customer" ? "Create your first laundry order!" : "Orders assigned to you will appear here."}
            </div>
            {role === "customer" && (
              <button onClick={() => setShowCreateModal(true)}
                style={{ marginTop: 16, background: "linear-gradient(135deg, #6366f1, #0ea5e9)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>
                + Create Order
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {visibleOrders.map(order => {
              const st = STATUS_FLOW[order.status] || {};
              const isSelected = selectedOrder?.id === order.id;
              const progress = ((st.step || 1) / 11) * 100;
              return (
                <div key={order.id} className="order-card"
                  onClick={() => setSelectedOrder(isSelected ? null : order)}
                  style={{
                    background: "#fff", borderRadius: 14, padding: "14px 14px",
                    border: isSelected ? "2px solid #6366f1" : "1px solid #ece9e4",
                    cursor: "pointer",
                    boxShadow: isSelected ? "0 4px 20px rgba(99,102,241,0.12)" : "0 1px 4px rgba(0,0,0,0.04)",
                  }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: "#1a1714" }}>{order.id}</span>
                        <span style={{
                          background: st.bg, color: st.color,
                          fontSize: 10, fontWeight: 700,
                          padding: "2px 8px", borderRadius: 20,
                          border: `1px solid ${st.border}`,
                          whiteSpace: "nowrap",
                        }}>{st.label}</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: 12, color: "#6b7280" }}>
                        <span>🧺 {order.clothesType} × {order.quantity}</span>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📍 {order.address}</span>
                        {order.driver && <span style={{ color: "#6366f1", fontWeight: 600 }}>🚗 {order.driver}</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 10 }}>
                      <div style={{ fontSize: 11, color: "#9ca3af" }}>{order.createdAt}</div>
                      <div style={{ fontSize: 10, color: "#d4cfc8", marginTop: 2 }}>{st.step || 1}/11</div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ height: 3, background: "#f3f1ee", borderRadius: 4, overflow: "hidden", marginBottom: 10 }}>
                    <div style={{
                      height: "100%",
                      background: order.status === "REJECTED" ? "#ef4444" : "linear-gradient(90deg, #6366f1, #0ea5e9)",
                      borderRadius: 4, width: `${progress}%`, transition: "width 0.5s ease",
                    }} />
                  </div>

                  <div onClick={e => e.stopPropagation()}>
                    <ActionButtons order={order} role={role} handlers={handlers} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Order Modal */}
      {showCreateModal && (
        <div className="modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", zIndex: 500, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div className="modal-content" style={{ background: "#fff", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 430, boxShadow: "0 -8px 40px rgba(0,0,0,0.2)", overflow: "hidden", maxHeight: "90vh", overflowY: "auto" }}>
            {/* Handle */}
            <div style={{ width: 36, height: 4, background: "#e5e7eb", borderRadius: 4, margin: "12px auto 0" }} />

            <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f1ee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "#1a1714" }}>New Order</div>
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 1 }}>Fill in your laundry details</div>
              </div>
              <button onClick={() => setShowCreateModal(false)}
                style={{ background: "#f3f1ee", border: "none", borderRadius: 8, width: 30, height: 30, cursor: "pointer", fontSize: 14, color: "#6b7280", display: "flex", alignItems: "center", justifyContent: "center" }}>
                ✕
              </button>
            </div>

            <div style={{ padding: "20px 20px 32px", display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#374151", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Clothes Type</label>
                  <select value={newOrder.clothesType} onChange={e => setNewOrder(p => ({ ...p, clothesType: e.target.value }))}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #ece9e4", fontSize: 13, background: "#fff", color: "#1a1714", fontFamily: "'Outfit', sans-serif" }}>
                    {CLOTHES_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#374151", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Qty</label>
                  <input type="number" min={1} value={newOrder.quantity} onChange={e => setNewOrder(p => ({ ...p, quantity: parseInt(e.target.value) || 1 }))}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #ece9e4", fontSize: 13, fontFamily: "'Outfit', sans-serif" }} />
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#374151", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Pickup Address <span style={{ color: "#ef4444" }}>*</span></label>
                <input type="text" placeholder="e.g. Street 271, BKK1, Phnom Penh" value={newOrder.address} onChange={e => setNewOrder(p => ({ ...p, address: e.target.value }))}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #ece9e4", fontSize: 13, fontFamily: "'Outfit', sans-serif" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#374151", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Special Instructions</label>
                <textarea value={newOrder.notes} onChange={e => setNewOrder(p => ({ ...p, notes: e.target.value }))} rows={3} placeholder="e.g. No bleach, use warm water..."
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #ece9e4", fontSize: 13, fontFamily: "'Outfit', sans-serif", resize: "vertical" }} />
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button onClick={() => setShowCreateModal(false)}
                  style={{ flex: 1, padding: "12px", borderRadius: 10, border: "1.5px solid #ece9e4", background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit', sans-serif", color: "#6b7280" }}>
                  Cancel
                </button>
                <button onClick={createOrder}
                  style={{ flex: 2, padding: "12px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #6366f1, #0ea5e9)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit', sans-serif", boxShadow: "0 4px 16px rgba(99,102,241,0.3)" }}>
                  Place Order →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="toast" style={{
          position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
          background: "#fff",
          border: `1.5px solid ${toast.type === "error" ? "#fca5a5" : "#86efac"}`,
          color: toast.type === "error" ? "#dc2626" : "#15803d",
          borderRadius: 12, padding: "10px 18px", fontSize: 12, fontWeight: 600,
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)", zIndex: 999,
          display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap",
        }}>
          {toast.type === "error" ? "❌" : "✅"} {toast.msg}
        </div>
      )}
    </div>
  );
}

function ActionButtons({ order, role, handlers }) {
  const { status } = order;

  const btn = (label, onClick, variant = "primary") => {
    const styles = {
      primary: { bg: "linear-gradient(135deg, #6366f1, #0ea5e9)", color: "#fff", border: "none", shadow: "0 2px 8px rgba(99,102,241,0.25)" },
      success: { bg: "#f0fdf4", color: "#15803d", border: "1px solid #86efac", shadow: "none" },
      danger: { bg: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5", shadow: "none" },
      purple: { bg: "#f5f3ff", color: "#4f46e5", border: "1px solid #a5b4fc", shadow: "none" },
      cyan: { bg: "#ecfeff", color: "#0891b2", border: "1px solid #67e8f9", shadow: "none" },
    };
    const s = styles[variant] || styles.primary;
    return (
      <button key={label} onClick={onClick} className="action-btn"
        style={{
          padding: "7px 12px", borderRadius: 8,
          background: s.bg, color: s.color, border: s.border,
          fontSize: 11, fontWeight: 700, cursor: "pointer",
          fontFamily: "'Outfit', sans-serif", whiteSpace: "nowrap",
          boxShadow: s.shadow,
        }}>
        {label}
      </button>
    );
  };

  const actions = [];
  if (role === "shop") {
    if (status === "PENDING") {
      actions.push(btn("✅ Accept", () => handlers.shopAction(order.id, "accept"), "success"));
      actions.push(btn("❌ Reject", () => handlers.shopAction(order.id, "reject"), "danger"));
    }
    if (status === "ACCEPTED") actions.push(btn("🚗 Assign Pickup Driver", () => handlers.assignPickupDriver(order.id), "purple"));
    if (status === "DELIVERED_TO_SHOP") actions.push(btn("🫧 Start Washing", () => handlers.shopStartWashing(order.id), "cyan"));
    if (status === "WASHING") actions.push(btn("✨ Mark Ready", () => handlers.shopReadyForDelivery(order.id), "success"));
    if (status === "READY_FOR_DELIVERY") actions.push(btn("🚗 Assign Delivery Driver", () => handlers.assignDeliveryDriver(order.id), "purple"));
  }
  if (role === "driver") {
    if (status === "PICKUP_ASSIGNED") {
      actions.push(btn("✅ Accept Pickup", () => handlers.driverPickupAction(order.id, "accept"), "success"));
      actions.push(btn("❌ Reject", () => handlers.driverPickupAction(order.id, "reject"), "danger"));
    }
    if (status === "OUT_FOR_PICKUP") actions.push(btn("📦 Mark Picked Up", () => handlers.driverPickedUp(order.id), "primary"));
    if (status === "PICKED_UP") actions.push(btn("🏪 Delivered to Shop", () => handlers.driverDeliveredToShop(order.id), "cyan"));
    if (status === "DELIVERY_ASSIGNED") {
      actions.push(btn("✅ Accept Delivery", () => handlers.driverDeliveryAction(order.id, "accept"), "success"));
      actions.push(btn("❌ Reject", () => handlers.driverDeliveryAction(order.id, "reject"), "danger"));
    }
    if (status === "OUT_FOR_DELIVERY") {
      actions.push(btn("📍 Arrived", () => handlers.driverArrivedAtCustomer(order.id), "purple"));
      actions.push(btn("✅ Delivered!", () => handlers.driverDelivered(order.id), "success"));
    }
  }

  if (actions.length === 0) return null;
  return <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 2 }}>{actions}</div>;
}