import { clients } from "@/constants";
import styles from "@/styles/style";
import Image from "next/image";

const Clients: React.FC = () => (
  <section className={`${styles.flexCenter} my-4 relative overflow-hidden py-20`}>
    {/* Background decorative elements */}
    <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl" />
    <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl" />
    
    <div className="relative z-10 w-full">
      {/* Header */}
      <div className="text-center mb-16">
        <h2 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
          Trusted by <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">Partners</span>
        </h2>
        <p className="text-lg text-slate-300 leading-relaxed max-w-3xl mx-auto">
          Leading healthcare institutions and technology companies trust our AI-powered medical imaging solutions.
        </p>
      </div>

      {/* Partners Grid */}
      <div className={`${styles.flexCenter} flex-wrap w-full`}>
        {clients.map((client) => (
          <div key={client.id} className={`flex-1 ${styles.flexCenter} sm:min-w-[192px] min-x-[120px] p-6`}>
            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-800/20 to-slate-900/20 border border-slate-700/20 backdrop-blur-sm hover:border-blue-500/30 transition-all duration-300 hover:scale-105">
              <Image 
                src={client.logo} 
                alt="client" 
                className="sm:w-[192px] w-[100%] object-contain hover:-translate-y-2 cursor-pointer transition-all ease-in-out duration-300" 
              />
            </div>
          </div>
        ))}
      </div>

      {/* Call to Action */}
      <div className="mt-16 text-center">
        <div className="p-8 rounded-3xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 backdrop-blur-sm max-w-2xl mx-auto">
          <h3 className="text-2xl font-bold text-white mb-4">Become a Partner</h3>
          <p className="text-slate-300 mb-6 leading-relaxed">
            Join our network of healthcare innovators and help us revolutionize medical imaging worldwide.
          </p>
          <button 
            onClick={() => window.open('mailto:tymarbeit@gmail.com?subject=Partnership%20Inquiry%20-%20Pneumonia%20Detection%20App', '_blank')}
            className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white px-8 py-4 rounded-xl font-semibold hover:scale-105 transition-transform duration-300 border border-blue-500/30"
          >
            Contact Us
          </button>
        </div>
      </div>
    </div>
  </section>
);

export default Clients;