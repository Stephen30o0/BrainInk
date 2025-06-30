// Test Tournament Service Connectivity and Error Handling
import fetch from 'node-fetch';

// Configuration
const KANA_BASE_URL = process.env.KANA_API_BASE_URL || 'https://kana-backend-app.onrender.com';
const TOURNAMENT_API_URL = `${KANA_BASE_URL}/api/tournaments`;

console.log('🔗 Testing Tournament Service Connectivity');
console.log('📡 Tournament API URL:', TOURNAMENT_API_URL);

// Test with improved error handling similar to the frontend service
async function makeRequestWithRetry(url, options = {}) {
    const maxRetries = 3;
    const retryDelay = 1000;
    const timeoutMs = 15000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        let controller = null;
        let timeoutId = null;

        try {
            controller = new AbortController();
            
            // Set up timeout with proper cleanup
            timeoutId = setTimeout(() => {
                if (controller && !controller.signal.aborted) {
                    controller.abort('Request timeout');
                }
            }, timeoutMs);

            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                signal: controller.signal
            });

            // Clear timeout on success
            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }

            return response;
        } catch (error) {
            // Clear timeout on error
            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }

            console.error(`❌ Request attempt ${attempt} failed:`, error.message);

            if (attempt === maxRetries) {
                if (error.name === 'AbortError' || error.message.includes('aborted')) {
                    throw new Error('Request timeout. Please check your connection and try again.');
                } else if (error.message.includes('ECONNREFUSED')) {
                    throw new Error('Tournament backend is not available. Please check your connection and try again.');
                } else if (error.message.includes('ENOTFOUND')) {
                    throw new Error('Cannot resolve tournament backend URL. Please check your internet connection.');
                }
                throw error;
            }

            // Wait before retrying
            const delay = error.name === 'AbortError' ? retryDelay * attempt * 2 : retryDelay * attempt;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw new Error('Max retries exceeded');
}

async function testTournamentConnectivity() {
    try {
        console.log('\n📋 Testing GET /api/tournaments...');
        const response = await makeRequestWithRetry(TOURNAMENT_API_URL);
        
        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            throw new Error(`Server responded with status ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        
        // Handle structured response format
        if (data.success && Array.isArray(data.tournaments)) {
            console.log('✅ Successfully fetched tournaments');
            console.log(`📊 Found ${data.tournaments.length} tournaments`);
            
            if (data.tournaments.length > 0) {
                console.log('🏆 Sample tournament:', {
                    id: data.tournaments[0].id,
                    name: data.tournaments[0].name,
                    status: data.tournaments[0].status,
                    max_players: data.tournaments[0].max_players,
                    current_players: data.tournaments[0].current_players
                });
            }
            
            return true;
        } else if (!Array.isArray(data)) {
            console.log('✅ Successfully fetched tournaments (direct array format)');
            console.log(`📊 Found ${data.length} tournaments`);
            
            if (data.length > 0) {
                console.log('🏆 Sample tournament:', {
                    id: data[0].id,
                    name: data[0].name,
                    status: data[0].status,
                    max_players: data[0].max_players
                });
            }
            
            return true;
        } else {
            console.error('❌ Invalid response format:', data);
            throw new Error('Invalid response format from server');
        }
        
        return true;
    } catch (error) {
        console.error('❌ Tournament connectivity test failed:', error.message);
        return false;
    }
}

async function testBackendHealth() {
    try {
        console.log('\n🏥 Testing backend health...');
        const healthUrl = `${KANA_BASE_URL}/health`;
        const response = await makeRequestWithRetry(healthUrl);
        
        if (response.ok) {
            const health = await response.json();
            console.log('✅ Backend health check passed:', health);
            return true;
        } else {
            console.log('⚠️ Backend health check failed, but backend might still be operational');
            return false;
        }
    } catch (error) {
        console.log('⚠️ Backend health endpoint not available:', error.message);
        return false;
    }
}

async function runAllTests() {
    console.log('🚀 Starting Tournament Service Connectivity Tests\n');
    
    const healthResult = await testBackendHealth();
    const tournamentResult = await testTournamentConnectivity();
    
    console.log('\n📊 Test Results Summary:');
    console.log(`   Backend Health: ${healthResult ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Tournament API: ${tournamentResult ? '✅ PASS' : '❌ FAIL'}`);
    
    if (tournamentResult) {
        console.log('\n🎉 Tournament service is working correctly!');
        console.log('   Frontend should be able to connect to the tournament backend.');
    } else {
        console.log('\n⚠️ Tournament service has connectivity issues.');
        console.log('   Please check the backend URL and network connection.');
    }
}

// Run the tests
runAllTests().catch(console.error);
