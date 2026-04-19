import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function HomePage(): React.JSX.Element {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Inbox health</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Connect a workspace to view live response coverage.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>AI quality</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Monitor resolution quality after each assistant run.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Knowledge sync</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Keep documents fresh to improve answer confidence.</p>
        </CardContent>
      </Card>
    </div>
  );
}
