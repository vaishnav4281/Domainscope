import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeBackground() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const isMobile = window.innerWidth < 768;

        // Scene setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);

        // Position camera for a nice angled view of the floor
        camera.position.set(0, 3, 5);
        camera.lookAt(0, 0, 0);

        const renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
            powerPreference: "high-performance"
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        containerRef.current.appendChild(renderer.domElement);

        // Geometry: Large plane for the floor
        const geometry = new THREE.PlaneGeometry(40, 40, 64, 64);

        // Custom Shader Material for the Grid
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uMouse: { value: new THREE.Vector2(9999, 9999) },
                uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
                uColor: { value: new THREE.Color(0xe2e8f0) }, // Default grid color
                uBgColor: { value: new THREE.Color(0xffffff) }, // Background fade
                uGridSize: { value: 8.0 }, // Smaller number = Bigger grid cells
                uLineWidth: { value: 0.02 }, // Thinner, sharper lines
                uOpacity: { value: 0.5 }
            },
            vertexShader: `
                uniform float uTime;
                uniform vec2 uMouse;
                varying vec2 vUv;
                varying float vElevation;

                void main() {
                    vUv = uv;
                    vec3 pos = position;
                    
                    // Map world position to roughly 0-1 range for mouse interaction
                    vec2 normalizedPos = pos.xy * 0.05 + 0.5;
                    
                    // Mouse interaction: Gentle ripple
                    float dist = distance(pos.xy, uMouse);
                    
                    // Smooth, wide ripple effect
                    float wave = sin(dist * 2.0 - uTime * 1.5) * 0.2;
                    float decay = smoothstep(5.0, 0.0, dist); // Effect fades out over distance
                    
                    float elevation = wave * decay;
                    
                    pos.z += elevation;
                    vElevation = elevation;

                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 uColor;
                uniform vec3 uBgColor;
                uniform float uGridSize;
                uniform float uLineWidth;
                uniform float uOpacity;
                
                varying vec2 vUv;
                varying float vElevation;

                void main() {
                    // Grid pattern
                    vec2 grid = fract(vUv * uGridSize);
                    vec2 gridLine = step(1.0 - uLineWidth, grid) + step(grid, vec2(uLineWidth));
                    float line = max(gridLine.x, gridLine.y);
                    
                    // Distance from center for fading edges (vignette)
                    float dist = distance(vUv, vec2(0.5));
                    float alpha = smoothstep(0.5, 0.0, dist);

                    // Mix grid color with background based on line existence
                    vec3 finalColor = uColor;
                    
                    // Add subtle highlight on elevation peaks
                    finalColor += vec3(vElevation * 0.2);

                    // Output
                    gl_FragColor = vec4(finalColor, line * uOpacity * alpha);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide
        });

        const plane = new THREE.Mesh(geometry, material);
        // Rotate to be a floor
        plane.rotation.x = -Math.PI / 2.5; // Slight tilt
        scene.add(plane);

        // Mouse interaction
        const mouse = new THREE.Vector2();
        const raycaster = new THREE.Raycaster();
        // Create a virtual plane for raycasting that matches the visual plane's orientation roughly
        // or just project mouse to ground plane z=0 (after rotation)
        // Simpler: Raycast against the mesh itself

        const handleMouseMove = (event: MouseEvent) => {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObject(plane);

            if (intersects.length > 0) {
                // Convert intersection point back to local space if needed, 
                // but shader uses world space for distance calc mostly.
                // Actually shader uses local position. 
                // We need to pass the point in the plane's local coordinate system.
                const point = intersects[0].point;
                // Since plane is rotated, we need to inverse transform or just pass world pos
                // Let's simplify: pass world pos x/y (which maps to plane x/y before rotation roughly)
                // Actually, simpler to just map mouse screen X/Y to a uniform and fake it in shader
                // But for accuracy, let's use the intersection point.
                // The plane is at (0,0,0). 
                material.uniforms.uMouse.value.set(point.x, point.y); // This works because plane geometry is centered
            }
        };

        if (!isMobile) {
            window.addEventListener('mousemove', handleMouseMove);
        }

        // Animation
        const clock = new THREE.Clock();
        let animationId: number;

        const animate = () => {
            const elapsedTime = clock.getElapsedTime();
            material.uniforms.uTime.value = elapsedTime;
            renderer.render(scene, camera);
            animationId = requestAnimationFrame(animate);
        };

        animate();

        // Resize
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            material.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
        };

        window.addEventListener('resize', handleResize);

        // Theme Handling
        const updateThemeColors = () => {
            const isDark = document.documentElement.classList.contains('dark');
            if (isDark) {
                // Dark Mode: Dark background, lighter gray lines
                material.uniforms.uColor.value.setHex(0x475569); // Slate-600
                material.uniforms.uOpacity.value = 0.3;
            } else {
                // Light Mode: White background, dark gray lines
                material.uniforms.uColor.value.setHex(0x94a3b8); // Slate-400
                material.uniforms.uOpacity.value = 0.4;
            }
        };

        const observer = new MutationObserver(updateThemeColors);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        updateThemeColors();

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationId);
            observer.disconnect();
            if (containerRef.current?.contains(renderer.domElement)) {
                containerRef.current.removeChild(renderer.domElement);
            }
            geometry.dispose();
            material.dispose();
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
