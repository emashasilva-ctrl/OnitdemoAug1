"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { categories } from "@/lib/data/categories";

export function HeroSearch({ areas }: { areas: string[] }) {
  const router = useRouter();
  const [category, setCategory] = useState<string>("");
  const [area, setArea] = useState<string>("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (area) params.set("area", area);
    router.push(`/beauty/salons${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full flex-col gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm sm:flex-row sm:items-center sm:rounded-full sm:p-2"
    >
      <Select value={category} onValueChange={setCategory}>
        <SelectTrigger className="w-full border-none shadow-none sm:w-56 sm:flex-1">
          <SelectValue placeholder="What are you looking for?" />
        </SelectTrigger>
        <SelectContent>
          {categories.map((c) => (
            <SelectItem key={c.slug} value={c.slug}>
              {c.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="hidden h-8 w-px bg-border sm:block" aria-hidden="true" />

      <Select value={area} onValueChange={setArea}>
        <SelectTrigger className="w-full border-none shadow-none sm:w-48 sm:flex-1">
          <SelectValue placeholder="Colombo area" />
        </SelectTrigger>
        <SelectContent>
          {areas.map((a) => (
            <SelectItem key={a} value={a}>
              {a}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button type="submit" size="lg" className="w-full gap-2 rounded-full sm:w-auto">
        <Search className="size-4" />
        Find Salons
      </Button>
    </form>
  );
}
