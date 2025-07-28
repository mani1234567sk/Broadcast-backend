import { connectToDatabase, Video, Highlight } from '@/lib/mongodb';

export async function GET(request: Request, { id }: { id: string }) {
  try {
    await connectToDatabase();
    
    // First try to find it as a regular video
    let video = await Video.findById(id).lean();
    let isHighlight = false;
    
    // If not found as video, try to find it as a highlight
    if (!video) {
      video = await Highlight.findById(id).lean();
      isHighlight = true;
    }
    
    if (!video) {
      return new Response('Video not found', { status: 404 });
    }
    
    // Type assertion to handle Mongoose lean results
    const videoDoc = video as any;
    
    // Increment view count
    if (isHighlight) {
      await Highlight.findByIdAndUpdate(id, { $inc: { views: 1 } });
    } else {
      await Video.findByIdAndUpdate(id, { $inc: { views: 1 } });
    }
    
    // Format the response with proper video details
    const videoDetails = {
      id: videoDoc._id.toString(),
      title: videoDoc.title,
      description: videoDoc.description || generateDescription(videoDoc, isHighlight),
      videoId: videoDoc.videoId,
      uploadDate: videoDoc.uploadDate ? new Date(videoDoc.uploadDate).toLocaleDateString() : 'Unknown',
      views: (videoDoc.views || 0) + 1,
      category: isHighlight ? 'Sports Highlight' : (videoDoc.category || 'Video'),
      duration: videoDoc.duration || 'Unknown',
      youtubeUrl: videoDoc.youtubeUrl,
      sport: videoDoc.sport || undefined,
      featured: videoDoc.featured || false,
      thumbnailUrl: videoDoc.thumbnailUrl || `https://img.youtube.com/vi/${videoDoc.videoId}/maxresdefault.jpg`
    };
    
    return Response.json(videoDetails);
  } catch (error) {
    console.error('Error fetching video details:', error);
    return new Response('Error fetching video details', { status: 500 });
  }
}

// Helper function to generate appropriate descriptions
function generateDescription(video: any, isHighlight: boolean): string {
  if (isHighlight) {
    const sport = video.sport || 'Sports';
    const featured = video.featured ? 'Featured ' : '';
    
    return `${featured}${sport} Highlight: ${video.title}

Watch this exciting ${sport.toLowerCase()} highlight featuring incredible moments and spectacular plays. This video showcases the best action from recent matches.

${video.featured ? '⭐ This is a featured highlight, showcasing some of the most exciting moments in sports!\n\n' : ''}Key Features:
• High-quality ${sport.toLowerCase()} footage
• Professional commentary and analysis
• Best moments and key plays
• Perfect for sports enthusiasts

Don't miss these incredible moments from the world of ${sport.toLowerCase()}!`;
  } else {
    const category = video.category || 'Video';
    
    return `${category}: ${video.title}

Enjoy this ${category.toLowerCase()} content featuring engaging and entertaining material.

Category: ${category}
${video.views ? `Views: ${video.views.toLocaleString()}` : ''}

Watch and enjoy this quality content!`;
  }
}

export async function PUT(request: Request, { id }: { id: string }) {
  try {
    await connectToDatabase();
    const body = await request.json();
    
    // Try to update as video first, then as highlight
    let updatedItem = await Video.findByIdAndUpdate(
      id,
      { ...body, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).lean();
    
    let itemType = 'video';
    
    if (!updatedItem) {
      updatedItem = await Highlight.findByIdAndUpdate(
        id,
        { ...body, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).lean();
      itemType = 'highlight';
    }
    
    if (!updatedItem) {
      return new Response('Video not found', { status: 404 });
    }
    
    // Type assertion to handle Mongoose lean results
    const itemDoc = updatedItem as any;
    
    // Trigger real-time update
    if (typeof global !== 'undefined' && (global as any).io) {
      (global as any).io.emit('dreamlive-update', {
        type: itemType,
        action: 'update',
        data: itemDoc,
        timestamp: Date.now()
      });
    }
    
    return Response.json({
      ...itemDoc,
      id: itemDoc._id.toString(),
      _id: itemDoc._id.toString()
    });
  } catch (error) {
    console.error('Error updating video:', error);
    return new Response('Error updating video', { status: 500 });
  }
}

export async function DELETE(request: Request, { id }: { id: string }) {
  try {
    await connectToDatabase();
    
    // Try to delete as video first, then as highlight
    let deletedItem = await Video.findByIdAndDelete(id);
    let itemType = 'video';
    
    if (!deletedItem) {
      deletedItem = await Highlight.findByIdAndDelete(id);
      itemType = 'highlight';
    }
    
    if (!deletedItem) {
      return new Response('Video not found', { status: 404 });
    }
    
    // Trigger real-time update
    if (typeof global !== 'undefined' && (global as any).io) {
      (global as any).io.emit('dreamlive-update', {
        type: itemType,
        action: 'delete',
        data: { id },
        timestamp: Date.now()
      });
    }
    
    return Response.json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Error deleting video:', error);
    return new Response('Error deleting video', { status: 500 });
  }
}