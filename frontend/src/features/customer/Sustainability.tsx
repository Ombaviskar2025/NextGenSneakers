import React from 'react';
import { Compass, RefreshCw, Leaf, Droplet, Sun, ArrowRight } from 'lucide-react';

interface ImpactStat {
  value: string;
  label: string;
  sublabel: string;
}

const stats: ImpactStat[] = [
  { value: '85%', label: 'RECYCLED POLYESTER', sublabel: 'Used across all AeroWeave knit uppers' },
  { value: '100%', label: 'RENEWABLE LAB ENERGY', sublabel: 'Labs powered entirely by wind & solar energy' },
  { value: '98%', label: 'WASTE DIVERTED', sublabel: 'Diverted from landfills across manufacturing pipelines' }
];

export const Sustainability: React.FC = () => {
  return (
    <div className="bg-surface-dim min-h-screen pt-12 pb-24 space-y-24">
      
      {/* 1. Sustainability Header */}
      <section className="px-6 md:px-16 max-w-container-max mx-auto text-center space-y-6">
        <span className="text-pulse-red font-bold text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2">
          <Leaf className="h-4.5 w-4.5" />
          MOVE TO ZERO
        </span>
        <h1 className="text-4xl md:text-7xl font-sans font-black text-white uppercase tracking-tighter leading-none">
          SUSTAINABILITY
        </h1>
        <p className="text-platinum-gray text-xs md:text-sm max-w-2xl mx-auto leading-relaxed">
          Performance shouldn't cost the planet. We are re-engineering the life cycles of athletic products to achieve a zero-carbon, zero-waste footprint.
        </p>
      </section>

      {/* 2. Impact Numbers */}
      <section className="px-6 md:px-16 max-w-container-max mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {stats.map((stat, i) => (
          <div key={i} className="p-8 glass-card rounded-2xl border border-white/5 text-center md:text-left space-y-4">
            <span className="block text-4xl md:text-6xl font-sans font-black text-pulse-red">{stat.value}</span>
            <div className="space-y-1">
              <h4 className="font-bold text-white uppercase tracking-wider text-xs">{stat.label}</h4>
              <p className="text-platinum-gray text-[10px] uppercase font-semibold leading-relaxed">{stat.sublabel}</p>
            </div>
          </div>
        ))}
      </section>

      {/* 3. Circular Design Pillars */}
      <section className="px-6 md:px-16 max-w-container-max mx-auto space-y-12">
        <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight text-center md:text-left">Circular Design Pillars</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Pillar 1 */}
          <div className="p-8 bg-surface-container rounded-2xl border border-white/5 space-y-6">
            <div className="p-3 bg-pulse-red/10 border border-pulse-red/30 rounded-full w-fit">
              <RefreshCw className="h-6 w-6 text-pulse-red" />
            </div>
            <div className="space-y-3">
              <h4 className="font-black text-white uppercase tracking-wider text-sm">Disassembly Engineering</h4>
              <p className="text-platinum-gray text-xs leading-relaxed">
                AirVerse shoes are built with localized, zero-glue stitching techniques. This allows our recycling plants to easily disassemble the shoe components and recycle the carbon plate, nitrogen casing, and weave upper separately.
              </p>
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="p-8 bg-surface-container rounded-2xl border border-white/5 space-y-6">
            <div className="p-3 bg-pulse-red/10 border border-pulse-red/30 rounded-full w-fit">
              <Droplet className="h-6 w-6 text-pulse-red" />
            </div>
            <div className="space-y-3">
              <h4 className="font-black text-white uppercase tracking-wider text-sm">Waterless Dyeing Process</h4>
              <p className="text-platinum-gray text-xs leading-relaxed">
                Traditional fabric dyeing consumes thousands of liters of clean water. The AeroWeave yarn is colored using CO2-pressurized dry dye matrices, reducing water consumption to zero and chemical discharge by 95%.
              </p>
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="p-8 bg-surface-container rounded-2xl border border-white/5 space-y-6">
            <div className="p-3 bg-pulse-red/10 border border-pulse-red/30 rounded-full w-fit">
              <Sun className="h-6 w-6 text-pulse-red" />
            </div>
            <div className="space-y-3">
              <h4 className="font-black text-white uppercase tracking-wider text-sm">Zero-Waste Knit Patterns</h4>
              <p className="text-platinum-gray text-xs leading-relaxed">
                Every AeroWeave upper is knit directly to shape as a single continuous thread. This eliminates the standard fabric off-cuts and scraps generated in traditional sneaker sewing patterns, bringing cutting waste to zero.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* 4. Join the Circular Program CTA */}
      <section className="px-6 md:px-16 max-w-4xl mx-auto">
        <div className="glass-card p-10 md:p-14 rounded-3xl border border-white/5 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center text-center lg:text-left relative overflow-hidden shadow-2xl">
          <div className="lg:col-span-2 space-y-4">
            <span className="text-pulse-red text-[10px] font-bold uppercase tracking-widest">BECOME AN ECO CHAMPION</span>
            <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight leading-none">
              RECYCLE YOUR OLD RUNNERS
            </h2>
            <p className="text-platinum-gray text-xs leading-relaxed pr-0 lg:pr-8">
              Send us your worn-out athletic footwear (any brand). We will break down the materials to build our next generation of performance training models.
            </p>
          </div>
          <div className="flex justify-center lg:justify-end col-span-1">
            <button className="bg-pulse-red text-white px-8 py-4.5 rounded-full text-xs font-bold uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-[0_0_25px_rgba(255,59,48,0.25)] flex items-center gap-2">
              <span>Recycle Program</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};
