import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function InstagramPage(): React.JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Instagram Integration</CardTitle>
        <CardDescription>Connect your account and tune auto-reply behavior.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-md border border-border p-4">
          <div>
            <Label className="text-base">Auto replies</Label>
            <p className="text-sm text-muted-foreground">Enable assistant-generated replies for new DMs.</p>
          </div>
          <Switch checked disabled />
        </div>
      </CardContent>
    </Card>
  );
}
