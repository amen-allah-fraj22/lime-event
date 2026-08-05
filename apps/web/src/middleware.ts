import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/artists',
  '/artists/:id',
  '/explore/artists',
  '/explore/events',
]);

function signInUrlWithReturnBack(req: Request): string {
  const signIn = new URL('/sign-in', req.url);
  const requested = new URL(req.url);
  const returnPath = `${requested.pathname}${requested.search}`;
  if (returnPath && returnPath !== '/sign-in' && returnPath !== '/sign-up') {
    signIn.searchParams.set('redirect_url', returnPath);
  }
  return signIn.toString();
}

export default clerkMiddleware(
  async (auth, req) => {
    if (isPublicRoute(req)) return;

    await auth.protect({
      unauthenticatedUrl: signInUrlWithReturnBack(req),
    });
  },
  {
    signInUrl: '/sign-in',
    signUpUrl: '/sign-up',
  },
);

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
