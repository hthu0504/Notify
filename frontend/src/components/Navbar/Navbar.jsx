import React from 'react'
import Logo from '../../assets/logo.png'
import { IoMdSearch } from "react-icons/io";
import DarkMode from "./DarkMode";

const Navbar = () => {
  return (
    <div className="shadow-md bg-white dark:bg-gray-900 dark:text-white duration-200 relative z-40">
        {}
        <div className='bg-primary/100 dark:bg-[#0d1126] py-3 sm:py-3 transition-all duration-300'>
            <div className="container flex justify-between items-center">
                <div>
                    <a href="#" className="font-bold text-2xl sm:text-3xl flex gap-2">
                        <img src={Logo} alt = "Logo"
                        className="w-10 uppercase"/>
                        Notify
                    </a>
                </div>
                {}
                <div className='flex justify-between items-center gap-6'>
                    <div>
                        <DarkMode />
                    </div>
                </div>
            </div>
        </div>
    </div>
  )
}

export default Navbar
