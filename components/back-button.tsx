"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export function BackButton() {
  const router = useRouter();
  
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => router.back()}
      className="mb-3 sm:mb-4 hover:bg-secondary/50 hover:text-primary transition-colors min-h-[44px]"
    >
      <ArrowLeft className="mr-2 h-4 w-4" />
      Back to Albums
    </Button>
  );
}