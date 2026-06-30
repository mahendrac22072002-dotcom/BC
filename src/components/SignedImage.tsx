import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ImageIcon } from "lucide-react";

interface SignedImageProps {
  bucket: string;
  path: string | null | undefined;
  alt: string;
  className?: string;
  fallbackClassName?: string;
}

export function SignedImage({ bucket, path, alt, className, fallbackClassName }: SignedImageProps) {
  const { data: url } = useQuery({
    queryKey: ["signed-url", bucket, path],
    enabled: !!path,
    staleTime: 50 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path!, 60 * 60);
      if (error) throw error;
      return data.signedUrl;
    },
  });

  if (!path || !url) {
    return (
      <div
        className={
          "flex items-center justify-center bg-surface text-muted-foreground " +
          (fallbackClassName ?? className ?? "")
        }
        aria-hidden
      >
        <ImageIcon className="h-6 w-6 opacity-40" />
      </div>
    );
  }
  return <img src={url} alt={alt} className={className} loading="lazy" />;
}
