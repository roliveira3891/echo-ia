#!/usr/bin/env node

/**
 * Script para verificar o webhook configurado no Telegram
 *
 * USO:
 * node check-telegram-webhook.js SEU_BOT_TOKEN
 *
 * Exemplo:
 * node check-telegram-webhook.js 1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
 */

const botToken = process.argv[2];

if (!botToken) {
  console.error('❌ Erro: Bot token não fornecido');
  console.error('');
  console.error('USO:');
  console.error('  node check-telegram-webhook.js SEU_BOT_TOKEN');
  console.error('');
  console.error('Exemplo:');
  console.error('  node check-telegram-webhook.js 1234567890:ABCdefGHIjklMNOpqrsTUVwxyz');
  process.exit(1);
}

async function checkWebhook() {
  try {
    console.log('🔍 Verificando webhook configurado no Telegram...\n');

    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/getWebhookInfo`
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Erro ao consultar Telegram API:');
      console.error(JSON.stringify(errorData, null, 2));
      process.exit(1);
    }

    const data = await response.json();
    const webhookInfo = data.result;

    console.log('✅ Informações do Webhook:\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`URL configurada:     ${webhookInfo.url || '(nenhuma)'}`);
    console.log(`Atualizações pendentes: ${webhookInfo.pending_update_count || 0}`);
    console.log(`Certificado customizado: ${webhookInfo.has_custom_certificate || false}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (webhookInfo.last_error_date) {
      const errorDate = new Date(webhookInfo.last_error_date * 1000);
      console.log('\n⚠️  ÚLTIMO ERRO:');
      console.log(`Data: ${errorDate.toISOString()}`);
      console.log(`Mensagem: ${webhookInfo.last_error_message}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }

    if (webhookInfo.pending_update_count > 0) {
      console.log(`\n⚠️  Existem ${webhookInfo.pending_update_count} mensagens pendentes!`);
      console.log('Isso significa que o Telegram tentou enviar mensagens mas falhou.');
    }

    console.log('\n📋 Resposta completa do Telegram API:');
    console.log(JSON.stringify(webhookInfo, null, 2));

    // Verificações
    console.log('\n\n🔎 DIAGNÓSTICO:\n');

    if (!webhookInfo.url) {
      console.log('❌ PROBLEMA: Nenhum webhook configurado!');
      console.log('   O bot não vai receber mensagens sem um webhook.');
    } else {
      console.log('✅ Webhook configurado');

      // Verificar se é o domínio correto
      if (webhookInfo.url.includes('echo-ia-web.vercel.app')) {
        console.log('❌ PROBLEMA: O webhook está apontando para o frontend (Vercel)!');
        console.log('   Deveria apontar para: https://disciplined-rooster-887.convex.cloud');
      } else if (webhookInfo.url.includes('disciplined-rooster-887.convex.cloud')) {
        console.log('✅ O webhook está apontando para o Convex (correto)');
      } else if (webhookInfo.url.includes('localhost')) {
        console.log('❌ PROBLEMA: O webhook está apontando para localhost!');
        console.log('   O Telegram não consegue acessar localhost. Use ngrok ou similar.');
      }
    }

    if (webhookInfo.last_error_message) {
      console.log(`\n⚠️  Há erros recentes no webhook:`);
      console.log(`   ${webhookInfo.last_error_message}`);

      if (webhookInfo.last_error_message.includes('ECONNREFUSED') ||
          webhookInfo.last_error_message.includes('Connection refused')) {
        console.log('\n   💡 Isso significa que o Telegram não conseguiu conectar no servidor.');
      } else if (webhookInfo.last_error_message.includes('404')) {
        console.log('\n   💡 Endpoint não encontrado (404). Verifique se o endpoint /webhooks/telegram existe.');
      } else if (webhookInfo.last_error_message.includes('401') ||
                 webhookInfo.last_error_message.includes('403')) {
        console.log('\n   💡 Erro de autenticação. Verifique se o token no webhook está correto.');
      }
    }

  } catch (error) {
    console.error('❌ Erro ao executar script:', error.message);
    process.exit(1);
  }
}

checkWebhook();
