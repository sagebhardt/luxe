import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublic = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/health",
  /* Token-gated client trip summaries — token validation happens
   * inside the route handler, not at middleware level. */
  "/share/(.*)",
  /* Vercel Cron triggers — handler validates the CRON_SECRET header. */
  "/api/cron/(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublic(req)) return;
  await auth.protect();
});

export const config = {
  matcher: [
    /* Skip Next.js internals and static files unless they're part of search params */
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    /* Always run for API routes */
    "/(api|trpc)(.*)",
  ],
};
