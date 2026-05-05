import React from 'react'
import Hero from '../components/Hero'
import { HeroVideoCard } from '../components/Hero'
import PhotoSlider from '../components/PhotoSlider'
import './HomePage.css'

export default function HomePage() {
  return (
    <>
      {/* Original Hero with developer.py card restored */}
      <Hero />

      {/* Photo/Video media card section — below Hero */}
      <section className="hero-media-section">
        <div className="container">
          <div className="hero-media-grid">
            <HeroVideoCard />
          </div>
        </div>
      </section>

      {/* Image/Video slider */}
      <PhotoSlider />
    </>
  )
}
