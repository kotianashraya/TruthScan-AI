import { useEffect, useRef, useState } from 'react';

interface Particle {
  x: number;
  y: number;
  z: number;
  color: string;
}

export default function AICoreSphere() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hovered, setHovered] = useState(false);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = canvas.width;
    let height = canvas.height;

    // Resize handler
    const handleResize = () => {
      if (!containerRef.current || !canvas) return;
      const rect = containerRef.current.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width;
      canvas.height = height;
    };

    handleResize();
    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Generate sphere particles using Fibonacci spiral
    const particleCount = 180;
    const particles: Particle[] = [];
    const r = Math.min(width, height) * 0.35 || 120; // sphere radius

    for (let i = 0; i < particleCount; i++) {
      const phi = Math.acos(-1 + (2 * i) / particleCount);
      const theta = Math.sqrt(particleCount * Math.PI) * phi;

      // 3D sphere coordinates
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      // Cyberpunk cyan/violet gradient colors
      const color = i % 2 === 0 ? 'rgba(6, 182, 212, ' : 'rgba(139, 92, 246, ';
      particles.push({ x, y, z, color });
    }

    let angleX = 0.003;
    let angleY = 0.005;

    // Mouse move tracking
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      // Normalized mouse coordinates from -1 to 1
      mouseRef.current.targetX = (e.clientX - cx) / (rect.width / 2);
      mouseRef.current.targetY = (e.clientY - cy) / (rect.height / 2);
    };

    const handleMouseLeave = () => {
      mouseRef.current.targetX = 0;
      mouseRef.current.targetY = 0;
      setHovered(false);
    };

    const handleMouseEnter = () => {
      setHovered(true);
    };

    window.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('mouseenter', handleMouseEnter);

    const focalLength = 400;

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse damping
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      // Dynamic rotation angle based on mouse
      const currentAngleX = angleX + mouseRef.current.y * 0.015;
      const currentAngleY = angleY + mouseRef.current.x * 0.015;

      const cosX = Math.cos(currentAngleX);
      const sinX = Math.sin(currentAngleX);
      const cosY = Math.cos(currentAngleY);
      const sinY = Math.sin(currentAngleY);

      // Project and draw particles
      const projected: { sx: number; sy: number; sz: number; color: string; alpha: number }[] = [];

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Rotate Y
        let x1 = p.x * cosY - p.z * sinY;
        let z1 = p.z * cosY + p.x * sinY;

        // Rotate X
        let y2 = p.y * cosX - z1 * sinX;
        let z2 = z1 * cosX + p.y * sinX;

        // Save current rotated positions back incrementally to maintain spin
        p.x = x1;
        p.y = y2;
        p.z = z2;

        // 3D perspective projection
        const scale = focalLength / (focalLength + z2);
        const sx = width / 2 + x1 * scale;
        const sy = height / 2 + y2 * scale;

        // Calculate opacity based on depth (z-coordinate)
        const alpha = Math.max(0.1, Math.min(1, (r - z2) / (2 * r)));

        projected.push({ sx, sy, sz: z2, color: p.color, alpha });
      }

      // Draw neural connections (lines) between close projected points
      const maxDistance = 45;
      ctx.lineWidth = 0.5;

      for (let i = 0; i < projected.length; i++) {
        const p1 = projected[i];
        for (let j = i + 1; j < projected.length; j++) {
          const p2 = projected[j];
          const dx = p1.sx - p2.sx;
          const dy = p1.sy - p2.sy;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDistance) {
            // Combined opacity based on average depth
            const alpha = ((p1.alpha + p2.alpha) / 2) * (1 - dist / maxDistance) * 0.35;
            ctx.strokeStyle = p1.color.includes('182') 
              ? `rgba(6, 182, 212, ${alpha})` 
              : `rgba(139, 92, 246, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(p1.sx, p1.sy);
            ctx.lineTo(p2.sx, p2.sy);
            ctx.stroke();
          }
        }
      }

      // Sort projected points by depth (back to front) to draw dots correctly
      projected.sort((a, b) => b.sz - a.sz);

      // Draw particle dots
      for (let i = 0; i < projected.length; i++) {
        const p = projected[i];
        const dotSize = Math.max(1, (3 - p.sz / 100) * (hovered ? 1.3 : 1));

        ctx.fillStyle = `${p.color}${p.alpha * (hovered ? 0.95 : 0.75)})`;
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, dotSize, 0, Math.PI * 2);
        ctx.fill();

        // Draw outer subtle glow for front particles
        if (p.sz < -50) {
          ctx.shadowBlur = 10;
          ctx.shadowColor = p.color.includes('182') ? '#06b6d4' : '#8b5cf6';
          ctx.fillStyle = `${p.color}${p.alpha * 0.4})`;
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, dotSize * 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0; // reset
        }
      }

      // Draw central core source light
      const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, r * 0.45);
      gradient.addColorStop(0, 'rgba(6, 182, 212, 0.12)');
      gradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.05)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, r * 0.45, 0, Math.PI * 2);
      ctx.fill();

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('mouseenter', handleMouseEnter);
      resizeObserver.disconnect();
    };
  }, [hovered]);

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[300px] md:min-h-[400px] flex items-center justify-center">
      <canvas
        ref={canvasRef}
        className="block cursor-grab active:cursor-grabbing max-w-full transition-transform duration-300"
        style={{ filter: 'drop-shadow(0 0 25px rgba(6, 182, 212, 0.15))' }}
      />
      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
        {/* Futuristic Hologram Overlays */}
        <div className="w-48 h-48 rounded-full border border-dashed border-cyan-500/10 animate-spin" style={{ animationDuration: '40s' }} />
        <div className="absolute w-56 h-56 rounded-full border border-dotted border-violet-500/10 animate-spin" style={{ animationDuration: '20s', animationDirection: 'reverse' }} />
      </div>
    </div>
  );
}
