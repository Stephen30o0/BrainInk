// Simple test to verify the agent system works
import BrainInkAgentManager from './dist/index.js';

async function testAgents() {
    console.log('🧪 Testing Brain Ink Agent System...');

    const manager = new BrainInkAgentManager();

    try {
        // Start the agent manager
        console.log('🚀 Starting agents...');
        await manager.start(3002); // Use a different port for testing

        // Test agent communication
        console.log('📱 Testing agent communication...');

        // Get Kana Tutor agent
        const kanaTutor = manager.getAgent('Kana Tutor');
        if (kanaTutor) {
            const response = await kanaTutor.processMessage({
                id: 'test_msg_1',
                userId: 'test_user',
                content: { text: 'Create a Japanese quiz for me' },
                timestamp: Date.now()
            });

            console.log('✅ Kana Tutor Response:', response.text);
        }

        // Get Progress Analyst agent
        const progressAnalyst = manager.getAgent('Progress Analyst');
        if (progressAnalyst) {
            const response = await progressAnalyst.processMessage({
                id: 'test_msg_2',
                userId: 'test_user',
                content: { text: 'Show me my progress in mathematics' },
                timestamp: Date.now()
            });

            console.log('✅ Progress Analyst Response:', response.text);
        }

        // Get Squad Coordinator agent
        const squadCoordinator = manager.getAgent('Squad Coordinator');
        if (squadCoordinator) {
            const response = await squadCoordinator.processMessage({
                id: 'test_msg_3',
                userId: 'test_user',
                content: { text: 'Help me find study partners for chemistry' },
                timestamp: Date.now()
            });

            console.log('✅ Squad Coordinator Response:', response.text);
        }

        console.log('\n🎉 All tests completed successfully!');
        console.log('📋 Available agents:', manager.listAgents());

        // Stop the manager
        setTimeout(async () => {
            await manager.stop();
            console.log('✅ Test completed and system stopped');
            process.exit(0);
        }, 2000);

    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}

testAgents().catch(console.error);
