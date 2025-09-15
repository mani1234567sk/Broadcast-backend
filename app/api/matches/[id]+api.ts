import { connectToDatabase, Match } from '@/lib/mongodb';

export async function GET(request: Request, { id }: { id: string }) {
  try {
    await connectToDatabase();
    const match = await Match.findById(id).lean();
    
    if (!match) {
      return new Response('Match not found', { status: 404 });
    }
    
    return Response.json({
      ...match,
      id: (match as any)._id?.toString(),
      _id: (match as any)._id?.toString()
    });
  } catch (error) {
    console.error('Error fetching match:', error);
    return new Response('Error fetching match', { status: 500 });
  }
}

export async function PUT(request: Request, { id }: { id: string }) {
  try {
    await connectToDatabase();
    const body = await request.json();
    
    const updatedMatch = await Match.findByIdAndUpdate(
      id,
      { ...body, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).lean();
    
    if (!updatedMatch) {
      return new Response('Match not found', { status: 404 });
    }
    
    // Trigger real-time update
    if (typeof global !== 'undefined' && global.io) {
      (global.io as any).emit('dreamlive-update', {
        type: 'match',
        action: 'update',
        data: updatedMatch,
        timestamp: Date.now()
      });
    }
    
    return Response.json({
      ...updatedMatch,
      id: (updatedMatch as any)._id?.toString(),
      _id: (updatedMatch as any)._id?.toString()
    });
  } catch (error) {
    console.error('Error updating match:', error);
    return new Response('Error updating match', { status: 500 });
  }
}

export async function DELETE(request: Request, { id }: { id: string }) {
  try {
    await connectToDatabase();
    const deletedMatch = await Match.findByIdAndDelete(id);
    
    if (!deletedMatch) {
      return new Response('Match not found', { status: 404 });
    }
    
    // Trigger real-time update
    if (typeof global !== 'undefined' && global.io) {
      (global.io as any).emit('dreamlive-update', {
        type: 'match',
        action: 'delete',
        data: { id },
        timestamp: Date.now()
      });
    }
    
    return Response.json({ message: 'Match deleted successfully' });
  } catch (error) {
    console.error('Error deleting match:', error);
    return new Response('Error deleting match', { status: 500 });
  }
}