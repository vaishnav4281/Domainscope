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
        camera.position.z = 10; // Moved back to see more of the vertical wall

        const renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
            powerPreference: "high-performance"
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        containerRef.current.appendChild(renderer.domElement);

        // Geometry: Large vertical plane facing the camera
        const geometry = new THREE.PlaneGeometry(60, 40, 64, 64);

        // Custom Shader Material
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uMouse: { value: new THREE.Vector2(9999, 9999) },
                uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
                uLineColor: { value: new THREE.Color(0x000000) },
                uBgColor: { value: new THREE.Color(0xffffff) },
                uGridSize: { value: 30.0 }, // Higher value = Smaller cells
                uLineWidth: { value: 0.015 }, // Very thin lines
                uOpacity: { value: 0.15 } // Subtle opacity
            },
            vertexShader: `
                uniform float uTime;
                uniform vec2 uMouse;
                varying vec2 vUv;
                varying float vElevation;

                void main() {
                    vUv = uv;
                    vec3 pos = position;
                    
                    // Mouse interaction: Gentle localized bulge
                    // Map mouse to world space roughly
                    vec2 normalizedPos = pos.xy; 
                    float dist = distance(pos.xy, uMouse);
                    
                    // Subtle wave/bulge effect
                    float effect = smoothstep(4.0, 0.0, dist);
                    float wave = sin(dist * 3.0 - uTime * 2.0) * 0.1;
                    
                    // Push Z towards camera
                    float elevation = effect * 0.5 + (wave * effect * 0.2);
                    
                    pos.z += elevation;
                    vElevation = elevation;

                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 uLineColor;
                uniform vec3 uBgColor;
                uniform float uGridSize;
                uniform float uLineWidth;
                uniform float uOpacity;
                
                varying vec2 vUv;
                varying float vElevation;

                void main() {
                    // Grid pattern
                    vec2 grid = fract(vUv * uGridSize);
                    
                    // Sharp lines using step
                    vec2 gridLine = step(1.0 - uLineWidth, grid) + step(grid, vec2(uLineWidth));
                    float line = max(gridLine.x, gridLine.y);
                    
                    // Vignette / Fade edges
                    float dist = distance(vUv, vec2(0.5));
                    float alpha = smoothstep(0.6, 0.2, dist);

                    // Final color
                    vec3 color = uLineColor;
                    
                    // Highlight interaction
                    color += vec3(vElevation * 0.1);

                    // Output: Line color with opacity, fading out at edges
                    // We only render the lines, background is transparent (handled by CSS/HTML bg)
                    gl_FragColor = vec4(color, line * uOpacity * alpha);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide
        });

        const plane = new THREE.Mesh(geometry, material);
        // No rotation needed for vertical wall facing camera
        scene.add(plane);

        // Mouse interaction
        const mouse = new THREE.Vector2();
        const raycaster = new THREE.Raycaster();

        const handleMouseMove = (event: MouseEvent) => {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObject(plane);

            if (intersects.length > 0) {
                const point = intersects[0].point;
                material.uniforms.uMouse.value.set(point.x, point.y);
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

            // Adjust grid density based on aspect ratio to keep square cells
            const aspect = window.innerWidth / window.innerHeight;
            material.uniforms.uGridSize.value = 30.0; // Base size
        };

        window.addEventListener('resize', handleResize);

        // Theme Handling
        const updateThemeColors = () => {
            const isDark = document.documentElement.classList.contains('dark');
            if (isDark) {
                // Dark Mode: White lines
                material.uniforms.uLineColor.value.setHex(0xffffff);
                material.uniforms.uOpacity.value = 0.12; // Subtle white lines
            } else {
                // Light Mode: Black/Dark lines
                material.uniforms.uLineColor.value.setHex(0x000000);
                material.uniforms.uOpacity.value = 0.08; // Subtle dark lines
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
