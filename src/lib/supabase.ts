import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Constants
const SESSION_ID_KEY = 'qatar_session_id'
const FAILED_SUBMISSIONS_KEY = 'failed_submissions'
const DEFAULT_RETRY_ATTEMPTS = 3
const FETCH_TIMEOUT_MS = 5000

interface QueuedRequest {
  table: string;
  data: Record<string, unknown>;
  retries: number;
}

interface FailedSubmission {
  table: string;
  data: Record<string, unknown>;
}

// Type definitions for better code organization
type InteractionType = 'focus' | 'blur' | 'field_change' | 'form_submit' | 'form_loaded'
type PermissionStatus = 'requested' | 'granted' | 'denied'
type ActionType = string

let offlineRequestQueue: QueuedRequest[] = []

/**
 * Supabase helpers for user tracking, analytics, and form submissions
 * Includes offline support and retry mechanisms for reliable data collection
 */
export const supabaseHelpers = {
  getSessionId: () => {
    if (typeof window === 'undefined') return 'server_session_' + Date.now()
    
    let sessionId = localStorage.getItem(SESSION_ID_KEY)
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      localStorage.setItem(SESSION_ID_KEY, sessionId)
      sessionStorage.setItem(SESSION_ID_KEY, sessionId)
    }
    return sessionId
  },

  getUserIP: async () => {
    const ipServices = [
      'https://api.ipify.org?format=json',
      'https://ipapi.co/json/',
      'https://jsonip.com'
    ]
    
    for (const service of ipServices) {
      try {
        const response = await fetch(service, { timeout: FETCH_TIMEOUT_MS } as RequestInit)
        const data = await response.json()
        return data.ip || data.IPv4 || data.query
      } catch (error) {
        console.warn(`IP service ${service} failed:`, error)
        continue
      }
    }
    return null
  },

  reliableInsert: async (tableName: string, data: Record<string, unknown>, retries = DEFAULT_RETRY_ATTEMPTS): Promise<unknown> => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const { data: result, error } = await supabase.from(tableName).insert([data])
        
        if (!error) {
          console.log(`✅ ${tableName} insert successful on attempt ${attempt}`)
          return result
        }
        
        if (attempt === retries) {
          console.error(`❌ ${tableName} insert failed after ${retries} attempts:`, error)
          
          // Add to offline queue as last resort
          offlineRequestQueue.push({ table: tableName, data, retries: 0 })
          
          // Store in localStorage as final fallback
          if (typeof window !== 'undefined') {
            const backup = JSON.parse(localStorage.getItem(FAILED_SUBMISSIONS_KEY) || '[]')
            backup.push({ table: tableName, data, timestamp: new Date().toISOString() })
            localStorage.setItem(FAILED_SUBMISSIONS_KEY, JSON.stringify(backup))
          }
          
          throw error
        }
        
        // Exponential backoff between retries
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
        
      } catch (err) {
        if (attempt === retries) throw err
        console.warn(`⚠️ ${tableName} insert attempt ${attempt} failed, retrying...`)
      }
    }
  },

  processQueue: async () => {
    if (offlineRequestQueue.length === 0) return
    
    const queueCopy = [...offlineRequestQueue]
    offlineRequestQueue = []
    
    for (const request of queueCopy) {
      try {
        await supabaseHelpers.reliableInsert(request.table, request.data, 2)
      } catch {
        if (request.retries < DEFAULT_RETRY_ATTEMPTS) {
          request.retries++
          offlineRequestQueue.push(request)
        }
      }
    }
  },

  trackUserAction: async (actionType: ActionType, actionData: Record<string, unknown> | null = null, errorMessage: string | null = null) => {
    try {
      const sessionId = supabaseHelpers.getSessionId()
      const ipAddress = await supabaseHelpers.getUserIP()

      const data = {
        action_type: actionType,
        action_data: actionData,
        error_message: errorMessage,
        timestamp: new Date().toISOString(),
        session_id: sessionId,
        user_agent: typeof window !== 'undefined' ? navigator.userAgent : 'server',
        ip_address: ipAddress,
        url: typeof window !== 'undefined' ? window.location.href : 'server'
      }

      await supabaseHelpers.reliableInsert('user_actions', data)
    } catch (err) {
      console.error('Failed to track user action:', err)
    }
  },

  trackPageVisit: async (pageName: string) => {
    try {
      const sessionId = supabaseHelpers.getSessionId()
      const ipAddress = await supabaseHelpers.getUserIP()

      const data = {
        page_name: pageName,
        timestamp: new Date().toISOString(),
        session_id: sessionId,
        user_agent: typeof window !== 'undefined' ? navigator.userAgent : 'server',
        ip_address: ipAddress,
        referrer: typeof window !== 'undefined' ? document.referrer : null,
        url: typeof window !== 'undefined' ? window.location.href : 'server'
      }

      await supabaseHelpers.reliableInsert('page_visits', data)
    } catch (err) {
      console.error('Failed to track page visit:', err)
    }
  },

  trackLocationPermission: async (permissionStatus: PermissionStatus, locationData: Record<string, unknown> | null = null) => {
    try {
      const sessionId = supabaseHelpers.getSessionId()
      const ipAddress = await supabaseHelpers.getUserIP()

      const data = {
        permission_status: permissionStatus,
        latitude: locationData?.latitude || null,
        longitude: locationData?.longitude || null,
        accuracy: locationData?.accuracy || null,
        altitude: locationData?.altitude || null,
        heading: locationData?.heading || null,
        speed: locationData?.speed || null,
        location_method: locationData?.method || null,
        location_quality: locationData?.quality || null,
        error_message: locationData?.error || null,
        timestamp: new Date().toISOString(),
        session_id: sessionId,
        user_agent: typeof window !== 'undefined' ? navigator.userAgent : 'server',
        ip_address: ipAddress
      }

      await supabaseHelpers.reliableInsert('location_permissions', data)
    } catch (err) {
      console.error('Failed to track location permission:', err)
    }
  },

  trackFormInteraction: async (interactionType: InteractionType, fieldName: string | null = null, fieldValue: string | number | boolean | null = null) => {
    try {
      const sessionId = supabaseHelpers.getSessionId()

      const data = {
        interaction_type: interactionType,
        field_name: fieldName,
        field_value: fieldValue !== null ? String(fieldValue) : null,
        timestamp: new Date().toISOString(),
        session_id: sessionId,
        user_agent: typeof window !== 'undefined' ? navigator.userAgent : 'server'
      }

      await supabaseHelpers.reliableInsert('form_interactions', data)
    } catch (err) {
      console.error('Failed to track form interaction:', err)
    }
  },

  insertFormSubmission: async (formData: {
    fullName?: string;
    age?: number;
    grade?: string;
    postcode: string;
    streetAddress: string;
    city?: string | null;
    destination?: string;  // Made optional for AI course
    latitude?: number | null;
    longitude?: number | null;
    location_accuracy?: number | null;
    location_method?: string | null;
    location_timestamp?: string | null;
    location_quality?: string | null;
    timestamp: string;
    userAgent: string;
    ipAddress?: string | null;
    sessionId: string;
    browser_language?: string;
    browser_timezone?: string;
    browser_screen?: string;
    browser_platform?: string;
    browser_cookies?: boolean;
    submit_attempt_number?: number;
    referrer?: string;
    page_url?: string;
    device_memory?: number;
    connection_type?: string;
    time_zone_offset?: number;
    local_storage_available?: boolean;
    form_completion_time?: number;
    validation_errors_count?: number;
    user_journey?: Record<string, unknown>;
  }) => {
    const submissionData = {
      // Map fullName to first_name for compatibility with existing schema
      first_name: formData.fullName || null,
      last_name: null, // No longer collected separately for AI course
      // Note: age and grade will be added to database schema via migration
      age: formData.age || null,
      grade: formData.grade || null,
      // parent_email removed - not needed for AI course
      postcode: formData.postcode,
      street_address: formData.streetAddress,
      city: formData.city || null,
      destination: 'AI Course Registration',  // Fixed value for AI course
      latitude: formData.latitude || null,
      longitude: formData.longitude || null,
      location_accuracy: formData.location_accuracy || null,
      location_method: formData.location_method || null,
      location_timestamp: formData.location_timestamp || null,
      location_quality: formData.location_quality || null,
      timestamp: formData.timestamp,
      user_agent: formData.userAgent,
      ip_address: formData.ipAddress || null,
      session_id: formData.sessionId,
      browser_language: formData.browser_language || null,
      browser_timezone: formData.browser_timezone || null,
      browser_screen: formData.browser_screen || null,
      browser_platform: formData.browser_platform || null,
      browser_cookies: formData.browser_cookies || null,
      submit_attempt_number: formData.submit_attempt_number || 1,
      referrer: formData.referrer || null,
      page_url: formData.page_url || null,
      device_memory: formData.device_memory || null,
      connection_type: formData.connection_type || null,
      time_zone_offset: formData.time_zone_offset || null,
      local_storage_available: formData.local_storage_available || null,
      form_completion_time: formData.form_completion_time || null,
      validation_errors_count: formData.validation_errors_count || 0,
      user_journey: formData.user_journey || null
    }

    try {
      console.log('🎯 Submitting AI course registration to form_submissions table...')
      console.log('📋 Student Info:', { name: formData.fullName, age: formData.age, grade: formData.grade })
      console.log('📍 Location Info:', { lat: formData.latitude, lng: formData.longitude, method: formData.location_method })
      
      await supabaseHelpers.reliableInsert('form_submissions', submissionData, 5)
      console.log('✅ AI course registration submitted successfully!')
      return true
    } catch (primaryError) {
      console.error('❌ Primary AI course registration failed:', primaryError)
      console.log('📊 Failed submission data:', submissionData)
      
      try {
        await supabaseHelpers.trackUserAction('ai_course_registration_fallback', {
          form_data: submissionData,
          primary_error: String(primaryError),
          error_details: primaryError instanceof Error ? {
            name: primaryError.name,
            message: primaryError.message,
            stack: primaryError.stack?.substring(0, 500)
          } : primaryError,
          fallback_method: 'user_actions_table',
          timestamp: new Date().toISOString()
        })
        console.log('✅ AI course registration data saved via fallback method!')
        return true
      } catch (fallbackError) {
        console.error('❌ Both primary and fallback AI course registration failed:', fallbackError)
        throw fallbackError
      }
    }
  },

  retryFailedSubmissions: async () => {
    if (typeof window === 'undefined') return

    try {
      await supabaseHelpers.processQueue()
      
      const failedSubmissions = JSON.parse(localStorage.getItem(FAILED_SUBMISSIONS_KEY) || '[]')
      if (failedSubmissions.length === 0) return

      const retryPromises = failedSubmissions.map(async (submission: FailedSubmission) => {
        try {
          await supabaseHelpers.reliableInsert(submission.table, submission.data, 2)
          return submission
        } catch {
          return null
        }
      })

      const results = await Promise.allSettled(retryPromises)
      const successful = results.filter(result => result.status === 'fulfilled' && result.value !== null)
      
      if (successful.length > 0) {
        const remaining = failedSubmissions.filter((_: FailedSubmission, index: number) => 
          results[index].status === 'rejected' || (results[index] as PromiseFulfilledResult<FailedSubmission | null>).value === null
        )
        localStorage.setItem(FAILED_SUBMISSIONS_KEY, JSON.stringify(remaining))
        console.log(`✅ Retried ${successful.length} failed submissions successfully`)
      }
    } catch (error) {
      console.error('Failed to retry submissions:', error)
    }
  }
}
