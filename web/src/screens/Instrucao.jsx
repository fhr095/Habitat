/*Caso queira forçar as resposta da IA:
1) Comente a linha  de chamada a função da requisição post: sendPostRequest(text); e chame uma função alternativa mockSendPostRequest(text)  conforme abaixo*/

function sendText(text) {
    console.log("Enviando mensagem:", text);
    //sendPostRequest(text);
    mockSendPostRequest(text).then(data => {
      console.log("Resposta recebida:", data);
      processServerCommands(data.comandos);
    });
  }

/*2) Implemente a função mockSendPostRequest*/

function mockSendPostRequest(text) {
    console.log("Simulando envio de mensagem:", text);
    
    // Simulação da resposta da API
    return Promise.resolve({
      comandos: [
        {
          texto: "O banheiro público mais próximo fica no andar térreo do Centro de Convivência.",
          fade: "Banheiro",
          audio: "https://storagemp3.blob.core.windows.net/markvoice/phrases/03c8120617466315.ogg?sv=2022-11-02&ss=bfqt&srt=sco&sp=rwdlacupiytfx&se=2024-09-02T01:12:15Z&st=2023-09-01T17:12:15Z&spr=https,http&sig=O8nmPDv%2BPYMxM72l1Lq7Dgrs5gz4mIMGplVCYRUBWS4%3D"
        }
      ]
    });
  }