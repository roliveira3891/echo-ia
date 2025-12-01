'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useLocale } from 'next-intl'
import { Button } from '@workspace/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu'
import { Globe } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'

/**
 * Cabeçalho da página de autenticação
 *
 * Exibe:
 * - Logo do projeto (Echo IA)
 * - Seletor de tema (claro/escuro)
 * - Seletor de idioma
 *
 * Funcionalidades:
 * - Tema persistido com next-themes
 * - Idioma sincronizado com URL routing
 * - Responsivo (sm: breakpoints)
 * - Dark mode completo
 *
 * @component
 * @example
 * <AuthHeader />
 */
export const AuthHeader = ({ isLoading = false }: { isLoading?: boolean }) => {
  const { setTheme } = useTheme()
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  /**
   * Muda o idioma alterando a URL locale
   * Remove o locale atual e adiciona o novo
   *
   * @param newLocale - 'en' ou 'pt-BR'
   */
  const changeLanguage = (newLocale: string) => {
    if (locale === newLocale) return

    // Remove o locale atual do pathname
    const pathWithoutLocale = pathname.replace(`/${locale}`, '')
    const newPath = `/${newLocale}${pathWithoutLocale || '/'}`

    router.push(newPath)
  }

  // Se está carregando, não mostra nada
  if (isLoading) {
    return null
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 py-4 sm:px-6 sm:py-6 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo - Esquerda */}
        <div className="flex items-center gap-2">
          {/* Ícone com as letras "EA" */}
          <div className="w-8 h-8 bg-blue-600 dark:bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">EA</span>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent dark:from-blue-400 dark:to-blue-300">
            Echo IA
          </span>
        </div>

        {/* Controles - Direita */}
        <div className="flex items-center gap-3">
          {/* Language Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-9 sm:size-10 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Alterar idioma"
              >
                <Globe className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="sr-only">Selecionar idioma</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                onClick={() => changeLanguage('pt-BR')}
                className={locale === 'pt-BR' ? 'bg-blue-50 dark:bg-blue-900/30' : ''}
              >
                <span className="flex items-center gap-2">
                  <span className="text-sm">🇧🇷</span>
                  Português (BR)
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => changeLanguage('en')}
                className={locale === 'en' ? 'bg-blue-50 dark:bg-blue-900/30' : ''}
              >
                <span className="flex items-center gap-2">
                  <span className="text-sm">🇬🇧</span>
                  English
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-9 sm:size-10 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Alterar tema"
              >
                <Sun className="h-4 w-4 sm:h-5 sm:w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 sm:h-5 sm:w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Alternar tema</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => setTheme('light')}>
                <span className="flex items-center gap-2">
                  <Sun className="h-4 w-4" />
                  Claro
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>
                <span className="flex items-center gap-2">
                  <Moon className="h-4 w-4" />
                  Escuro
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')}>
                <span className="flex items-center gap-2">
                  <span>⚙️</span>
                  Sistema
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
