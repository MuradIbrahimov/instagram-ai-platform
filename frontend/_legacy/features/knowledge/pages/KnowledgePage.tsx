import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function KnowledgePage(): React.JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Knowledge Base</CardTitle>
        <CardDescription>Documents used to ground AI-generated replies.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between rounded-md border border-border p-4">
          <div>
            <p className="font-medium">Shipping policy.txt</p>
            <p className="text-sm text-muted-foreground">Uploaded from local file</p>
          </div>
          <Badge variant="secondary">ready</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
