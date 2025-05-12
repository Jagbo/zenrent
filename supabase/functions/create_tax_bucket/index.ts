import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// This function creates the tax-forms bucket if it doesn't exist
serve(async (req) => {
  try {
    // Create a Supabase client with the Admin key
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase
      .storage
      .listBuckets()

    if (listError) {
      console.error('Error listing buckets:', listError)
      return new Response(JSON.stringify({ error: 'Error listing buckets' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      })
    }

    // Check if tax-forms bucket exists
    const taxFormsBucket = buckets.find(bucket => bucket.name === 'tax-forms')
    
    if (!taxFormsBucket) {
      // Create the bucket if it doesn't exist
      const { data: newBucket, error: createError } = await supabase
        .storage
        .createBucket('tax-forms', {
          public: false,
          fileSizeLimit: 10485760, // 10MB
          allowedMimeTypes: ['application/pdf']
        })

      if (createError) {
        console.error('Error creating tax-forms bucket:', createError)
        return new Response(JSON.stringify({ error: 'Error creating bucket' }), {
          headers: { 'Content-Type': 'application/json' },
          status: 500
        })
      }

      return new Response(JSON.stringify({ 
        message: 'tax-forms bucket created successfully', 
        bucket: newBucket 
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 201
      })
    }

    return new Response(JSON.stringify({ 
      message: 'tax-forms bucket already exists',
      bucket: taxFormsBucket
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(JSON.stringify({ error: 'Unexpected error occurred' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    })
  }
}) 