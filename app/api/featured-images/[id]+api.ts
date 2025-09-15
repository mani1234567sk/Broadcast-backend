import { connectToDatabase, FeaturedImage } from '@/lib/mongodb';

export async function PUT(request: Request, { id }: { id: string }) {
  try {
    await connectToDatabase();
    const body = await request.json();
    
    const updatedImage = await FeaturedImage.findByIdAndUpdate(
      id,
      { ...body, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).lean();
    
    if (!updatedImage) {
      return new Response('Featured image not found', { status: 404 });
    }
    
    // Trigger real-time update
    if (typeof global !== 'undefined' && (global as any).io) {
      (global as any).io.emit('dreamlive-update', {
        type: 'featured',
        action: 'update',
        data: updatedImage,
        timestamp: Date.now()
      });
    }
    
    return Response.json({
      ...updatedImage,
      id: (updatedImage as any)._id.toString(),
      _id: (updatedImage as any)._id.toString()
    });
  } catch (error) {
    console.error('Error updating featured image:', error);
    return new Response('Error updating featured image', { status: 500 });
  }
}

export async function DELETE(request: Request, { id }: { id: string }) {
  try {
    await connectToDatabase();
    const deletedImage = await FeaturedImage.findByIdAndDelete(id);
    
    if (!deletedImage) {
      return new Response('Featured image not found', { status: 404 });
    }
    
    // Trigger real-time update
    if (typeof global !== 'undefined' && (global as any).io) {
      (global as any).io.emit('dreamlive-update', {
        type: 'featured',
        action: 'delete',
        data: { id },
        timestamp: Date.now()
      });
    }
    
    return Response.json({ message: 'Featured image deleted successfully' });
  } catch (error) {
    console.error('Error deleting featured image:', error);
    return new Response('Error deleting featured image', { status: 500 });
  }
}