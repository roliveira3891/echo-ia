'use client';

import { SignIn } from "@clerk/nextjs";
import { useLocale } from 'next-intl';
import { useEffect } from 'react';

/**
 * Componente de visualização do sign-in do Clerk
 *
 * Exibe o formulário de autenticação do Clerk com:
 * - Estilização personalizada (light/dark mode)
 * - Tamanho otimizado para melhor legibilidade
 * - Cores e espaçamento consistentes com o design do projeto
 * - Suporte a múltiplas estratégias de autenticação (OAuth, email/senha)
 * - Redirecionamento pós-login para locale correto
 *
 * Funcionalidades:
 * - Salva o locale atual em cookie antes do login
 * - Clerk redireciona para /, middleware lê o cookie
 * - Usuário é redirecionado para /[locale]/conversations
 *
 * @component
 * @example
 * <SignInView />
 *
 * @note
 * O componente SignIn do Clerk gerencia:
 * - Validação de email/senha
 * - Fluxo OAuth (Google, GitHub, etc)
 * - Redirecionamento pós-autenticação
 * - Sessões e tokens JWT
 *
 * @warning
 * Não modifique a prop `routing="hash"` sem atualizar a configuração
 * de middleware e i18n routing do Next.js
 */
export const SignInView = () => {
  const locale = useLocale();

  // Salvar o locale atual em cookie quando o componente monta
  useEffect(() => {
    // Garante que o locale correto está no cookie para quando o Clerk redirecionar
    document.cookie = `preferred-locale=${locale}; path=/; max-age=31536000; SameSite=Lax`;
  }, [locale]);

  return (
    <SignIn
      routing="hash"
      appearance={{
        elements: {
          // Container principal - aumentado para melhor espaço
          card: "bg-white dark:bg-gray-900 shadow-lg rounded-xl border border-gray-200 dark:border-gray-800 w-full",
          cardBox: "shadow-none",

          // Headers e títulos
          headerTitle: "text-3xl font-bold text-gray-900 dark:text-white",
          headerSubtitle:
            "text-base text-gray-600 dark:text-gray-400 mt-2 mb-6",

          // Form fields (inputs)
          formFieldInput:
            "bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors h-12 text-base",
          formFieldLabel:
            "text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2",

          // Botões
          formButtonPrimary:
            "bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors h-12 text-base",
          formResendCodeButton:
            "text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-base font-semibold",

          // Divisor e alternativas
          dividerLine: "bg-gray-200 dark:bg-gray-700",
          dividerText:
            "text-gray-600 dark:text-gray-400 text-base font-medium",

          // Botões sociais/OAuth
          socialButtonsBlockButton:
            "bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors h-12 text-base",

          // Links
          footerActionLink:
            "text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold text-base",

          // Mensagens de erro
          alertText: "text-red-600 dark:text-red-400 text-base",

          // Spinner (carregando)
          spinner: "text-blue-600 dark:text-blue-400",

          // Ícones
          socialButtonIcon: "opacity-80",
        },
        variables: {
          // Cores base
          colorPrimary: "#2563eb", // blue-600
          colorDanger: "#dc2626", // red-600
          colorSuccess: "#059669", // green-600
          colorWarning: "#f59e0b", // amber-600
          colorNeutral: "#6b7280", // gray-500
          colorText: "#111827", // gray-900
          colorTextSecondary: "#6b7280", // gray-500

          // Espaçamento - aumentado
          spacingUnit: "12px",

          // Bordas
          borderRadius: "0.5rem",

          // Fontes - aumentado
          fontSize: "1rem",
          fontFamily: "system-ui, -apple-system, sans-serif",

          // Dark mode
          colorBackground: "#ffffff",
          colorInputBackground: "#f9fafb",
          colorInputText: "#111827",
        },
      }}
    />
  );
};
 