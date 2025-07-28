export async function GET(request: Request) {
  try {
    // Return the current featured video
    const featuredVideo = {
      videoId: 'dQw4w9WgXcQ',
      title: 'Featured Match Highlights',
      lastUpdated: new Date().toISOString(),
    };

    return Response.json(featuredVideo);
  } catch (error) {
    return new Response('Error fetching featured video', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Here you would typically save to MongoDB
    const updatedFeaturedVideo = {
      videoId: body.videoId,
      title: body.title || 'Featured Content',
      lastUpdated: new Date().toISOString(),
    };

    return Response.json(updatedFeaturedVideo);
  } catch (error) {
    return new Response('Error updating featured video', { status: 500 });
  }
}