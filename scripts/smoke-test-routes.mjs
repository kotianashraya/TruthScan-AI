const routes = ['/', '/dashboard', '/scanner', '/history', '/reports', '/profile', '/settings'];
const baseUrl = 'https://truthscan-ai-2eb39.web.app';

console.log(`Smoke testing SPA routes on ${baseUrl}...`);

for (const route of routes) {
  try {
    const res = await fetch(`${baseUrl}${route}`, { redirect: 'manual' });
    const text = await res.text();
    const hasRootDiv = text.includes('<div id="root">');
    console.log(`${route.padEnd(12)} -> HTTP ${res.status} (SPA HTML shell: ${hasRootDiv ? 'OK' : 'MISMATCH'})`);
  } catch (err) {
    console.error(`${route.padEnd(12)} -> ERROR:`, err.message);
  }
}
