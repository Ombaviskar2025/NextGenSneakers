import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { Cpu, Zap, Activity, ShieldCheck, Award, Star, ArrowRight, ChevronDown } from 'lucide-react';

interface FeatureCallout {
  scrollTrigger: [number, number]; // [startScrollPercent, endScrollPercent]
  title: string;
  subtitle: string;
  description: string;
  xPos: 'left' | 'right';
  yPos: 'top' | 'middle' | 'bottom';
}

const featureCallouts: FeatureCallout[] = [
  {
    scrollTrigger: [10, 35],
    title: 'AEROWEAVE UPPER',
    subtitle: 'Adaptive Tensile Thread Matrix',
    description: 'A continuous, monofilament weave that expands under thermal heat and contracts for maximum lockdown during sudden lateral movements.',
    xPos: 'left',
    yPos: 'top'
  },
  {
    scrollTrigger: [35, 65],
    title: 'NITROGEN RESPONSE CELLS',
    subtitle: 'Dual-Chamber Cushioning Pods',
    description: 'Double-pressurized nitrogen chambers placed at high-impact vectors. Compresses proportionally to landing velocity to shield joint stress.',
    xPos: 'right',
    yPos: 'middle'
  },
  {
    scrollTrigger: [65, 90],
    title: 'QUANTUM CARBON PLATE',
    subtitle: 'Aerospace Composite Launch Matrix',
    description: 'A 3D-sculpted variable-thickness plate designed to store bending energy at landing and snap forward, acting as a kinetic launch pad.',
    xPos: 'left',
    yPos: 'bottom'
  }
];

export const Innovation: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scrollPercent, setScrollPercent] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadProgress, setLoadProgress] = useState<number>(0);
  const [loadError, setLoadError] = useState<boolean>(false);
  const [activeTestimonial, setActiveTestimonial] = useState<number>(0);

  // Testimonials database
  const testimonials = [
    {
      name: 'Alice Shopper',
      role: 'Marathon Runner',
      stars: 5,
      comment: "Most comfortable sneakers I've ever worn. The energy return on long runs is unbelievable!"
    },
    {
      name: 'Dr. Sarah Vance',
      role: 'Biomechanics Specialist',
      stars: 5,
      comment: "The pressurized nitrogen cells provide exceptional cushioning and support without compromising on weight."
    },
    {
      name: 'Marcus Twan',
      role: 'Athletic Trainer',
      stars: 5,
      comment: "Outstanding lateral lock. The carbon plate snaps back instantly at toe-off. An absolute masterpiece."
    }
  ];

  // Scroll listener to calculate progress
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const totalHeight = containerRef.current.scrollHeight - window.innerHeight;
      
      // Calculate overall scroll progress (0 to 100)
      const scrolled = -rect.top;
      const percent = Math.min(Math.max((scrolled / totalHeight) * 100, 0), 100);
      setScrollPercent(percent);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    
    // Initial trigger
    setTimeout(handleScroll, 200);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  // Three.js Scene Initialization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    // 1. Scene setup
    const scene = new THREE.Scene();
    
    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.2, 5);

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Cap at 1.5 for mobile perf
    renderer.shadowMap.enabled = true;

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight1.position.set(5, 10, 7);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xff3b30, 0.6); // Premium red secondary light
    dirLight2.position.set(-5, -3, -5);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0xffffff, 0.5, 10);
    pointLight.position.set(0, 2, 2);
    scene.add(pointLight);

    // 5. Model references for animations
    let shoeRoot: THREE.Group | null = null;
    const meshes: { mesh: THREE.Mesh; originalPos: THREE.Vector3; direction: THREE.Vector3 }[] = [];

    // Fallback: build a wireframe shoe block if GLB fails
    const createFallbackMesh = () => {
      const fallbackGroup = new THREE.Group();
      
      // Sole block
      const soleGeo = new THREE.BoxGeometry(1.6, 0.25, 0.6);
      const soleMat = new THREE.MeshPhongMaterial({ color: 0xff3b30, wireframe: true });
      const sole = new THREE.Mesh(soleGeo, soleMat);
      sole.position.y = -0.2;
      fallbackGroup.add(sole);
      meshes.push({ mesh: sole, originalPos: sole.position.clone(), direction: new THREE.Vector3(0, -0.4, 0) });

      // Cushion pods
      const podGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.15, 8);
      const podMat = new THREE.MeshPhongMaterial({ color: 0xffffff, wireframe: true });
      for (let i = -0.6; i <= 0.6; i += 0.4) {
        const pod = new THREE.Mesh(podGeo, podMat);
        pod.position.set(i, -0.1, 0);
        fallbackGroup.add(pod);
        meshes.push({ mesh: pod, originalPos: pod.position.clone(), direction: new THREE.Vector3(i * 0.2, -0.2, (Math.random() - 0.5) * 0.2) });
      }

      // Upper block
      const upperGeo = new THREE.BoxGeometry(1.4, 0.4, 0.55);
      const upperMat = new THREE.MeshPhongMaterial({ color: 0x2c2c2e, wireframe: true });
      const upper = new THREE.Mesh(upperGeo, upperMat);
      upper.position.y = 0.15;
      fallbackGroup.add(upper);
      meshes.push({ mesh: upper, originalPos: upper.position.clone(), direction: new THREE.Vector3(0, 0.3, 0) });

      // Collar/Opening
      const collarGeo = new THREE.BoxGeometry(0.5, 0.3, 0.5);
      const collarMat = new THREE.MeshPhongMaterial({ color: 0xffffff, wireframe: true });
      const collar = new THREE.Mesh(collarGeo, collarMat);
      collar.position.set(-0.3, 0.4, 0);
      fallbackGroup.add(collar);
      meshes.push({ mesh: collar, originalPos: collar.position.clone(), direction: new THREE.Vector3(-0.2, 0.4, 0) });

      scene.add(fallbackGroup);
      shoeRoot = fallbackGroup as unknown as THREE.Group;
      setIsLoading(false);
    };

    // Enable Three.js built-in cache for GLB reuse across navigations
    THREE.Cache.enabled = true;

    // Load GLTF shoe model with DRACOLoader for compressed meshes
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
    dracoLoader.setDecoderConfig({ type: 'js' }); // JS decoder for broadest compatibility

    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);

    loader.load(
      '/models/shoe.glb',
      (gltf) => {
        const model = gltf.scene;
        
        // Scale and center the model
        model.scale.set(1.4, 1.4, 1.4);
        model.position.set(0, -0.1, 0);
        
        // Traverse to configure materials and track individual meshes for disassembly
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            
            // Adjust materials to support transparency & wireframe highlights during scroll
            if (mesh.material) {
              const mat = mesh.material as THREE.MeshStandardMaterial;
              mat.transparent = true;
              mat.opacity = 1.0;
            }

            // Exploded Direction Vector: distance vector from the model center
            const meshCenter = new THREE.Vector3();
            mesh.geometry.computeBoundingBox();
            if (mesh.geometry.boundingBox) {
              mesh.geometry.boundingBox.getCenter(meshCenter);
            }
            meshCenter.applyMatrix4(mesh.matrixWorld);

            // Establish explode direction outward from center
            const direction = meshCenter.clone().normalize();
            
            // Ensure some custom dramatic directions for specific types
            const nameLower = mesh.name.toLowerCase();
            if (nameLower.includes('lace') || nameLower.includes('string')) {
              direction.set(0, 0.6, 0.2);
            } else if (nameLower.includes('sole') || nameLower.includes('bottom') || nameLower.includes('midsole')) {
              direction.set(0, -0.6, 0);
            } else if (nameLower.includes('upper') || nameLower.includes('body')) {
              direction.set(0, 0.2, 0.4);
            } else if (direction.length() === 0) {
              direction.set((Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5).normalize();
            }

            meshes.push({
              mesh,
              originalPos: mesh.position.clone(),
              direction
            });
          }
        });

        scene.add(model);
        shoeRoot = model;
        setIsLoading(false);
      },
      (progress) => {
        // Track loading progress for the progress bar
        if (progress.total > 0) {
          setLoadProgress(Math.round((progress.loaded / progress.total) * 100));
        }
      },
      (err) => {
        console.error('Failed to load shoe GLTF model. Rendering wireframe fallback.', err);
        setLoadError(true);
        createFallbackMesh();
      }
    );

    // Mouse interactive shift
    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth) - 0.5;
      mouseY = (e.clientY / window.innerHeight) - 0.5;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // 6. Animation loop variables
    let reqId: number;
    let currentRotationY = 0;
    let targetRotationY = 0;

    // Render loop
    const animate = () => {
      reqId = requestAnimationFrame(animate);

      // Handle resize
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }

      // Check current scroll status (passed via ref or module state)
      const currentScroll = parseFloat(canvas.dataset.scroll || '0');

      if (shoeRoot) {
        // A. Scroll-controlled Rotation: Complete 360 rotation as page scrolls
        targetRotationY = (currentScroll / 100) * Math.PI * 4; // 2 full turns
        currentRotationY += (targetRotationY - currentRotationY) * 0.08;
        
        shoeRoot.rotation.y = currentRotationY;
        
        // Add subtle mouse hover rotation
        shoeRoot.rotation.x = THREE.MathUtils.lerp(shoeRoot.rotation.x, mouseY * 0.4, 0.05);
        shoeRoot.rotation.z = THREE.MathUtils.lerp(shoeRoot.rotation.z, -mouseX * 0.3, 0.05);

        // B. Exploded View (Disassembly): Starts from 30% scroll and reaches maximum at 65% scroll
        let explodeProgress = 0;
        if (currentScroll >= 30 && currentScroll <= 70) {
          // Explode outwards
          explodeProgress = (currentScroll - 30) / 40;
        } else if (currentScroll > 70) {
          // Reassemble slowly back to solid
          explodeProgress = Math.max(0, 1 - (currentScroll - 70) / 20);
        }

        meshes.forEach(({ mesh, originalPos, direction }) => {
          // Offset position along direction vector
          const offset = direction.clone().multiplyScalar(explodeProgress * 0.85);
          mesh.position.copy(originalPos).add(offset);
          
          // C. Material opacity highlight (Ghosting during material breakdown section at 60-80% scroll)
          if (mesh.material) {
            const mat = mesh.material as THREE.MeshStandardMaterial;
            if (currentScroll >= 60 && currentScroll <= 80) {
              const nameLower = mesh.name.toLowerCase();
              // Make carbon plate meshes solid, and other meshes semi-transparent
              if (nameLower.includes('plate') || nameLower.includes('carbon')) {
                mat.opacity = 1.0;
                mat.wireframe = false;
              } else {
                mat.opacity = 0.25;
                mat.wireframe = true;
              }
            } else {
              mat.opacity = 1.0;
              mat.wireframe = false;
            }
          }
        });
      }

      renderer.render(scene, camera);
    };

    reqId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(reqId);
      window.removeEventListener('mousemove', handleMouseMove);
      // Dispose Three.js resources to prevent memory leaks
      renderer.dispose();
      dracoLoader.dispose();
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          mesh.geometry.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else if (mesh.material) {
            mesh.material.dispose();
          }
        }
      });
    };
  }, []);

  // Sync scroll percent into canvas dataset attribute for animation loop
  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.dataset.scroll = scrollPercent.toString();
    }
  }, [scrollPercent]);

  return (
    <div ref={containerRef} className="relative bg-[#0d0d0d] min-h-[400vh] text-white overflow-hidden">
      
      {/* ── BACKGROUND VIEWPORT CANVASES ───────────────── */}
      <div className="fixed inset-0 w-full h-screen z-0 pointer-events-none select-none">
        
        {/* Glow behind 3D canvas */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] md:w-[45vw] md:h-[45vw] bg-pulse-red/5 rounded-full blur-[120px] z-0" />
        
        {/* Three.js Canvas Container */}
        <div className="absolute inset-0 flex items-center justify-center">
          <canvas
            ref={canvasRef}
            className="w-full h-full max-w-[1200px] max-h-[800px] transition-all duration-300"
          />
        </div>
      </div>

      {/* Loading — Subtle inline progress bar instead of full-screen blocking overlay */}
      {isLoading && (
        <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
          {/* Background progress bar */}
          <div className="h-1 bg-white/5 w-full">
            <div 
              className="h-full bg-gradient-to-r from-pulse-red to-red-400 transition-all duration-300 ease-out"
              style={{ width: `${loadProgress}%` }}
            />
          </div>
          {/* Subtle center spinner (non-blocking — content is visible behind it) */}
          <div className="fixed bottom-8 right-8 flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2.5 rounded-full border border-white/10 shadow-2xl">
            <div className="w-4 h-4 border-2 border-pulse-red border-t-transparent rounded-full animate-spin" />
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/50">{loadProgress}%</span>
          </div>
        </div>
      )}

      {/* ── FLOAT OVERLAYS (STORYTELLING CARDS) ─────────── */}
      <div className="relative z-10 w-full pointer-events-none">
        
        {/* Section 1: Intro Hero */}
        <section className="h-screen flex flex-col justify-between items-center text-center p-6 pt-24 pb-16">
          <div className="space-y-4 animate-fade-in">
            <span className="text-pulse-red font-bold text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2">
              <Zap className="h-4 w-4 animate-pulse" />
              AIRVERSE LABS
            </span>
            <h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase leading-none text-white">
              INNOVATION ENGINE
            </h1>
            <p className="text-platinum-gray/60 text-xs md:text-sm max-w-xl mx-auto leading-relaxed">
              Experience performance deconstructed. Scroll down to trigger the system disassembly and explore the material blueprints.
            </p>
          </div>
          
          <div className="flex flex-col items-center gap-2 animate-bounce opacity-50">
            <span className="text-[10px] font-bold tracking-widest uppercase">SCROLL TO DISASSEMBLE</span>
            <ChevronDown className="h-4.5 w-4.5 text-pulse-red" />
          </div>
        </section>

        {/* Feature Highlights Overlay (Triggered by scroll progress) */}
        <div className="fixed inset-0 z-20 pointer-events-none flex items-center justify-center px-6 md:px-16 max-w-container-max mx-auto h-screen">
          {featureCallouts.map((callout, index) => {
            const isVisible = scrollPercent >= callout.scrollTrigger[0] && scrollPercent < callout.scrollTrigger[1];
            
            // Layout Alignment Classes
            const xAlignClass = callout.xPos === 'left' ? 'mr-auto md:ml-12' : 'ml-auto md:mr-12';
            const yAlignClass = 
              callout.yPos === 'top' ? 'mb-40' : 
              callout.yPos === 'bottom' ? 'mt-40' : '';

            return (
              <div
                key={index}
                className={`absolute w-full max-w-[340px] pointer-events-auto transition-all duration-500 ease-out p-6 rounded-2xl glass-card border border-white/10 shadow-2xl ${
                  isVisible 
                    ? 'opacity-100 translate-y-0 scale-100 filter blur-0 pointer-events-auto' 
                    : 'opacity-0 translate-y-8 scale-95 filter blur-sm pointer-events-none'
                } ${xAlignClass} ${yAlignClass}`}
              >
                <div className="space-y-3">
                  <div className="flex gap-2.5 items-center">
                    <span className="bg-pulse-red/10 border border-pulse-red/35 rounded-lg p-2.5 text-pulse-red">
                      {index === 0 ? <Activity className="h-4.5 w-4.5" /> : index === 1 ? <Cpu className="h-4.5 w-4.5" /> : <Zap className="h-4.5 w-4.5" />}
                    </span>
                    <div>
                      <h3 className="text-white font-black text-xs uppercase tracking-wider leading-none">{callout.title}</h3>
                      <span className="text-[9px] font-bold text-platinum-gray uppercase tracking-widest leading-none mt-1 block">{callout.subtitle}</span>
                    </div>
                  </div>
                  <p className="text-platinum-gray/80 text-[11px] leading-relaxed">
                    {callout.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Height Spacer Sections matching the triggers */}
        <div className="h-screen" /> {/* 100vh spacer for callout 1 */}
        <div className="h-screen" /> {/* 200vh spacer for callout 2 */}
        <div className="h-screen" /> {/* 300vh spacer for callout 3 */}

        {/* ── FOOTER SECTIONS (STATISTICS & TESTIMONIALS) ─── */}
        <div className="relative bg-[#0d0d0d]/90 backdrop-blur-3xl border-t border-white/10 z-30 pointer-events-auto select-none pt-24 pb-20">
          
          <div className="max-w-container-max mx-auto px-6 md:px-12 space-y-24">
            
            {/* 1. Statistics Section */}
            <section className="space-y-12">
              <div className="text-center space-y-4 max-w-xl mx-auto">
                <span className="text-pulse-red text-[10px] font-bold uppercase tracking-widest">PERFORMANCE BY THE NUMBERS</span>
                <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter">ENGINEERED STATISTICS</h2>
                <p className="text-platinum-gray/60 text-xs leading-relaxed">
                  Through scientific formulation and athlete feedback, we build speed benchmarks that prove themselves at every stride.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-8 rounded-2xl glass-card border border-white/5 text-center space-y-3 hover:border-pulse-red/25 transition duration-300">
                  <span className="block text-4xl md:text-5xl font-sans font-black text-pulse-red">100%</span>
                  <div>
                    <h4 className="font-bold text-white uppercase tracking-wider text-xs">SUSTAINABLE MATERIALS</h4>
                    <p className="text-platinum-gray/50 text-[10px] uppercase font-semibold leading-relaxed mt-1">Made from recycled polyester matrix</p>
                  </div>
                </div>
                
                <div className="p-8 rounded-2xl glass-card border border-white/5 text-center space-y-3 hover:border-pulse-red/25 transition duration-300">
                  <span className="block text-4xl md:text-5xl font-sans font-black text-pulse-red">25%</span>
                  <div>
                    <h4 className="font-bold text-white uppercase tracking-wider text-xs">LIGHTER MIDSOLE</h4>
                    <p className="text-platinum-gray/50 text-[10px] uppercase font-semibold leading-relaxed mt-1">Nitrogen density optimization</p>
                  </div>
                </div>

                <div className="p-8 rounded-2xl glass-card border border-white/5 text-center space-y-3 hover:border-pulse-red/25 transition duration-300">
                  <span className="block text-4xl md:text-5xl font-sans font-black text-pulse-red">50K+</span>
                  <div>
                    <h4 className="font-bold text-white uppercase tracking-wider text-xs">GLOBAL ATHLETES</h4>
                    <p className="text-platinum-gray/50 text-[10px] uppercase font-semibold leading-relaxed mt-1">Active customer feedback community</p>
                  </div>
                </div>

                <div className="p-8 rounded-2xl glass-card border border-white/5 text-center space-y-3 hover:border-pulse-red/25 transition duration-300">
                  <span className="block text-4xl md:text-5xl font-sans font-black text-pulse-red">4.9 ★</span>
                  <div>
                    <h4 className="font-bold text-white uppercase tracking-wider text-xs">AVERAGE RATING</h4>
                    <p className="text-platinum-gray/50 text-[10px] uppercase font-semibold leading-relaxed mt-1">From certified buyers and reviewers</p>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. Testimonials Section */}
            <section className="space-y-12">
              <div className="text-center space-y-4 max-w-xl mx-auto">
                <span className="text-pulse-red text-[10px] font-bold uppercase tracking-widest">ATHLETE VOICES</span>
                <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter">WHAT THEY SAY</h2>
              </div>

              <div className="glass-card p-8 md:p-14 rounded-3xl border border-white/5 max-w-3xl mx-auto shadow-2xl relative overflow-hidden flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left transition-all duration-350">
                <div className="p-5 bg-pulse-red/10 border border-pulse-red/20 rounded-full flex-shrink-0">
                  <Award className="h-12 w-12 text-pulse-red" />
                </div>
                <div className="space-y-4 flex-1">
                  <div className="flex justify-center md:justify-start gap-1">
                    {[...Array(testimonials[activeTestimonial].stars)].map((_, i) => (
                      <Star key={i} className="h-4.5 w-4.5 fill-pulse-red text-pulse-red" />
                    ))}
                  </div>
                  <p className="text-lg md:text-xl font-bold italic leading-relaxed text-white">
                    "{testimonials[activeTestimonial].comment}"
                  </p>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t border-white/5">
                    <div>
                      <h4 className="font-black text-white text-xs uppercase tracking-wider">{testimonials[activeTestimonial].name}</h4>
                      <span className="text-[10px] font-bold text-platinum-gray/60 uppercase tracking-widest">{testimonials[activeTestimonial].role}</span>
                    </div>
                    
                    {/* Navigation Dots */}
                    <div className="flex justify-center gap-2.5">
                      {testimonials.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveTestimonial(idx)}
                          className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                            activeTestimonial === idx 
                              ? 'bg-pulse-red scale-125' 
                              : 'bg-white/20 hover:bg-white/40'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

          </div>
        </div>

      </div>

    </div>
  );
};
