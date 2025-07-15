// Test Frontend Tournament Service
import { backendTournamentService } from './src/services/backendTournamentService.ts';

console.log('🔗 Testing Frontend Tournament Service');

async function testFrontendService() {
    try {
        console.log('\n🏥 Testing backend connection...');
        const connectionTest = await backendTournamentService.testConnection();
        console.log('Connection result:', connectionTest);
        
        if (connectionTest.connected) {
            console.log('\n📋 Testing getTournaments...');
            const tournamentsResult = await backendTournamentService.getTournaments({
                status: 'registration',
                limit: 5
            });
            
            console.log('✅ Successfully fetched tournaments:', {
                success: tournamentsResult.success,
                count: tournamentsResult.tournaments.length
            });
            
            if (tournamentsResult.tournaments.length > 0) {
                console.log('🏆 Sample tournament:', {
                    id: tournamentsResult.tournaments[0].id,
                    name: tournamentsResult.tournaments[0].name,
                    status: tournamentsResult.tournaments[0].status,
                    max_players: tournamentsResult.tournaments[0].max_players,
                    current_players: tournamentsResult.tournaments[0].current_players
                });
            }
            
            return true;
        } else {
            console.log('❌ Backend connection failed');
            return false;
        }
    } catch (error) {
        console.error('❌ Frontend service test failed:', error.message);
        return false;
    }
}

testFrontendService().then(success => {
    if (success) {
        console.log('\n🎉 Frontend tournament service is working correctly!');
        console.log('   The AbortError issue should be resolved.');
    } else {
        console.log('\n⚠️ Frontend tournament service has issues.');
    }
}).catch(console.error);
