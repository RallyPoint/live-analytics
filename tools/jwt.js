var jwt = require('jsonwebtoken');
var fs = require('fs');
// sign with RSA SHA256
var privateKey = fs.readFileSync('../ci/cert/local.key');
var token = jwt.sign({ userId: '24' }, privateKey, { algorithm: 'RS256'});
console.log(JSON.stringify({token}));
