export async function GET(request: Request) {
  try {
    return Response.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      server: 'Dream Live API Server',
      platform: 'Expo Router',
      version: '1.0.0',
      endpoints: {
        matches: '/api/matches',
        leagues: '/api/leagues', 
        videos: '/api/videos',
        highlights: '/api/highlights',
        featured: '/api/featured-video',
        admin: '/api/admin/stats'
      }
    });
  } catch (error) {
    return new Response('Health check failed', { status: 500 });
  }
}