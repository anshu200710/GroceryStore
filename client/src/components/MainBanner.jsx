// import React from "react";
// import { Link } from "react-router-dom";
// import { assets } from "../assets/assets";

// const MainBanner = () => {
//     return (
//         <div className="relative">
//             <img
//                 src={assets.main_banner_bg}
//                 alt="banner"
//                 className="w-full hidden md:block"
//             />
//             <img
//                 src={assets.main_banner_bg_sm}
//                 alt="banner"
//                 className="w-full md:hidden"
//             />
//             <div className="absolute inset-0 flex flex-col items-center md:items-start justify-end md:justify-center pb-24 md:pb-0 px-4 md:pl-18 lg:pl-24">
//                 <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center md:text-left max-w-72 md:max-w-80 lg:max-w-105 leading-tight lg:leading-15">
//                     Freshness You Can Trust, Savings You will Love!
//                 </h1>

//                 <div className="flex items-center mt-6 font-medium">
//                     <Link
//                         to={"/products"}
//                         className="group flex items-center gap-2 px-7 md:px-9 py-3 bg-primary hover:bg-primary-dull transition rounded text-white cursor-pointer"
//                     >
//                         Shop Now{" "}
//                         <img
//                             className="md:hidden transition group-focus:translate-x-1"
//                             src={assets.white_arrow_icon}
//                             alt="arrow"
//                         />
//                     </Link>

//                     <Link
//                         to={"/products"}
//                         className="group hidden md:flex items-center gap-2 px-9 py-3 cursor-pointer"
//                     >
//                         Explore Deals{" "}
//                         <img
//                             className="transition group-hover:translate-x-1"
//                             src={assets.black_arrow_icon}
//                             alt="arrow"
//                         />
//                     </Link>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default MainBanner;
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const API_URL = import.meta.env.VITE_BACKEND_URL
  ? `${import.meta.env.VITE_BACKEND_URL}/api`
  : "https://groceries.vyaapaarniti.com";

const FILE_BASE = API_URL.replace(/\/api\/?$/, "");

const MainBanner = () => {
  const [banners, setBanners] = useState([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    loadBanners();
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(
      () => setCurrent((i) => (i + 1) % banners.length),
      5000
    );
    return () => clearInterval(timer);
  }, [banners]);

  const loadBanners = async () => {
    try {
      const { data } = await axios.get(
        `${API_URL}/hero-banners/all`
      );
      setBanners(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const banner = banners[current];
  if (!banner) return null;

  return (
    <div className="relative">
      <img
        src={banner.desktopImageUrl}
        className="hidden md:block w-full"
      />
      <img
        src={banner.mobileImageUrl || banner.desktopImageUrl}
        className="md:hidden w-full"
      />
      

      {/* <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-20">
        <h1 className="text-3xl md:text-5xl font-bold max-w-lg">
          Freshness You Can Trust, Savings You’ll Love!
        </h1>
        <Link
          to="/products"
          className="mt-6 w-fit px-7 py-3 bg-primary text-white rounded"
        >
          Shop Now
        </Link>
      </div> */}
      
    </div>
  );
};

export default MainBanner;
