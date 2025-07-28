export async function GET(request: Request, { id }: { id: string }) {
  try {
    // Sample data - replace with actual MongoDB queries
    const leagueMatches = {
      leagueName: id === '1' ? 'Premier League' : id === '2' ? 'Champions League' : 'La Liga',
      matches: [
        {
          id: '1',
          team1: 'Manchester United',
          team2: 'Liverpool',
          date: '2025-01-15',
          time: '15:00',
          status: 'live',
          venue: 'Old Trafford',
          imageUrl: 'https://images.pexels.com/photos/274506/pexels-photo-274506.jpeg?auto=compress&cs=tinysrgb&w=800',
        },
        {
          id: '2',
          team1: 'Chelsea',
          team2: 'Arsenal',
          date: '2025-01-16',
          time: '18:30',
          status: 'upcoming',
          venue: 'Stamford Bridge',
          imageUrl: 'https://images.pexels.com/photos/186077/pexels-photo-186077.jpeg?auto=compress&cs=tinysrgb&w=800',
        },
        {
          id: '3',
          team1: 'Manchester City',
          team2: 'Tottenham',
          date: '2025-01-12',
          time: '16:00',
          status: 'completed',
          venue: 'Etihad Stadium',
          imageUrl: 'https://images.pexels.com/photos/1884574/pexels-photo-1884574.jpeg?auto=compress&cs=tinysrgb&w=800',
        },
      ]
    };

    return Response.json(leagueMatches);
  } catch (error) {
    return new Response('Error fetching league matches', { status: 500 });
  }
}