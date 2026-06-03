"use client";

export default function SidebarOverlay() {
  const handleDismiss = () => {
    document.body.classList.remove("sidebar-open");
  };

  return (
    <div
      className="admin-sidebar-overlay"
      onClick={handleDismiss}
      style={{ cursor: "pointer" }}
    />
  );
}
