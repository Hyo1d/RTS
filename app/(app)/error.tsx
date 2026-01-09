"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="rounded-3xl border border-border/60 bg-card/80 p-6">
      <h2 className="text-lg font-semibold">Algo salio mal</h2>
      <p className="text-sm text-muted-foreground">
        Ocurrio un error al cargar esta seccion.
      </p>
      <Button className="mt-4" onClick={() => reset()}>
        Reintentar
      </Button>
    </div>
  );
}
