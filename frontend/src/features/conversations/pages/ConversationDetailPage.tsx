import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function ConversationDetailPage(): React.JSX.Element {
  const params = useParams();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversation Detail</CardTitle>
        <CardDescription>Review messages, generated drafts, and AI run history.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Conversation id: {params.conversationId}</p>
        <Separator className="my-4" />
        <p className="text-sm">Detailed message timeline will appear here.</p>
      </CardContent>
    </Card>
  );
}
