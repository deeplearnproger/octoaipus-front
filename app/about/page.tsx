"use client"
import styles from "@/styles/style";
import { Navbar, Footer } from "@/components";
import Image from "next/image";
import { star, shield, send } from "@/public/assets";

const About: React.FC = () => {
  return (
    <>
      <div className="bg-primary w-full overflow-hidden">
        <div className={`${styles.paddingX} ${styles.flexCenter}`}>
          <div className={`${styles.boxWidth}`}>
            <Navbar />
          </div>
        </div>
        
        <div className={`bg-primary ${styles.paddingX} ${styles.flexStart} py-20`}>
          <div className={`${styles.boxWidth}`}>
            {/* Hero Section */}
            <div className="text-center mb-16">
              <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                About <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500">octoaipus</span>
              </h1>
              <p className="text-xl text-slate-300 leading-relaxed max-w-3xl mx-auto">
                We're revolutionizing medical imaging with AI-powered pneumonia detection, making healthcare more accessible and accurate.
              </p>
            </div>

            {/* Mission Section */}
            <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
              <div>
                <h2 className="text-4xl font-bold text-white mb-6">Our Mission</h2>
                <p className="text-lg text-slate-300 leading-relaxed mb-6">
                  To democratize access to medical imaging analysis by providing instant, accurate, and free AI-powered diagnostic tools that help healthcare professionals and patients make informed decisions.
                </p>
                <p className="text-lg text-slate-300 leading-relaxed">
                  We believe that advanced medical technology should be accessible to everyone, regardless of their location or resources.
                </p>
              </div>
              <div className="p-8 rounded-3xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 backdrop-blur-sm">
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                    <span className="text-4xl">🎯</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Accessible Healthcare</h3>
                  <p className="text-slate-300">
                    Making advanced medical imaging analysis available to everyone, everywhere.
                  </p>
                </div>
              </div>
            </div>

            {/* Values Section */}
            <div className="mb-20">
              <h2 className="text-4xl font-bold text-white text-center mb-12">Our Values</h2>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="p-6 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 backdrop-blur-sm text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                    <Image src={star} alt="star" className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Excellence</h3>
                  <p className="text-slate-300">
                    We strive for the highest accuracy and reliability in our AI models.
                  </p>
                </div>
                <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 backdrop-blur-sm text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
                    <Image src={shield} alt="shield" className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Privacy</h3>
                  <p className="text-slate-300">
                    Your medical data is sacred. We never store or share your images.
                  </p>
                </div>
                <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 backdrop-blur-sm text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                    <Image src={send} alt="send" className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Innovation</h3>
                  <p className="text-slate-300">
                    Continuously improving our technology to serve you better.
                  </p>
                </div>
              </div>
            </div>

            {/* Team Section */}
            <div className="text-center">
              <h2 className="text-4xl font-bold text-white mb-6">Our Team</h2>
              <p className="text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto mb-8">
                A dedicated team of AI researchers, medical professionals, and software engineers working together to advance healthcare technology.
              </p>
              <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/30 backdrop-blur-sm">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="text-left">
                    <h3 className="text-2xl font-bold text-white mb-4">AI & Technology</h3>
                    <p className="text-slate-300 mb-4">
                      Our AI models are trained on millions of chest X-rays and continuously improved with the latest advances in deep learning.
                    </p>
                    <ul className="text-slate-300 space-y-2">
                      <li>• Advanced neural networks</li>
                      <li>• Medical imaging expertise</li>
                      <li>• Continuous model updates</li>
                    </ul>
                  </div>
                  <div className="text-left">
                    <h3 className="text-2xl font-bold text-white mb-4">Medical Advisory</h3>
                    <p className="text-slate-300 mb-4">
                      We work closely with healthcare professionals to ensure our technology meets real-world clinical needs.
                    </p>
                    <ul className="text-slate-300 space-y-2">
                      <li>• Board-certified radiologists</li>
                      <li>• Clinical validation</li>
                      <li>• Medical best practices</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Section */}
            <div className="mt-20 text-center">
              <h2 className="text-4xl font-bold text-white mb-6">Get in Touch</h2>
              <p className="text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto mb-8">
                Have questions about our technology or want to collaborate? We'd love to hear from you.
              </p>
              <button 
                onClick={() => window.open('mailto:tymarbeit@gmail.com?subject=Inquiry%20-%20About%20octoaipus', '_blank')}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:scale-105 transition-transform duration-300"
              >
                Contact Us
              </button>
            </div>
          </div>
        </div>

        <div className={`bg-primary ${styles.paddingX} ${styles.flexStart}`}>
          <div className={`${styles.boxWidth}`}>
            <Footer />
          </div>
        </div>
      </div>
    </>
  );
};

export default About;
