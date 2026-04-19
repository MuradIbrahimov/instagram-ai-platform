import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ConversationsPage(): React.JSX.Element {
  const params = useParams();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversations</CardTitle>
        <CardDescription>Track incoming Instagram threads and AI draft coverage.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Workspace id: <span className="font-medium text-foreground">{params.workspaceId}</span>
        </p>
        <div className="flex items-center gap-2">
          <Badge>Inbox connected</Badge>
          <Badge variant="secondary">Auto-reply healthy</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
