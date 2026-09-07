import { createFileRoute } from "@tanstack/react-router";
import { ComoMount } from "@/como-mount";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Como Pizza — The spirit of Italy" },
      {
        name: "description",
        content:
          "Como Pizza — o'tin pechida pishirilgan italyan pitsalari. Onlayn buyurtma bering va tez yetkazib berish xizmatidan foydalaning.",
      },
      { property: "og:title", content: "Como Pizza — The spirit of Italy" },
      {
        property: "og:description",
        content: "O'tin pechida pishirilgan italyan pitsalari. Onlayn buyurtma va tez yetkazib berish.",
      },
    ],
  }),
  component: ComoMount,
});
