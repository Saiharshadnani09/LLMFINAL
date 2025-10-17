import React from "react";

function AuthBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
      {/* Subtle gradient blobs */}
      <div className="blob blobPulse" style={{
        top: "-10%",
        left: "-10%",
        width: "420px",
        height: "420px",
        // PeopleTech maroon (#a71e38)
        background: "radial-gradient(closest-side, rgba(167,30,56,0.28), rgba(167,30,56,0))"
      }} />
      <div className="blob blobPulse" style={{
        bottom: "-12%",
        right: "-8%",
        width: "520px",
        height: "520px",
        animationDelay: "-4s",
        // Subtle amber accent (#f59e0b)
        background: "radial-gradient(closest-side, rgba(245,158,11,0.18), rgba(245,158,11,0))"
      }} />
      <div className="blob blobPulse" style={{
        top: "20%",
        right: "30%",
        width: "380px",
        height: "380px",
        animationDelay: "-8s",
        // Neutral slate to complement black/white UI (#0f172a ~ slate-900)
        background: "radial-gradient(closest-side, rgba(15,23,42,0.18), rgba(15,23,42,0))"
      }} />
    </div>
  );
}

export default AuthBackground;


