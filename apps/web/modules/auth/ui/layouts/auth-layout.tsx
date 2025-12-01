'use client'

import { AuthHeader } from '../components/auth-header'

/**
 * Layout para página de autenticação
 *
 * Exibe:
 * - Cabeçalho com logo, tema e idioma
 * - Componente de sign-in/sign-up do Clerk centralizado
 *
 * @component
 * @param {React.ReactNode} children - Conteúdo principal (Clerk SignIn/SignUp)
 * @example
 * <AuthLayout>
 *   <SignInView />
 * </AuthLayout>
 */
export const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen min-w-screen h-full w-full bg-white dark:bg-gray-950 transition-colors duration-300">
      {/* Cabeçalho fixo com logo, tema e idioma */}
      <AuthHeader />

      {/* Conteúdo principal - Centralizado com espaço para header */}
      <div className="flex flex-col items-center justify-center min-h-screen w-full px-4 pt-24 sm:pt-28 pb-8">
        {/* Container do conteúdo */}
        <div className="w-full max-w-md">
          {children}
        </div>

        {/* Rodapé opcional - Links ou info adicional */}
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white dark:from-gray-950 to-transparent pointer-events-none h-24" />
      </div>
    </div>
  );
};
