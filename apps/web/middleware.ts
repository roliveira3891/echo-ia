import { NextRequest, NextResponse } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Rotas públicas que não requerem autenticação
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/(en|pt-BR)/sign-in(.*)',
  '/(en|pt-BR)/sign-up(.*)',
]);

// Rotas que não requerem organizaçao
const isOrgFreeRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/org-selection(.*)',
  '/(en|pt-BR)/sign-in(.*)',
  '/(en|pt-BR)/sign-up(.*)',
  '/(en|pt-BR)/org-selection(.*)',
]);

const VALID_LOCALES = ['en', 'pt-BR'] as const;
const DEFAULT_LOCALE = 'pt-BR';

/**
 * Extrai o locale válido da requisição
 */
function getLocaleFromPath(pathname: string): string {
  const pathSegments = pathname.split('/').filter(Boolean);
  const potentialLocale = pathSegments[0] || '';
  return VALID_LOCALES.includes(potentialLocale as any) ? potentialLocale : DEFAULT_LOCALE;
}

export default clerkMiddleware(async (auth, req) => {
  // Proteger rotas privadas
  if (!isPublicRoute(req)) {
    await auth.protect();
  }

  const { userId, orgId } = await auth();

  // Se o usuário está autenticado mas não tem organização,
  // redirecionar para seleção/criação de organização
  if (userId && !orgId && !isOrgFreeRoute(req)) {
    const locale = getLocaleFromPath(req.nextUrl.pathname);
    const redirectUrl = new URL(`/${locale}/org-selection`, req.url);
    redirectUrl.searchParams.set('redirectUrl', req.url);
    return NextResponse.redirect(redirectUrl);
  }

  return undefined;
});

export const config = {
  matcher: [
    /**
     * Matcher que cobre todas as páginas, exceto:
     * - Arquivos estáticos (_next, public)
     * - Arquivos com extensões específicas
     * - Endpoints do Next.js
     */
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
};
