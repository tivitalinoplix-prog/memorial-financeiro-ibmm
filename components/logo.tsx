import React from 'react';
import Image from 'next/image';

export function LogoHeader() {
  return (
    <div className="flex items-center gap-3 shrink-0 group select-none">
      <div className="flex h-9 w-9 items-center justify-center bg-white overflow-hidden shrink-0 transition-transform group-hover:scale-105 duration-300">
        <Image 
          src="https://i.postimg.cc/vHf6Nxx7/memorial.jpg" 
          alt="Memorial" 
          width={36} 
          height={36} 
          className="object-cover w-full h-full grayscale group-hover:grayscale-0 transition-all duration-500"
          referrerPolicy="no-referrer"
        />
      </div>
      <div className="flex flex-col justify-center min-w-0">
        <span className="text-[8px] uppercase font-bold leading-tight tracking-[0.3em] text-text-muted">
          Igreja Batista
        </span>
        <span className="text-[14px] font-black leading-none tracking-tight text-text-primary group-hover:text-primary transition-colors">
          MEMORIAL
        </span>
      </div>
    </div>
  );
}
