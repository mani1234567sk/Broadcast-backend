import { connectToDatabase, Video } from '@/lib/mongodb';

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const videos = await Video.find().sort({ createdAt: -1 }).lean();
    
    const formattedVideos = videos.map(video => ({
      ...video,
      id: (video._id as any).toString(),
      _id: (video._id as any).toString(),
      uploadDate: video.uploadDate ? new Date(video.uploadDate).toLocaleDateString() : 'Unknown'
    }));
    
    return Response.json(formattedVideos);
  } catch (error) {
    console.error('Error fetching videos:', error);
    return new Response('Error fetching videos', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    
    const video = new Video({
      ...body,
      thumbnailUrl: body.thumbnailUrl || `https://img.youtube.com/vi/${body.videoId}/maxresdefault.jpg`,
      uploadDate: new Date(),
      views: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    const savedVideo = await video.save();
    
    // Trigger real-time update
    if (typeof global !== 'undefined' && global.io) {
      (global.io as any).emit('dreamlive-update', {
        type: 'video',
        action: 'create',
        data: savedVideo,
        timestamp: Date.now()
      });
    }
    
    return Response.json({
      ...savedVideo.toObject(),
      id: savedVideo._id.toString(),
      _id: savedVideo._id.toString()
    });
  } catch (error) {
    console.error('Error creating video:', error);
    return new Response('Error creating video', { status: 500 });
  }
}