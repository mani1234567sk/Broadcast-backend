export async function GET(request: Request) {
  try {
    console.log('🏥 Health check requested');
    
    return Response.json({ 
      status: 'OK', 
      server: 'Dream Live API Server',
      platform: 'Expo Router',
      version: '1.0.0',
      environment: __DEV__ ? 'development' : 'production',
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
    console.error('❌ Health check failed:', error);
    return new Response('Health check failed', { status: 500 });
  }
}