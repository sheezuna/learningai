// Manual Test Script for AI Course Registration
// Open browser console and paste this to test form submission without UI

const testFormSubmission = async () => {
  console.log('🧪 Testing AI Course Registration Form Submission...');
  
  const testData = {
    fullName: 'Test Student',
    age: 12,
    grade: '7th Grade',
    streetAddress: '123 Test Street',
    postcode: '12345',
    city: 'Test City',
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    sessionId: 'test_session_' + Date.now(),
    ipAddress: '192.168.1.1',
    browser_language: navigator.language,
    browser_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    browser_screen: `${screen.width}x${screen.height}`,
    browser_platform: navigator.platform,
    browser_cookies: navigator.cookieEnabled,
    submit_attempt_number: 1,
    referrer: document.referrer,
    page_url: window.location.href,
    time_zone_offset: new Date().getTimezoneOffset(),
    local_storage_available: typeof(Storage) !== "undefined",
    form_completion_time: 30000, // 30 seconds
    validation_errors_count: 0,
    user_journey: {
      test: true,
      timestamp: new Date().toISOString()
    }
  };

  try {
    // Import the Supabase helper
    const { supabaseHelpers } = await import('/src/lib/supabase.ts');
    
    console.log('📝 Submitting test data:', testData);
    
    const result = await supabaseHelpers.insertFormSubmission(testData);
    
    if (result) {
      console.log('✅ Test submission successful!');
      console.log('🎯 Check your Supabase dashboard for the new record');
    } else {
      console.log('❌ Test submission failed');
    }
    
    return result;
  } catch (error) {
    console.error('🚨 Test submission error:', error);
    return false;
  }
};

// Run the test
testFormSubmission();
