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
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID is required' }, { status: 400 });
    }

    // Verify the tenant belongs to the current user
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id')
      .eq('id', tenantId)
      .eq('user_id', user.id)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Tenant not found or unauthorized' }, { status: 404 });
    }

    // Get tenant documents
    const { data: documents, error: documentsError } = await supabase
      .from('tenant_documents')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('uploaded_at', { ascending: false });

    if (documentsError) {
      console.error('Error fetching tenant documents:', documentsError);
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
    }

    return NextResponse.json({ documents });
  } catch (error) {
    console.error('Error in tenant documents GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const tenantId = formData.get('tenantId') as string;
    const documentType = formData.get('documentType') as string;
    const description = formData.get('description') as string;

    if (!file || !tenantId || !documentType) {
      return NextResponse.json({ 
        error: 'File, tenant ID, and document type are required' 
      }, { status: 400 });
    }

    // Verify the tenant belongs to the current user
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, name')
      .eq('id', tenantId)
      .eq('user_id', user.id)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Tenant not found or unauthorized' }, { status: 404 });
    }

    // Generate unique file name
    const fileExtension = file.name.split('.').pop();
    const fileName = `${tenantId}/${documentType}_${Date.now()}.${fileExtension}`;

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('tenant-documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('tenant-documents')
      .getPublicUrl(fileName);

    // Save document record to database
    const { data: document, error: dbError } = await supabase
      .from('tenant_documents')
      .insert({
        tenant_id: tenantId,
        document_type: documentType,
        document_url: publicUrl,
        file_name: file.name,
        file_size: file.size,
        uploaded_by: user.id,
        description: description || null,
        metadata: {
          original_name: file.name,
          content_type: file.type,
          storage_path: fileName
        }
      })
      .select()
      .single();

    if (dbError) {
      console.error('Error saving document record:', dbError);
      // Try to clean up uploaded file
      await supabase.storage.from('tenant-documents').remove([fileName]);
      return NextResponse.json({ error: 'Failed to save document record' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Document uploaded successfully',
      document 
    });
  } catch (error) {
    console.error('Error in tenant documents POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
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

    // Delete file from storage
    const storagePath = document.metadata?.storage_path;
    if (storagePath) {
      const { error: storageError } = await supabase.storage
        .from('tenant-documents')
        .remove([storagePath]);
      
      if (storageError) {
        console.error('Error deleting file from storage:', storageError);
      }
    }

    // Delete document record from database
    const { error: deleteError } = await supabase
      .from('tenant_documents')
      .delete()
      .eq('id', documentId);

    if (deleteError) {
      console.error('Error deleting document record:', deleteError);
      return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error in tenant documents DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 