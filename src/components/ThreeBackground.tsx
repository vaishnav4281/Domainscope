import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeBackground() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const isMobile = window.innerWidth < 768;
        const isDark = document.documentElement.classList.contains('dark');

        // Scene setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        camera.position.z = 5;

        const renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: !isMobile,
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        containerRef.current.appendChild(renderer.domElement);

        // Create vertical grid
        const gridSize = 20;
        const gridDivisions = 20;

        // Vertical grid facing the camera
        const gridHelper = new THREE.GridHelper(gridSize, gridDivisions);
        gridHelper.rotation.x = Math.PI / 2; // Rotate to face camera
        gridHelper.material.transparent = true;
        gridHelper.material.opacity = isDark ? 0.15 : 0.1;

        // Set grid colors based on theme
        const centerColor = isDark ? 0x3b82f6 : 0xef4444; // Blue/Red
        const gridColor = isDark ? 0x1e293b : 0xe2e8f0;   // Slate
        gridHelper.material.color.setHex(gridColor);

        scene.add(gridHelper);

        // Mouse position
        const mouse = new THREE.Vector2();
        const targetRotation = new THREE.Vector2();
        const currentRotation = new THREE.Vector2();

        const handleMouseMove = (event: MouseEvent) => {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            targetRotation.x = mouse.y * 0.3;
            targetRotation.y = mouse.x * 0.3;
        };

        if (!isMobile) {
            window.addEventListener('mousemove', handleMouseMove);
        }

        // Animation
        let animationId: number;

        const animate = () => {
            // Smooth rotation following mouse
            currentRotation.x += (targetRotation.x - currentRotation.x) * 0.05;
            currentRotation.y += (targetRotation.y - currentRotation.y) * 0.05;

            gridHelper.rotation.x = Math.PI / 2 + currentRotation.x;
            gridHelper.rotation.z = currentRotation.y;

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

        // Theme observer
        const themeObserver = new MutationObserver(() => {
            const newIsDark = document.documentElement.classList.contains('dark');
            gridHelper.material.opacity = newIsDark ? 0.15 : 0.1;
            const newGridColor = newIsDark ? 0x1e293b : 0xe2e8f0;
            gridHelper.material.color.setHex(newGridColor);
        });

        themeObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });

        // Cleanup
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationId);
            themeObserver.disconnect();

            if (containerRef.current?.contains(renderer.domElement)) {
                containerRef.current.removeChild(renderer.domElement);
            }

            gridHelper.geometry.dispose();
            gridHelper.material.dispose();
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
