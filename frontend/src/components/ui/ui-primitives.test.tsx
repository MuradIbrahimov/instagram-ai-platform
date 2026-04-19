import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Toaster } from "@/components/ui/toaster";
import { Toast, ToastProvider, ToastViewport } from "@/components/ui/toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

describe("UI primitives", () => {
  it("render without console errors", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    render(
      <div>
        <Button>Action</Button>
        <Input placeholder="Type" />
        <Label htmlFor="field">Field</Label>
        <Badge>status</Badge>
        <Card>
          <CardHeader>
            <CardTitle>Title</CardTitle>
            <CardDescription>Description</CardDescription>
          </CardHeader>
          <CardContent>Body</CardContent>
          <CardFooter>Footer</CardFooter>
        </Card>
        <Separator />
        <Skeleton className="h-4 w-10" />
        <Avatar>
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
        <Dialog open>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dialog</DialogTitle>
              <DialogDescription>Dialog body</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
        <DropdownMenu open>
          <DropdownMenuTrigger asChild>
            <Button>Menu</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select value" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Option A</SelectItem>
          </SelectContent>
        </Select>
        <Switch defaultChecked />
        <TooltipProvider>
          <Tooltip open>
            <TooltipTrigger asChild>
              <Button>Hover</Button>
            </TooltipTrigger>
            <TooltipContent>Tooltip</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Textarea defaultValue="Body" />
        <ScrollArea className="h-16 w-20">
          <div className="h-40">Scrollable</div>
        </ScrollArea>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Header</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <ToastProvider>
          <Toast open>
            <div>Toast body</div>
          </Toast>
          <ToastViewport />
        </ToastProvider>
        <Toaster />
      </div>,
    );

    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
