import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SettingsPage(): React.JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Workspace Settings</CardTitle>
        <CardDescription>Configure timezone, roles, and automation defaults.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Settings controls will be added in the next milestone.</p>
      </CardContent>
    </Card>
  );
}
