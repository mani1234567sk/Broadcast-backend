import { connectToDatabase, League } from '@/lib/mongodb';


export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const leagues = await League.find().sort({ createdAt: -1 }).lean();
    
    const formattedLeagues = leagues.map(league => ({
      ...league,
      id: (league._id as { toString(): string }).toString(),
      _id: (league._id as { toString(): string }).toString()
    }));
    
    return Response.json(formattedLeagues);
  } catch (error) {
    console.error('Error fetching leagues:', error);
    return new Response('Error fetching leagues', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    
    const league = new League({
      ...body,
      matchCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    const savedLeague = await league.save();
    
    // Trigger real-time update
    if (typeof global !== 'undefined' && global.io) {
      (global.io as any).emit('dreamlive-update', {
        type: 'league',
        action: 'create',
        data: savedLeague,
        timestamp: Date.now()
      });
    }
    
    return Response.json({
      ...savedLeague.toObject(),
      id: savedLeague._id.toString(),
      _id: savedLeague._id.toString()
    });
  } catch (error) {
    console.error('Error creating league:', error);
    return new Response('Error creating league', { status: 500 });
  }
}