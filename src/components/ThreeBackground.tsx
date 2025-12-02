import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeBackground() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Detect mobile for performance optimization
        const isMobile = window.innerWidth < 768;
        const isDark = document.documentElement.classList.contains('dark');

        // Scene setup with optimized settings
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        camera.position.z = 15;

        const renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: !isMobile, // Disable on mobile for performance
            powerPreference: "low-power"
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1 : 2));
        containerRef.current.appendChild(renderer.domElement);

        // Reduce particle count on mobile
        const particleCount = isMobile ? 80 : 150;
        const lineCount = isMobile ? 8 : 15;

        // Create optimized particle geometry (shared for performance)
        const particleGeometry = new THREE.SphereGeometry(0.05, 6, 6);

        // Create particles with brand colors
        const particles: THREE.Mesh[] = [];
        const particleSpeeds: number[] = [];

        for (let i = 0; i < particleCount; i++) {
            let color;
            const rand = Math.random();

            // Brand color palette: Red-Purple-Blue gradient
            if (rand > 0.75) {
                color = new THREE.Color(0xef4444); // Red
            } else if (rand > 0.5) {
                color = new THREE.Color(0xa855f7); // Purple
            } else if (rand > 0.25) {
                color = new THREE.Color(0x3b82f6); // Blue
            } else {
                color = new THREE.Color(isDark ? 0x94a3b8 : 0x64748b); // Slate
            }

            const material = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: isDark ? 0.6 : 0.5,
            });

            const particle = new THREE.Mesh(particleGeometry, material);

            // Spread particles across depth for 3D effect
            particle.position.set(
                (Math.random() - 0.5) * 30,
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 20
            );

            particles.push(particle);
            particleSpeeds.push(Math.random() * 0.3 + 0.1); // Random speeds for variety
            scene.add(particle);
        }

        // Create flowing connection lines
        const lines: THREE.Line[] = [];
        const lineOpacities: number[] = [];

        for (let i = 0; i < lineCount; i++) {
            const p1 = particles[Math.floor(Math.random() * particles.length)];
            const p2 = particles[Math.floor(Math.random() * particles.length)];

            if (p1 !== p2) {
                const points = [p1.position.clone(), p2.position.clone()];
                const geometry = new THREE.BufferGeometry().setFromPoints(points);

                // Gradient line colors
                const lineColor = Math.random() > 0.5
                    ? new THREE.Color(0x3b82f6) // Blue
                    : new THREE.Color(0xef4444); // Red

                const material = new THREE.LineBasicMaterial({
                    color: lineColor,
                    transparent: true,
                    opacity: 0.2,
                    linewidth: 1
                });

                const line = new THREE.Line(geometry, material);
                lines.push(line);
                lineOpacities.push(Math.random()); // Store initial phase
                scene.add(line);
            }
        }

        // Mouse/touch interaction
        let targetRotationX = 0;
        let targetRotationY = 0;

        const handlePointerMove = (event: MouseEvent | TouchEvent) => {
            const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
            const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;

            targetRotationX = (clientX / window.innerWidth - 0.5) * 0.3;
            targetRotationY = (clientY / window.innerHeight - 0.5) * 0.3;
        };

        if (!isMobile) {
            window.addEventListener('mousemove', handlePointerMove as EventListener);
        }
        window.addEventListener('touchmove', handlePointerMove as EventListener, { passive: true });

        // Optimized animation loop
        let animationId: number;
        const clock = new THREE.Clock();

        const animate = () => {
            const elapsedTime = clock.getElapsedTime();

            // Gentle floating animation for particles
            particles.forEach((particle, i) => {
                const speed = particleSpeeds[i];
                particle.position.y += Math.sin(elapsedTime * speed + i) * 0.005;
                particle.position.x += Math.cos(elapsedTime * speed * 0.5 + i) * 0.003;

                // Gentle rotation
                particle.rotation.y += 0.002;
                particle.rotation.x += 0.001;
            });

            // Smooth pulsing for connection lines
            lines.forEach((line, i) => {
                const material = line.material as THREE.LineBasicMaterial;
                const phase = lineOpacities[i];
                material.opacity = (Math.sin(elapsedTime * 1.2 + phase * Math.PI * 2) * 0.15) + 0.2;
            });

            // Smooth camera rotation based on input
            camera.rotation.y += (targetRotationX - camera.rotation.y) * 0.05;
            camera.rotation.x += (targetRotationY - camera.rotation.x) * 0.05;

            renderer.render(scene, camera);
            animationId = requestAnimationFrame(animate);
        };

        animate();

        // Handle resize with debouncing
        let resizeTimeout: NodeJS.Timeout;
        const handleResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
            }, 100);
        };

        window.addEventListener('resize', handleResize);

        // Theme change listener
        const themeObserver = new MutationObserver(() => {
            const newIsDark = document.documentElement.classList.contains('dark');
            particles.forEach((particle, i) => {
                const material = particle.material as THREE.MeshBasicMaterial;
                material.opacity = newIsDark ? 0.6 : 0.5;
            });
        });

        themeObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });

        // Cleanup
        return () => {
            window.removeEventListener('mousemove', handlePointerMove as EventListener);
            window.removeEventListener('touchmove', handlePointerMove as EventListener);
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationId);
            clearTimeout(resizeTimeout);
            themeObserver.disconnect();

            // Proper cleanup
            if (containerRef.current?.contains(renderer.domElement)) {
                containerRef.current.removeChild(renderer.domElement);
            }

            // Dispose shared geometry once
            particleGeometry.dispose();

            particles.forEach(particle => {
                (particle.material as THREE.Material).dispose();
            });

            lines.forEach(line => {
                line.geometry.dispose();
                (line.material as THREE.Material).dispose();
            });

            renderer.dispose();
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 pointer-events-none"
            style={{ zIndex: 0 }}
        />
    );
}
