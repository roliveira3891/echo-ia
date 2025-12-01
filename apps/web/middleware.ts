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
  const potentialLocale = pathSegments[0];
  if (potentialLocale && VALID_LOCALES.includes(potentialLocale as any)) {
    return potentialLocale;
  }
  return DEFAULT_LOCALE;
}

export default clerkMiddleware(async (auth, req) => {
  // Proteger rotas privadas
  if (!isPublicRoute(req)) {
    await auth.protect();
  }

  const { userId, orgId } = await auth();
  const pathname = req.nextUrl.pathname;
  const searchParams = req.nextUrl.searchParams;

  // Extrair locale do pathname
  let locale = getLocaleFromPath(pathname);

  // Se o usuário fez login e tem query param ?locale=en,
  // usar esse locale em vez do que está na URL
  // Isso acontece quando Clerk redireciona para /pt-BR/conversations?locale=en
  if (userId) {
    const queryLocale = searchParams.get('locale');
    const cookieValue = req.cookies.get('preferred-locale')?.value;

    // DEBUG: Log para debug
    console.log(`[MW] pathname=${pathname}, userId=${userId}`);
    console.log(`[MW] queryLocale=${queryLocale}, cookieValue=${cookieValue}, urlLocale=${locale}`);

    if (queryLocale && VALID_LOCALES.includes(queryLocale as any)) {
      // Query param tem prioridade - foi explicitamente passado
      if (locale !== queryLocale) {
        console.log(`[MW] Query param locale diferente! urlLocale=${locale}, queryLocale=${queryLocale}`);
        // Se o locale do URL é diferente do query param, redirecionar para o correto
        const redirectUrl = new URL(`/${queryLocale}${pathname.replace(/^\/(en|pt-BR)/, '')}`, req.url);
        // Preservar query params sem o locale
        searchParams.forEach((value, key) => {
          if (key !== 'locale') {
            redirectUrl.searchParams.set(key, value);
          }
        });
        console.log(`[MW] Redirecting to correct locale: ${redirectUrl.toString()}`);
        return NextResponse.redirect(redirectUrl);
      }
      locale = queryLocale;
      console.log(`[MW] Using queryLocale: ${locale}`);
    } else if (cookieValue && VALID_LOCALES.includes(cookieValue as any)) {
      locale = cookieValue;
      console.log(`[MW] Using cookieValue: ${locale}`);
    }

    console.log(`[MW] Final locale: ${locale}`);
  }

  // Se o usuário está autenticado mas não tem organização,
  // redirecionar para seleção/criação de organização
  if (userId && !orgId && !isOrgFreeRoute(req)) {
    const redirectUrl = new URL(`/${locale}/org-selection`, req.url);
    redirectUrl.searchParams.set('redirectUrl', req.url);
    console.log(`[MW] Redirecting to org-selection: ${redirectUrl.toString()}`);
    return NextResponse.redirect(redirectUrl);
  }

  // Se o caminho é / e o usuário está autenticado,
  // redirecionar para conversations com o locale correto
  if (pathname === '/' && userId) {
    const redirectUrl = new URL(`/${locale}/conversations`, req.url);
    console.log(`[MW] Redirecting to conversations: ${redirectUrl.toString()}`);
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
