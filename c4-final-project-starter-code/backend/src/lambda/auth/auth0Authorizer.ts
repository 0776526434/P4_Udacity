import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { verify, decode } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
import Axios from 'axios'
import { Jwt } from '../../auth/Jwt'
import { JwtPayload } from '../../auth/JwtPayload'

const logger = createLogger('auth')

// TODO: Provide a URL that can be used to download a certificate that can be used
// to verify JWT token signature.
// To get this URL you need to go to an Auth0 page -> Show Advanced Settings -> Endpoints -> JSON Web Key Set
const jwksUrl = 'https://dev-czjhkn5i1cjf7qdq.us.auth0.com/.well-known/jwks.json'

export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const auth = getToken(authHeader);
  const jwt: Jwt = decode(auth, { complete: true }) as Jwt;

  const kid: string = jwt.header.kid;
  let reSpon = await Axios.get(jwksUrl);
  const publicKey: string = await getSigninKeys(reSpon.data.keys,kid);

  return verify(auth, publicKey, { algorithms: ['RS256'] }) as JwtPayload;
}

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header');

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header');

  const split = authHeader.split(' ');
  const auth = split[1];

  return auth;
}

function certToPEM(cert: string) {
  cert = cert.match(/.{1,64}/g).join('\n');
  cert = `-----BEGIN CERTIFICATE-----\n${cert}\n-----END CERTIFICATE-----\n`;
  return cert;
}

async function getSigninKeys(keys: any[], kid: string) {
  const signinKeys = keys
      .filter(key => key.use === 'sig' && key.kty === 'RSA' && key.kid && ((key.x5c && key.x5c.length) || (key.n && key.e)))
      .map(key => {
        return {
          kid: key.kid,
          nbf: key.nbf,
          publicKey: certToPEM(key.x5c[0])
        };
      });

  if (!signinKeys) {
    throw new Error('The JWKS endpoint did not contain any signing keys');
  }

  const signingKey = signinKeys.find(key => key.kid === kid);

  if (!signingKey) {
    throw new Error(`Key not found'${kid}'`);
  }

  return signingKey.publicKey;
}