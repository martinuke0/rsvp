"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-4xl">RSVP Speed Reader</CardTitle>
          <CardDescription className="text-lg">
            Read faster with precise focal point guidance and customizable speed control
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button size="lg">Upload PDF</Button>
        </CardContent>
      </Card>
    </div>
  );
}
