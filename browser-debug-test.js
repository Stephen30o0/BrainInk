// Integration test for principal dashboard components
// Run this in browser console to debug the student/teacher data loading

(function () {
    console.log('🔍 Principal Dashboard Integration Test Starting...');

    // Check if we're on the correct page
    if (!window.location.href.includes('localhost:5173')) {
        console.log('❌ Please run this on localhost:5173');
        return;
    }

    // Check for React components in the page
    const studentManagementExists = document.querySelector('[data-testid="student-management"]') ||
        document.querySelector('h2') &&
        Array.from(document.querySelectorAll('h2')).some(h => h.textContent?.includes('Student Management'));

    const teacherManagementExists = document.querySelector('[data-testid="teacher-management"]') ||
        document.querySelector('h2') &&
        Array.from(document.querySelectorAll('h2')).some(h => h.textContent?.includes('Teacher Management'));

    console.log(`📚 Student Management Component: ${studentManagementExists ? '✅ Found' : '❌ Not found'}`);
    console.log(`👨‍🏫 Teacher Management Component: ${teacherManagementExists ? '✅ Found' : '❌ Not found'}`);

    // Check for loading states
    const loadingElements = document.querySelectorAll('[class*="animate-spin"]');
    console.log(`⏳ Loading indicators: ${loadingElements.length}`);

    // Check for error messages
    const errorElements = document.querySelectorAll('[class*="text-red"]');
    console.log(`❌ Error elements: ${errorElements.length}`);

    // Check for student/teacher tables
    const tables = document.querySelectorAll('table');
    console.log(`📋 Tables found: ${tables.length}`);

    if (tables.length > 0) {
        tables.forEach((table, index) => {
            const rows = table.querySelectorAll('tbody tr');
            console.log(`   Table ${index + 1}: ${rows.length} data rows`);
        });
    }

    // Check for empty state messages
    const emptyStates = Array.from(document.querySelectorAll('*')).filter(el =>
        el.textContent?.includes('No Students Yet') ||
        el.textContent?.includes('No Teachers Yet') ||
        el.textContent?.includes('No matching')
    );
    console.log(`📭 Empty state messages: ${emptyStates.length}`);

    if (emptyStates.length > 0) {
        emptyStates.forEach((el, index) => {
            console.log(`   Empty state ${index + 1}: "${el.textContent?.trim()}"`);
        });
    }

    // Check for network requests in the network tab
    console.log('🌐 Check the Network tab for:');
    console.log('   - GET /study-area/students/my-school');
    console.log('   - GET /study-area/teachers/my-school');
    console.log('   - Look for 200 status codes and response data');

    console.log('\n📋 Test complete. Check above results and network tab for more details.');
})();
