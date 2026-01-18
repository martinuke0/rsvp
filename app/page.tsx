"use client";

import { useState, useRef } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Dynamically import PDFViewer to avoid SSR issues with PDF.js
const PDFViewer = dynamic(() => import("@/components/pdf/PDFViewer"), {
  ssr: false,
});

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-2xl space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-4xl">RSVP Speed Reader</CardTitle>
            <CardDescription className="text-lg">
              Read faster with precise focal point guidance and customizable speed control
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button size="lg" onClick={handleUploadClick}>
              Upload PDF
            </Button>
          </CardContent>
        </Card>

        <PDFViewer file={selectedFile} />
      </div>
    </div>
  );
}
