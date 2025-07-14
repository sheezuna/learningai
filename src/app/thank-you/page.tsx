'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseHelpers } from '@/lib/supabase'

const REDIRECT_DELAY_MS = 10000 // 10 seconds

export default function ThankYouPage() {
  const router = useRouter()

  useEffect(() => {
    // Track thank you page visit
    supabaseHelpers.trackPageVisit('thank_you_page')
    
    // Auto redirect after 10 seconds
    const timer = setTimeout(() => {
      router.push('/')
    }, REDIRECT_DELAY_MS)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="thank-you-page">
      <div className="content-container">
        <div className="header-section">
          <div className="logo-container">
            <div className="ai-logo">🤖</div>
            <h2 className="brand-name">AI Learning Academy</h2>
          </div>
          
          {/* Purple badge centered under logo */}
          <div className="badge-container">
            <div className="free-course-badge">
              FREE AI Course Secured
            </div>
          </div>
        </div>

        <div className="success-content">
          <div className="success-icon-large">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          
          <h1>Welcome to AI Learning Academy!</h1>
          <h2>Your FREE Course Spot is Secured ✨</h2>
          
          <div className="message-content">
            <p className="main-message">
              Congratulations! You&apos;ve successfully registered for our exclusive FREE AI course. Get ready to learn AI Drawing, World-Building, and Game Development like Roblox. Your learning journey starts soon!
            </p>
            
            <div className="next-steps">
              <h3>What&apos;s Next:</h3>
              <ul>
                <li>🎨 Learn AI Drawing techniques and digital art creation</li>
                <li>🌍 Master interactive world-building skills</li>
                <li>🎮 Develop games like Roblox using AI tools</li>
                <li>📧 Course details and session link sent to parent email</li>
                <li>� Join our online community of young AI creators</li>
              </ul>
            </div>
            
            <p className="final-note">
              Check your parent&apos;s email for session details. Your creative AI adventure begins now!
            </p>
          </div>
        </div>

        <div className="footer-section">
          <div className="security-badge">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11.5C15.4,11.5 16,12.1 16,12.7V16.2C16,16.8 15.4,17.3 14.8,17.3H9.2C8.6,17.3 8,16.8 8,16.2V12.8C8,12.2 8.6,11.7 9.2,11.7V10C9.2,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.5,8.7 10.5,9.5V11.5H13.5V9.5C13.5,8.7 12.8,8.2 12,8.2Z" fill="currentColor"/>
            </svg>
            <span>Your data is secure and protected</span>
          </div>
          
          <div className="redirect-notice">
            <p>You will be redirected automatically in 10 seconds...</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        /* Main Container */
        .thank-you-page {
          min-height: 100vh;
          background: #ffffff;
          font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
          box-sizing: border-box;
        }

        /* Content Container */
        .content-container {
          background: #ffffff;
          width: 100%;
          max-width: 600px;
          padding: 2rem;
          text-align: center;
        }

        /* Header Section */
        .header-section {
          margin-bottom: 3rem;
        }

        .logo-container {
          display: inline-block;
          margin-bottom: 1.5rem;
        }

        .ai-logo {
          font-size: 4rem;
          margin-bottom: 0.5rem;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
        }

        .brand-name {
          font-size: 1.4rem;
          font-weight: 600;
          color: #7c3aed;
          margin: 0;
          letter-spacing: 0.5px;
        }

        .logo {
          width: clamp(120px, 20vw, 140px);
          height: auto;
        }

        /* Purple Badge */
        .badge-container {
          display: flex;
          justify-content: center;
          margin-bottom: 1rem;
        }

        .free-course-badge {
          background: linear-gradient(135deg, #7c3aed 0%, #6366f1 100%);
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 30px;
          font-weight: 600;
          font-size: 1rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
        }

        /* Success Content */
        .success-content {
          margin-bottom: 2rem;
        }

        .success-icon-large {
          width: 80px;
          height: 80px;
          margin: 0 auto 1.5rem;
          color: #7c3aed;
        }

        .success-icon-large svg {
          width: 100%;
          height: 100%;
        }

        h1 {
          font-size: 2.5rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 0.5rem;
          background: linear-gradient(135deg, #7c3aed 0%, #6366f1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        h2 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 2rem;
        }

        .message-content {
          text-align: left;
          margin: 2rem 0;
        }

        .main-message {
          font-size: 1.1rem;
          line-height: 1.6;
          color: #374151;
          margin-bottom: 2rem;
          text-align: center;
        }

        .next-steps {
          background: #f9fafb;
          border-radius: 12px;
          padding: 1.5rem;
          margin: 2rem 0;
          border: 1px solid #e5e7eb;
        }

        .next-steps h3 {
          font-size: 1.2rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 1rem;
          text-align: center;
        }

        .next-steps ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .next-steps li {
          padding: 0.75rem 0;
          font-size: 1rem;
          color: #374151;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .next-steps li:last-child {
          border-bottom: none;
        }

        .final-note {
          font-size: 1rem;
          line-height: 1.6;
          color: #6b7280;
          text-align: center;
          font-style: italic;
        }

        /* Footer Section */
        .footer-section {
          border-top: 1px solid #e5e7eb;
          padding-top: 1.5rem;
          margin-top: 2rem;
        }

        .security-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .security-badge svg {
          width: 20px;
          height: 20px;
          color: #10b981;
        }

        .security-badge span {
          font-size: 0.9rem;
          color: #6b7280;
        }

        .redirect-notice {
          margin-top: 1rem;
        }

        .redirect-notice p {
          font-size: 0.9rem;
          color: #9ca3af;
          margin: 0;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .thank-you-page {
            padding: 1rem 0.5rem;
          }

          .content-container {
            padding: 1.5rem 1rem;
          }

          h1 {
            font-size: 2rem;
          }

          h2 {
            font-size: 1.3rem;
          }

          .main-message {
            font-size: 1rem;
          }

          .next-steps {
            padding: 1rem;
          }

          .next-steps li {
            font-size: 0.9rem;
            padding: 0.5rem 0;
          }

          .free-flight-badge {
            font-size: 0.9rem;
            padding: 0.6rem 1.2rem;
          }
        }

        @media (max-width: 480px) {
          .content-container {
            padding: 1rem 0.75rem;
          }

          h1 {
            font-size: 1.75rem;
          }

          h2 {
            font-size: 1.1rem;
          }

          .next-steps li {
            font-size: 0.85rem;
            gap: 0.5rem;
          }
        }
      `}</style>
    </div>
  )
}
