// MongoDB connection and Match operations
import { connectToDatabase, Match } from '@/lib/mongodb';

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const matches = await Match.find().sort({ createdAt: -1 }).lean();
    
    // Convert MongoDB _id to id for frontend compatibility
    const formattedMatches = matches.map(match => ({
      ...match,
      id: (match._id as { toString(): string }).toString(),
      _id: (match._id as { toString(): string }).toString()
    }));
    
    return Response.json(formattedMatches);
  } catch (error) {
    console.error('Error fetching matches:', error);
    return new Response('Error fetching matches', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    
    const match = new Match({
      ...body,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    const savedMatch = await match.save();
    
    // Trigger real-time update
    if (typeof global !== 'undefined' && global.io) {
      (global.io as any).emit('dreamlive-update', {
        type: 'match',
        action: 'create',
        data: savedMatch,
        timestamp: Date.now()
      });
    }
    
    return Response.json({
      ...savedMatch.toObject(),
      id: savedMatch._id.toString(),
      _id: savedMatch._id.toString()
    });
  } catch (error) {
    console.error('Error creating match:', error);
    return new Response('Error creating match', { status: 500 });
  }
}