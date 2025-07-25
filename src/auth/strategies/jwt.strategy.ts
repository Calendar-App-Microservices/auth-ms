import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma-setup/prisma.service';
import { Users } from '@prisma/client';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()


export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor( private readonly prisma: PrismaService ) 
    
    {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET, 
    });
  }

 // Validación de JWT 
 async validate(payload: JwtPayload): Promise<Users> {
  const { id } = payload;

  // Buscar al usuario por el ID en el payload
  const user = await this.prisma.users.findUnique({
    where: { id },
  });
  
  if (!user) {
    throw new UnauthorizedException('Token not valid');
  }

  return {...user, verified: payload.verified}; // Retorna el usuario encontrado (automáticamente será adjuntado al request)
}
}