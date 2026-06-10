import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Calendar, Clock, Sparkles, Share2 } from 'lucide-react';

interface Story {
  id: string;
  title: string;
  category: 'Athletes' | 'Innovation' | 'Culture' | 'Design';
  description: string;
  image: string;
  date: string;
  readTime: string;
  author: string;
  featured?: boolean;
}

const storiesData: Story[] = [
  {
    id: '1',
    title: 'CHASING LIGHT: HOW AIRVERSE CUSHIONING WAS TESTED IN THE DESERT',
    category: 'Innovation',
    description: 'An inside look at our engineering team\'s extreme temperature tests in the Atacama Desert to push nitrogen pod bounds.',
    image: 'https://images.unsplash.com/photo-1502224562085-639556652f33?w=800',
    date: 'Jun 08, 2026',
    readTime: '6 min read',
    author: 'Dr. Sarah Vance',
    featured: true
  },
  {
    id: '2',
    title: 'BREAKING LIMITS: THE ELIUD KIPCHOGE TRAINING CAMP DIARIES',
    category: 'Athletes',
    description: 'Behind the scenes at Kaptagat as Kipchoge tests early prototypes of the AirVerse carbon-plate racer.',
    image: 'https://images.unsplash.com/photo-1486218119243-13883505764c?w=600',
    date: 'May 28, 2026',
    readTime: '8 min read',
    author: 'Markus Twan'
  },
  {
    id: '3',
    title: 'STREET TO PODIUM: THE EVOLUTION OF THE JORDAN 4 BRED SCAN',
    category: 'Culture',
    description: 'How retro sneaker collectors collaborated with digital archivists to create the definitive 3D Jordan catalog scan.',
    image: 'https://images.unsplash.com/photo-1597045566677-8cf032ed6634?w=600',
    date: 'May 15, 2026',
    readTime: '5 min read',
    author: 'Rico Haze'
  },
  {
    id: '4',
    title: 'NEXT-GEN MATERIALS: THE CHEMISTRY OF THE AEROWEAVE ADAPTIVE THREAD',
    category: 'Design',
    description: 'Breaking down the high-tensile matrix thread that reacts dynamically to body heat for custom lockdown.',
    image: 'https://images.unsplash.com/photo-1473186578172-c141e6798cf4?w=600',
    date: 'Apr 30, 2026',
    readTime: '7 min read',
    author: 'Elena Rostova'
  },
  {
    id: '5',
    title: 'DESIGNED FOR SPEED: A CONVERSATION WITH CHIEF INNOVATOR TOBY HATFIELD',
    category: 'Design',
    description: 'A deep dive into the philosophy of removing non-essential weight to achieve atomic-level performance profiles.',
    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600',
    date: 'Apr 22, 2026',
    readTime: '10 min read',
    author: 'Alex Carter'
  }
];

export const Stories: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('All');
  const categories = ['All', 'Athletes', 'Innovation', 'Culture', 'Design'];

  const filteredStories = activeTab === 'All'
    ? storiesData
    : storiesData.filter(s => s.category.toLowerCase() === activeTab.toLowerCase());

  const featuredStory = storiesData.find(s => s.featured);
  const gridStories = filteredStories.filter(s => s.id !== featuredStory?.id);

  return (
    <div className="bg-surface-dim min-h-screen pt-12 pb-24 space-y-20">
      
      {/* 1. Header Hero */}
      <section className="px-6 md:px-16 max-w-container-max mx-auto space-y-6 text-center md:text-left">
        <span className="text-pulse-red font-bold text-xs uppercase tracking-[0.2em] flex items-center justify-center md:justify-start gap-2">
          <Sparkles className="h-4 w-4" />
          Inside AirVerse
        </span>
        <h1 className="text-4xl md:text-7xl font-sans font-black text-white uppercase tracking-tighter leading-none">
          AIRVERSE STORIES
        </h1>
        <p className="text-platinum-gray text-xs md:text-sm max-w-xl leading-relaxed">
          Explore the narratives, athlete trials, and design philosophies that shape the future of sport performance.
        </p>
      </section>

      {/* 2. Featured Story */}
      {featuredStory && activeTab === 'All' && (
        <section className="px-6 md:px-16 max-w-container-max mx-auto">
          <div className="group relative glass-card rounded-3xl overflow-hidden border border-white/5 grid grid-cols-1 lg:grid-cols-2 gap-0 hover:border-pulse-red/30 transition-all duration-500 shadow-2xl">
            <div className="relative aspect-[16/10] lg:aspect-auto overflow-hidden bg-white/5">
              <img
                src={featuredStory.image}
                alt={featuredStory.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700"
              />
              <span className="absolute top-6 left-6 bg-pulse-red text-white font-bold text-[9px] px-3.5 py-1.5 rounded-full uppercase tracking-widest">
                Featured
              </span>
            </div>
            
            <div className="p-8 md:p-12 flex flex-col justify-center space-y-6">
              <div className="flex items-center gap-4 text-[10px] font-bold text-platinum-gray uppercase tracking-widest">
                <span className="text-pulse-red">{featuredStory.category}</span>
                <span>•</span>
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {featuredStory.date}</span>
                <span>•</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {featuredStory.readTime}</span>
              </div>
              <h2 className="text-2xl md:text-4xl font-black text-white leading-tight uppercase tracking-tight group-hover:text-pulse-red transition-colors duration-300">
                {featuredStory.title}
              </h2>
              <p className="text-platinum-gray text-xs md:text-sm leading-relaxed">
                {featuredStory.description}
              </p>
              <div className="pt-4 flex items-center justify-between border-t border-white/5">
                <span className="text-[10px] font-bold text-white tracking-widest uppercase">By {featuredStory.author}</span>
                <button className="flex items-center gap-2 text-pulse-red font-bold text-xs uppercase tracking-wider group-hover:translate-x-1.5 transition-transform">
                  <span>Read Article</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3. Category Tabs */}
      <section className="px-6 md:px-16 max-w-container-max mx-auto">
        <div className="flex flex-wrap gap-3 border-b border-white/5 pb-6">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                activeTab === cat
                  ? 'bg-pulse-red text-white shadow-lg shadow-pulse-red/25'
                  : 'bg-white/5 hover:bg-white/10 text-platinum-gray hover:text-white border border-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* 4. Stories Grid */}
      <section className="px-6 md:px-16 max-w-container-max mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {gridStories.map((story) => (
            <div
              key={story.id}
              className="group flex flex-col glass-card rounded-2xl overflow-hidden hover:-translate-y-2 border border-white/5 hover:border-pulse-red/30 transition-all duration-500 hover:shadow-2xl"
            >
              <div className="relative aspect-video bg-white/5 overflow-hidden">
                <img
                  src={story.image}
                  alt={story.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <span className="absolute top-4 right-4 bg-[#1f1f1f] text-platinum-gray border border-white/5 font-bold text-[8px] px-2.5 py-1 rounded-full uppercase tracking-widest">
                  {story.category}
                </span>
              </div>
              
              <div className="p-6 flex flex-col flex-1 space-y-4 justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-[9px] font-bold text-platinum-gray uppercase tracking-widest">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {story.date}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {story.readTime}</span>
                  </div>
                  <h3 className="font-black text-white group-hover:text-pulse-red transition text-sm uppercase tracking-wide line-clamp-2 leading-snug">
                    {story.title}
                  </h3>
                  <p className="text-platinum-gray text-xs leading-relaxed line-clamp-2">
                    {story.description}
                  </p>
                </div>
                
                <div className="pt-4 flex items-center justify-between border-t border-white/5">
                  <span className="text-[9px] font-bold text-platinum-gray uppercase tracking-wider">By {story.author}</span>
                  <button className="flex items-center gap-1.5 text-pulse-red font-bold text-[10px] uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                    <span>Read</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. CTA Newsletter */}
      <section className="px-6 md:px-16 max-w-4xl mx-auto">
        <div className="glass-card p-10 md:p-14 rounded-3xl border border-white/5 text-center space-y-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 border border-pulse-red/10 rounded-full translate-x-12 -translate-y-12 animate-pulse" />
          <div className="absolute bottom-0 left-0 w-48 h-48 border border-white/5 rounded-full -translate-x-12 translate-y-12 animate-pulse" style={{ animationDelay: '1.5s' }} />
          
          <BookOpen className="h-10 w-10 text-pulse-red mx-auto" />
          <div className="space-y-3">
            <h3 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tight">Stay Connected</h3>
            <p className="text-platinum-gray text-xs md:text-sm max-w-md mx-auto leading-relaxed">
              Subscribe to recieve monthly digests of raw design notebooks, athlete trials, and drop notifications.
            </p>
          </div>
          <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="EMAIL ADDRESS"
              className="flex-1 bg-white/5 border border-white/10 px-6 py-4 rounded-full text-white font-bold tracking-wider text-xs focus:ring-1 focus:ring-pulse-red focus:outline-none transition-all"
            />
            <button
              type="submit"
              className="bg-pulse-red text-white px-8 py-4 rounded-full text-xs font-bold uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,59,48,0.2)]"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>

    </div>
  );
};
