import React from "react";

export default function Home() {
  return (
    <div className="p-0">
      {/* Image occupies half of the viewport height and is fully visible */}
      <div className="w-full h-[50vh] bg-black flex items-center justify-center">
        <img
          src="/peopletech/ptg background.png"
          alt="PeopleTech background"
          className="max-w-full max-h-full object-contain"
        />
      </div>

      {/* Placeholder for remaining half content */}
      <div className="w-full min-h-[50vh] p-6">
        {/* Add your home page content here */}
      </div>
    </div>
  );
}


