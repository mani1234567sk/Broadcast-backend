import { connectToDatabase, Highlight } from '@/lib/mongodb';

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const highlights = await Highlight.find().sort({ featured: -1, createdAt: -1 }).lean();
    
    const formattedHighlights = highlights.map(highlight => ({
      ...highlight,
      id: (highlight._id as { toString(): string }).toString(),
      _id: (highlight._id as { toString(): string }).toString(),
      uploadDate: highlight.uploadDate ? new Date(highlight.uploadDate).toLocaleDateString() : 'Unknown'
    }));
    
    return Response.json(formattedHighlights);
  } catch (error) {
    console.error('Error fetching highlights:', error);
    return new Response('Error fetching highlights', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    
    const highlight = new Highlight({
      ...body,
      thumbnailUrl: body.thumbnailUrl || `https://img.youtube.com/vi/${body.videoId}/maxresdefault.jpg`,
      uploadDate: new Date(),
      views: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    const savedHighlight = await highlight.save();
    const savedHighlightObj = savedHighlight.toObject();
    
    // Trigger real-time update
    if (typeof global !== 'undefined' && (global as any).io) {
      (global as any).io.emit('dreamlive-update', {
        type: 'highlight',
        action: 'create',
        data: savedHighlightObj,
        timestamp: Date.now()
      });
    }
    
    return Response.json({
      ...savedHighlightObj,
      id: savedHighlightObj._id.toString(),
      _id: savedHighlightObj._id.toString()
    });
  } catch (error) {
    console.error('Error creating highlight:', error);
    return new Response('Error creating highlight', { status: 500 });
  }
}