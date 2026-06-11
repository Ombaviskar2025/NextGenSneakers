import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Trophy, Flame, Zap, Activity, ShieldCheck, Truck, RefreshCw, Sparkles, Plus } from 'lucide-react';
import { api } from '../../services/api';
import type { Product } from '../../types';


// ----------------------------------------------------
// WebGL Shader Background Component
// ----------------------------------------------------
const WebGLBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return;

    let animationId: number;

    const syncSize = () => {
      const w = canvas.clientWidth || 1280;
      const h = canvas.clientHeight || 720;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    };

    window.addEventListener('resize', syncSize);
    syncSize();

    const vs = `
      attribute vec2 a_position;
      varying vec2 v_texCoord;
      void main() {
        v_texCoord = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fs = `
      precision highp float;
      varying vec2 v_texCoord;
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;

      void main() {
        vec2 uv = v_texCoord;
        float noise = sin(uv.x * 10.0 + u_time) * cos(uv.y * 10.0 - u_time) * 0.5 + 0.5;
        vec3 color = mix(vec3(0.0), vec3(0.08, 0.0, 0.0), noise);
        color += mix(vec3(0.0), vec3(0.03), step(0.995, fract(uv.x * 20.0)) + step(0.995, fract(uv.y * 20.0)));
        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const compileShader = (type: number, src: string) => {
      const s = gl.createShader(type);
      if (!s) return null;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };

    const vertexShader = compileShader(gl.VERTEX_SHADER, vs);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fs);
    if (!vertexShader || !fragmentShader) return;

    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vertexShader);
    gl.attachShader(prog, fragmentShader);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const pos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes = gl.getUniformLocation(prog, 'u_resolution');

    const render = (t: number) => {
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (uTime) gl.uniform1f(uTime, t * 0.001);
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', syncSize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0 opacity-40" style={{ display: 'block' }} />;
};

// ----------------------------------------------------
// Sketchfab 3D Jordan 4 Bred Embed
// Uses the real hi-res 3D scanned model
// ----------------------------------------------------
const SKETCHFAB_MODEL_ID = '0f9cd6cc050b499b8109a7277523e8f2';

const HeroShoeViewer: React.FC = () => {
  const iframeSrc = `https://sketchfab.com/models/${SKETCHFAB_MODEL_ID}/embed?autostart=1&transparent=1&ui_theme=dark&ui_controls=0&ui_infos=0&ui_stop=0&ui_inspector=0&ui_watermark_link=0&ui_watermark=0&ui_ar=0&ui_help=0&ui_settings=0&ui_vr=0&ui_fullscreen=0&ui_annotations=0&ui_title=0&ui_author=0&ui_hint=0&camera=0&preload=1&scrollwheel=0&dnt=1`;

  return (
    <div 
      className="w-full h-full relative overflow-hidden"
      style={{
        maskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,1) 90%, rgba(0,0,0,0) 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,1) 90%, rgba(0,0,0,0) 100%)',
      }}
    >
      <iframe
        title="3D Jordan 4 Bred"
        src={iframeSrc}
        className="absolute left-[-40px] top-[-40px] w-[440px] h-[300px] md:left-[-75px] md:top-[-50px] md:w-[900px] md:h-[500px] border-0"
        style={{ background: 'transparent' }}
        allow="autoplay; fullscreen; xr-spatial-tracking"
      />
    </div>
  );
};


// ----------------------------------------------------
// Main Home Page Component
// ----------------------------------------------------
export const Home: React.FC = () => {
  // Fetch Categories
  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/products/categories');
      return res.data;
    },
  });

  // Fetch Featured Products
  const { data: featuredResponse } = useQuery<{ products: Product[] }>({
    queryKey: ['featured-products'],
    queryFn: async () => {
      const res = await api.get('/products?isFeatured=true&limit=4');
      return res.data;
    },
  });

  // Fetch Latest Products
  const { data: latestResponse } = useQuery<{ products: Product[] }>({
    queryKey: ['latest-products'],
    queryFn: async () => {
      const res = await api.get('/products?limit=8&sortBy=created_desc');
      return res.data;
    },
  });

  const featuredProducts = featuredResponse?.products || [];
  const latestProducts = latestResponse?.products || [];

  // Map category slugs to icons
  const getCategoryIcon = (slug: string) => {
    switch (slug.toLowerCase()) {
      case 'lifestyle':
        return <Trophy className="h-6 w-6 text-pulse-red" />;
      case 'running':
        return <Flame className="h-6 w-6 text-pulse-red" />;
      case 'basketball':
        return <Zap className="h-6 w-6 text-pulse-red" />;
      case 'training':
      case 'training & gym':
        return <Activity className="h-6 w-6 text-pulse-red" />;
      default:
        return <Trophy className="h-6 w-6 text-pulse-red" />;
    }
  };

  return (
    <div className="space-y-24 bg-surface-dim min-h-screen">
      
      {/* 1. Hero Section */}
      <section className="relative h-screen w-full overflow-hidden flex items-center justify-center bg-surface-dim">
        
        {/* WebGL Animated shader */}
        <WebGLBackground />

        {/* Hero Context */}
        <div className="relative z-10 text-center px-6 md:px-0">
          <div className="flex flex-col items-center">
            
            {/* Display Header */}
            <h1 className="font-sans font-black text-6xl md:text-[100px] leading-[0.9] tracking-tighter text-white max-w-5xl uppercase animate-fade-in">
              MOVE FASTER <br className="hidden md:block"/> THAN TOMORROW
            </h1>

            {/* 3D Canvas container */}
            <div className="w-[360px] h-[220px] md:w-[750px] md:h-[400px] relative mt-[-20px] mb-[-10px] animate-float flex items-center justify-center">
              <HeroShoeViewer />
            </div>



          </div>
        </div>
      </section>

      {/* 2. Brand Value Pillars */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 px-6 md:px-16 max-w-container-max mx-auto">
        <div className="p-8 glass-card rounded-2xl flex flex-col items-center space-y-4 text-center">
          <div className="p-3 bg-white/5 border border-white/10 rounded-full">
            <ShieldCheck className="h-6 w-6 text-pulse-red" />
          </div>
          <h4 className="font-bold text-white uppercase tracking-wider text-sm">Secure Uplink</h4>
          <p className="text-platinum-gray text-xs leading-relaxed">
            Encrypted transactions powered by standard processing keeping credentials secure.
          </p>
        </div>
        <div className="p-8 glass-card rounded-2xl flex flex-col items-center space-y-4 text-center">
          <div className="p-3 bg-white/5 border border-white/10 rounded-full">
            <Truck className="h-6 w-6 text-pulse-red" />
          </div>
          <h4 className="font-bold text-white uppercase tracking-wider text-sm">Quantum Transport</h4>
          <p className="text-platinum-gray text-xs leading-relaxed">
            Coordinated with express shipping lines to verify delivery status in real time.
          </p>
        </div>
        <div className="p-8 glass-card rounded-2xl flex flex-col items-center space-y-4 text-center">
          <div className="p-3 bg-white/5 border border-white/10 rounded-full">
            <RefreshCw className="h-6 w-6 text-pulse-red" />
          </div>
          <h4 className="font-bold text-white uppercase tracking-wider text-sm">Direct Return</h4>
          <p className="text-platinum-gray text-xs leading-relaxed">
            Process easy returns directly through your dashboard if details don't suit your metrics.
          </p>
        </div>
      </section>

      {/* 3. Browse Categories */}
      <section className="space-y-8 px-6 md:px-16 max-w-container-max mx-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-black text-white uppercase tracking-tight">Browse Categories</h3>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {categories.slice(0, 4).map((cat) => (
            <Link
              key={cat.id}
              to={`/products?categorySlug=${cat.slug}`}
              className="flex flex-col items-center justify-center p-8 bg-[#1f1f1f] border border-white/5 rounded-2xl hover:border-pulse-red transition duration-300 group hover:shadow-2xl"
            >
              <div className="p-4 bg-white/5 rounded-2xl mb-3 group-hover:scale-110 transition duration-300 border border-white/5">
                {getCategoryIcon(cat.slug)}
              </div>
              <span className="font-bold text-white text-xs tracking-wider uppercase">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. Crafted for Speed (Featured Products) */}
      <section className="space-y-8 px-6 md:px-16 max-w-container-max mx-auto">
        <div className="flex items-end justify-between">
          <div className="space-y-2">
            <span className="text-pulse-red font-bold text-xs tracking-widest uppercase">New Arrivals</span>
            <h3 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">Crafted For Speed</h3>
          </div>
          <Link to="/products" className="text-platinum-gray hover:text-pulse-red font-bold flex items-center gap-1.5 transition-colors text-xs uppercase tracking-wider">
            <span>See All</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {featuredProducts.map((product) => (
            <div key={product.id} className="group flex flex-col glass-card rounded-2xl overflow-hidden hover:-translate-y-2 transition-all duration-500 hover:shadow-2xl">
              <Link to={`/products/${product.slug}`} className="relative block overflow-hidden bg-white/5 aspect-square">
                <img
                  src={product.image_url || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600'}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <span className="absolute top-4 right-4 bg-pulse-red text-white font-bold text-[9px] px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                  Elite
                </span>
              </Link>
              <div className="p-6 flex flex-col flex-1 space-y-2">
                <span className="text-[9px] uppercase font-bold text-platinum-gray tracking-widest">Store: {product.store_name}</span>
                <Link to={`/products/${product.slug}`} className="font-black text-white group-hover:text-pulse-red transition text-sm uppercase tracking-wide line-clamp-1">
                  {product.name}
                </Link>
                {/* Rating */}
                <div className="flex items-center gap-1 text-xs text-pulse-red">
                  <span>★</span>
                  <span className="font-bold text-platinum-gray text-[10px] tracking-wider">{product.rating ? parseFloat(product.rating.toString()).toFixed(1) : '5.0'}</span>
                </div>
                <div className="pt-2 flex items-center justify-between mt-auto">
                  <span className="font-black text-white text-base">₹{parseFloat(product.price.toString()).toFixed(2)}</span>
                  {product.compare_at_price && (
                    <span className="text-xs line-through text-platinum-gray">₹{parseFloat(product.compare_at_price.toString()).toFixed(2)}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Innovation Lab */}
      <section className="relative min-h-[500px] flex items-center py-20 bg-surface-container-lowest border-y border-white/5">
        <div className="px-6 md:px-16 max-w-container-max mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <span className="text-pulse-red font-bold text-xs uppercase tracking-[0.2em]">Innovation Lab</span>
            <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight leading-none">AIRVERSE: THE FUTURE OF CUSHIONING.</h2>
            <p className="text-platinum-gray text-xs md:text-sm leading-relaxed max-w-lg">
              Introducing a new era of performance engineering. The AirVerse technology utilizes atomic-level precision to create cushioning that reacts instantly to your unique movement signature.
            </p>
            <div className="grid grid-cols-2 gap-8 pt-4">
              <div>
                <div className="text-4xl font-black text-pulse-red mb-1">40%</div>
                <p className="text-[10px] font-bold text-platinum-gray uppercase tracking-widest">More Energy Return</p>
              </div>
              <div>
                <div className="text-4xl font-black text-pulse-red mb-1">-15%</div>
                <p className="text-[10px] font-bold text-platinum-gray uppercase tracking-widest">Lighter Weight</p>
              </div>
            </div>
          </div>
          <div className="relative group">
            <div className="relative z-10 glass-card p-1 rounded-2xl overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=600"
                alt="Nike tech design"
                className="w-full h-[320px] object-cover rounded-2xl grayscale hover:grayscale-0 transition-all duration-1000"
              />
            </div>
            {/* Design circle highlights */}
            <div className="absolute -top-6 -right-6 w-32 h-32 border border-pulse-red/20 rounded-full animate-pulse" />
            <div className="absolute -bottom-6 -left-6 w-48 h-48 border border-white/5 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
        </div>
      </section>

      {/* 6. Join the Revolution */}
      <section className="py-20 max-w-4xl mx-auto px-6 text-center space-y-8">
        <h3 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight">JOIN THE REVOLUTION.</h3>
        <p className="text-platinum-gray text-xs md:text-sm max-w-md mx-auto leading-relaxed">
          Be the first to know about product drops, athlete collaborations, and exclusive digital experiences.
        </p>
        <form className="flex flex-col md:flex-row gap-4 max-w-xl mx-auto pt-4" onSubmit={(e) => e.preventDefault()}>
          <input
            type="email"
            placeholder="EMAIL ADDRESS"
            className="flex-1 bg-surface-container-high border-none px-6 py-4 rounded-full text-white font-bold tracking-wider text-xs focus:ring-1 focus:ring-pulse-red transition-all outline-none"
          />
          <button
            type="submit"
            className="bg-pulse-red text-white px-8 py-4 rounded-full text-xs font-bold uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,59,48,0.2)]"
          >
            Subscribe
          </button>
        </form>
      </section>

    </div>
  );
};
