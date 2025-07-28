export async function GET(request: Request) {
  try {
    // Sample stats - replace with actual MongoDB aggregation queries
    const stats = {
      totalMatches: 156,
      liveMatches: 3,
      upcomingMatches: 12,
      completedMatches: 141,
      totalLeagues: 8,
      totalVideos: 45,
    };

    return Response.json(stats);
  } catch (error) {
    return new Response('Error fetching admin stats', { status: 500 });
  }
}