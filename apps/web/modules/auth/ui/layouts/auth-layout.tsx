'use client'

import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import { AuthHeader } from '../components/auth-header'

/**
 * Layout para página de autenticação
 *
 * Exibe:
 * - Cabeçalho com logo, tema e idioma
 * - Componente de sign-in/sign-up do Clerk centralizado
 * - Loading spinner centralizado
 *
 * Comportamento:
 * - Header sempre visível (logo, tema e idioma)
 * - Clerk carrega no centro da página
 * - Monitora autenticação e redireciona para locale correto
 * - Salva locale em localStorage para persistência
 *
 * @component
 * @param {React.ReactNode} children - Conteúdo principal (Clerk SignIn/SignUp)
 * @example
 * <AuthLayout>
 *   <SignInView />
 * </AuthLayout>
 */
export const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  const locale = useLocale()
  const [clerkReady, setClerkReady] = useState(false)

  // Guardar locale em localStorage para sincronizar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth-locale', locale)
    }
  }, [locale])

  useEffect(() => {
    // Aguarda o Clerk renderizar
    // Clerk adiciona elementos ao DOM quando está pronto
    const checkClerkReady = () => {
      // Procura pelo elemento principal do Clerk (SignIn/SignUp card)
      const clerkCard = document.querySelector('[class*="cl-"]')
      if (clerkCard) {
        setClerkReady(true)
        return true
      }
      return false
    }

    // Primeira verificação imediata
    if (checkClerkReady()) {
      return
    }

    // Se não encontrou, usa observer para detectar quando o Clerk renderiza
    const observer = new MutationObserver(() => {
      if (checkClerkReady()) {
        observer.disconnect()
      }
    })

    observer.observe(document.body, { childList: true, subtree: true })

    // Timeout de segurança: mostra o header em 2 segundos mesmo que Clerk não carregue
    const timeout = setTimeout(() => {
      setClerkReady(true)
      observer.disconnect()
    }, 2000)

    return () => {
      clearTimeout(timeout)
      observer.disconnect()
    }
  }, [])

  return (
    <div className="min-h-screen min-w-screen h-full w-full bg-white dark:bg-gray-950 transition-colors duration-300">
      {/* Cabeçalho fixo com logo, tema e idioma */}
      {/* <AuthHeader /> */}

      {/* Conteúdo principal - Centralizado */}
      <div className="flex flex-col items-center justify-center min-h-screen w-full px-4 pt-24 sm:pt-28 pb-8">
        {/* Container do conteúdo */}
        <div className="w-full max-w-lg">
          {/* Wrapper para centralizar Clerk */}
          <div className="flex flex-col items-center justify-center">
            {clerkReady && children}
            {!clerkReady && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin">
                  <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rodapé opcional */}
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white dark:from-gray-950 to-transparent pointer-events-none h-24" />
      </div>
    </div>
  );
};
