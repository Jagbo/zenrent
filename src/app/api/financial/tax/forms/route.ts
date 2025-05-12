import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper function to validate UUID format
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export async function GET(request: Request) {
  try {
    // Get the URL search params
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");
    const taxYear = url.searchParams.get("taxYear");
    
    // Validate inputs
    if (!userId || !taxYear) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }
    
    // Validate UUID format
    if (!isValidUUID(userId)) {
      return NextResponse.json({ error: "Invalid user ID format" }, { status: 400 });
    }
    
    // Query database for forms
    const { data: forms, error } = await supabase
      .from("tax_forms")
      .select("*")
      .eq("user_id", userId)
      .eq("tax_year", taxYear)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      if (error.code === "PGRST116") {
        // No records found - not an error
        return NextResponse.json(null);
      }
      
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // All records should be valid at this point (either real storage URLs or demo URLs)
    return NextResponse.json(forms);
  } catch (error: any) {
    console.error("Error retrieving tax forms:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    // Get the URL search params
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");
    const taxYear = url.searchParams.get("taxYear");
    
    // Validate inputs
    if (!userId || !taxYear) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }
    
    // Validate UUID format
    if (!isValidUUID(userId)) {
      return NextResponse.json({ error: "Invalid user ID format" }, { status: 400 });
    }
    
    // Delete any existing form records for this user and tax year
    const { error } = await supabase
      .from("tax_forms")
      .delete()
      .eq("user_id", userId)
      .eq("tax_year", taxYear);
    
    if (error) {
      console.error("Error deleting tax forms:", error);
      return NextResponse.json(
        { error: `Failed to delete tax forms: ${error.message}` }, 
        { status: 500 }
      );
    }
    
    // Try to delete any associated files from storage
    try {
      const taxYearFormatted = taxYear.replace('/', '-');
      const fileNames = [
        `${userId}/sa100-${taxYearFormatted}.pdf`,
        `${userId}/sa105-${taxYearFormatted}.pdf`,
        `${userId}/combined-${taxYearFormatted}.pdf`
      ];
      
      for (const fileName of fileNames) {
        const { error: deleteError } = await supabase
          .storage
          .from('tax-forms')
          .remove([fileName]);
          
        if (deleteError) {
          console.warn(`Could not delete file ${fileName}:`, deleteError);
          // Continue with other files even if one fails
        }
      }
    } catch (storageError) {
      console.warn("Error cleaning up storage files:", storageError);
      // Continue anyway - DB record deletion is the main priority
    }
    
    return NextResponse.json({ success: true, message: "Tax forms deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting tax forms:", error);
    return NextResponse.json(
      { error: `Failed to delete tax forms: ${error.message}` }, 
      { status: 500 }
    );
  }
} 