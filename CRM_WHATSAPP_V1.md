# CRM PERSONAL · WHATSAPP · V1

Estado visual congelado.

## Alcance V1
- Solo mensajes nuevos pendientes.
- Filtros/grupos visibles solo cuando tienen mensajes: Todos, Familia, Amigos, Clientes.
- Mensaje de texto: mostrar remitente, teléfono, hora y texto.
- Audio: mostrar transcripción; no convertir la interfaz en un clon de WhatsApp.
- Respuesta inline desde la tarjeta.
- Estados de envío previstos: enviando, enviado, error.
- Sin historial persistente visible, sin agenda completa, sin notas CRM, sin paneles extra.

## Integración pendiente para AZOK
1. Mantener intacto WhatsApp→Telegram existente.
2. Conectar entrada real de Evolution/n8n a la bandeja V1.
3. Leer solo mensajes pendientes desde la memoria CRM/NocoDB.
4. Para audio, usar la transcripción ya generada por el flujo existente.
5. Exponer endpoint seguro de lectura para Vercel.
6. Exponer endpoint seguro de respuesta: Vercel → n8n → Evolution API → WhatsApp.
7. Resolver grupo/categoría de contacto sin mostrar grupos vacíos.
8. Marcar atendido para que desaparezca de la bandeja principal.
9. Validar con mensaje real, audio real y respuesta real sin duplicados.

## Regla
No rediseñar la UI V1 salvo instrucción expresa. Esta rama es el contrato visual aprobado.
