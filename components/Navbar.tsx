"use client"
import { useState } from 'react';
import { close, logo, menu } from "@/public/assets";
import { navLinks } from "@/constants";
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';

const Navbar: React.FC = () => {
  const [toggle, setToggle] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleNavClick = (navId: string) => {
    if (pathname !== '/') {
      // If we're not on the home page, navigate to home first
      router.push(`/#${navId}`);
    } else {
      // If we're on the home page, just scroll to section
      const element = document.querySelector(`#${navId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleLogoClick = () => {
    router.push('/');
  };

  return (
    <nav className="w-full flex py-6 justify-between items-center navbar">
      <Image 
        src={logo} 
        alt="octoaipus" 
        width={124} 
        height={32} 
        className="cursor-pointer hover:opacity-80 transition-opacity duration-300"
        onClick={handleLogoClick}
      />
      <ul className="list-none sm:flex hidden justify-end items-center flex-1">
        {navLinks.map((nav, index) => (
          <li
            key={nav.id}
            className={`font-poppins font-normal cursor-pointer text-[16px] text-white hover:text-secondary transition-colors duration-300 ${index === navLinks.length - 1 ? 'mr-0' : 'mr-10'}`}
            onClick={() => handleNavClick(nav.id)}>
            {nav.title}
          </li>
        ))}
      </ul>
      <div className="sm:hidden flex flex-1 justify-end items-center">
        <Image src={toggle ? close : menu}
          alt="menu"
          className="object-contain"
          width={28}
          height={28}
          onClick={() => setToggle((prev) => !prev)} />
        <div className={`${toggle ? 'flex' : 'hidden'}
            p-6 bg-black-gradient absolute top-20 ring-0 mx-4 my-2 min-w-[140px] rounded-xl sidebar`}>
          <ul className="list-none flex flex-col justify-end items-center flex-1">
            {navLinks.map((nav, index) => (
              <li
                key={nav.id}
                className={`font-poppins font-normal cursor-pointer text-[16px] text-white hover:text-secondary transition-colors duration-300 ${index === navLinks.length - 1 ? 'mr-0' : 'mb-4'}`}
                onClick={() => {
                  handleNavClick(nav.id);
                  setToggle(false); // Close mobile menu
                }}>
                {nav.title}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  )
}

export default Navbar