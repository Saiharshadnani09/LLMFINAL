import React, { useEffect, useRef } from "react";

// Professional, subtle particle field with smooth motion
function ParticlesBackground() {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
      initParticles();
    };

    const colors = [
      "rgba(167,30,56,0.75)", // maroon
      "rgba(245,158,11,0.8)", // amber
      "rgba(15,23,42,0.6)",   // slate
    ];

    const particles = [];
    const numParticles = 140; // more visible
    const maxSpeed = 0.7; // faster
    const connectDist = 160; // longer links

    function initParticles() {
      particles.length = 0;
      for (let i = 0; i < numParticles; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * maxSpeed,
          vy: (Math.random() - 0.5) * maxSpeed,
          r: 1.2 + Math.random() * 1.8,
          c: colors[(Math.random() * colors.length) | 0],
        });
      }
    }

    function step() {
      ctx.clearRect(0, 0, width, height);

      // draw connections first for layering
      ctx.lineWidth = 1;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < connectDist) {
            const alpha = 1 - dist / connectDist;
            ctx.strokeStyle = `rgba(167,30,56,${0.12 * alpha})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // draw particles
      for (let p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        // glow effect
        ctx.fillStyle = p.c;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(step);
    }

    initParticles();
    rafRef.current = requestAnimationFrame(step);
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-0">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}

export default ParticlesBackground;


