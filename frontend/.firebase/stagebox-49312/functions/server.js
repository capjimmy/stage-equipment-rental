const { onRequest } = require('firebase-functions/v2/https');
  const server = import('firebase-frameworks');
  exports.ssrstagebox49312 = onRequest({"region":"asia-northeast3"}, (req, res) => server.then(it => it.handle(req, res)));
  