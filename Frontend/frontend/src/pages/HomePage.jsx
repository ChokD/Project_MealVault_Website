import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Recommended from '../components/Recommended';

function HomePage() {
  return (
    <div>
      <Navbar />
      <Hero />
      <Recommended />
    </div>
  );
}

export default HomePage;