import React, { useState } from 'react';
import { Cpu, Zap, Activity, Award, CheckCircle, Flame, ShieldAlert } from 'lucide-react';

interface TechPillar {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  description: string;
  stats: { label: string; value: string }[];
  details: string[];
}

const techPillars: TechPillar[] = [
  {
    id: 'casing',
    title: 'AIRVERSE PRESSURIZED CASING',
    subtitle: 'Dynamic Nitrogen Response Cells',
    icon: <Cpu className="h-6 w-6 text-pulse-red" />,
    description: 'Double-chambered, nitrogen-pressurized pods that flex and expand instantly based on impact strike vectors, offering tailormade cushioning.',
    stats: [
      { label: 'Energy Return', value: '+40%' },
      { label: 'Cell Response Time', value: '1.2ms' },
      { label: 'Compression Resilience', value: '99.8%' }
    ],
    details: [
      'Encapsulated high-purity nitrogen chambers that resist thermal deformation.',
      'Segmented channels that distribute impact loads away from joint stress zones.',
      'Progressive density walls that stiffen proportionally to landing velocity.'
    ]
  },
  {
    id: 'plate',
    title: 'QUANTUM CARBON PLATE',
    subtitle: 'Multi-Directional Launch Matrix',
    icon: <Zap className="h-6 w-6 text-pulse-red" />,
    description: 'A 3D-sculpted, variable-thickness aerospace-grade carbon composite plate designed to store bending energy and snap forward at toe-off.',
    stats: [
      { label: 'Propulsion Index', value: '9.8/10' },
      { label: 'Weight Profile', value: '14 grams' },
      { label: 'Stiffness Ratio', value: 'Carbon-S2' }
    ],
    details: [
      'Variable-flex layup structure that allows natural forefoot pronation.',
      'Spoons-shaped geometry optimized for stride acceleration profiles.',
      'Torsional stabilization wings that reduce ankle fatigue on curved routes.'
    ]
  },
  {
    id: 'weave',
    title: 'AEROWEAVE ADAPTIVE UPPER',
    subtitle: 'High-Tensile Kinetic Matrix Thread',
    icon: <Activity className="h-6 w-6 text-pulse-red" />,
    description: 'A monofilament matrix weave that expands and tightens dynamically under lateral strain, providing a second-skin fit without internal seams.',
    stats: [
      { label: 'Weight Reduction', value: '-15%' },
      { label: 'Tensile Strength', value: '450N/m' },
      { label: 'Air Permeability', value: '180 l/m²/s' }
    ],
    details: [
      'Zoned weave structures that place maximum containment only where needed.',
      'Elastic core threads that contract in response to foot temperature rise.',
      '100% recycled high-performance yarn blended with metallic composite fibers.'
    ]
  }
];

export const Innovation: React.FC = () => {
  const [activeTechId, setActiveTechId] = useState<string>('casing');
  const activeTech = techPillars.find(t => t.id === activeTechId) || techPillars[0];

  return (
    <div className="bg-surface-dim min-h-screen pt-12 pb-24 space-y-24">
      
      {/* 1. Lab Header */}
      <section className="px-6 md:px-16 max-w-container-max mx-auto text-center space-y-6">
        <span className="text-pulse-red font-bold text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2">
          <Flame className="h-4 w-4" />
          PERFORMANCE LAB
        </span>
        <h1 className="text-4xl md:text-7xl font-sans font-black text-white uppercase tracking-tighter leading-none">
          AIRVERSE INNOVATION
        </h1>
        <p className="text-platinum-gray text-xs md:text-sm max-w-2xl mx-auto leading-relaxed">
          Where atomic-level materials science meets elite athletic engineering. We disassemble traditional footwear boundaries to reconstruct speed from the sole up.
        </p>
      </section>

      {/* 2. Interactive Tech Showcase */}
      <section className="px-6 md:px-16 max-w-container-max mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Navigation Selector (Left) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <span className="text-[10px] font-bold text-platinum-gray uppercase tracking-widest px-4">SELECT CORE PILLAR</span>
          {techPillars.map((tech) => (
            <button
              key={tech.id}
              onClick={() => setActiveTechId(tech.id)}
              className={`p-6 text-left rounded-2xl border transition-all duration-300 flex items-start gap-4 ${
                activeTechId === tech.id
                  ? 'bg-white/5 border-pulse-red shadow-lg shadow-pulse-red/10'
                  : 'bg-transparent border-white/5 hover:border-white/10 hover:bg-white/2'
              }`}
            >
              <div className={`p-3 rounded-xl border ${activeTechId === tech.id ? 'bg-pulse-red/10 border-pulse-red/35' : 'bg-white/5 border-white/5'}`}>
                {tech.icon}
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-white text-xs tracking-wider uppercase">{tech.title}</h3>
                <p className="text-[10px] text-platinum-gray font-semibold uppercase">{tech.subtitle}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Detailed Showcase Panel (Right) */}
        <div className="lg:col-span-8 glass-card p-8 md:p-12 rounded-3xl border border-white/5 flex flex-col gap-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-pulse-red/5 rounded-full blur-3xl" />
          
          <div className="space-y-4">
            <span className="text-pulse-red text-[10px] font-bold uppercase tracking-widest">Active technology module</span>
            <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight leading-none">
              {activeTech.title}
            </h2>
            <p className="text-platinum-gray text-xs md:text-sm leading-relaxed">
              {activeTech.description}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 border-y border-white/5 py-8">
            {activeTech.stats.map((stat, i) => (
              <div key={i} className="text-center md:text-left space-y-2">
                <span className="block text-3xl md:text-4xl font-sans font-black text-pulse-red">{stat.value}</span>
                <span className="block text-[9px] font-bold text-platinum-gray uppercase tracking-widest leading-none">{stat.label}</span>
              </div>
            ))}
          </div>

          {/* Tech bullet details */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">SYSTEM SPECIFICATIONS:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeTech.details.map((detail, idx) => (
                <div key={idx} className="flex gap-3 items-start bg-white/3 p-4 rounded-xl border border-white/5">
                  <CheckCircle className="h-4.5 w-4.5 text-pulse-red flex-shrink-0 mt-0.5" />
                  <p className="text-platinum-gray text-xs leading-relaxed">{detail}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* 3. Tech Spec Comparison */}
      <section className="px-6 md:px-16 max-w-container-max mx-auto space-y-8">
        <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight text-center md:text-left">Tech Blueprint</h3>
        <div className="overflow-x-auto glass-card rounded-2xl border border-white/5 shadow-2xl">
          <table className="w-full border-collapse text-left text-xs tracking-wide">
            <thead>
              <tr className="border-b border-white/10 text-[10px] font-bold text-platinum-gray uppercase bg-white/2">
                <th className="p-6">Feature Metric</th>
                <th className="p-6">Standard Foam Tech</th>
                <th className="p-6">AirVerse Lab Tech</th>
                <th className="p-6 text-pulse-red">Performance Gain</th>
              </tr>
            </thead>
            <tbody className="text-platinum-gray uppercase font-semibold">
              <tr className="border-b border-white/5 hover:bg-white/2 transition-colors">
                <td className="p-6 font-bold text-white">Energy Return Rate</td>
                <td className="p-6">58% - 64%</td>
                <td className="p-6 text-white font-bold">88% - 94%</td>
                <td className="p-6 text-pulse-red font-black">+42% Boost</td>
              </tr>
              <tr className="border-b border-white/5 hover:bg-white/2 transition-colors">
                <td className="p-6 font-bold text-white">Midsole Density Degradation</td>
                <td className="p-6">After 250 Kilometers</td>
                <td className="p-6 text-white font-bold">After 800 Kilometers</td>
                <td className="p-6 text-pulse-red font-black">3.2x Lifetime</td>
              </tr>
              <tr className="border-b border-white/5 hover:bg-white/2 transition-colors">
                <td className="p-6 font-bold text-white">Component Weight (Size 9)</td>
                <td className="p-6">145 Grams</td>
                <td className="p-6 text-white font-bold">98 Grams</td>
                <td className="p-6 text-pulse-red font-black">32% Lighter</td>
              </tr>
              <tr className="hover:bg-white/2 transition-colors">
                <td className="p-6 font-bold text-white">Lockdown Strain Response</td>
                <td className="p-6">Static Friction</td>
                <td className="p-6 text-white font-bold">Dynamic Tensile Shrink</td>
                <td className="p-6 text-pulse-red font-black">Active Adaptive</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. Elite Lab Certification */}
      <section className="px-6 md:px-16 max-w-5xl mx-auto">
        <div className="p-8 md:p-12 bg-surface-container rounded-3xl border border-white/5 grid grid-cols-1 md:grid-cols-3 gap-8 items-center text-center md:text-left">
          <div className="col-span-1 flex justify-center">
            <div className="p-5 bg-pulse-red/10 border border-pulse-red/30 rounded-full">
              <Award className="h-14 w-14 text-pulse-red" />
            </div>
          </div>
          <div className="col-span-1 md:col-span-2 space-y-4">
            <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">IAAF IAAF-Approved Specs</h3>
            <p className="text-platinum-gray text-xs leading-relaxed">
              Every compound, foam thickness, and carbon stack height designed in the AirVerse Innovation Lab is strictly tested and certified to fall within elite international competition boundaries.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
};
