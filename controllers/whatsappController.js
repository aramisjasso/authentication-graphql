const whatsAppClient = require("@green-api/whatsapp-api-client");

exports.sendWhatsMessage = async (phone, message) => {
    const restAPI = whatsAppClient.restAPI({
        idInstance: process.env.ID_INSTANCE,
        apiTokenInstance: process.env.API_TOKEN_INSTANCE,
    });

    phone = normalizeNumber(phone);

    restAPI.message.sendMessage(`${phone}@c.us`, null, message).then((data) => {
        console.log(data);
    });
}

function normalizeNumber(numero) {
  // Asegurarse de que comience con +52
  if (numero.startsWith('+52')) {
    // Si después de +52 no viene el 1, lo insertamos
    if (numero[3] !== '1') {
      return numero.slice(0, 3) + '1' + numero.slice(3);
    }
  }
  return numero;
}
