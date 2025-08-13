import styles from "@/styles/style";
import { layout } from "@/styles/style";
import Image from "next/image";
import { star, shield, send } from "@/public/assets";

const UpdateCard: React.FC<{
  version: string;
  date: string;
  title: string;
  description: string;
  features: string[];
  type: 'feature' | 'improvement' | 'fix';
}> = ({ version, date, title, description, features, type }) => {
  const getTypeColor = () => {
    switch (type) {
      case 'feature': return 'from-green-500/20 to-emerald-500/20 border-green-500/30';
      case 'improvement': return 'from-blue-500/20 to-cyan-500/20 border-blue-500/30';
      case 'fix': return 'from-orange-500/20 to-red-500/20 border-orange-500/30';
      default: return 'from-slate-800/60 to-slate-900/60 border-slate-700/30';
    }
  };

  const getTypeIcon = () => {
    switch (type) {
      case 'feature': return '✨';
      case 'improvement': return '⚡';
      case 'fix': return '🔧';
      default: return '📝';
    }
  };

  return (
    <div className={`p-6 rounded-2xl bg-gradient-to-br ${getTypeColor()} backdrop-blur-sm border transition-all duration-300 hover:scale-105`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getTypeIcon()}</span>
          <div>
            <h3 className="text-xl font-bold text-white">{title}</h3>
            <p className="text-slate-300 text-sm">v{version} • {date}</p>
          </div>
        </div>
      </div>
      <p className="text-slate-200 mb-4 leading-relaxed">{description}</p>
      <ul className="space-y-2">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-2 text-slate-300">
            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></span>
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
};

const Updates: React.FC = () => {
  const updates = [
    {
      version: "2.1.0",
      date: "January 2025",
      title: "Enhanced AI Model",
      description: "Major improvements to our pneumonia detection algorithm with better accuracy and faster processing.",
      features: [
        "Improved detection accuracy to 94.7%",
        "Reduced processing time by 40%",
        "Enhanced image preprocessing",
        "Better handling of edge cases"
      ],
      type: 'improvement' as const
    },
    {
      version: "2.0.0",
      date: "December 2024",
      title: "New User Interface",
      description: "Complete redesign of the user interface for better user experience and accessibility.",
      features: [
        "Modern, responsive design",
        "Improved mobile experience",
        "Better accessibility features",
        "Enhanced visual feedback"
      ],
      type: 'feature' as const
    },
    {
      version: "1.9.5",
      date: "November 2024",
      title: "Bug Fixes & Performance",
      description: "Various bug fixes and performance optimizations to ensure smooth operation.",
      features: [
        "Fixed image upload issues",
        "Improved error handling",
        "Optimized memory usage",
        "Enhanced security measures"
      ],
      type: 'fix' as const
    }
  ];

  const roadmap = [
    {
      quarter: "Q1 2025",
      title: "Multi-language Support",
      description: "Adding support for multiple languages to serve global users better.",
      status: "In Progress"
    },
    {
      quarter: "Q2 2025",
      title: "Advanced Analytics",
      description: "Detailed analytics and reporting features for healthcare providers.",
      status: "Planned"
    },
    {
      quarter: "Q3 2025",
      title: "Mobile App",
      description: "Native mobile applications for iOS and Android platforms.",
      status: "Planned"
    },
    {
      quarter: "Q4 2025",
      title: "API Integration",
      description: "Public API for third-party integrations and partnerships.",
      status: "Planned"
    }
  ];

  return (
    <section id="updates" className={`${layout.section} relative overflow-hidden py-20`}>
      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            Latest <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500">Updates</span>
          </h2>
          <p className="text-xl text-slate-300 leading-relaxed max-w-3xl mx-auto">
            Stay informed about our latest improvements, new features, and upcoming developments in AI-powered medical imaging.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16">
          {/* Recent Updates */}
          <div>
            <h3 className="text-3xl font-bold text-white mb-8">Recent Updates</h3>
            <div className="space-y-6">
              {updates.map((update, index) => (
                <UpdateCard key={index} {...update} />
              ))}
            </div>
          </div>

          {/* Roadmap */}
          <div>
            <h3 className="text-3xl font-bold text-white mb-8">Development Roadmap</h3>
            <div className="space-y-6">
              {roadmap.map((item, index) => (
                <div key={index} className="p-6 rounded-2xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/30 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-semibold text-cyan-400 bg-cyan-500/20 px-3 py-1 rounded-full">
                      {item.quarter}
                    </span>
                    <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                      item.status === 'In Progress' 
                        ? 'text-orange-400 bg-orange-500/20' 
                        : 'text-slate-400 bg-slate-500/20'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <h4 className="text-xl font-bold text-white mb-3">{item.title}</h4>
                  <p className="text-slate-300 leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>

            {/* Contact for suggestions */}
            <div className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 backdrop-blur-sm">
              <h4 className="text-xl font-bold text-white mb-3">Have Suggestions?</h4>
              <p className="text-slate-300 mb-4">
                We'd love to hear your ideas for improving our platform. Share your feedback with us!
              </p>
              <button 
                onClick={() => window.open('mailto:tymarbeit@gmail.com?subject=Feature%20Suggestion%20-%20Pneumonia%20Detection%20App', '_blank')}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-transform duration-300"
              >
                Send Suggestion
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Updates;
