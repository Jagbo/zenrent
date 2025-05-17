"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

interface ServiceResult {
  section: string;
  data: unknown;
  error?: string;
}

export default function ServicesApiPage() {
  const [userId, setUserId] = useState<string>("");
  const [results, setResults] = useState<ServiceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClientComponentClient();

  const fetchAllServices = async () => {
    setLoading(true);
    try {
      const services = [
        { section: "Properties", query: "properties" },
        { section: "Tenants", query: "tenants" },
        { section: "Issues", query: "issues" },
        { section: "Payments", query: "payments" },
        { section: "Documents", query: "documents" },
        { section: "Maintenance", query: "maintenance_records" },
      ];

      const results: ServiceResult[] = [];

      for (const service of services) {
        try {
          const { data, error } = await supabase
            .from(service.query)
            .select("*")
            .eq("user_id", userId);

          results.push({
            section: service.section,
            data: data || [],
            error: error?.message,
          });
        } catch (error) {
          results.push({
            section: service.section,
            data: [],
            error: "Failed to fetch data",
          });
        }
      }

      setResults(results);
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Services API Debug</h1>

      <div className="flex gap-4 mb-8">
        <Input placeholder="Enter User ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="max-w-md"
        />
        <Button onClick={fetchAllServices} disabled={!userId || loading}>
          {loading ? "Loading..." : "Fetch Services"}
        </Button>
      </div>

      <div className="grid gap-6">
        {results.map((result, index) => (
          <Card key={index}>
            <CardHeader>
              <h2 className="text-xl font-semibold">{result.section}</h2>
            </CardHeader>
            <CardContent>
              {result.error ? (
                <div className="text-red-500">Error: {result.error}</div>
              ) : result.data.length === 0 ? (
                <div className="text-gray-500">No data found</div>
              ) : (
                <pre className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-96">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
