import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function Globe3D() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
            50,
            containerRef.current.clientWidth / containerRef.current.clientHeight,
            0.1,
            1000
        );
        camera.position.z = 10;

        const renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
            powerPreference: "high-performance"
        });
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);
        containerRef.current.appendChild(renderer.domElement);

        const mainGroup = new THREE.Group();
        scene.add(mainGroup);

        let isDarkMode = document.documentElement.classList.contains('dark');

        // Colors - Premium palette
        const colors = {
            blue: 0x3b82f6,
            blueLight: 0x60a5fa,
            blueSoft: 0x93c5fd,
            red: 0xef4444,
            redLight: 0xf87171,
            green: 0x22c55e,
            yellow: 0xfbbf24,
            purple: 0x8b5cf6,
            cyan: 0x06b6d4,
            white: 0xffffff,
            dark: 0x1f2937
        };

        // ============ CENTRAL DOMAIN CARD ============
        const domainGroup = new THREE.Group();

        // Rounded rectangle helper
        const createRoundedRect = (width: number, height: number, radius: number) => {
            const shape = new THREE.Shape();
            const x = -width / 2;
            const y = -height / 2;
            shape.moveTo(x + radius, y);
            shape.lineTo(x + width - radius, y);
            shape.quadraticCurveTo(x + width, y, x + width, y + radius);
            shape.lineTo(x + width, y + height - radius);
            shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
            shape.lineTo(x + radius, y + height);
            shape.quadraticCurveTo(x, y + height, x, y + height - radius);
            shape.lineTo(x, y + radius);
            shape.quadraticCurveTo(x, y, x + radius, y);
            return shape;
        };

        // Main domain card - larger and more visible
        const cardWidth = 2.2;
        const cardHeight = 1.4;
        const domainShape = createRoundedRect(cardWidth, cardHeight, 0.15);
        const domainGeometry = new THREE.ShapeGeometry(domainShape);
        const domainMaterial = new THREE.MeshBasicMaterial({
            color: colors.blue,
            transparent: true,
            opacity: 0.12,
            side: THREE.DoubleSide
        });
        const domainCard = new THREE.Mesh(domainGeometry, domainMaterial);
        domainGroup.add(domainCard);

        // Domain card glowing border
        const borderPoints: THREE.Vector3[] = [];
        createRoundedRect(cardWidth, cardHeight, 0.15).getPoints(60).forEach(p =>
            borderPoints.push(new THREE.Vector3(p.x, p.y, 0))
        );
        borderPoints.push(borderPoints[0].clone());
        const borderGeometry = new THREE.BufferGeometry().setFromPoints(borderPoints);
        const borderMaterial = new THREE.LineBasicMaterial({
            color: colors.blue,
            transparent: true,
            opacity: 0.9
        });
        const domainBorder = new THREE.Line(borderGeometry, borderMaterial);
        domainGroup.add(domainBorder);

        // URL bar with glow effect
        const urlBarShape = createRoundedRect(1.9, 0.28, 0.08);
        const urlBarGeometry = new THREE.ShapeGeometry(urlBarShape);
        const urlBarMaterial = new THREE.MeshBasicMaterial({
            color: colors.blueLight,
            transparent: true,
            opacity: 0.25,
            side: THREE.DoubleSide
        });
        const urlBar = new THREE.Mesh(urlBarGeometry, urlBarMaterial);
        urlBar.position.y = 0.4;
        domainGroup.add(urlBar);

        // Lock icon (larger, more visible)
        const lockBody = new THREE.Mesh(
            new THREE.BoxGeometry(0.12, 0.09, 0.02),
            new THREE.MeshBasicMaterial({ color: colors.green, transparent: true, opacity: 1 })
        );
        lockBody.position.set(-0.75, 0.4, 0.02);
        domainGroup.add(lockBody);

        const lockShackle = new THREE.Mesh(
            new THREE.TorusGeometry(0.04, 0.015, 8, 16, Math.PI),
            new THREE.MeshBasicMaterial({ color: colors.green, transparent: true, opacity: 1 })
        );
        lockShackle.position.set(-0.75, 0.47, 0.02);
        lockShackle.rotation.z = Math.PI;
        domainGroup.add(lockShackle);

        // Browser dots (larger)
        const browserDots = [
            { x: 0.85, y: 0.4, color: colors.red },
            { x: 0.93, y: 0.4, color: colors.yellow },
            { x: 1.01, y: 0.4, color: colors.green }
        ];
        browserDots.forEach(dot => {
            const mesh = new THREE.Mesh(
                new THREE.CircleGeometry(0.045, 16),
                new THREE.MeshBasicMaterial({ color: dot.color, transparent: true, opacity: 0.9, side: THREE.DoubleSide })
            );
            mesh.position.set(dot.x, dot.y, 0.02);
            domainGroup.add(mesh);
        });

        // Content lines (simulated webpage)
        for (let i = 0; i < 3; i++) {
            const width = 1.2 - i * 0.2 + Math.random() * 0.3;
            const line = new THREE.Mesh(
                new THREE.PlaneGeometry(width, 0.08),
                new THREE.MeshBasicMaterial({ color: colors.blueSoft, transparent: true, opacity: 0.12, side: THREE.DoubleSide })
            );
            line.position.set(-0.2 + (1.4 - width) / 2, 0.1 - i * 0.18, 0.01);
            domainGroup.add(line);
        }

        // Scanning glow ring around card
        const glowRingGeometry = new THREE.RingGeometry(1.25, 1.35, 64);
        const glowRingMaterial = new THREE.MeshBasicMaterial({
            color: colors.blue,
            transparent: true,
            opacity: 0.35,
            side: THREE.DoubleSide
        });
        const glowRing = new THREE.Mesh(glowRingGeometry, glowRingMaterial);
        domainGroup.add(glowRing);

        // Inner accent ring
        const innerRingGeometry = new THREE.RingGeometry(1.1, 1.15, 64);
        const innerRingMaterial = new THREE.MeshBasicMaterial({
            color: colors.red,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide
        });
        const innerRing = new THREE.Mesh(innerRingGeometry, innerRingMaterial);
        domainGroup.add(innerRing);

        // Secondary inner scan ring
        const innerScanRingGeometry = new THREE.RingGeometry(0.85, 0.88, 64);
        const innerScanRingMaterial = new THREE.MeshBasicMaterial({
            color: colors.red,
            transparent: true,
            opacity: 0.25,
            side: THREE.DoubleSide
        });
        const innerScanRing = new THREE.Mesh(innerScanRingGeometry, innerScanRingMaterial);
        domainGroup.add(innerScanRing);

        mainGroup.add(domainGroup);

        // ============ SCAN MODULES ============
        const modulesData = [
            { name: 'WHOIS', color: colors.blue, angle: Math.PI * 0.05 },
            { name: 'DNS', color: colors.cyan, angle: Math.PI * 0.35 },
            { name: 'SSL', color: colors.green, angle: Math.PI * 0.65 },
            { name: 'THREAT', color: colors.red, angle: Math.PI * 1.0 },
            { name: 'GEO', color: colors.purple, angle: Math.PI * 1.35 },
            { name: 'SUBDOMAIN', color: colors.yellow, angle: Math.PI * 1.65 }
        ];

        const modulesGroup = new THREE.Group();
        const modules: { group: THREE.Group; data: typeof modulesData[0] }[] = [];
        const moduleRadius = 3.0;

        modulesData.forEach((data) => {
            const moduleGroup = new THREE.Group();

            // Module background - rounded square
            const modSize = 0.55;
            const modShape = createRoundedRect(modSize, modSize, 0.1);
            const modGeometry = new THREE.ShapeGeometry(modShape);
            const modMaterial = new THREE.MeshBasicMaterial({
                color: data.color,
                transparent: true,
                opacity: 0.15,
                side: THREE.DoubleSide
            });
            moduleGroup.add(new THREE.Mesh(modGeometry, modMaterial));

            // Module border
            const modBorderPoints: THREE.Vector3[] = [];
            modShape.getPoints(30).forEach(p => modBorderPoints.push(new THREE.Vector3(p.x, p.y, 0)));
            modBorderPoints.push(modBorderPoints[0].clone());
            const modBorderGeom = new THREE.BufferGeometry().setFromPoints(modBorderPoints);
            const modBorderMat = new THREE.LineBasicMaterial({ color: data.color, transparent: true, opacity: 0.8 });
            moduleGroup.add(new THREE.Line(modBorderGeom, modBorderMat));

            // Inner glow circle
            const innerGlow = new THREE.Mesh(
                new THREE.CircleGeometry(0.12, 24),
                new THREE.MeshBasicMaterial({ color: data.color, transparent: true, opacity: 0.7, side: THREE.DoubleSide })
            );
            moduleGroup.add(innerGlow);

            // Position module
            moduleGroup.position.x = Math.cos(data.angle) * moduleRadius;
            moduleGroup.position.y = Math.sin(data.angle) * moduleRadius;

            modules.push({ group: moduleGroup, data });
            modulesGroup.add(moduleGroup);
        });

        mainGroup.add(modulesGroup);

        // ============ CONNECTION LINES ============
        const connectionsGroup = new THREE.Group();
        const connectionLines: THREE.Line[] = [];

        modulesData.forEach((module) => {
            const endPos = new THREE.Vector3(
                Math.cos(module.angle) * moduleRadius,
                Math.sin(module.angle) * moduleRadius,
                0
            );

            // Curved connection
            const midPoint = new THREE.Vector3(
                endPos.x * 0.45,
                endPos.y * 0.45,
                0.3
            );
            const curve = new THREE.QuadraticBezierCurve3(
                new THREE.Vector3(0, 0, 0),
                midPoint,
                endPos
            );
            const points = curve.getPoints(25);
            const lineGeom = new THREE.BufferGeometry().setFromPoints(points);
            const lineMat = new THREE.LineBasicMaterial({
                color: module.color,
                transparent: true,
                opacity: 0.3
            });
            const line = new THREE.Line(lineGeom, lineMat);
            connectionLines.push(line);
            connectionsGroup.add(line);
        });

        mainGroup.add(connectionsGroup);

        // ============ DATA FLOW PARTICLES ============
        const particlesGroup = new THREE.Group();
        const dataParticles: {
            mesh: THREE.Mesh;
            endPos: THREE.Vector3;
            progress: number;
            speed: number;
            returning: boolean;
            color: number;
        }[] = [];

        modulesData.forEach((module) => {
            const modulePos = new THREE.Vector3(
                Math.cos(module.angle) * moduleRadius,
                Math.sin(module.angle) * moduleRadius,
                0
            );

            for (let i = 0; i < 2; i++) {
                const particle = new THREE.Mesh(
                    new THREE.SphereGeometry(0.055, 10, 10),
                    new THREE.MeshBasicMaterial({ color: module.color, transparent: true, opacity: 0.9 })
                );

                dataParticles.push({
                    mesh: particle,
                    endPos: modulePos.clone(),
                    progress: i * 0.5,
                    speed: 0.35 + Math.random() * 0.15,
                    returning: i % 2 === 0,
                    color: module.color
                });
                particlesGroup.add(particle);
            }
        });

        mainGroup.add(particlesGroup);

        // ============ STATUS INDICATORS ============
        const statusGroup = new THREE.Group();

        modules.forEach((module, i) => {
            const angle = modulesData[i].angle;
            const statusDist = moduleRadius - 0.5;

            const statusDot = new THREE.Mesh(
                new THREE.CircleGeometry(0.07, 16),
                new THREE.MeshBasicMaterial({ color: colors.green, transparent: true, opacity: 0.9, side: THREE.DoubleSide })
            );
            statusDot.position.set(Math.cos(angle) * statusDist, Math.sin(angle) * statusDist, 0.01);
            statusGroup.add(statusDot);
        });

        mainGroup.add(statusGroup);

        // ============ AMBIENT PARTICLES ============
        const ambientGroup = new THREE.Group();
        const ambientParticles: { mesh: THREE.Mesh; velocity: THREE.Vector3 }[] = [];

        for (let i = 0; i < 30; i++) {
            const isBlue = Math.random() > 0.35;
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.02 + Math.random() * 0.015, 6, 6),
                new THREE.MeshBasicMaterial({
                    color: isBlue ? colors.blueLight : colors.redLight,
                    transparent: true,
                    opacity: 0.25 + Math.random() * 0.2
                })
            );
            particle.position.set(
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 7,
                (Math.random() - 0.5) * 1.5
            );
            ambientParticles.push({
                mesh: particle,
                velocity: new THREE.Vector3((Math.random() - 0.5) * 0.15, (Math.random() - 0.5) * 0.12, 0)
            });
            ambientGroup.add(particle);
        }

        mainGroup.add(ambientGroup);

        // ============ SCAN PULSE WAVES ============
        const scanWaves: { mesh: THREE.Mesh; scale: number; opacity: number }[] = [];

        const createScanWave = () => {
            const wave = new THREE.Mesh(
                new THREE.RingGeometry(0.3, 0.38, 64),
                new THREE.MeshBasicMaterial({ color: colors.blue, transparent: true, opacity: 0.45, side: THREE.DoubleSide })
            );
            scanWaves.push({ mesh: wave, scale: 1, opacity: 0.45 });
            mainGroup.add(wave);
        };

        // ============ MOUSE INTERACTION ============
        const targetRotation = { x: 0, y: 0 };
        const currentRotation = { x: 0, y: 0 };
        let targetScale = 1;
        let currentScale = 1;

        const onMouseMove = (event: MouseEvent) => {
            const rect = containerRef.current?.getBoundingClientRect();
            if (rect) {
                const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
                const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
                targetRotation.x = y * 0.08; // Reduced sensitivity for smoother feel
                targetRotation.y = x * 0.1;
            }
        };

        const onMouseEnter = () => {
            targetScale = 1.02; // Subtle scale
            createScanWave();
        };

        const onMouseLeave = () => {
            targetScale = 1;
            targetRotation.x = 0;
            targetRotation.y = 0;
        };

        if (window.matchMedia("(pointer: fine)").matches) {
            window.addEventListener('mousemove', onMouseMove);
        }
        containerRef.current.addEventListener('mouseenter', onMouseEnter);
        containerRef.current.addEventListener('mouseleave', onMouseLeave);

        // ============ ANIMATION LOOP ============
        let time = 0;
        const clock = new THREE.Clock();

        const animate = () => {
            requestAnimationFrame(animate);
            const delta = clock.getDelta();
            time += delta;

            // Smooth rotation & scale interpolation
            currentRotation.x += (targetRotation.x - currentRotation.x) * 0.05;
            currentRotation.y += (targetRotation.y - currentRotation.y) * 0.05;
            mainGroup.rotation.x = currentRotation.x;
            mainGroup.rotation.y = currentRotation.y;

            currentScale += (targetScale - currentScale) * 0.05;
            mainGroup.scale.setScalar(currentScale);

            // Gentle floating (reduced amplitude for smoothness)
            mainGroup.position.y = Math.sin(time * 0.5) * 0.05;

            // Animate glow rings
            glowRing.rotation.z += delta * 0.15;
            glowRingMaterial.opacity = 0.35 + Math.sin(time * 1.5) * 0.1;

            innerRing.rotation.z -= delta * 0.2;
            innerRingMaterial.opacity = 0.2 + Math.sin(time * 2.0) * 0.08;

            // Animate modules (subtle pulse)
            modules.forEach((module, i) => {
                const pulse = 1 + Math.sin(time * 1.5 + i * 0.5) * 0.03;
                module.group.scale.setScalar(pulse);
            });

            // Animate data particles
            dataParticles.forEach((p) => {
                p.progress += p.speed * delta;
                if (p.progress > 1) {
                    p.progress = 0;
                    p.returning = !p.returning;
                }

                const t = p.progress;
                const start = p.returning ? p.endPos : new THREE.Vector3(0, 0, 0);
                const end = p.returning ? new THREE.Vector3(0, 0, 0) : p.endPos;

                // Quadratic Bezier curve for smooth path
                const mid = new THREE.Vector3(
                    (start.x + end.x) * 0.5,
                    (start.y + end.y) * 0.5,
                    0.5 // Arc height
                );

                const t1 = 1 - t;
                p.mesh.position.x = t1 * t1 * start.x + 2 * t1 * t * mid.x + t * t * end.x;
                p.mesh.position.y = t1 * t1 * start.y + 2 * t1 * t * mid.y + t * t * end.y;
                p.mesh.position.z = t1 * t1 * start.z + 2 * t1 * t * mid.z + t * t * end.z;

                // Fade in/out at ends
                (p.mesh.material as THREE.MeshBasicMaterial).opacity = Math.sin(t * Math.PI) * 0.8;
            });

            // Connection line pulse
            connectionLines.forEach((line, i) => {
                (line.material as THREE.LineBasicMaterial).opacity = 0.2 + Math.sin(time + i * 0.5) * 0.1;
            });

            // Scan waves animation
            for (let i = scanWaves.length - 1; i >= 0; i--) {
                const wave = scanWaves[i];
                wave.scale += delta * 1.2;
                wave.opacity -= delta * 0.3;

                wave.mesh.scale.setScalar(wave.scale);
                (wave.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, wave.opacity);

                if (wave.opacity <= 0) {
                    mainGroup.remove(wave.mesh);
                    wave.mesh.geometry.dispose();
                    (wave.mesh.material as THREE.Material).dispose();
                    scanWaves.splice(i, 1);
                }
            }

            // Periodic scan wave (less frequent)
            if (Math.floor(time) % 4 === 0 && Math.floor(time - delta) % 4 !== 0) {
                createScanWave();
            }

            // Status blink
            statusGroup.children.forEach((dot, i) => {
                const blink = Math.sin(time * 3 + i) > 0 ? 0.8 : 0.3;
                ((dot as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = blink;
            });

            // Ambient particles
            ambientParticles.forEach((p) => {
                p.mesh.position.add(p.velocity.clone().multiplyScalar(delta));

                // Wrap around logic
                if (Math.abs(p.mesh.position.x) > 6) p.mesh.position.x *= -0.9;
                if (Math.abs(p.mesh.position.y) > 4) p.mesh.position.y *= -0.9;
            });

            renderer.render(scene, camera);
        };

        animate();

        // ============ RESIZE ============
        const handleResize = () => {
            if (!containerRef.current) return;
            camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        };
        window.addEventListener('resize', handleResize);

        // ============ THEME ============
        const updateTheme = () => {
            isDarkMode = document.documentElement.classList.contains('dark');
            domainMaterial.opacity = isDarkMode ? 0.12 : 0.15;
        };
        const observer = new MutationObserver(updateTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        updateTheme();

        // ============ CLEANUP ============
        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', onMouseMove);
            containerRef.current?.removeEventListener('mouseenter', onMouseEnter);
            containerRef.current?.removeEventListener('mouseleave', onMouseLeave);
            observer.disconnect();

            // Dispose Three.js resources
            mainGroup.traverse((object) => {
                if (object instanceof THREE.Mesh) {
                    object.geometry.dispose();
                    if (object.material instanceof THREE.Material) {
                        object.material.dispose();
                    }
                }
            });

            if (containerRef.current?.contains(renderer.domElement)) {
                containerRef.current.removeChild(renderer.domElement);
            }
            renderer.dispose();
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className="w-full h-full absolute inset-0 cursor-pointer"
            aria-label="3D Domain Intelligence Visualization"
        />
    );
}
