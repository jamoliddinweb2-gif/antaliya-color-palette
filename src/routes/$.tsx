import { createFileRoute } from "@tanstack/react-router";
import { ComoMount } from "@/como-mount";

export const Route = createFileRoute("/$")({
  head: () => ({
    meta: [
      { title: "Como Pizza — Buyurtma" },
      {
        name: "description",
        content: "Como Pizza onlayn do'koni: menyu, savat, buyurtmalar va yetkazib berish.",
      },
      { property: "og:title", content: "Como Pizza — Buyurtma" },
      {
        property: "og:description",
        content: "Como Pizza onlayn do'koni: menyu, savat, buyurtmalar va yetkazib berish.",
      },
    ],
  }),
  component: ComoMount,
});
