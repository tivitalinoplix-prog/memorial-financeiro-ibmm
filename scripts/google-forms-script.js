// SCRIPT DO GOOGLE FORMS
// Cole isso no Editor de Script do formulário do IBMM
// 1. No Google Forms, vá nos 3 pontinhos (Mais) no canto superior direito
// 2. Clique em "Editor de script"
// 3. Apague o que estiver lá e cole esse código
// 4. Salve e clique em "Acionadores" (ícone do reloginho na esquerda)
// 5. Adicione um Acionador: Selecione a função "onSubmit", Evento "Ao enviar o formulário"
// 6. Aceite as permissões do Google.

const WEBHOOK_URL = 'https://sua-url-no-vercel.vercel.app/api/webhook/forms';
const WEBHOOK_SECRET = 'ibmm-forms-token-2026'; // Deve bater com o FORMS_WEBHOOK_SECRET do Vercel

function onSubmit(e) {
  try {
    const responses = e.response.getItemResponses();
    const data = {};
    
    // Mapeie os títulos das perguntas do formulário para os campos do banco
    responses.forEach(function(response) {
      const title = response.getItem().getTitle();
      const answer = response.getResponse();
      
      if (title.includes("Data")) data.date = answer;
      else if (title.includes("Descrição") || title.includes("Título")) data.description = answer;
      else if (title.includes("Valor")) data.amount = answer;
      else if (title.includes("Tipo")) data.type = answer; // Entrada ou Saída
      else if (title.includes("Categoria")) data.category = answer;
      else if (title.includes("Conta")) data.account = answer;
    });

    const payload = {
      date: data.date,
      description: data.description,
      amount: data.amount,
      type: data.type,
      category: data.category,
      account: data.account,
      secret_token: WEBHOOK_SECRET
    };

    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload)
    };

    UrlFetchApp.fetch(WEBHOOK_URL, options);
    
  } catch (err) {
    console.error("Erro no Webhook do Forms: " + err);
  }
}
