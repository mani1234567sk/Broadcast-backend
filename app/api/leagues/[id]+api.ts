export async function PUT(request: Request, { id }: { id: string }) {
  try {
    const body = await request.json();
    
    // Here you would typically update the league in MongoDB
    const updatedLeague = {
      id,
      ...body,
      updatedAt: new Date().toISOString(),
    };

    return Response.json(updatedLeague);
  } catch (error) {
    return new Response('Error updating league', { status: 500 });
  }
}

export async function DELETE(request: Request, { id }: { id: string }) {
  try {
    // Here you would typically delete the league from MongoDB
    return new Response('League deleted successfully', { status: 200 });
  } catch (error) {
    return new Response('Error deleting league', { status: 500 });
  }
}