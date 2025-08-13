"use client"
import styles from "@/styles/style";
import { Navbar, Footer } from "@/components";

const Terms: React.FC = () => {
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
            <div className="max-w-4xl mx-auto">
              <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                Terms of <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500">Service</span>
              </h1>
              <p className="text-xl text-slate-300 leading-relaxed mb-12">
                Last updated: January 2025
              </p>

              <div className="space-y-8">
                <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/30 backdrop-blur-sm">
                  <h2 className="text-2xl font-bold text-white mb-4">Acceptance of Terms</h2>
                  <p className="text-slate-300 leading-relaxed">
                    By accessing and using octoaipus, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                  </p>
                </div>

                <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/30 backdrop-blur-sm">
                  <h2 className="text-2xl font-bold text-white mb-4">Service Description</h2>
                  <p className="text-slate-300 leading-relaxed mb-4">
                    octoaipus provides AI-powered medical image analysis for pneumonia detection. Our service:
                  </p>
                  <ul className="text-slate-300 space-y-2">
                    <li>• Analyzes chest X-ray images using advanced AI algorithms</li>
                    <li>• Provides instant diagnostic insights</li>
                    <li>• Offers educational information about results</li>
                    <li>• Maintains strict privacy and security standards</li>
                  </ul>
                </div>

                <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/30 backdrop-blur-sm">
                  <h2 className="text-2xl font-bold text-white mb-4">Medical Disclaimer</h2>
                  <div className="p-6 rounded-2xl bg-orange-500/10 border border-orange-500/20 mb-4">
                    <p className="text-orange-300 font-semibold mb-2">⚠️ Important Medical Notice</p>
                    <p className="text-slate-300 text-sm">
                      octoaipus is a screening tool and should not replace professional medical diagnosis. Always consult with qualified healthcare professionals for medical decisions.
                    </p>
                  </div>
                  <ul className="text-slate-300 space-y-2">
                    <li>• Results are for informational purposes only</li>
                    <li>• Not a substitute for professional medical advice</li>
                    <li>• Should be used in conjunction with clinical evaluation</li>
                    <li>• We are not liable for medical decisions based on our analysis</li>
                  </ul>
                </div>

                <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/30 backdrop-blur-sm">
                  <h2 className="text-2xl font-bold text-white mb-4">User Responsibilities</h2>
                  <p className="text-slate-300 leading-relaxed mb-4">
                    As a user of our service, you agree to:
                  </p>
                  <ul className="text-slate-300 space-y-2">
                    <li>• Provide only legitimate medical images for analysis</li>
                    <li>• Not use the service for malicious or fraudulent purposes</li>
                    <li>• Respect the privacy and security of the platform</li>
                    <li>• Not attempt to reverse engineer or compromise our systems</li>
                    <li>• Use the service in compliance with applicable laws</li>
                  </ul>
                </div>

                <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/30 backdrop-blur-sm">
                  <h2 className="text-2xl font-bold text-white mb-4">Intellectual Property</h2>
                  <p className="text-slate-300 leading-relaxed mb-4">
                    All content, features, and functionality of octoaipus are owned by us and are protected by international copyright, trademark, and other intellectual property laws.
                  </p>
                  <ul className="text-slate-300 space-y-2">
                    <li>• Our AI models and algorithms are proprietary</li>
                    <li>• Website design and content are protected</li>
                    <li>• Users retain rights to their uploaded images</li>
                    <li>• Analysis results belong to the user</li>
                  </ul>
                </div>

                <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/30 backdrop-blur-sm">
                  <h2 className="text-2xl font-bold text-white mb-4">Limitation of Liability</h2>
                  <p className="text-slate-300 leading-relaxed mb-4">
                    To the maximum extent permitted by law, octoaipus shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service.
                  </p>
                  <div className="grid md:grid-cols-2 gap-6 mt-6">
                    <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                      <h3 className="text-lg font-semibold text-blue-400 mb-2">What We Provide</h3>
                      <ul className="text-slate-300 text-sm space-y-1">
                        <li>• AI-powered image analysis</li>
                        <li>• Educational information</li>
                        <li>• Secure data processing</li>
                        <li>• Technical support</li>
                      </ul>
                    </div>
                    <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                      <h3 className="text-lg font-semibold text-red-400 mb-2">What We Don't Provide</h3>
                      <ul className="text-slate-300 text-sm space-y-1">
                        <li>• Medical diagnosis</li>
                        <li>• Treatment recommendations</li>
                        <li>• Emergency medical services</li>
                        <li>• Legal medical advice</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/30 backdrop-blur-sm">
                  <h2 className="text-2xl font-bold text-white mb-4">Service Availability</h2>
                  <p className="text-slate-300 leading-relaxed mb-4">
                    We strive to maintain high service availability but cannot guarantee uninterrupted access:
                  </p>
                  <ul className="text-slate-300 space-y-2">
                    <li>• Service may be temporarily unavailable for maintenance</li>
                    <li>• We reserve the right to modify or discontinue features</li>
                    <li>• Updates and improvements may affect service</li>
                    <li>• We will provide notice for significant changes</li>
                  </ul>
                </div>

                <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/30 backdrop-blur-sm">
                  <h2 className="text-2xl font-bold text-white mb-4">Changes to Terms</h2>
                  <p className="text-slate-300 leading-relaxed mb-4">
                    We may update these terms from time to time. Continued use of the service after changes constitutes acceptance of the new terms.
                  </p>
                </div>

                <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/30 backdrop-blur-sm">
                  <h2 className="text-2xl font-bold text-white mb-4">Contact Information</h2>
                  <p className="text-slate-300 leading-relaxed mb-4">
                    If you have questions about these Terms of Service, please contact us:
                  </p>
                  <button 
                    onClick={() => window.open('mailto:tymarbeit@gmail.com?subject=Terms%20of%20Service%20Inquiry', '_blank')}
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-transform duration-300"
                  >
                    Contact Legal Team
                  </button>
                </div>
              </div>
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

export default Terms;
