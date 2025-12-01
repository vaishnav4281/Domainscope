import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeBackground() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Detect theme
        const isDark = document.documentElement.classList.contains('dark');

        // Scene setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        camera.position.z = 10;

        const renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        containerRef.current.appendChild(renderer.domElement);

        // Globe and ring removed - keeping particles and connections only

        // Create scattered particles (data points)
        const particles: THREE.Mesh[] = [];
        const particleCount = 300;

        for (let i = 0; i < particleCount; i++) {
            // Small uniform size - more visible
            const geometry = new THREE.SphereGeometry(0.04, 8, 8);

            // Mix of colors: white/black base + red/blue accents
            let color;
            const rand = Math.random();
            if (rand > 0.7) {
                color = 0xef4444; // Red accent
            } else if (rand > 0.4) {
                color = 0x3b82f6; // Blue accent
            } else {
                color = isDark ? 0xffffff : 0x333333; // White/black base
            }

            const material = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: isDark ? 0.8 : 0.7,
            });

            const particle = new THREE.Mesh(geometry, material);

            // Scatter randomly across the screen
            particle.position.set(
                (Math.random() - 0.5) * 25,
                (Math.random() - 0.5) * 25,
                (Math.random() - 0.5) * 15
            );

            particles.push(particle);
            scene.add(particle);
        }

        // Create connection lines (data flow)
        const lines: THREE.Line[] = [];
        const lineMaterials: THREE.LineBasicMaterial[] = [];

        // Connect more random particles for richer network
        for (let i = 0; i < 25; i++) {
            const p1 = particles[Math.floor(Math.random() * particles.length)];
            const p2 = particles[Math.floor(Math.random() * particles.length)];

            if (p1 !== p2) {
                const points = [p1.position, p2.position];
                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                const material = new THREE.LineBasicMaterial({
                    color: isDark ? 0x3b82f6 : 0xef4444,
                    transparent: true,
                    opacity: 0.15,
                });

                const line = new THREE.Line(geometry, material);
                lines.push(line);
                lineMaterials.push(material);
                scene.add(line);
            }
        }

        // Mouse interaction
        let mouseX = 0;
        let mouseY = 0;

        const handleMouseMove = (event: MouseEvent) => {
            mouseX = (event.clientX / window.innerWidth) * 2 - 1;
            mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
        };

        window.addEventListener('mousemove', handleMouseMove);

        // Animation loop
        let animationId: number;
        const clock = new THREE.Clock();

        const animate = () => {
            const elapsedTime = clock.getElapsedTime();

            // Gentle particle drift
            particles.forEach((particle, i) => {
                particle.position.y += Math.sin(elapsedTime + i) * 0.002;
                particle.position.x += Math.cos(elapsedTime + i * 0.5) * 0.001;
            });

            // Connection lines pulse
            lineMaterials.forEach((material, i) => {
                const pulse = Math.sin(elapsedTime * 1.5 + i * 0.3) * 0.15 + 0.25;
                material.opacity = pulse;
            });

            // Subtle camera movement with mouse
            camera.position.x += (mouseX * 2 - camera.position.x) * 0.01;
            camera.position.y += (mouseY * 2 - camera.position.y) * 0.01;
            camera.lookAt(scene.position);

            renderer.render(scene, camera);
            animationId = requestAnimationFrame(animate);
        };

        animate();

        // Handle resize
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };

        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationId);
            containerRef.current?.removeChild(renderer.domElement);

            particles.forEach(particle => {
                particle.geometry.dispose();
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
