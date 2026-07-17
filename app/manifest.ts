import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Museum Adventure",
    short_name: "Museum Adventure",
    description: "A portable creative adventure for any art museum.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f6f0e4",
    theme_color: "#173f67",
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}

