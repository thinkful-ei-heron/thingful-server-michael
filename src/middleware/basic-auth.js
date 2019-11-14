const AuthService = require('../auth/auth-service');
const bcrypt = require('bcryptjs');

function requireAuth(req, res, next) {
  const authToken = req.get('Authorization') || '';
  const authFailure = { error: 'Unauthorized request' };

  let basicToken;
  if (!authToken.toLowerCase().startsWith('basic ')) {
    return res.status(401).json({ error: 'Missing basic token' });
  } else {
    basicToken = authToken.slice('basic '.length, authToken.length);
  }

  const [tokenUserName, tokenPassword] = AuthService.parseBasicToken(
    basicToken
  );

  if (!tokenUserName || !tokenPassword) {
    return res.status(401).json(authFailure);
  }

  const salt = bcrypt.genSaltSync(13);

  AuthService.getUserWithUserName(req.app.get('db'), tokenUserName)
    .then(user => {
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized request' });
      }
      return bcrypt.compare(tokenPassword, user.password).then(match => {
        if (!match) {
          return res.status(401).json(authFailure);
        }
        req.user = user;
        next();
      });
    })
    .catch(next);
}

module.exports = {
  requireAuth
};
