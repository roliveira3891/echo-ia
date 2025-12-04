#!/usr/bin/env node

/**
 * Script para CORRIGIR o webhook do Telegram
 *
 * USO:
 * node fix-telegram-webhook.js SEU_BOT_TOKEN
 *
 * Exemplo:
 * node fix-telegram-webhook.js 8190283185:AAH...
 */

const botToken = process.argv[2];

if (!botToken) {
  console.error('❌ Erro: Bot token não fornecido');
  console.error('');
  console.error('USO:');
  console.error('  node fix-telegram-webhook.js SEU_BOT_TOKEN');
  console.error('');
  console.error('Exemplo:');
  console.error('  node fix-telegram-webhook.js 8190283185:AAH...');
  process.exit(1);
}

const CORRECT_WEBHOOK_URL = 'https://disciplined-rooster-887.convex.cloud/webhooks/telegram?token=M8TxRTU7xCU56PmfVdRolGrdRdNuuE7f';

async function fixWebhook() {
  try {
    console.log('🔧 Corrigindo webhook do Telegram...\n');

    // 1. Verificar webhook atual
    console.log('1️⃣  Verificando webhook atual...');
    const checkResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/getWebhookInfo`
    );

    if (!checkResponse.ok) {
      const errorData = await checkResponse.json();
      console.error('❌ Erro ao consultar Telegram API:');
      console.error(JSON.stringify(errorData, null, 2));
      process.exit(1);
    }

    const currentData = await checkResponse.json();
    const currentWebhook = currentData.result;

    console.log(`   URL atual: ${currentWebhook.url || '(nenhuma)'}`);
    console.log(`   Pendentes: ${currentWebhook.pending_update_count || 0}`);
    console.log('');

    // 2. Configurar novo webhook
    console.log('2️⃣  Configurando webhook correto...');
    console.log(`   Nova URL: ${CORRECT_WEBHOOK_URL}`);
    console.log('');

    const setResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/setWebhook`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: CORRECT_WEBHOOK_URL,
          allowed_updates: ['message', 'edited_message'],
          drop_pending_updates: true, // Limpar mensagens antigas
        }),
      }
    );

    if (!setResponse.ok) {
      const errorData = await setResponse.json();
      console.error('❌ Erro ao configurar webhook:');
      console.error(JSON.stringify(errorData, null, 2));
      process.exit(1);
    }

    const setData = await setResponse.json();

    if (setData.ok && setData.result) {
      console.log('✅ Webhook configurado com sucesso!\n');
    } else {
      console.error('❌ Falha ao configurar webhook:');
      console.error(JSON.stringify(setData, null, 2));
      process.exit(1);
    }

    // 3. Verificar novamente
    console.log('3️⃣  Verificando configuração final...');
    const verifyResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/getWebhookInfo`
    );

    if (!verifyResponse.ok) {
      console.error('❌ Erro ao verificar webhook final');
      process.exit(1);
    }

    const verifyData = await verifyResponse.json();
    const finalWebhook = verifyData.result;

    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 WEBHOOK CONFIGURADO:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`URL: ${finalWebhook.url}`);
    console.log(`Pendentes: ${finalWebhook.pending_update_count || 0}`);
    console.log(`IP: ${finalWebhook.ip_address || 'N/A'}`);
    console.log(`Max Conexões: ${finalWebhook.max_connections || 'N/A'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (finalWebhook.url === CORRECT_WEBHOOK_URL) {
      console.log('\n✅ SUCESSO! Webhook configurado corretamente.');
      console.log('\n📱 Agora você pode enviar uma mensagem no Telegram e deve receber resposta.');
    } else {
      console.log('\n⚠️  Atenção: A URL configurada não é a esperada.');
    }

  } catch (error) {
    console.error('❌ Erro ao executar script:', error.message);
    process.exit(1);
  }
}

fixWebhook();
