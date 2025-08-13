"use client"
import styles from "@/styles/style";
import { Navbar, Footer } from "@/components";

const Privacy: React.FC = () => {
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
                Privacy <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500">Policy</span>
              </h1>
              <p className="text-xl text-slate-300 leading-relaxed mb-12">
                Last updated: January 2025
              </p>

              <div className="space-y-8">
                <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/30 backdrop-blur-sm">
                  <h2 className="text-2xl font-bold text-white mb-4">Data Protection Commitment</h2>
                  <p className="text-slate-300 leading-relaxed mb-4">
                    At octoaipus, we take your privacy and the security of your medical data very seriously. Our commitment to protecting your information is fundamental to our mission.
                  </p>
                  <div className="grid md:grid-cols-2 gap-6 mt-6">
                    <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20">
                      <h3 className="text-lg font-semibold text-green-400 mb-2">✅ We Do</h3>
                      <ul className="text-slate-300 text-sm space-y-1">
                        <li>• Process images securely</li>
                        <li>• Use encryption for data transfer</li>
                        <li>• Maintain strict access controls</li>
                        <li>• Follow medical data regulations</li>
                      </ul>
                    </div>
                    <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                      <h3 className="text-lg font-semibold text-red-400 mb-2">❌ We Never</h3>
                      <ul className="text-slate-300 text-sm space-y-1">
                        <li>• Store your medical images</li>
                        <li>• Share data with third parties</li>
                        <li>• Use data for marketing</li>
                        <li>• Sell personal information</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/30 backdrop-blur-sm">
                  <h2 className="text-2xl font-bold text-white mb-4">Information We Collect</h2>
                  <p className="text-slate-300 leading-relaxed mb-4">
                    We collect minimal information necessary to provide our service:
                  </p>
                  <ul className="text-slate-300 space-y-2">
                    <li>• <strong>Medical Images:</strong> Temporarily processed for analysis (not stored)</li>
                    <li>• <strong>Usage Analytics:</strong> Anonymous data to improve our service</li>
                    <li>• <strong>Technical Data:</strong> Device information for compatibility</li>
                  </ul>
                </div>

                <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/30 backdrop-blur-sm">
                  <h2 className="text-2xl font-bold text-white mb-4">How We Use Your Information</h2>
                  <p className="text-slate-300 leading-relaxed mb-4">
                    Your information is used exclusively for:
                  </p>
                  <ul className="text-slate-300 space-y-2">
                    <li>• Providing AI-powered medical image analysis</li>
                    <li>• Improving our detection algorithms</li>
                    <li>• Ensuring service quality and reliability</li>
                    <li>• Complying with legal obligations</li>
                  </ul>
                </div>

                <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/30 backdrop-blur-sm">
                  <h2 className="text-2xl font-bold text-white mb-4">Data Security</h2>
                  <p className="text-slate-300 leading-relaxed mb-4">
                    We implement industry-standard security measures:
                  </p>
                  <ul className="text-slate-300 space-y-2">
                    <li>• End-to-end encryption for all data transfers</li>
                    <li>• Secure cloud infrastructure with regular audits</li>
                    <li>• Access controls and authentication protocols</li>
                    <li>• Regular security assessments and updates</li>
                  </ul>
                </div>

                <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/30 backdrop-blur-sm">
                  <h2 className="text-2xl font-bold text-white mb-4">Your Rights</h2>
                  <p className="text-slate-300 leading-relaxed mb-4">
                    You have the right to:
                  </p>
                  <ul className="text-slate-300 space-y-2">
                    <li>• Access any personal data we may have</li>
                    <li>• Request deletion of your information</li>
                    <li>• Opt out of analytics collection</li>
                    <li>• Contact us with privacy concerns</li>
                  </ul>
                </div>

                <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/30 backdrop-blur-sm">
                  <h2 className="text-2xl font-bold text-white mb-4">Contact Us</h2>
                  <p className="text-slate-300 leading-relaxed mb-4">
                    If you have any questions about this Privacy Policy or our data practices, please contact us:
                  </p>
                  <button 
                    onClick={() => window.open('mailto:tymarbeit@gmail.com?subject=Privacy%20Policy%20Inquiry', '_blank')}
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-transform duration-300"
                  >
                    Contact Privacy Team
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

export default Privacy;
