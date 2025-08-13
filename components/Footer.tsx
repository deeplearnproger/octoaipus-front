import styles from "@/styles/style";
import { logo_word } from "@/public/assets";
import { footerLinks, socialMedia } from "@/constants";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";

const Footer: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();

  const handleLinkClick = (link: string) => {
    if (link.startsWith('mailto:')) {
      // Email links open in default email client
      window.open(link, '_blank');
    } else if (link.startsWith('#')) {
      // Anchor links - if we're not on home page, navigate to home first
      if (pathname !== '/') {
        router.push(`/${link}`);
      } else {
        // If we're on the home page, just scroll to section
        const element = document.querySelector(link);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    } else if (link.startsWith('/')) {
      // Internal routes - use Next.js router
      router.push(link);
    } else {
      // External links
      window.open(link, '_blank');
    }
  };

  return (
    <section className={`${styles.flexCenter} ${styles.paddingY} flex-col`}>
      <div className={`${styles.flexCenter} md:flex-row flex-col mb-8 w-full`}>
        <div className="flex-1 flex flex-col justify-start mr-10">
          <Image
            src={logo_word}
            alt="octoaipus"
            className="w-[266px] h-[72px] object-contain"
          />
          <p className={`${styles.paragraph} mt-4 max-w-[310px]`}>
            Advanced AI-powered pneumonia detection from chest X-rays. 
            Get instant, accurate results with medical-grade precision.
          </p>
          <div className="mt-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-400 text-sm font-medium">AI-Powered • Free • Secure</span>
          </div>
        </div>
        <div className="flex-[1.5] w-full flex flex-row justify-between flex-wrap md:mt-0 mt-10">
          {footerLinks.map((footerLink) => (
            <div
              key={footerLink.id}
              className="flex flex-col ss:my-0 my-4 min-w-[150px]"
            >
              <h4
                className={`font-poppins font-medium text-[18px] leading-[27px] text-white mb-4`}
              >
                {footerLink.title}
              </h4>
              <ul className="list-none">
                {footerLink.links.map((link, index) => (
                  <li
                    key={link.name}
                    className={`font-poppins font-normal text-[16px] leading-[24px] text-dimWhite hover:text-secondary cursor-pointer transition-colors duration-300 ${
                      index !== footerLink.links.length - 1 ? "mb-4" : "mb-0"
                    }`}
                    onClick={() => handleLinkClick(link.link)}
                  >
                    {link.name}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="w-full flex justify-between items-center md:flex-row flex-col pt-6 border-t-[1px] border-t-[#3F3E45]">
        <p className="font-poppins font-normal text-center text-[18px] leading-[27px] text-white">
          © 2025 octoaipus. All Rights Reserved.
        </p>
        <div className="flex flex-row md:mt-0 mt-6">
          {socialMedia.map((social, index) => (
            <div
              key={social.id}
              className={`cursor-pointer transition-transform duration-300 hover:scale-110 ${
                index !== socialMedia.length - 1 ? "mr-6" : "mr-0"
              }`}
              onClick={() => window.open(social.link, '_blank')}
            >
              <Image
                src={social.icon}
                alt={social.id}
                className="w-[21px] h-[21px] object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Footer;
