// Simple test to check what's being exported from tournaments.js
const tournamentRoutes = require('./routes/tournaments');

console.log('Type of tournamentRoutes:', typeof tournamentRoutes);
console.log('tournamentRoutes:', tournamentRoutes);
console.log('Is it a function?', typeof tournamentRoutes === 'function');
console.log('Constructor name:', tournamentRoutes.constructor.name);

if (tournamentRoutes.constructor.name === 'router') {
    console.log('✅ Tournament routes exported correctly as Express router');
} else {
    console.log('❌ Tournament routes NOT exported as Express router');
    console.log('Available properties:', Object.keys(tournamentRoutes));
}
