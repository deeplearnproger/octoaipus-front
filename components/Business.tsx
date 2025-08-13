import styles, { layout } from "@/styles/style";
import Button from "./Button";
import Image from "next/image";
import { useState, useEffect } from "react";

const GuideStep: React.FC<{ 
  step: number; 
  title: string; 
  content: string; 
  icon: string;
  isActive: boolean;
  isCompleted: boolean;
}> = ({ step, title, content, icon, isActive, isCompleted }) => (
  <div className={`group relative p-8 rounded-3xl transition-all duration-500 ${
    isActive 
      ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-2 border-cyan-400/50 shadow-2xl shadow-cyan-500/20 scale-105' 
      : isCompleted
      ? 'bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-emerald-500/30 backdrop-blur-sm'
      : 'bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/30 backdrop-blur-sm hover:border-cyan-500/30 hover:scale-102'
  }`}>
    {/* Animated background gradient */}
    <div className={`absolute inset-0 rounded-3xl transition-opacity duration-500 ${
      isActive 
        ? 'bg-gradient-to-r from-cyan-500/10 to-blue-500/10 opacity-100' 
        : 'bg-gradient-to-r from-cyan-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100'
    }`} />
    
    <div className="relative flex items-start gap-6">
      {/* Step number with enhanced glow effect */}
      <div className="relative flex-shrink-0">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-2xl transition-all duration-500 ${
          isActive 
            ? 'bg-gradient-to-br from-cyan-400 to-blue-500 shadow-cyan-500/50' 
            : isCompleted
            ? 'bg-gradient-to-br from-emerald-500 to-teal-500 shadow-emerald-500/30'
            : 'bg-gradient-to-br from-slate-600 to-slate-700 shadow-slate-500/20'
        }`}>
          {isCompleted ? (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            step
          )}
        </div>
        <div className={`absolute inset-0 w-16 h-16 rounded-2xl blur-xl transition-opacity duration-500 ${
          isActive 
            ? 'bg-gradient-to-br from-cyan-400 to-blue-500 opacity-60' 
            : isCompleted
            ? 'bg-gradient-to-br from-emerald-500 to-teal-500 opacity-40'
            : 'bg-gradient-to-br from-slate-600 to-slate-700 opacity-30'
        }`} />
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className={`font-bold text-xl mb-3 transition-colors duration-300 ${
          isActive 
            ? 'text-cyan-300' 
            : isCompleted
            ? 'text-emerald-300'
            : 'text-white group-hover:text-cyan-200'
        }`}>
          {title}
        </h4>
        <p className="text-slate-200 text-base leading-relaxed font-medium">
          {content.split(' ').map((word, index) => {
            const isKeyword = /^(X-ray|phone|steady|entire|chest|area|lighting|glare|high-resolution|focused|photo)$/i.test(word);
            return (
              <span key={index} className={isKeyword ? 'text-cyan-300 font-semibold' : ''}>
                {word}{' '}
              </span>
            );
          })}
        </p>
      </div>
      
      {/* Enhanced icon with better styling */}
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 flex-shrink-0 ${
        isActive 
          ? 'bg-cyan-500/30 text-cyan-300' 
          : isCompleted
          ? 'bg-emerald-500/20 text-emerald-300'
          : 'bg-slate-700/50 text-slate-400 group-hover:bg-cyan-500/20 group-hover:text-cyan-300'
      }`}>
        <Image src={icon} alt="icon" width={20} height={20} className="opacity-80" />
      </div>
    </div>
  </div>
);

const Business: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const guideSteps = [
    {
      step: 1,
      title: "Prepare",
      content: "Place X-ray on flat surface with good lighting",
      icon: "/assets/Shield.svg"
    },
    {
      step: 2,
      title: "Position",
      content: "Hold phone steady, 20-30cm above the film",
      icon: "/assets/Star.svg"
    },
    {
      step: 3,
      title: "Frame",
      content: "Include entire chest area in the frame",
      icon: "/assets/Send.svg"
    },
    {
      step: 4,
      title: "Light",
      content: "Ensure even, bright lighting without glare",
      icon: "/assets/Discount.svg"
    },
    {
      step: 5,
      title: "Capture",
      content: "Take high-resolution, focused photo",
      icon: "/assets/Shield.svg"
    }
  ];

  // Auto-advance steps for demo
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => {
        if (prev < guideSteps.length - 1) {
          setCompletedSteps(prevSteps => [...prevSteps, prev]);
          return prev + 1;
        } else {
          // Reset everything for new cycle
          setCompletedSteps([]);
          return 0; // Reset to start
        }
      });
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  return (
    <section id="features" className={`${layout.section} relative overflow-hidden py-20`}>
      {/* Enhanced background decorative elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-blue-500/15 to-purple-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-cyan-500/5 to-blue-500/5 rounded-full blur-3xl" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Section - Enhanced */}
          <div className="space-y-8">
            <div className="space-y-6">
              <h2 className="text-5xl lg:text-6xl font-bold text-white leading-tight">
                Perfect X-ray <br className="sm:block hidden" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500">
                  Photography Guide
                </span>
              </h2>
              <p className="text-xl text-slate-300 leading-relaxed font-medium max-w-2xl">
                Master the art of capturing <span className="text-cyan-300 font-semibold">crystal-clear X-ray images</span> with your phone. 
                <br />
                <span className="text-cyan-400 font-bold text-2xl">Better quality = better diagnosis.</span>
              </p>
            </div>
            
            {/* Enhanced feature highlights */}
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
                <div className="w-4 h-4 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" />
                <span className="text-lg font-semibold text-white">Auto-enhancement</span>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-400 to-purple-500" />
                <span className="text-lg font-semibold text-white">Smart alignment</span>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                <div className="w-4 h-4 rounded-full bg-gradient-to-r from-purple-400 to-pink-500" />
                <span className="text-lg font-semibold text-white">Quality check</span>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
                <div className="w-4 h-4 rounded-full bg-gradient-to-r from-green-400 to-emerald-500" />
                <span className="text-lg font-semibold text-white">Instant results</span>
              </div>
            </div>
            
            <Button styles="mt-8" />
          </div>

          {/* Right Section - Enhanced Steps */}
          <div className="space-y-6">
            {guideSteps.map((step, index) => (
              <GuideStep 
                key={index} 
                {...step} 
                isActive={index === activeStep}
                isCompleted={completedSteps.includes(index)}
              />
            ))}
            
            {/* Enhanced warning section */}
            <div className="mt-12 p-8 rounded-3xl bg-gradient-to-br from-orange-500/15 to-red-500/15 border-2 border-orange-500/30 backdrop-blur-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500/30 to-red-500/30 flex items-center justify-center">
                  <span className="text-orange-300 text-2xl">⚠️</span>
                </div>
                <h4 className="font-bold text-2xl text-white">Avoid These Mistakes</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
                  <span className="text-orange-400 text-lg">•</span>
                  <span className="text-lg font-medium text-slate-200">Blurry shots</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
                  <span className="text-orange-400 text-lg">•</span>
                  <span className="text-lg font-medium text-slate-200">Poor lighting</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
                  <span className="text-orange-400 text-lg">•</span>
                  <span className="text-lg font-medium text-slate-200">Cropped areas</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
                  <span className="text-orange-400 text-lg">•</span>
                  <span className="text-lg font-medium text-slate-200">Angled photos</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Business;
