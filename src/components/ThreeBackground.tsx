import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeBackground() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Detect mobile and theme
        const isMobile = window.innerWidth < 768;
        const isDark = document.documentElement.classList.contains('dark');

        // Scene setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            100
        );
        camera.position.set(0, 8, 12);
        camera.lookAt(0, 0, 0);

        const renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: !isMobile,
            powerPreference: "low-power"
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1 : 1.5));
        containerRef.current.appendChild(renderer.domElement);

        // Create infinite grid with brand colors
        const gridSize = 40;
        const gridDivisions = isMobile ? 20 : 30;

        // Main grid
        const gridHelper = new THREE.GridHelper(
            gridSize,
            gridDivisions,
            isDark ? 0x3b82f6 : 0xef4444, // Blue in dark, Red in light
            isDark ? 0x1e293b : 0xe2e8f0  // Slate colors
        );
        gridHelper.material.opacity = isDark ? 0.15 : 0.1;
        gridHelper.material.transparent = true;
        scene.add(gridHelper);

        // Create animated gradient plane below grid
        const planeGeometry = new THREE.PlaneGeometry(gridSize * 2, gridSize * 2, 32, 32);

        // Create gradient shader material
        const planeMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                color1: { value: new THREE.Color(isDark ? 0x1e1b4b : 0xfef2f2) }, // Deep blue/light red
                color2: { value: new THREE.Color(isDark ? 0x450a0a : 0xeff6ff) }, // Deep red/light blue
                opacity: { value: isDark ? 0.4 : 0.3 }
            },
            vertexShader: `
                varying vec2 vUv;
                uniform float time;
                
                void main() {
                    vUv = uv;
                    vec3 pos = position;
                    
                    // Subtle wave effect
                    float wave = sin(pos.x * 0.3 + time * 0.5) * cos(pos.y * 0.3 + time * 0.3);
                    pos.z = wave * 0.5;
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 color1;
                uniform vec3 color2;
                uniform float opacity;
                varying vec2 vUv;
                
                void main() {
                    // Diagonal gradient
                    float gradient = (vUv.x + vUv.y) * 0.5;
                    vec3 color = mix(color1, color2, gradient);
                    gl_FragColor = vec4(color, opacity);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide
        });

        const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.rotation.x = -Math.PI / 2;
        plane.position.y = -0.05;
        scene.add(plane);

        // Add subtle accent dots on grid intersections (fewer on mobile)
        const dotCount = isMobile ? 15 : 25;
        const dots: THREE.Mesh[] = [];
        const dotGeometry = new THREE.SphereGeometry(0.08, 8, 8);

        for (let i = 0; i < dotCount; i++) {
            const colorChoice = Math.random();
            let dotColor;

            if (colorChoice > 0.66) {
                dotColor = new THREE.Color(0xef4444); // Red
            } else if (colorChoice > 0.33) {
                dotColor = new THREE.Color(0x8b5cf6); // Purple
            } else {
                dotColor = new THREE.Color(0x3b82f6); // Blue
            }

            const material = new THREE.MeshBasicMaterial({
                color: dotColor,
                transparent: true,
                opacity: 0.6
            });

            const dot = new THREE.Mesh(dotGeometry, material);

            // Place on grid intersections
            const gridStep = gridSize / gridDivisions;
            dot.position.set(
                (Math.floor(Math.random() * gridDivisions) - gridDivisions / 2) * gridStep,
                0.1,
                (Math.floor(Math.random() * gridDivisions) - gridDivisions / 2) * gridStep
            );

            dots.push(dot);
            scene.add(dot);
        }

        // Floating particles (very subtle, minimal)
        const particleCount = isMobile ? 20 : 40;
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities: number[] = [];

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * gridSize;
            positions[i * 3 + 1] = Math.random() * 10;
            positions[i * 3 + 2] = (Math.random() - 0.5) * gridSize;
            velocities.push(Math.random() * 0.02 + 0.01);
        }

        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const particleMaterial = new THREE.PointsMaterial({
            color: isDark ? 0x60a5fa : 0xf87171,
            size: 0.1,
            transparent: true,
            opacity: 0.4,
            sizeAttenuation: true
        });

        const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
        scene.add(particleSystem);

        // Ambient light for subtle illumination
        const ambientLight = new THREE.AmbientLight(
            isDark ? 0x3b82f6 : 0xef4444,
            0.2
        );
        scene.add(ambientLight);

        // Animation
        let animationId: number;
        const clock = new THREE.Clock();

        const animate = () => {
            const elapsedTime = clock.getElapsedTime();

            // Update shader time for wave effect
            planeMaterial.uniforms.time.value = elapsedTime;

            // Rotate grid very slowly for depth effect
            gridHelper.rotation.y = elapsedTime * 0.05;

            // Pulse dots gently
            dots.forEach((dot, i) => {
                const material = dot.material as THREE.MeshBasicMaterial;
                material.opacity = 0.4 + Math.sin(elapsedTime * 2 + i) * 0.2;

                // Gentle bounce
                dot.position.y = 0.1 + Math.sin(elapsedTime * 1.5 + i) * 0.1;
            });

            // Animate particles (floating upward)
            const positions = particleGeometry.attributes.position.array as Float32Array;
            for (let i = 0; i < particleCount; i++) {
                positions[i * 3 + 1] += velocities[i];

                // Reset when too high
                if (positions[i * 3 + 1] > 15) {
                    positions[i * 3 + 1] = 0;
                }
            }
            particleGeometry.attributes.position.needsUpdate = true;

            // Very subtle camera sway
            camera.position.x = Math.sin(elapsedTime * 0.2) * 0.5;
            camera.position.y = 8 + Math.cos(elapsedTime * 0.15) * 0.3;
            camera.lookAt(0, 0, 0);

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

        // Theme change observer
        const themeObserver = new MutationObserver(() => {
            const newIsDark = document.documentElement.classList.contains('dark');

            // Update grid colors
            gridHelper.material.color.setHex(newIsDark ? 0x3b82f6 : 0xef4444);

            // Update plane gradient
            planeMaterial.uniforms.color1.value.setHex(newIsDark ? 0x1e1b4b : 0xfef2f2);
            planeMaterial.uniforms.color2.value.setHex(newIsDark ? 0x450a0a : 0xeff6ff);
            planeMaterial.uniforms.opacity.value = newIsDark ? 0.4 : 0.3;

            // Update particles
            particleMaterial.color.setHex(newIsDark ? 0x60a5fa : 0xf87171);

            // Update ambient light
            ambientLight.color.setHex(newIsDark ? 0x3b82f6 : 0xef4444);
        });

        themeObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationId);
            clearTimeout(resizeTimeout);
            themeObserver.disconnect();

            if (containerRef.current?.contains(renderer.domElement)) {
                containerRef.current.removeChild(renderer.domElement);
            }

            // Dispose geometries
            gridHelper.geometry.dispose();
            (gridHelper.material as THREE.Material).dispose();
            planeGeometry.dispose();
            planeMaterial.dispose();
            dotGeometry.dispose();
            particleGeometry.dispose();
            particleMaterial.dispose();

            dots.forEach(dot => {
                (dot.material as THREE.Material).dispose();
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
