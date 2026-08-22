import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  pulseSpeed: number;
  pulse: number;
}

interface DataStream {
  x: number;
  y: number;
  speed: number;
  length: number;
  char: string;
  opacity: number;
}

export const FuturisticVideoBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Initialize Network Particles (Nodes)
    const particleCount = Math.min(Math.floor((width * height) / 14000), 75);
    const particles: Particle[] = [];
    const colors = ['#ffffff', '#ff4d5a', '#ea1d2c', '#ff8a93', '#ffd166'];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.7,
        vy: (Math.random() - 0.5) * 0.7,
        radius: Math.random() * 2.2 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.7 + 0.3,
        pulseSpeed: 0.02 + Math.random() * 0.03,
        pulse: Math.random() * Math.PI,
      });
    }

    // Initialize Telemetry Data Streams
    const dataStreamCount = 14;
    const dataStreams: DataStream[] = [];
    const symbols = ['1', '0', 'CLARO', '5G+', 'SYNC', 'KPI', 'DATA', 'VOLTE', '99.9%', 'TIETÊ'];

    for (let i = 0; i < dataStreamCount; i++) {
      dataStreams.push({
        x: Math.random() * width,
        y: Math.random() * height,
        speed: Math.random() * 0.8 + 0.4,
        length: Math.random() * 80 + 40,
        char: symbols[Math.floor(Math.random() * symbols.length)],
        opacity: Math.random() * 0.35 + 0.1,
      });
    }

    let frame = 0;

    const render = () => {
      frame++;
      ctx.clearRect(0, 0, width, height);

      // 1. Deep Futuristic Red-Tech Gradient Base
      const bgGrad = ctx.createRadialGradient(
        width / 2,
        height * 0.45,
        50,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.75
      );
      bgGrad.addColorStop(0, '#590212'); // Rich deep ruby center
      bgGrad.addColorStop(0.35, '#30010a'); // Dark crimson shadow
      bgGrad.addColorStop(0.7, '#150004'); // Midnight tech black
      bgGrad.addColorStop(1, '#060002'); // Pure obsidian edges

      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Perspective 3D Futuristic Grid Floor (moving forward)
      const gridY = height * 0.62;
      ctx.save();
      ctx.strokeStyle = 'rgba(234, 29, 44, 0.12)';
      ctx.lineWidth = 1;

      // Horizon line
      ctx.beginPath();
      ctx.moveTo(0, gridY);
      ctx.lineTo(width, gridY);
      ctx.stroke();

      // Perspective vertical lines converging to center horizon
      const vanishX = width / 2;
      const vanishY = gridY;
      const numLines = 26;
      for (let i = -numLines / 2; i <= numLines / 2; i++) {
        const bottomX = vanishX + (i * width) / 10;
        ctx.beginPath();
        ctx.moveTo(vanishX, vanishY);
        ctx.lineTo(bottomX, height);
        ctx.stroke();
      }

      // Animated horizontal grid lines moving towards screen
      const gridOffset = (frame * 0.6) % 35;
      for (let y = gridY; y < height; y += (y - gridY) * 0.22 + 8) {
        const animatedY = y + gridOffset * ((y - gridY) / (height - gridY + 1));
        if (animatedY <= height && animatedY >= gridY) {
          const alpha = ((animatedY - gridY) / (height - gridY)) * 0.18;
          ctx.strokeStyle = `rgba(234, 29, 44, ${alpha})`;
          ctx.beginPath();
          ctx.moveTo(0, animatedY);
          ctx.lineTo(width, animatedY);
          ctx.stroke();
        }
      }
      ctx.restore();

      // 3. Futuristic Rotating Telemetry Circles (High-tech HUD)
      ctx.save();
      const centerX = width / 2;
      const centerY = height * 0.38;

      // Outer Ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, 210, frame * 0.003, frame * 0.003 + Math.PI * 1.5);
      ctx.strokeStyle = 'rgba(255, 77, 90, 0.08)';
      ctx.setLineDash([12, 18]);
      ctx.lineWidth = 2;
      ctx.stroke();

      // Inner Ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, 280, -frame * 0.002, -frame * 0.002 + Math.PI);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.setLineDash([8, 24]);
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Digital Crosshairs
      ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(255, 77, 90, 0.1)';
      ctx.beginPath();
      ctx.moveTo(centerX - 310, centerY);
      ctx.lineTo(centerX - 290, centerY);
      ctx.moveTo(centerX + 290, centerY);
      ctx.lineTo(centerX + 310, centerY);
      ctx.moveTo(centerX, centerY - 310);
      ctx.lineTo(centerX, centerY - 290);
      ctx.moveTo(centerX, centerY + 290);
      ctx.lineTo(centerX, centerY + 310);
      ctx.stroke();
      ctx.restore();

      // 4. Draw & Update Digital Telemetry Data Streams
      ctx.font = '10px monospace';
      dataStreams.forEach((stream) => {
        stream.y -= stream.speed;
        if (stream.y < -50) {
          stream.y = height + 50;
          stream.x = Math.random() * width;
        }

        // Faint glowing data code
        ctx.fillStyle = `rgba(255, 100, 115, ${stream.opacity})`;
        ctx.fillText(stream.char, stream.x, stream.y);

        // Subtle vertical trail
        ctx.strokeStyle = `rgba(234, 29, 44, ${stream.opacity * 0.4})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(stream.x, stream.y);
        ctx.lineTo(stream.x, stream.y + stream.length);
        ctx.stroke();
      });

      // 5. Update and Draw Interconnected Node Network (Plexus)
      const maxDistance = 140;

      // Draw connection laser lines between particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDistance) {
            const lineAlpha = (1 - dist / maxDistance) * 0.28;
            ctx.strokeStyle = `rgba(255, 77, 90, ${lineAlpha})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw glowing nodes
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        // Bounce from edges smoothly
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        p.pulse += p.pulseSpeed;
        const currentRadius = p.radius + Math.sin(p.pulse) * 0.8;

        // Glowing halo
        const halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, currentRadius * 4);
        halo.addColorStop(0, `rgba(255, 77, 90, ${p.alpha * 0.6})`);
        halo.addColorStop(1, 'rgba(234, 29, 44, 0)');

        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(p.x, p.y, currentRadius * 4, 0, Math.PI * 2);
        ctx.fill();

        // Core dot
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, currentRadius, 0, Math.PI * 2);
        ctx.fill();
      });

      // 6. Subtle Cyber Scanline Overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.07)';
      for (let y = 0; y < height; y += 4) {
        ctx.fillRect(0, y, width, 1.5);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
    />
  );
};
