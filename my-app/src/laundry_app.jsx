import { useState, useEffect, useRef } from "react";

const STATUS_FLOW = {
  PENDING: { label: "Pending", color: "#f59e0b", bg: "#fef3c7", step: 1 },
  ACCEPTED: { label: "Accepted", color: "#10b981", bg: "#d1fae5", step: 2 },
  REJECTED: { label: "Rejected", color: "#ef4444", bg: "#fee2e2", step: 2 },
  PICKUP_ASSIGNED: { label: "Pickup Assigned", color: "#6366f1", bg: "#ede9fe", step: 3 },
  OUT_FOR_PICKUP: { label: "Out for Pickup", color: "#8b5cf6", bg: "#ede9fe", step: 4 },
  PICKED_UP: { label: "Picked Up", color: "#0ea5e9", bg: "#e0f2fe", step: 5 },
  DELIVERED_TO_SHOP: { label: "At Shop", color: "#0284c7", bg: "#e0f2fe", step: 6 },
  WASHING: { label: "Washing", color: "#06b6d4", bg: "#cffafe", step: 7 },
  READY_FOR_DELIVERY: { label: "Ready", color: "#10b981", bg: "#d1fae5", step: 8 },
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
function generateId() { return `ORD-${orderIdCounter++}`; }

const CLOTHES_TYPES = ["Shirts", "Pants", "Dresses", "Jackets", "Bedsheets", "Towels", "Uniforms", "Mixed"];

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

  // Phone shell wrapper
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#e2e8f0", padding: 20, fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Fraunces:wght@400;600;700&display=swap" rel="stylesheet" />

      {/* Phone shell */}
      <div style={{ width: 390, height: 844, background: "#f0f4f8", borderRadius: 44, boxShadow: "0 40px 80px rgba(0,0,0,0.25), 0 0 0 10px #1e293b, inset 0 0 0 2px #334155", overflow: "hidden", position: "relative", display: "flex", flexDirection: "column" }}>

        {/* Status bar */}
        <div style={{ background: "#fff", padding: "12px 24px 8px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>9:41</span>
          <div style={{ width: 120, height: 26, background: "#0f172a", borderRadius: 20, flexShrink: 0 }} />
          <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
            <span style={{ fontSize: 11 }}>●●●</span>
            <span style={{ fontSize: 11 }}>📶</span>
            <span style={{ fontSize: 11 }}>🔋</span>
          </div>
        </div>

        {/* Header */}
        <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 30, height: 30, background: "linear-gradient(135deg, #0ea5e9, #6366f1)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>👕</div>
            <div>
              <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 16, color: "#0f172a", lineHeight: 1 }}>FreshFold</div>
              <div style={{ fontSize: 9, color: "#64748b", fontWeight: 500 }}>Laundry System</div>
            </div>
          </div>

          {/* Notification Bell */}
          <div ref={notifRef} style={{ position: "relative" }}>
            <button onClick={() => { setShowNotif(!showNotif); markRead(); }}
              style={{ background: showNotif ? "#e0f2fe" : "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, width: 36, height: 36, cursor: "pointer", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
              🔔
              {unreadCount > 0 && (
                <span style={{ position: "absolute", top: -3, right: -3, background: "#ef4444", color: "#fff", borderRadius: 20, fontSize: 9, fontWeight: 700, minWidth: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px" }}>
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotif && (
              <div style={{ position: "absolute", right: 0, top: 42, width: 300, background: "#fff", borderRadius: 14, boxShadow: "0 8px 32px rgba(0,0,0,0.15)", border: "1px solid #e2e8f0", overflow: "hidden", zIndex: 200 }}>
                <div style={{ padding: "12px 14px", borderBottom: "1px solid #f1f5f9", fontWeight: 700, fontSize: 13, color: "#0f172a" }}>Notifications</div>
                {currentNotifs.length === 0 ? (
                  <div style={{ padding: 20, textAlign: "center", color: "#94a3b8", fontSize: 12 }}>No notifications yet</div>
                ) : (
                  <div style={{ maxHeight: 260, overflowY: "auto" }}>
                    {currentNotifs.map(n => (
                      <div key={n.id} onClick={() => { const o = orders.find(o => o.id === n.orderId); if (o) setSelectedOrder(o); setShowNotif(false); }}
                        style={{ padding: "10px 14px", borderBottom: "1px solid #f8fafc", cursor: "pointer", background: n.read ? "#fff" : "#f0f9ff" }}>
                        <div style={{ fontSize: 12, color: "#334155", fontWeight: n.read ? 400 : 600 }}>{n.msg}</div>
                        <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{n.time}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Role Switcher */}
        <div style={{ background: "#fff", padding: "8px 12px", borderBottom: "1px solid #e2e8f0", flexShrink: 0 }}>
          <div style={{ display: "flex", background: "#f1f5f9", borderRadius: 10, padding: 3, gap: 2 }}>
            {[
              { id: "customer", icon: "👤", label: "Customer" },
              { id: "shop", icon: "🏪", label: "Shop" },
              { id: "driver", icon: "🚗", label: "Driver" },
            ].map(r => (
              <button key={r.id} onClick={() => { setRole(r.id); setSelectedOrder(null); }}
                style={{ flex: 1, padding: "7px 4px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s",
                  background: role === r.id ? "#fff" : "transparent",
                  color: role === r.id ? "#0f172a" : "#64748b",
                  boxShadow: role === r.id ? "0 1px 4px rgba(0,0,0,0.1)" : "none"
                }}>
                <div>{r.icon}</div>
                <div>{r.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 12px 20px" }}>

          {/* Top bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 700, margin: 0, color: "#0f172a" }}>
                {role === "customer" && "My Orders"}
                {role === "shop" && "Shop Dashboard"}
                {role === "driver" && "My Jobs"}
              </h1>
              <p style={{ margin: "2px 0 0", fontSize: 11, color: "#64748b" }}>
                {getOrdersForRole().length} order{getOrdersForRole().length !== 1 ? "s" : ""}
              </p>
            </div>
            {role === "customer" && (
              <button onClick={() => setShowCreateModal(true)}
                style={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)", color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", boxShadow: "0 4px 10px rgba(14,165,233,0.3)" }}>
                + New Order
              </button>
            )}
          </div>

          {/* Stats row for shop */}
          {role === "shop" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 12 }}>
              {[
                { label: "Pending", status: "PENDING", icon: "⏳", color: "#f59e0b", bg: "#fef9ee" },
                { label: "Washing", status: "WASHING", icon: "🫧", color: "#06b6d4", bg: "#f0fdfe" },
                { label: "Ready", status: "READY_FOR_DELIVERY", icon: "✅", color: "#10b981", bg: "#f0fdf4" },
                { label: "Done", status: "DELIVERED", icon: "📦", color: "#6366f1", bg: "#f5f3ff" },
              ].map(stat => (
                <div key={stat.status} style={{ background: stat.bg, borderRadius: 10, padding: "10px 8px", border: `1px solid ${stat.color}22`, textAlign: "center" }}>
                  <div style={{ fontSize: 16 }}>{stat.icon}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: stat.color }}>{orders.filter(o => o.status === stat.status).length}</div>
                  <div style={{ fontSize: 9, color: "#64748b", fontWeight: 500 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Orders list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {getOrdersForRole().length === 0 ? (
              <div style={{ background: "#fff", borderRadius: 14, padding: 36, textAlign: "center", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>👕</div>
                <div style={{ fontWeight: 600, color: "#334155", fontSize: 14 }}>No orders yet</div>
                <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 3 }}>
                  {role === "customer" ? "Create your first order!" : "Orders will appear here"}
                </div>
              </div>
            ) : (
              getOrdersForRole().map(order => {
                const st = STATUS_FLOW[order.status] || {};
                const isSelected = selectedOrder?.id === order.id;
                return (
                  <div key={order.id}>
                    <div onClick={() => setSelectedOrder(isSelected ? null : order)}
                      style={{ background: "#fff", borderRadius: 14, padding: 14, border: isSelected ? "2px solid #0ea5e9" : "1px solid #e2e8f0", cursor: "pointer", transition: "all 0.2s", boxShadow: isSelected ? "0 4px 16px rgba(14,165,233,0.12)" : "0 1px 4px rgba(0,0,0,0.04)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                            <span style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>{order.id}</span>
                            <span style={{ background: st.bg, color: st.color, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>{st.label}</span>
                          </div>
                          <div style={{ fontSize: 11, color: "#64748b" }}>
                            🧺 {order.clothesType} · ×{order.quantity} · 📍 {order.address}
                          </div>
                          {order.driver && (
                            <div style={{ fontSize: 11, color: "#6366f1", marginTop: 3, fontWeight: 500 }}>🚗 {order.driver}</div>
                          )}
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontSize: 10, color: "#94a3b8" }}>{order.createdAt}</div>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div style={{ height: 3, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ height: "100%", background: "linear-gradient(90deg, #0ea5e9, #6366f1)", borderRadius: 4, width: `${((st.step || 1) / 11) * 100}%`, transition: "width 0.5s ease" }} />
                      </div>

                      {/* Quick Actions */}
                      <div onClick={e => e.stopPropagation()} style={{ marginTop: 10 }}>
                        <ActionButtons order={order} role={role} handlers={handlers} />
                      </div>
                    </div>

                    {/* Inline detail panel when selected */}
                    {isSelected && (
                      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden", marginTop: 8, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                        <div style={{ padding: "12px 14px", borderBottom: "1px solid #f1f5f9", background: "linear-gradient(135deg, #f0f9ff, #f5f3ff)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>Order Details</div>
                          <button onClick={() => setSelectedOrder(null)} style={{ background: "#f1f5f9", border: "none", borderRadius: 6, width: 24, height: 24, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                        </div>

                        <div style={{ padding: 14 }}>
                          {/* Info grid */}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                            {[
                              { label: "Customer", value: selectedOrder.customer },
                              { label: "Clothes", value: `${selectedOrder.clothesType} ×${selectedOrder.quantity}` },
                              { label: "Address", value: selectedOrder.address },
                              { label: "Driver", value: selectedOrder.driver || "Not assigned" },
                            ].map(item => (
                              <div key={item.label} style={{ background: "#f8fafc", borderRadius: 8, padding: "8px 10px" }}>
                                <div style={{ fontSize: 9, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>{item.label}</div>
                                <div style={{ fontSize: 11, fontWeight: 600, color: "#334155", marginTop: 1 }}>{item.value}</div>
                              </div>
                            ))}
                          </div>

                          {selectedOrder.notes && (
                            <div style={{ background: "#fef9c3", borderRadius: 8, padding: "8px 10px", marginBottom: 12 }}>
                              <div style={{ fontSize: 9, color: "#854d0e", fontWeight: 600 }}>NOTES</div>
                              <div style={{ fontSize: 11, color: "#713f12" }}>{selectedOrder.notes}</div>
                            </div>
                          )}

                          {/* Timeline */}
                          <div style={{ marginBottom: 14 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>Timeline</div>
                            {selectedOrder.history.map((h, i) => {
                              const st = STATUS_FLOW[h.status] || {};
                              const isLast = i === selectedOrder.history.length - 1;
                              return (
                                <div key={i} style={{ display: "flex", gap: 10, marginBottom: isLast ? 0 : 12, position: "relative" }}>
                                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: isLast ? st.color || "#0ea5e9" : "#cbd5e1", flexShrink: 0, marginTop: 3 }} />
                                    {!isLast && <div style={{ width: 2, flex: 1, background: "#e2e8f0", marginTop: 2 }} />}
                                  </div>
                                  <div style={{ paddingBottom: isLast ? 0 : 4 }}>
                                    <div style={{ fontSize: 12, fontWeight: isLast ? 700 : 500, color: isLast ? st.color || "#0f172a" : "#475569" }}>{st.label || h.status}</div>
                                    <div style={{ fontSize: 10, color: "#94a3b8" }}>{h.time}</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Progress steps */}
                          <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 12 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>Progress</div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                              {STEPS.slice(0, 7).map((step, i) => {
                                const curStep = STATUS_FLOW[selectedOrder.status]?.step || 1;
                                const done = curStep > i + 1;
                                const active = curStep === i + 1;
                                return (
                                  <div key={step.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <div style={{ width: 16, height: 16, borderRadius: "50%", background: done ? "#10b981" : active ? "#0ea5e9" : "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                      {done ? <span style={{ color: "#fff", fontSize: 8 }}>✓</span> : <span style={{ width: 5, height: 5, borderRadius: "50%", background: active ? "#fff" : "#cbd5e1", display: "block" }} />}
                                    </div>
                                    <span style={{ fontSize: 11, color: done ? "#10b981" : active ? "#0ea5e9" : "#94a3b8", fontWeight: active ? 700 : 500 }}>{step.label}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Create Order Modal - inside phone */}
        {showCreateModal && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,0.5)", zIndex: 300, display: "flex", alignItems: "flex-end" }}>
            <div style={{ background: "#fff", borderRadius: "20px 20px 0 0", width: "100%", boxShadow: "0 -8px 40px rgba(0,0,0,0.2)", overflow: "hidden", maxHeight: "85%" }}>
              {/* Handle */}
              <div style={{ padding: "12px 0 4px", display: "flex", justifyContent: "center" }}>
                <div style={{ width: 40, height: 4, background: "#e2e8f0", borderRadius: 4 }} />
              </div>
              <div style={{ padding: "0 20px 14px", borderBottom: "1px solid #f1f5f9" }}>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 700, color: "#0f172a" }}>New Order</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>Fill in your details</div>
              </div>
              <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 }}>Clothes Type</label>
                  <select value={newOrder.clothesType} onChange={e => setNewOrder(p => ({ ...p, clothesType: e.target.value }))}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 13, background: "#fff", color: "#0f172a", fontFamily: "'DM Sans', sans-serif" }}>
                    {CLOTHES_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 }}>Quantity (pieces)</label>
                  <input type="number" min={1} value={newOrder.quantity} onChange={e => setNewOrder(p => ({ ...p, quantity: parseInt(e.target.value) || 1 }))}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 13, fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 }}>Pickup Address *</label>
                  <input type="text" placeholder="e.g. Street 271, BKK1" value={newOrder.address} onChange={e => setNewOrder(p => ({ ...p, address: e.target.value }))}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 13, fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 }}>Special Instructions</label>
                  <textarea value={newOrder.notes} onChange={e => setNewOrder(p => ({ ...p, notes: e.target.value }))} rows={2} placeholder="e.g. No bleach..."
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 13, fontFamily: "'DM Sans', sans-serif", resize: "none", boxSizing: "border-box" }} />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setShowCreateModal(false)}
                    style={{ flex: 1, padding: "12px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", color: "#64748b" }}>
                    Cancel
                  </button>
                  <button onClick={createOrder}
                    style={{ flex: 2, padding: "12px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #0ea5e9, #6366f1)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", boxShadow: "0 4px 12px rgba(14,165,233,0.3)" }}>
                    Place Order
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div style={{ position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)", background: toast.type === "error" ? "#fef2f2" : "#f0fdf4", border: `1px solid ${toast.type === "error" ? "#fca5a5" : "#86efac"}`, color: toast.type === "error" ? "#b91c1c" : "#15803d", borderRadius: 10, padding: "10px 16px", fontSize: 12, fontWeight: 600, boxShadow: "0 6px 20px rgba(0,0,0,0.1)", zIndex: 999, whiteSpace: "nowrap" }}>
            {toast.type === "error" ? "❌" : "✅"} {toast.msg}
          </div>
        )}
      </div>
    </div>
  );
}

function ActionButtons({ order, role, handlers }) {
  const { status } = order;
  const btn = (label, onClick, color = "#0ea5e9", bg = "#e0f2fe") => (
    <button onClick={onClick}
      style={{ padding: "6px 10px", borderRadius: 7, border: "none", background: bg, color, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" }}>
      {label}
    </button>
  );

  const actions = [];

  if (role === "shop") {
    if (status === "PENDING") {
      actions.push(btn("✅ Accept", () => handlers.shopAction(order.id, "accept"), "#10b981", "#d1fae5"));
      actions.push(btn("❌ Reject", () => handlers.shopAction(order.id, "reject"), "#ef4444", "#fee2e2"));
    }
    if (status === "ACCEPTED") actions.push(btn("🚗 Assign Pickup", () => handlers.assignPickupDriver(order.id), "#6366f1", "#ede9fe"));
    if (status === "DELIVERED_TO_SHOP") actions.push(btn("🫧 Start Washing", () => handlers.shopStartWashing(order.id), "#06b6d4", "#cffafe"));
    if (status === "WASHING") actions.push(btn("✅ Ready", () => handlers.shopReadyForDelivery(order.id), "#10b981", "#d1fae5"));
    if (status === "READY_FOR_DELIVERY") actions.push(btn("🚗 Assign Delivery", () => handlers.assignDeliveryDriver(order.id), "#6366f1", "#ede9fe"));
  }

  if (role === "driver") {
    if (status === "PICKUP_ASSIGNED") {
      actions.push(btn("✅ Accept Pickup", () => handlers.driverPickupAction(order.id, "accept"), "#10b981", "#d1fae5"));
      actions.push(btn("❌ Reject", () => handlers.driverPickupAction(order.id, "reject"), "#ef4444", "#fee2e2"));
    }
    if (status === "OUT_FOR_PICKUP") actions.push(btn("📦 Picked Up", () => handlers.driverPickedUp(order.id), "#0ea5e9", "#e0f2fe"));
    if (status === "PICKED_UP") actions.push(btn("🏪 At Shop", () => handlers.driverDeliveredToShop(order.id), "#0284c7", "#e0f2fe"));
    if (status === "DELIVERY_ASSIGNED") {
      actions.push(btn("✅ Accept Delivery", () => handlers.driverDeliveryAction(order.id, "accept"), "#10b981", "#d1fae5"));
      actions.push(btn("❌ Reject", () => handlers.driverDeliveryAction(order.id, "reject"), "#ef4444", "#fee2e2"));
    }
    if (status === "OUT_FOR_DELIVERY") {
      actions.push(btn("📍 Arrived", () => handlers.driverArrivedAtCustomer(order.id), "#8b5cf6", "#ede9fe"));
      actions.push(btn("✅ Delivered", () => handlers.driverDelivered(order.id), "#10b981", "#d1fae5"));
    }
  }

  if (actions.length === 0) return null;
  return <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>{actions}</div>;
}
