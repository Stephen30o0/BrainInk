const axios = require('axios');

const BASE_URL = 'http://localhost:10000/api/tournaments';

// Test data
const testCreator = '0x1234567890123456789012345678901234567890';
const testPlayer1 = '0x2345678901234567890123456789012345678901';
const testPlayer2 = '0x3456789012345678901234567890123456789012';
const testPlayer3 = '0x4567890123456789012345678901234567890123';

let tournamentId = '';
let invitationId = '';

async function test() {
    console.log('🧪 Testing Tournament API Endpoints...\n');

    try {
        // Test 1: Create Tournament
        console.log('1️⃣ Testing POST /tournaments/create');
        const createResponse = await axios.post(`${BASE_URL}/create`, {
            name: 'Test Tournament API',
            description: 'Testing all tournament endpoints',
            creator_address: testCreator,
            max_players: 8,
            entry_fee: 0,
            prize_pool: 100,
            bracket_type: 'single_elimination',
            questions_per_match: 10,
            time_limit_minutes: 30,
            difficulty_level: 'medium',
            subject_category: 'general',
            custom_topics: ['Math', 'Science'],
            is_public: true,
            prize_distribution: [60, 30, 10]
        });

        console.log('✅ Tournament created:', createResponse.data.tournament_id);
        tournamentId = createResponse.data.tournament_id;
        console.log('');

        // Test 2: Get All Tournaments
        console.log('2️⃣ Testing GET /tournaments/');
        const listResponse = await axios.get(`${BASE_URL}/`);
        console.log(`✅ Retrieved ${listResponse.data.tournaments.length} tournaments`);
        console.log('');

        // Test 3: Get Tournament Details
        console.log('3️⃣ Testing GET /tournaments/{tournament_id}');
        const detailsResponse = await axios.get(`${BASE_URL}/${tournamentId}`);
        console.log('✅ Tournament details:', detailsResponse.data.tournament.name);
        console.log('');

        // Test 4: Join Tournament
        console.log('4️⃣ Testing POST /tournaments/{tournament_id}/join');
        const joinResponse1 = await axios.post(`${BASE_URL}/${tournamentId}/join`, {
            user_address: testPlayer1
        });
        console.log('✅ Player 1 joined tournament');

        const joinResponse2 = await axios.post(`${BASE_URL}/${tournamentId}/join`, {
            user_address: testPlayer2
        });
        console.log('✅ Player 2 joined tournament');
        console.log('');

        // Test 5: Invite Players
        console.log('5️⃣ Testing POST /tournaments/{tournament_id}/invite');
        const inviteResponse = await axios.post(`${BASE_URL}/${tournamentId}/invite`, {
            inviter_address: testCreator,
            invited_addresses: [testPlayer3],
            message: 'Join our awesome tournament!'
        });
        console.log('✅ Invitation sent:', inviteResponse.data.invited.length);
        console.log('');

        // Test 6: Get My Invitations
        console.log('6️⃣ Testing GET /tournaments/invitations/{user_address}');
        const invitationsResponse = await axios.get(`${BASE_URL}/invitations/${testPlayer3}`);
        console.log('✅ Retrieved invitations:', invitationsResponse.data.invitations.length);
        if (invitationsResponse.data.invitations.length > 0) {
            invitationId = invitationsResponse.data.invitations[0].id;
        }
        console.log('');

        // Test 7: Respond to Invitation
        if (invitationId) {
            console.log('7️⃣ Testing POST /tournaments/invitations/{invitation_id}/respond');
            const respondResponse = await axios.post(`${BASE_URL}/invitations/${invitationId}/respond`, {
                user_address: testPlayer3,
                response: 'accept'
            });
            console.log('✅ Invitation accepted:', respondResponse.data.response);
            console.log('');
        }

        // Test 8: Get My Tournaments
        console.log('8️⃣ Testing GET /tournaments/my/{user_address}');
        const myTournamentsResponse = await axios.get(`${BASE_URL}/my/${testCreator}`);
        console.log('✅ Retrieved my tournaments:', myTournamentsResponse.data.tournaments.length);
        console.log('');

        // Test 9: Start Tournament
        console.log('9️⃣ Testing POST /tournaments/{tournament_id}/start');
        const startResponse = await axios.post(`${BASE_URL}/${tournamentId}/start`, {
            user_address: testCreator
        });
        console.log('✅ Tournament started');
        console.log('');

        // Test 10: Get Tournament Bracket
        console.log('🔟 Testing GET /tournaments/{tournament_id}/bracket');
        const bracketResponse = await axios.get(`${BASE_URL}/${tournamentId}/bracket`);
        console.log('✅ Retrieved tournament bracket with', bracketResponse.data.matches.length, 'matches');
        console.log('');

        console.log('🎉 All endpoint tests completed successfully!');
    } catch (error) {
        console.error('❌ Test failed:');
        console.error('Error message:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
        if (error.code) {
            console.error('Error code:', error.code);
        }
    }
}

// Run tests
test();
