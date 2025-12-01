import {getRequestConfig} from 'next-intl/server';

export default getRequestConfig(async ({locale}) => {
  // Validar e definir locale padrão
  const validLocales = ['en', 'pt-BR'];
  const selectedLocale = locale && validLocales.includes(locale) ? locale : 'pt-BR';

  try {
    // Carregamento direto do arquivo JSON
    const messages = await import(`../messages/${selectedLocale}.json`);

    return {
      locale: selectedLocale,
      messages: messages.default
    };
  } catch (error) {
    console.error(`Erro ao carregar mensagens para locale: ${selectedLocale}`, error);

    // Fallback para português
    try {
      const fallbackMessages = await import('../messages/pt-BR.json');
      return {
        locale: 'pt-BR',
        messages: fallbackMessages.default
      };
    } catch (fallbackError) {
      console.error('Erro crítico ao carregar fallback', fallbackError);
      throw new Error('Não foi possível carregar as mensagens de tradução');
    }
  }
});