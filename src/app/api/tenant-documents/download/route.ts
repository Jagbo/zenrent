import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    // Get document details and verify ownership
    const { data: document, error: docError } = await supabase
      .from('tenant_documents')
      .select(`
        *,
        tenants!inner(user_id)
      `)
      .eq('id', documentId)
      .eq('tenants.user_id', user.id)
      .single();

    if (docError || !document) {
      return NextResponse.json({ error: 'Document not found or unauthorized' }, { status: 404 });
    }

    // Get signed URL for download
    const storagePath = document.metadata?.storage_path;
    if (!storagePath) {
      return NextResponse.json({ error: 'Document file not found' }, { status: 404 });
    }

    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from('tenant-documents')
      .createSignedUrl(storagePath, 3600); // 1 hour expiry

    if (urlError || !signedUrlData) {
      console.error('Error creating signed URL:', urlError);
      return NextResponse.json({ error: 'Failed to generate download link' }, { status: 500 });
    }

    return NextResponse.json({ 
      downloadUrl: signedUrlData.signedUrl,
      fileName: document.file_name,
      contentType: document.metadata?.content_type || 'application/octet-stream'
    });
  } catch (error) {
    console.error('Error in document download:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 