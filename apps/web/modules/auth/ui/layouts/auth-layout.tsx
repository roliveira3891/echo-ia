'use client'

import { useEffect, useState } from 'react'
import { AuthHeader } from '../components/auth-header'

/**
 * Layout para página de autenticação
 *
 * Exibe:
 * - Cabeçalho com logo, tema e idioma (escondido durante carregamento do Clerk)
 * - Componente de sign-in/sign-up do Clerk centralizado
 * - Loading spinner centralizado
 *
 * Comportamento:
 * - Detecta quando o Clerk está carregando
 * - Esconde header enquanto Clerk carrega
 * - Centraliza o loading do Clerk
 *
 * @component
 * @param {React.ReactNode} children - Conteúdo principal (Clerk SignIn/SignUp)
 * @example
 * <AuthLayout>
 *   <SignInView />
 * </AuthLayout>
 */
export const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  const [isClerkLoading, setIsClerkLoading] = useState(true)

  useEffect(() => {
    // Aguarda um pouco para o Clerk carregar
    const timer = setTimeout(() => {
      // Verifica se o Clerk terminou de carregar
      const clerkElement = document.querySelector('[data-clerk-loaded]')
      if (clerkElement) {
        setIsClerkLoading(false)
      } else {
        // Se ainda não carregou, tenta novamente
        const observer = new MutationObserver(() => {
          setIsClerkLoading(false)
          observer.disconnect()
        })

        const formElement = document.querySelector('[data-clerk-form]')
        if (formElement) {
          observer.observe(formElement, { childList: true, subtree: true })
          setIsClerkLoading(false)
        }
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen min-w-screen h-full w-full bg-white dark:bg-gray-950 transition-colors duration-300">
      {/* Cabeçalho fixo com logo, tema e idioma - escondido durante carregamento */}
      <AuthHeader isLoading={isClerkLoading} />

      {/* Conteúdo principal - Centralizado com espaço para header */}
      <div className="flex flex-col items-center justify-center min-h-screen w-full px-4 py-8">
        {/* Container do conteúdo - maior para acomodar melhor o formulário */}
        <div className="w-full max-w-lg">
          {/* Wrapper para centralizar loading do Clerk */}
          <div className="flex flex-col items-center justify-center">
            {children}
          </div>
        </div>

        {/* Rodapé opcional - Links ou info adicional */}
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white dark:from-gray-950 to-transparent pointer-events-none h-24" />
      </div>
    </div>
  );
};
