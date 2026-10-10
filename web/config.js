/* Configuracao do site. Editavel; o servidor (pipeline/servidor.py) substitui este arquivo automaticamente.
   modo "local":  le os arquivos de web/dados (funciona sem servidor e sem internet).
   modo "api":    le da API em apiBase (ver docs/api_contrato.md) e, se ela falhar, cai para os arquivos locais.
   pesquisaRemota: true  => a frase digitada e enviada a {apiBase}/pesquisar. Isso muda o aviso de privacidade na tela;
                            por seguranca, frases com sinal de violencia NUNCA sao enviadas. */
window.MISM3_CONFIG = {
  modo: "local",
  apiBase: "/api",
  pesquisaRemota: false,
  pesquisaDestino: "",   // nome do servico externo que recebe a frase (aparece no aviso de privacidade)
  usarLocalSeApiFalhar: true
};
