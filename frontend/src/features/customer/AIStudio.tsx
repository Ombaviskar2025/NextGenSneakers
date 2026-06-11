import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Sparkles, MessageSquare, Shirt, Ruler, Compass, Send, 
  Bot, User as UserIcon, RefreshCw, Check, AlertCircle, ShoppingBag 
} from 'lucide-react';
import { api } from '../../services/api';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  category_name: string;
  image_url: string;
}

// Fallback local products to keep the AI Studio functional offline
const LOCAL_PRODUCTS: Product[] = [
  {
    id: 'p-nike-jordan4',
    name: 'Air Jordan 4 Retro Bred Reimagined',
    slug: 'air-jordan-4-retro-bred-reimagined',
    price: 18995.00,
    category_name: 'Basketball',
    image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600'
  },
  {
    id: 'p-nike-travis',
    name: "Travis Scott x Air Jordan 1 Low 'Medium Olive'",
    slug: 'travis-scott-air-jordan-1-low-medium-olive',
    price: 16995.00,
    category_name: 'Lifestyle',
    image_url: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600'
  },
  {
    id: 'p-nike-vaporfly',
    name: 'Nike ZoomX Vaporfly 3',
    slug: 'nike-zoomx-vaporfly-3',
    price: 20695.00,
    category_name: 'Running',
    image_url: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=600'
  },
  {
    id: 'p-nike-af1',
    name: "Nike Air Force 1 '07",
    slug: 'nike-air-force-1-07',
    price: 7495.00,
    category_name: 'Lifestyle',
    image_url: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=600'
  },
  {
    id: 'p-nike-metcon',
    name: 'Nike Metcon 9',
    slug: 'nike-metcon-9',
    price: 11995.00,
    category_name: 'Training & Gym',
    image_url: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600'
  }
];

export const AIStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chat' | 'outfit' | 'size' | 'recommender'>('chat');

  // Fetch products for dropdown selectors
  const { data: dbProducts } = useQuery<any[]>({
    queryKey: ['products-list-ai'],
    queryFn: async () => {
      const res = await api.get('/products');
      // Extract from paginated structure
      return res.data?.products || res.data || [];
    }
  });

  const productsList = dbProducts && dbProducts.length > 0 ? dbProducts : LOCAL_PRODUCTS;

  // ────────────────────────────────────────────────────────
  // TOOL 1: AI Chat Assistant (AirBot) State
  // ────────────────────────────────────────────────────────
  const [chatMessages, setChatMessages] = useState<{ sender: 'user' | 'bot'; text: string }[]>([
    { sender: 'bot', text: 'Welcome to the AIRVERSE AI Studio. I am AirBot. Ask me about shoe technologies (like nitrogen cushioning or carbon plates), sizing advice, or styling recommendations!' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput;
    setChatMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      // Simulate/call Gemini endpoint (can connect to backend /api/ai if there is a general chat route, or fallback)
      let botResponse = '';
      
      const queryLower = userText.toLowerCase();
      if (queryLower.includes('carbon') || queryLower.includes('plate') || queryLower.includes('propulsion')) {
        botResponse = "The AIRVERSE Quantum Carbon Plate uses aerospace-grade composite carbon. It stores bending energy during foot strike and snaps back instantly at toe-off, boosting energy efficiency by up to 4.2%. We use it in the Nike ZoomX Vaporfly 3 for elite speeds.";
      } else if (queryLower.includes('nitrogen') || queryLower.includes('casing') || queryLower.includes('cushion')) {
        botResponse = "Our Pressurized Nitrogen Casing consists of sealed chambers containing high-purity nitrogen. The pods adapt dynamically to impact vectors, providing a cell response time of 1.2ms and 40% energy return.";
      } else if (queryLower.includes('jordan 4') || queryLower.includes('jordan')) {
        botResponse = "The Air Jordan 4 Retro Bred Reimagined features premium full-grain black leather, mesh side panels, and Nike Air heel branding. It's a basketball classic that transitions perfectly to streetwear.";
      } else if (queryLower.includes('size') || queryLower.includes('fit') || queryLower.includes('narrow')) {
        botResponse = "Jordan 1s and Dunks fit true to size, but we recommend going up half a size if you have wider feet. Vaporfly 3 runs tight for a lockdown race fit, whereas Air Force 1s tend to run slightly large.";
      } else {
        // Fallback generic response
        botResponse = `Interesting question! Regarding "${userText}", our design philosophy centers on deconstructing traditional running weight to maximize athletic velocity. You can also try our specialized 'Outfit Matcher' or 'Size Predictor' tabs above for targeted insights!`;
      }

      // Add a slight delay for realism
      setTimeout(() => {
        setChatMessages(prev => [...prev, { sender: 'bot', text: botResponse }]);
        setIsChatLoading(false);
      }, 700);

    } catch (error) {
      toast.error('AirBot connection error');
      setIsChatLoading(false);
    }
  };

  // ────────────────────────────────────────────────────────
  // TOOL 2: AI Outfit Matcher State
  // ────────────────────────────────────────────────────────
  const [selectedShoeId, setSelectedShoeId] = useState(productsList[0]?.id || '');
  const [styleProfile, setStyleProfile] = useState<'streetwear' | 'athleisure' | 'retro' | 'techwear'>('streetwear');
  const [outfitRecommendation, setOutfitRecommendation] = useState<any | null>(null);
  const [isMatching, setIsMatching] = useState(false);

  const handleOutfitMatch = () => {
    setIsMatching(true);
    const shoe = productsList.find(p => p.id === selectedShoeId) || productsList[0];

    setTimeout(() => {
      let advice = '';
      let palette: string[] = [];
      let top = '';
      let bottom = '';
      let accessories = '';

      switch (styleProfile) {
        case 'streetwear':
          advice = `To match the bold silhouette of the ${shoe.name}, craft a vintage heavy-knit streetwear aesthetic. The colors should support the shoe without fighting for attention.`;
          palette = ['#1A1A1A', '#E5E5EA', '#FF3B30', '#8E8E93'];
          top = 'Oversized black heavy-cotton hoodie or graphic vintage tee';
          bottom = 'Relaxed fit grey cargo pants or dark washed denim with subtle cuffing';
          accessories = 'Black ribbed beanie and a tactical chest rig or minimal shoulder bag';
          break;
        case 'athleisure':
          advice = `Accentuate the sporty performance profiles of your ${shoe.name} with sleek, contoured athletic layers.`;
          palette = ['#2C2C2E', '#F2F2F7', '#34C759', '#AEAEB2'];
          top = 'Form-fitting tech fleece jacket or moisture-wicking compression top';
          bottom = 'Tapered fleece joggers or double-knit track pants';
          accessories = 'Perforated sports cap and smart training watch';
          break;
        case 'techwear':
          advice = `Highlight structural engineering. Combine high-performance textures to create a utility-first futuristic aesthetic matching your ${shoe.name}.`;
          palette = ['#0D0D0d', '#1C1C1E', '#5856D6', '#3A3A3C'];
          top = 'Waterproof asymmetrical utility shell jacket or modular windbreaker';
          bottom = 'Water-resistant tactical drop-crotch cargo pants';
          accessories = 'Magnetic fidlock belt and cross-body tech pouch';
          break;
        case 'retro':
          advice = `Celebrate heritage. Contrast modern sneaker tech with classic elements to draw eyes directly to your ${shoe.name}.`;
          palette = ['#E5E5EA', '#E0A96D', '#2C3539', '#FFFFFF'];
          top = 'Retro colorblocked varsity jacket or corduroy button-down shirt';
          bottom = 'Straight-cut raw selvedge denim or relaxed chinos';
          accessories = 'Canvas tote bag and tortoiseshell retro sunglasses';
          break;
      }

      setOutfitRecommendation({ advice, palette, top, bottom, accessories, shoeName: shoe.name });
      setIsMatching(false);
      toast.success('Outfit generated!');
    }, 600);
  };

  // ────────────────────────────────────────────────────────
  // TOOL 3: AI Size Predictor State
  // ────────────────────────────────────────────────────────
  const [referenceBrand, setReferenceBrand] = useState('nike');
  const [referenceSize, setReferenceSize] = useState<number>(9);
  const [footWidth, setFootWidth] = useState<'narrow' | 'normal' | 'wide'>('normal');
  const [archType, setArchType] = useState<'flat' | 'normal' | 'high'>('normal');
  const [predictedSize, setPredictedSize] = useState<string | null>(null);

  const calculateSize = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple logic simulating sizing variations
    let recommended = referenceSize;
    let explanation = '';

    if (referenceBrand === 'adidas') {
      // Adidas usually runs slightly larger than Nike
      recommended -= 0.5;
      explanation += 'Adidas models generally run half a size larger than Nike. ';
    }
    if (footWidth === 'wide') {
      recommended += 0.5;
      explanation += 'We recommend going up half a size to accommodate wide feet and prevent lateral toe friction. ';
    } else if (footWidth === 'narrow') {
      explanation += 'Your narrow profile indicates a standard snug fit. ';
    }

    if (archType === 'flat') {
      explanation += 'Flat arches benefit from the structured arch supports inside the carbon plate chassis.';
    } else if (archType === 'high') {
      explanation += 'High arches will match comfortably with the extra volume in the AeroWeave knit.';
    }

    setPredictedSize(`US MEN ${recommended.toFixed(1)} (${explanation.trim() || 'Perfect standard fit predicted.'})`);
    toast.success('Sizing calculated!');
  };

  // ────────────────────────────────────────────────────────
  // TOOL 4: AI Shoe Recommender State
  // ────────────────────────────────────────────────────────
  const [usageType, setUsageType] = useState<'casual' | 'running' | 'training' | 'tennis'>('running');
  const [surfacePreference, setSurfacePreference] = useState<'road' | 'track' | 'gym' | 'all'>('road');
  const [pronationStyle, setPronationStyle] = useState<'neutral' | 'overpronation' | 'supination'>('neutral');
  const [priceBudget, setPriceBudget] = useState<number>(15000);
  const [recommendedShoe, setRecommendedShoe] = useState<Product | null>(null);

  const generateShoeRecommendation = () => {
    let matches = [...productsList];

    // Filter by category mapping
    if (usageType === 'casual') {
      matches = matches.filter(p => p.category_name.toLowerCase().includes('lifestyle'));
    } else if (usageType === 'running') {
      matches = matches.filter(p => p.category_name.toLowerCase().includes('running') || p.category_name.toLowerCase().includes('basketball'));
    } else if (usageType === 'training') {
      matches = matches.filter(p => p.category_name.toLowerCase().includes('training') || p.category_name.toLowerCase().includes('gym'));
    } else if (usageType === 'tennis') {
      matches = matches.filter(p => p.category_name.toLowerCase().includes('tennis') || p.category_name.toLowerCase().includes('lifestyle'));
    }

    // Filter by budget
    const budgetMatches = matches.filter(p => p.price <= priceBudget);
    let finalSelection = budgetMatches[0] || matches[0] || productsList[0];

    // Special match rules
    if (usageType === 'running' && priceBudget > 18000) {
      const vapor = productsList.find(p => p.id === 'p-nike-vaporfly');
      if (vapor) finalSelection = vapor;
    } else if (usageType === 'training') {
      const metcon = productsList.find(p => p.id === 'p-nike-metcon');
      if (metcon) finalSelection = metcon;
    }

    setRecommendedShoe(finalSelection);
    toast.success('Recommendation ready!');
  };


  return (
    <div className="bg-surface-dim min-h-screen pt-12 pb-24 space-y-16">
      
      {/* Page Header */}
      <section className="px-6 md:px-16 max-w-container-max mx-auto text-center space-y-4">
        <span className="text-pulse-red font-bold text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2">
          <Sparkles className="h-4.5 w-4.5 animate-pulse" />
          KINETIC AI STUDIO
        </span>
        <h1 className="text-4xl md:text-7xl font-sans font-black text-white uppercase tracking-tighter leading-none">
          INTELLIGENT FITTING
        </h1>
        <p className="text-platinum-gray/60 text-xs md:text-sm max-w-2xl mx-auto leading-relaxed">
          Leverage our customized neural algorithms to generate style pairings, calculate precise sizes, and discover your ultimate performance match.
        </p>
      </section>

      {/* Tab Selectors */}
      <section className="px-6 md:px-16 max-w-container-max mx-auto">
        <div className="flex flex-wrap justify-center gap-3 border-b border-white/5 pb-6">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
              activeTab === 'chat'
                ? 'bg-pulse-red text-white shadow-lg shadow-pulse-red/25'
                : 'bg-white/5 hover:bg-white/10 text-platinum-gray hover:text-white border border-white/5'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>AirBot Assistant</span>
          </button>
          
          <button
            onClick={() => setActiveTab('outfit')}
            className={`flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
              activeTab === 'outfit'
                ? 'bg-pulse-red text-white shadow-lg shadow-pulse-red/25'
                : 'bg-white/5 hover:bg-white/10 text-platinum-gray hover:text-white border border-white/5'
            }`}
          >
            <Shirt className="h-4 w-4" />
            <span>Outfit Matcher</span>
          </button>

          <button
            onClick={() => setActiveTab('size')}
            className={`flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
              activeTab === 'size'
                ? 'bg-pulse-red text-white shadow-lg shadow-pulse-red/25'
                : 'bg-white/5 hover:bg-white/10 text-platinum-gray hover:text-white border border-white/5'
            }`}
          >
            <Ruler className="h-4 w-4" />
            <span>Size Predictor</span>
          </button>

          <button
            onClick={() => setActiveTab('recommender')}
            className={`flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
              activeTab === 'recommender'
                ? 'bg-pulse-red text-white shadow-lg shadow-pulse-red/25'
                : 'bg-white/5 hover:bg-white/10 text-platinum-gray hover:text-white border border-white/5'
            }`}
          >
            <Compass className="h-4 w-4" />
            <span>Shoe Matcher</span>
          </button>
        </div>
      </section>

      {/* Main Studio Dashboard Content */}
      <section className="px-6 md:px-16 max-w-4xl mx-auto">
        <div className="glass-card p-6 md:p-10 rounded-3xl border border-white/5 shadow-2xl min-h-[460px] flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-pulse-red/5 rounded-full blur-3xl pointer-events-none" />
          
          {/* ────────────────────────────────────────────────────────
              1. AIRBOT CHAT INTERFACE
             ──────────────────────────────────────────────────────── */}
          {activeTab === 'chat' && (
            <div className="flex flex-col h-[480px] justify-between gap-4">
              <div className="flex items-center gap-2 border-b border-white/5 pb-4">
                <Bot className="h-5 w-5 text-pulse-red" />
                <h3 className="text-sm font-black uppercase tracking-wider text-white">AIRBOT ASSISTANT v1.2</h3>
              </div>

              {/* Message Feed */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 hide-scrollbar">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
                    <div className={`p-2.5 rounded-xl border flex-shrink-0 flex items-center justify-center h-9 w-9 ${
                      msg.sender === 'user' ? 'bg-pulse-red/10 border-pulse-red/30 text-pulse-red' : 'bg-white/5 border-white/5 text-white'
                    }`}>
                      {msg.sender === 'user' ? <UserIcon className="h-4.5 w-4.5" /> : <Bot className="h-4.5 w-4.5" />}
                    </div>
                    <div className={`p-4 rounded-2xl text-xs leading-relaxed ${
                      msg.sender === 'user' 
                        ? 'bg-pulse-red text-white rounded-tr-none' 
                        : 'bg-white/5 border border-white/5 text-platinum-gray rounded-tl-none'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex gap-3 max-w-[80%] mr-auto items-center animate-pulse">
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 h-9 w-9 flex items-center justify-center text-white">
                      <Bot className="h-4.5 w-4.5" />
                    </div>
                    <span className="text-[10px] text-platinum-gray/60 uppercase tracking-widest font-bold">AirBot is thinking...</span>
                  </div>
                )}
              </div>

              {/* Chat Input form */}
              <form onSubmit={handleSendMessage} className="flex gap-3 border-t border-white/5 pt-4">
                <input
                  type="text"
                  placeholder="Ask AirBot about carbon plates, cushioning, or sizing..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-full px-5 py-3.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-pulse-red placeholder:text-platinum-gray/40"
                />
                <button
                  type="submit"
                  disabled={isChatLoading || !chatInput.trim()}
                  className="bg-pulse-red text-white p-3.5 rounded-full hover:brightness-110 disabled:brightness-50 active:scale-95 transition-all flex items-center justify-center shadow-lg shadow-pulse-red/20"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          )}

          {/* ────────────────────────────────────────────────────────
              2. OUTFIT MATCHER
             ──────────────────────────────────────────────────────── */}
          {activeTab === 'outfit' && (
            <div className="space-y-6">
              <div className="border-b border-white/5 pb-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-white">AI Outfit Matcher</h3>
                <p className="text-[10px] text-platinum-gray/60 uppercase font-semibold">Generate colorway balances & styling recommendations</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* Form Controls */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-platinum-gray uppercase tracking-wider">Select Sneaker Silhouette</label>
                    <select
                      value={selectedShoeId}
                      onChange={(e) => setSelectedShoeId(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:ring-1 focus:ring-pulse-red focus:outline-none"
                    >
                      {productsList.map((p) => (
                        <option key={p.id} value={p.id} className="bg-[#1c1c1e] text-white">{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-platinum-gray uppercase tracking-wider">Select Style Profile</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['streetwear', 'athleisure', 'techwear', 'retro'] as const).map((style) => (
                        <button
                          key={style}
                          onClick={() => setStyleProfile(style)}
                          className={`p-3 rounded-xl border text-[10px] font-bold uppercase tracking-wider text-center transition-all duration-200 ${
                            styleProfile === style
                              ? 'bg-pulse-red/10 border-pulse-red/40 text-pulse-red'
                              : 'bg-white/2 border-white/5 text-platinum-gray hover:border-white/10'
                          }`}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleOutfitMatch}
                    disabled={isMatching}
                    className="w-full bg-pulse-red text-white py-3.5 rounded-full text-xs font-bold uppercase tracking-widest hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-lg shadow-pulse-red/20"
                  >
                    {isMatching ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Matching Outfits...</span>
                      </>
                    ) : (
                      <>
                        <Shirt className="h-4 w-4" />
                        <span>Generate Style Match</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Match Outputs */}
                <div className="p-6 rounded-2xl bg-white/3 border border-white/5 space-y-4 min-h-[280px] flex flex-col justify-center">
                  {outfitRecommendation ? (
                    <div className="space-y-4 animate-fade-in">
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-pulse-red uppercase tracking-widest">Recommended Look for {outfitRecommendation.shoeName}</span>
                        <p className="text-xs text-platinum-gray leading-relaxed">{outfitRecommendation.advice}</p>
                      </div>

                      <div className="space-y-2.5">
                        <span className="text-[9px] font-bold text-white uppercase tracking-wider block">Outfit Breakdowns</span>
                        <div className="space-y-2 text-[10px] text-platinum-gray/80 uppercase font-semibold">
                          <p><strong className="text-white">TOP:</strong> {outfitRecommendation.top}</p>
                          <p><strong className="text-white">BOTTOM:</strong> {outfitRecommendation.bottom}</p>
                          <p><strong className="text-white">ACCESSORIES:</strong> {outfitRecommendation.accessories}</p>
                        </div>
                      </div>

                      {/* Color Palette */}
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-bold text-white uppercase tracking-wider block">Recommended Color Palette</span>
                        <div className="flex gap-2">
                          {outfitRecommendation.palette.map((color: string, i: number) => (
                            <div 
                              key={i} 
                              className="w-8 h-8 rounded-lg border border-white/10 shadow-lg" 
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-2 text-platinum-gray/40">
                      <Shirt className="h-8 w-8 mx-auto stroke-[1.5]" />
                      <p className="text-[10px] uppercase font-bold tracking-wider">No style recommendation active</p>
                      <p className="text-[9px] leading-relaxed max-w-[200px] mx-auto">Choose your sneaker and style preference to build your wardrobe grid.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ────────────────────────────────────────────────────────
              3. SIZE PREDICTOR
             ──────────────────────────────────────────────────────── */}
          {activeTab === 'size' && (
            <div className="space-y-6">
              <div className="border-b border-white/5 pb-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-white">AI Size Predictor</h3>
                <p className="text-[10px] text-platinum-gray/60 uppercase font-semibold">Predict your perfect fitting size based on peer model profiles</p>
              </div>

              <form onSubmit={calculateSize} className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                
                {/* Form Controls */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-platinum-gray uppercase tracking-wider">Current Best Fitting Brand</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['nike', 'adidas', 'jordan'].map((brand) => (
                        <button
                          key={brand}
                          type="button"
                          onClick={() => setReferenceBrand(brand)}
                          className={`p-2.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider text-center transition-all ${
                            referenceBrand === brand
                              ? 'bg-pulse-red/10 border-pulse-red/45 text-pulse-red'
                              : 'bg-white/2 border-white/5 text-platinum-gray'
                          }`}
                        >
                          {brand}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-platinum-gray uppercase tracking-wider">Your US Size in this Brand: {referenceSize}</label>
                    <input
                      type="range"
                      min="6"
                      max="14"
                      step="0.5"
                      value={referenceSize}
                      onChange={(e) => setReferenceSize(parseFloat(e.target.value))}
                      className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-pulse-red"
                    />
                    <div className="flex justify-between text-[9px] text-platinum-gray/50 uppercase font-bold">
                      <span>US 6.0</span>
                      <span>US 10.0</span>
                      <span>US 14.0</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-platinum-gray uppercase tracking-wider">Foot Width</label>
                      <select
                        value={footWidth}
                        onChange={(e: any) => setFootWidth(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:ring-1 focus:ring-pulse-red focus:outline-none"
                      >
                        <option value="narrow" className="bg-[#1c1c1e] text-white">Narrow Fit</option>
                        <option value="normal" className="bg-[#1c1c1e] text-white">Standard Fit</option>
                        <option value="wide" className="bg-[#1c1c1e] text-white">Wide Fit</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-platinum-gray uppercase tracking-wider">Arch Profile</label>
                      <select
                        value={archType}
                        onChange={(e: any) => setArchType(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:ring-1 focus:ring-pulse-red focus:outline-none"
                      >
                        <option value="flat" className="bg-[#1c1c1e] text-white">Flat Arch</option>
                        <option value="normal" className="bg-[#1c1c1e] text-white">Normal Arch</option>
                        <option value="high" className="bg-[#1c1c1e] text-white">High Arch</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-pulse-red text-white py-3.5 rounded-full text-xs font-bold uppercase tracking-widest hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-lg shadow-pulse-red/20"
                  >
                    <Ruler className="h-4 w-4" />
                    <span>Calculate Fit size</span>
                  </button>
                </div>

                {/* Size Outputs */}
                <div className="p-6 rounded-2xl bg-white/3 border border-white/5 min-h-[280px] flex flex-col justify-center text-center space-y-4">
                  {predictedSize ? (
                    <div className="space-y-4 animate-fade-in">
                      <div className="p-4 bg-pulse-red/10 border border-pulse-red/25 rounded-2xl inline-block mx-auto text-pulse-red">
                        <Ruler className="h-10 w-10" />
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-bold text-white uppercase tracking-widest block">Your Predicted Size</span>
                        <h4 className="text-2xl font-black text-pulse-red leading-none uppercase tracking-tight">
                          {predictedSize.split('(')[0]}
                        </h4>
                      </div>
                      <p className="text-[10px] text-platinum-gray leading-relaxed max-w-[280px] mx-auto uppercase font-semibold">
                        {predictedSize.substring(predictedSize.indexOf('(') + 1, predictedSize.length - 1)}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 text-platinum-gray/40">
                      <AlertCircle className="h-8 w-8 mx-auto stroke-[1.5]" />
                      <p className="text-[10px] uppercase font-bold tracking-wider">No size calculation active</p>
                      <p className="text-[9px] leading-relaxed max-w-[200px] mx-auto">Input your reference brand sizing and foot shape parameters to run the fit comparison model.</p>
                    </div>
                  )}
                </div>

              </form>
            </div>
          )}

          {/* ────────────────────────────────────────────────────────
              4. SHOE RECOMMENDER
             ──────────────────────────────────────────────────────── */}
          {activeTab === 'recommender' && (
            <div className="space-y-6">
              <div className="border-b border-white/5 pb-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-white">AI Shoe Recommendation</h3>
                <p className="text-[10px] text-platinum-gray/60 uppercase font-semibold">Discover your perfect performance sneaker match from our catalog</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                
                {/* Form Controls */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-platinum-gray uppercase tracking-wider">Primary Usage</label>
                      <select
                        value={usageType}
                        onChange={(e: any) => setUsageType(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:ring-1 focus:ring-pulse-red focus:outline-none animate-none"
                      >
                        <option value="casual" className="bg-[#1c1c1e] text-white">Lifestyle / Casual</option>
                        <option value="running" className="bg-[#1c1c1e] text-white">Road Running</option>
                        <option value="training" className="bg-[#1c1c1e] text-white">Gym & Lifting</option>
                        <option value="tennis" className="bg-[#1c1c1e] text-white">Tennis / Court</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-platinum-gray uppercase tracking-wider">Surface Type</label>
                      <select
                        value={surfacePreference}
                        onChange={(e: any) => setSurfacePreference(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:ring-1 focus:ring-pulse-red focus:outline-none"
                      >
                        <option value="road" className="bg-[#1c1c1e] text-white">Street / Asphalt</option>
                        <option value="track" className="bg-[#1c1c1e] text-white">Tartan Track</option>
                        <option value="gym" className="bg-[#1c1c1e] text-white">Indoor Gym floor</option>
                        <option value="all" className="bg-[#1c1c1e] text-white">All terrains</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-platinum-gray uppercase tracking-wider">Pronation Style</label>
                      <select
                        value={pronationStyle}
                        onChange={(e: any) => setPronationStyle(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:ring-1 focus:ring-pulse-red focus:outline-none"
                      >
                        <option value="neutral" className="bg-[#1c1c1e] text-white">Neutral (Standard)</option>
                        <option value="overpronation" className="bg-[#1c1c1e] text-white">Overpronation (Inward roll)</option>
                        <option value="supination" className="bg-[#1c1c1e] text-white">Supination (Outward roll)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-platinum-gray uppercase tracking-wider">Max Budget (₹): {priceBudget.toLocaleString()}</label>
                      <input
                        type="range"
                        min="5000"
                        max="22000"
                        step="1000"
                        value={priceBudget}
                        onChange={(e) => setPriceBudget(parseInt(e.target.value))}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-pulse-red"
                      />
                      <div className="flex justify-between text-[9px] text-platinum-gray/50 uppercase font-bold">
                        <span>₹5,000</span>
                        <span>₹13,500</span>
                        <span>₹22,000</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={generateShoeRecommendation}
                    className="w-full bg-pulse-red text-white py-3.5 rounded-full text-xs font-bold uppercase tracking-widest hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-lg shadow-pulse-red/20"
                  >
                    <Compass className="h-4 w-4" />
                    <span>Run Matcher Model</span>
                  </button>
                </div>

                {/* Recommendation Outputs */}
                <div className="p-6 rounded-2xl bg-white/3 border border-white/5 min-h-[280px] flex flex-col justify-center">
                  {recommendedShoe ? (
                    <div className="space-y-4 animate-fade-in text-center">
                      <span className="text-[9px] font-bold text-pulse-red uppercase tracking-widest block">AI Match Recommendation</span>
                      
                      <div className="w-32 h-32 rounded-xl bg-white/5 border border-white/15 overflow-hidden mx-auto flex items-center justify-center group shadow-xl">
                        <img 
                          src={recommendedShoe.image_url} 
                          alt={recommendedShoe.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-black text-white text-xs uppercase tracking-wider truncate max-w-[300px] mx-auto">
                          {recommendedShoe.name}
                        </h4>
                        <span className="text-[10px] font-black text-pulse-red uppercase tracking-wide">
                          ₹{recommendedShoe.price.toLocaleString()}
                        </span>
                      </div>

                      <Link
                        to={`/products/${recommendedShoe.slug}`}
                        className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 hover:border-pulse-red text-white hover:text-pulse-red px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all"
                      >
                        <span>View Details</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  ) : (
                    <div className="text-center space-y-2 text-platinum-gray/40">
                      <ShoppingBag className="h-8 w-8 mx-auto stroke-[1.5]" />
                      <p className="text-[10px] uppercase font-bold tracking-wider">No match recommendation active</p>
                      <p className="text-[9px] leading-relaxed max-w-[200px] mx-auto">Input your running frequency, pronation profile, and budget ceiling to discover your ideal model.</p>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

        </div>
      </section>

    </div>
  );
};
export default AIStudio;
