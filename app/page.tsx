import { auth } from "@clerk/nextjs/server";
import GameClient from "./game-client";

export default async function Home() {
  const { userId } = await auth.protect();

  return <GameClient clerkUserId={userId} />;
}
