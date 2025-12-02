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
        camera.position.z = 5;

        const renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
            powerPreference: "high-performance"
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        containerRef.current.appendChild(renderer.domElement);

        // Geometry: High resolution plane for smooth deformation
        // Width, Height, SegmentsX, SegmentsY
        // More segments = smoother mouse interaction
        const geometry = new THREE.PlaneGeometry(16, 9, 64, 36);

        // Custom Shader Material
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uMouse: { value: new THREE.Vector2(9999, 9999) }, // Start off-screen
                uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
                uColor1: { value: new THREE.Color(0x3b82f6) }, // Blue
                uColor2: { value: new THREE.Color(0x8b5cf6) }, // Purple
                uGridSize: { value: new THREE.Vector2(40.0, 22.5) }, // Grid density
                uLineWidth: { value: 0.05 }, // Line thickness
                uOpacity: { value: 0.3 }
            },
            vertexShader: `
                uniform float uTime;
                uniform vec2 uMouse;
                varying vec2 vUv;
                varying float vElevation;

                void main() {
                    vUv = uv;
                    vec3 pos = position;
                    
                    // Calculate distance from mouse (in UV space roughly mapped to world)
                    // We map world position to a 0-1 range roughly for interaction
                    vec2 normalizedPos = pos.xy * 0.15 + 0.5; // Approximate mapping
                    
                    // Mouse interaction: Localized wave/bulge
                    float dist = distance(pos.xy, uMouse);
                    
                    // Ripple effect
                    float wave = sin(dist * 5.0 - uTime * 2.0) * 0.1;
                    
                    // Localized bulge near mouse
                    float bulge = smoothstep(2.0, 0.0, dist) * 0.5;
                    
                    // Combine effects
                    float elevation = bulge + wave * bulge;
                    
                    pos.z += elevation;
                    vElevation = elevation;

                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 uColor1;
                uniform vec3 uColor2;
                uniform vec2 uGridSize;
                uniform float uLineWidth;
                uniform float uOpacity;
                
                varying vec2 vUv;
                varying float vElevation;

                void main() {
                    // Create grid pattern
                    // fract(x) returns the fractional part, creating a repeating 0-1 gradient
                    vec2 grid = fract(vUv * uGridSize);
                    
                    // Use step/smoothstep to create sharp lines
                    // We want lines at the edges of the cells (near 0 or 1)
                    vec2 gridLine = step(1.0 - uLineWidth, grid) + step(grid, vec2(uLineWidth));
                    
                    // Combine x and y lines
                    float line = max(gridLine.x, gridLine.y);
                    
                    // Discard non-line pixels for transparency
                    if (line < 0.1) discard;

                    // Gradient color based on UV coordinates + Elevation highlight
                    vec3 color = mix(uColor1, uColor2, vUv.x + vUv.y * 0.5);
                    
                    // Add brightness based on elevation (mouse interaction)
                    color += vec3(vElevation * 0.5);

                    gl_FragColor = vec4(color, uOpacity);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide
        });

        const plane = new THREE.Mesh(geometry, material);
        scene.add(plane);

        // Mouse interaction
        const mouse = new THREE.Vector2();
        const raycaster = new THREE.Raycaster();
        const planeNormal = new THREE.Vector3(0, 0, 1);
        const planeConstant = 0;
        const planeObj = new THREE.Plane(planeNormal, planeConstant);

        const handleMouseMove = (event: MouseEvent) => {
            // Normalize mouse coordinates
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            // Raycast to find intersection with the plane z=0
            raycaster.setFromCamera(mouse, camera);
            const target = new THREE.Vector3();
            raycaster.ray.intersectPlane(planeObj, target);

            if (target) {
                material.uniforms.uMouse.value.set(target.x, target.y);
            }
        };

        if (!isMobile) {
            window.addEventListener('mousemove', handleMouseMove);
        }

        // Animation Loop
        const clock = new THREE.Clock();
        let animationId: number;

        const animate = () => {
            const elapsedTime = clock.getElapsedTime();
            material.uniforms.uTime.value = elapsedTime;

            renderer.render(scene, camera);
            animationId = requestAnimationFrame(animate);
        };

        animate();

        // Handle Resize
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            material.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);

            // Adjust grid density on resize to keep cells square-ish
            const aspect = window.innerWidth / window.innerHeight;
            material.uniforms.uGridSize.value.set(40.0 * aspect, 40.0);
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // Initial call

        // Theme Handling
        const updateThemeColors = () => {
            const isDark = document.documentElement.classList.contains('dark');
            if (isDark) {
                // Dark Mode: Blue -> Purple
                material.uniforms.uColor1.value.setHex(0x3b82f6);
                material.uniforms.uColor2.value.setHex(0xa855f7);
                material.uniforms.uOpacity.value = 0.4;
            } else {
                // Light Mode: Red -> Blue (Brand Gradient)
                material.uniforms.uColor1.value.setHex(0xef4444);
                material.uniforms.uColor2.value.setHex(0x3b82f6);
                material.uniforms.uOpacity.value = 0.5; // Slightly more visible in light mode
            }
        };

        // Observer for theme changes
        const observer = new MutationObserver(updateThemeColors);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

        // Initial theme set
        updateThemeColors();

        // Cleanup
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
