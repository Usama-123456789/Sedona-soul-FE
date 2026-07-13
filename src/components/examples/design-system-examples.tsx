import { ArrowRight, FileText, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function UserPwaComponentExample() {
  return (
    <Card className="max-w-md border-0 bg-white">
      <CardHeader>
        <p className="sedona-eyebrow">Daily check-in</p>
        <CardTitle>Before we begin</CardTitle>
        <CardDescription>Safety comes first, then workbook-guided reflection.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button className="w-full" size="lg">
          Yes, I&apos;m safe
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Button>
        <Button className="w-full" size="lg" variant="outline">
          I&apos;m not sure
        </Button>
      </CardContent>
    </Card>
  );
}

export function AdminComponentExample() {
  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle className="font-sans text-xl font-semibold">Content module setup</CardTitle>
        <CardDescription>Admin surfaces use compact controls and scan-friendly hierarchy.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input placeholder="Module title" />
        <Tabs defaultValue="content">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="safety">Safety</TabsTrigger>
          </TabsList>
          <TabsContent value="content">
            <EmptyState
              description="Upload workbook content, videos, or guided prompts for this module."
              icon={FileText}
              title="No content yet"
            />
          </TabsContent>
          <TabsContent value="reports">
            <LoadingState description="Fetching pseudonymized user progress summaries." title="Loading reports" />
          </TabsContent>
          <TabsContent value="safety">
            <ErrorState description="Safety rules must be configured before this module can be published." title="Safety rules missing" />
          </TabsContent>
        </Tabs>
        <Button variant="accent">
          Save module
          <Shield aria-hidden="true" className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
