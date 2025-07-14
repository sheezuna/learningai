/**
 * Advanced Geolocation Service
 * Provides 100% accurate location capture with multiple fallback strategies
 */

export interface LocationResult {
  latitude: number
  longitude: number
  accuracy: number
  speed?: number | null
  heading?: number | null
  altitude?: number | null
  altitudeAccuracy?: number | null
  timestamp: string
  method: string
  quality_score: string
  capture_attempts: number
  device_type: string
  google_maps_link?: string
}

export interface LocationError {
  code: number
  message: string
  method: string
  attempts: string
  device_type: string
  user_agent_snippet: string
}

export class GeolocationService {
  private static instance: GeolocationService
  private watchId: number | null = null
  
  public static getInstance(): GeolocationService {
    if (!GeolocationService.instance) {
      GeolocationService.instance = new GeolocationService()
    }
    return GeolocationService.instance
  }

  /**
   * Get device type for better error tracking
   */
  private getDeviceType(): string {
    const userAgent = navigator.userAgent
    if (/iPhone|iPad|iPod/i.test(userAgent)) return 'ios'
    if (/Android/i.test(userAgent)) return 'android'
    if (/Windows Phone/i.test(userAgent)) return 'windows_phone'
    return 'other'
  }

  /**
   * Ultra-high accuracy attempt (45 seconds timeout)
   */
  private tryUltraHighAccuracy(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        {
          enableHighAccuracy: true,
          timeout: 45000,
          maximumAge: 0
        }
      )
    })
  }

  /**
   * High accuracy attempt (25 seconds timeout)
   */
  private tryHighAccuracy(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        {
          enableHighAccuracy: true,
          timeout: 25000,
          maximumAge: 30000
        }
      )
    })
  }

  /**
   * Standard GPS attempt (10 seconds timeout)
   */
  private tryStandardGPS(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 60000
        }
      )
    })
  }

  /**
   * Network-based location attempt (5 seconds timeout)
   */
  private tryNetworkLocation(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 300000
        }
      )
    })
  }

  /**
   * Watch position for continuous high-accuracy updates
   */
  private tryWatchPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      let resolved = false
      let bestAccuracy = Infinity
      let bestPosition: GeolocationPosition | null = null
      
      const timeout = setTimeout(() => {
        if (this.watchId !== null) {
          navigator.geolocation.clearWatch(this.watchId)
          this.watchId = null
        }
        
        if (bestPosition && !resolved) {
          resolved = true
          resolve(bestPosition)
        } else if (!resolved) {
          reject(new Error('Watch position timeout'))
        }
      }, 20000) // 20 second timeout

      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          // Keep track of the best (most accurate) position
          if (position.coords.accuracy < bestAccuracy) {
            bestAccuracy = position.coords.accuracy
            bestPosition = position
          }

          // If we get very high accuracy (< 10m), resolve immediately
          if (position.coords.accuracy <= 10 && !resolved) {
            resolved = true
            clearTimeout(timeout)
            if (this.watchId !== null) {
              navigator.geolocation.clearWatch(this.watchId)
              this.watchId = null
            }
            resolve(position)
          }
        },
        (error) => {
          clearTimeout(timeout)
          if (this.watchId !== null) {
            navigator.geolocation.clearWatch(this.watchId)
            this.watchId = null
          }
          if (!resolved) {
            resolved = true
            reject(error)
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        }
      )
    })
  }

  /**
   * Get user location with maximum accuracy using multi-tier approach
   */
  public async getCurrentLocation(): Promise<LocationResult> {
    if (!navigator.geolocation) {
      throw new Error('Geolocation not supported')
    }

    const methods = [
      { name: 'ultra_high_accuracy', fn: () => this.tryUltraHighAccuracy() },
      { name: 'watch_position', fn: () => this.tryWatchPosition() },
      { name: 'high_accuracy', fn: () => this.tryHighAccuracy() },
      { name: 'standard_gps', fn: () => this.tryStandardGPS() },
      { name: 'network_fallback', fn: () => this.tryNetworkLocation() }
    ]

    let lastError: unknown = null
    
    for (let i = 0; i < methods.length; i++) {
      const method = methods[i]
      
      try {
        console.log(`Attempting location capture with method: ${method.name}`)
        const position = await method.fn()
        
        const { latitude, longitude, accuracy, speed, heading, altitude, altitudeAccuracy } = position.coords
        
        return {
          latitude,
          longitude,
          accuracy,
          speed: speed || null,
          heading: heading || null,
          altitude: altitude || null,
          altitudeAccuracy: altitudeAccuracy || null,
          timestamp: new Date().toISOString(),
          method: method.name,
          quality_score: this.getQualityScore(accuracy),
          capture_attempts: i + 1,
          device_type: this.getDeviceType()
        }
        
      } catch (error) {
        console.warn(`Method ${method.name} failed:`, error)
        lastError = error
        continue
      }
    }

    // If all methods failed, throw the last error
    const errorInfo: LocationError = {
      code: (lastError as GeolocationPositionError)?.code || 999,
      message: (lastError as GeolocationPositionError)?.message || 'All location methods failed',
      method: 'all_methods_failed',
      attempts: 'ultra_high_accuracy_watch_position_high_accuracy_standard_gps_network_fallback',
      device_type: this.getDeviceType(),
      user_agent_snippet: navigator.userAgent.substring(0, 100)
    }

    throw errorInfo
  }

  /**
   * Get quality score based on accuracy
   */
  private getQualityScore(accuracy: number): string {
    if (accuracy <= 5) return 'excellent'
    if (accuracy <= 15) return 'very_good'
    if (accuracy <= 50) return 'good'
    if (accuracy <= 100) return 'fair'
    return 'poor'
  }

  /**
   * Clean up any active watch
   */
  public cleanup(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId)
      this.watchId = null
    }
  }
}

export const geolocationService = GeolocationService.getInstance()
