import { connectToDatabase, FeaturedImage } from '@/lib/mongodb';

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const images = await FeaturedImage.find({ active: true }).sort({ order: 1, createdAt: -1 }).lean();
    
    const formattedImages = images.map(image => ({
      ...image,
      id: (image._id as { toString(): string }).toString(),
      _id: (image._id as { toString(): string }).toString()
    }));
    
    return Response.json(formattedImages);
  } catch (error) {
    console.error('Error fetching featured images:', error);
    return new Response('Error fetching featured images', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    
    const image = new FeaturedImage({
      ...body,
      active: true,
      order: body.order || 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    const savedImage = await image.save();
    
    // Trigger real-time update
    if (typeof global !== 'undefined' && (global as any).io) {
      (global as any).io.emit('dreamlive-update', {
        type: 'featured',
        action: 'create',
        data: savedImage,
        timestamp: Date.now()
      });
    }
    
    return Response.json({
      ...savedImage.toObject(),
      id: savedImage._id.toString(),
      _id: savedImage._id.toString()
    });
  } catch (error) {
    console.error('Error creating featured image:', error);
    return new Response('Error creating featured image', { status: 500 });
  }
}