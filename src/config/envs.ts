import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars {
    PORT: number;

    NATS_SERVERS: string[];

    JWT_SECRET: string;

    MAIL_HOST: string;
  
    MAIL_PORT: number;
  
    MAIL_USER: string;
    
    MAIL_PASS: string;
    
    FRONTEND_URL: string;
}

const envsSchema = joi.object({
    PORT: joi.number().required(),

    NATS_SERVERS: joi.array().items(joi.string()).required(),

    JWT_SECRET: joi.string().required(),

    MAIL_HOST: joi.string().required(),
  
    MAIL_PORT: joi.number().required(),
  
    MAIL_USER: joi.string().required(),
  
    MAIL_PASS: joi.string().required(),
  
    FRONTEND_URL: joi.string().uri().required(),
})
.unknown(true);

const { error, value } = envsSchema.validate({ 
    ...process.env,
    NATS_SERVERS: process.env.NATS_SERVERS?.split(',')
 });

if ( error ) {
    throw new Error (`Config validation error: ${ error.message }`);
}

const envVars: EnvVars = value;

export const envs = {
    port: envVars.PORT,

    natsServers: envVars.NATS_SERVERS,

    jwtSecret: envVars.JWT_SECRET,
    
    mailHost: envVars.MAIL_HOST,
  
    mailPort: envVars.MAIL_PORT,
  
    mailUser: envVars.MAIL_USER,
  
    mailPass: envVars.MAIL_PASS,
  
    frontendUrl: envVars.FRONTEND_URL,
}
