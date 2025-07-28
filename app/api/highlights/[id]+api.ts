import { connectToDatabase, Highlight } from '@/lib/mongodb';

export async function GET(request: Request, { id }: { id: string }) {
  try {
    await connectToDatabase();
    const highlight = await Highlight.findById(id).lean();
    
    if (!highlight) {
      return new Response('Highlight not found', { status: 404 });
    }
    
    // Increment view count
    await Highlight.findByIdAndUpdate(id, { $inc: { views: 1 } });
    
    // Type assertion to ensure we have the correct structure
    const highlightDoc = highlight as any;
    
    return Response.json({
      ...highlightDoc,
      id: highlightDoc._id.toString(),
      _id: highlightDoc._id.toString(),
      views: (highlightDoc.views || 0) + 1
    });
  } catch (error) {
    console.error('Error fetching highlight:', error);
    return new Response('Error fetching highlight', { status: 500 });
  }
}

export async function PUT(request: Request, { id }: { id: string }) {
  try {
    await connectToDatabase();
    const body = await request.json();
    
    const updatedHighlight = await Highlight.findByIdAndUpdate(
      id,
      { ...body, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).lean();
    
    if (!updatedHighlight) {
      return new Response('Highlight not found', { status: 404 });
    }
    
    // Type assertion to ensure we have the correct structure
    const highlightDoc = updatedHighlight as any;
    
    // Trigger real-time update
    if (typeof global !== 'undefined' && (global as any).io) {
      (global as any).io.emit('dreamlive-update', {
        type: 'highlight',
        action: 'update',
        data: highlightDoc,
        timestamp: Date.now()
      });
    }
    
    return Response.json({
      ...highlightDoc,
      id: highlightDoc._id.toString(),
      _id: highlightDoc._id.toString()
    });
  } catch (error) {
    console.error('Error updating highlight:', error);
    return new Response('Error updating highlight', { status: 500 });
  }
}

export async function DELETE(request: Request, { id }: { id: string }) {
  try {
    await connectToDatabase();
    const deletedHighlight = await Highlight.findByIdAndDelete(id);
    
    if (!deletedHighlight) {
      return new Response('Highlight not found', { status: 404 });
    }
    
    // Trigger real-time update
    if (typeof global !== 'undefined' && (global as any).io) {
      (global as any).io.emit('dreamlive-update', {
        type: 'highlight',
        action: 'delete',
        data: { id },
        timestamp: Date.now()
      });
    }
    
    return Response.json({ message: 'Highlight deleted successfully' });
  } catch (error) {
    console.error('Error deleting highlight:', error);
    return new Response('Error deleting highlight', { status: 500 });
  }
}