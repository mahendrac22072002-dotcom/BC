import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/admin/theme")({
  head: () => ({ meta: [{ title: "Theme Builder" }] }),
  component: ThemeBuilder,
});

function ThemeBuilder() {
  const [colors, setColors] = useState({
    primary: "#000000",
    secondary: "#ffffff",
    accent: "#3b82f6",
  });

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Theme Builder</h1>
        <p className="text-sm text-zinc-500">Configure global styles, colors, and typography.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold">Colors</h2>
          
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-zinc-700">Primary Color</label>
              <div className="flex gap-2 mt-1">
                <input type="color" value={colors.primary} onChange={(e) => setColors({ ...colors, primary: e.target.value })} className="h-9 w-9 p-0 border-0 rounded cursor-pointer" />
                <Input value={colors.primary} onChange={(e) => setColors({ ...colors, primary: e.target.value })} className="font-mono text-xs uppercase" />
              </div>
            </div>
            
            <div>
              <label className="text-xs font-medium text-zinc-700">Secondary Color</label>
              <div className="flex gap-2 mt-1">
                <input type="color" value={colors.secondary} onChange={(e) => setColors({ ...colors, secondary: e.target.value })} className="h-9 w-9 p-0 border-0 rounded cursor-pointer" />
                <Input value={colors.secondary} onChange={(e) => setColors({ ...colors, secondary: e.target.value })} className="font-mono text-xs uppercase" />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-700">Accent Color</label>
              <div className="flex gap-2 mt-1">
                <input type="color" value={colors.accent} onChange={(e) => setColors({ ...colors, accent: e.target.value })} className="h-9 w-9 p-0 border-0 rounded cursor-pointer" />
                <Input value={colors.accent} onChange={(e) => setColors({ ...colors, accent: e.target.value })} className="font-mono text-xs uppercase" />
              </div>
            </div>
          </div>
          
          <Button className="mt-4 w-full">Save Theme Settings</Button>
        </div>
        
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="text-sm text-zinc-500">Live Preview</div>
            <div className="p-6 rounded-lg bg-white shadow-sm border border-zinc-200 space-y-4 w-[300px]">
              <div className="h-4 w-1/3 rounded" style={{ backgroundColor: colors.primary }}></div>
              <div className="h-3 w-3/4 rounded bg-zinc-200"></div>
              <div className="h-3 w-1/2 rounded bg-zinc-200"></div>
              <Button style={{ backgroundColor: colors.accent, color: '#fff' }} className="w-full mt-4">Accent Button</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
