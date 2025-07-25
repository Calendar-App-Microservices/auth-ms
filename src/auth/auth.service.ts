import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { CreateUserDto, LoginUserDto } from './dto';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma-setup/prisma.service';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { JwtService } from '@nestjs/jwt';
import { envs } from '../config';
import { PaginationDto } from './common';
import { MailService } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { ConfirmAccountDto } from './dto/confirm-account.dto';

@Injectable()
export class AuthService {

  private readonly logger = new Logger('AuthService')

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
     private readonly configService: ConfigService,
  ) { }


  async signJWT(payload: JwtPayload) {
    return this.jwtService.sign(payload);
  }


  async verifyToken(token: string) {
    try {
      const { sub, iat, exp, ...user } = this.jwtService.verify(token, {
        secret: envs.jwtSecret,
      });

      return {
        user: user,
        token: await this.signJWT(user),
      }

    } catch (error) {
      console.log(error);
      throw new RpcException({
        status: 401,
        message: 'Invalid token'
      })
    }

  }

  async createUser(createUserDto: CreateUserDto) {

    try {
      const { password, ...userData } = createUserDto;

      const user = await this.prisma.users.findUnique({
        where: {
          email: userData.email,
        },
      });
      if (user) {
        throw new RpcException({
          status: 400,
          message: 'User already exists',
        });
      }

      const newUser = await this.prisma.users.create({
        data: {
          ...userData,
          password: bcrypt.hashSync(password, 10), // Hash the password
          verified: false, 
        },
      });

          // Generar token de confirmación (JWT)
      const confirmationToken = this.jwtService.sign(
        { userId: newUser.id, purpose: 'confirm-account' },
        { expiresIn: '1h' },
      );


      // Enviar correo de confirmación
      const confirmLink = `${this.configService.get('frontendUrl')}/confirm?token=${confirmationToken}`;
      await this.mailService.sendConfirmationEmail(newUser.email, confirmLink);

      const { password: __, ...rest } = newUser; // Exclude password from the response
      // Firma el token usando el id y otros datos relevantes
      return {
        user: rest,
        token: await this.signJWT(rest),
      };
    } catch (error) {
      throw new RpcException({
        status: 400,
        message: error.message,
      });
    }
  }

    async confirmAccount({ token }: ConfirmAccountDto) {
    try {
      // Validar el token JWT
      const payload = this.jwtService.verify(token);
      if (payload.purpose !== 'confirm-account') {
        throw new RpcException({
          status: 400,
          message: 'Invalid token purpose',
        });
      }

      // Buscar al usuario
      const user = await this.prisma.users.findUnique({
        where: { id: payload.userId },
      });
      if (!user) {
        throw new RpcException({
          status: 404,
          message: 'User not found',
        });
      }
      if (user.verified) {
        throw new RpcException({
          status: 400,
          message: 'Account already verified',
        });
      }

      // Marcar el usuario como verificado
      await this.prisma.users.update({
        where: { id: user.id },
        data: { verified: true },
      });

      return { message: 'Account confirmed successfully' };
    } catch (error) {
      throw new RpcException({
        status: 400,
        message: error.message || 'Invalid or expired token',
      });
    }
  }

  async loginUser(loginUserDto: LoginUserDto) {

    const { email, password } = loginUserDto;

    try {

      const user = await this.prisma.users.findUnique({
        where: { email },
      });

      if (!user) {
        throw new RpcException({
          status: 400,
          message: 'Invalid credentials',
        });
      }

      const isPasswordValid = bcrypt.compareSync(password, user.password);

      if (!isPasswordValid) {
        throw new RpcException({
          status: 400,
          message: 'Invalid credentials',
        });
      }

      const { password: __, ...rest } = user; // Exclude password from the response

      return {
        user: rest,
        token: await this.signJWT( rest ),
      };

    } catch (error) {
      throw new RpcException({
        status: 400,
        message: error.message,
      });
    }
  }

  async getUser(id: string) {
    try {
      const user = await this.prisma.users.findUnique({
        where: { id },
        select: { id: true, email: true, name: true },
      });

      if (!user) {
        throw new RpcException({
          status: 404,
          message: 'User not found',
        });
      }

      return user;
    } catch (error) {
      throw new RpcException({
        status: 400,
        message: error.message,
      });
    }
  }

  async getAllUsers(paginationDto: PaginationDto) {

    try {
    const { page, limit } = paginationDto;

    const totalPages = await this.prisma.users.count({where : { available: true} });
    const lastPage = Math.ceil(totalPages / limit);
    
    return {
      data: await this.prisma.users.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where: { available: true },
        select: { name: true, email: true, available: true, createdAt: true }
      }),
      meta: {
        total: totalPages,
        page: page,
        lastPage: lastPage,
      }
    }
   } catch (error) {
      throw new RpcException({
        status: 400,
        message: error.message,
      });
    }
    }


  async updateUser(id: string, updateUserDto: UpdateUserDto) {
    const { email, name, password } = updateUserDto;

    try {
      const user = await this.prisma.users.findUnique({ where: { id } });
      if (!user) {
        throw new RpcException({
          status: 404,
          message: 'User not found',
        });
      }

      const data: any = {};
      if (email) data.email = email;
      if (name) data.name = name;
      if (password) data.password = await bcrypt.hash(password, 10);


      const updatedUser = await this.prisma.users.update({
        where: { id },
        data,
        select: { id: true, email: true, name: true },
      });

      return updatedUser;
    } catch (error) {
      throw new RpcException({
        status: 400,
        message: error.message,
      });
    }
  }

  async deleteUser(id: string) {
    try {
      const user = await this.prisma.users.findUnique({ where: { id } });
      if (!user) {
        throw new RpcException({
          status: 404,
          message: 'User not found',
        });
      }

      await this.prisma.users.delete({ where: { id } });
      return { message: 'User deleted successfully' };
    } catch (error) {
      throw new RpcException({
        status: 400,
        message: error.message,
      });
    }
  }


  /*

    async forgotPassword({ email }: ForgotPasswordDto) {
    const user = await this.prisma.users.findUnique({
      where: { email },
    });

    if (!user) {
      throw new RpcException({
        status: 404,
        message: 'User not found',
      });
    }

    // Generar un token JWT
    const token = jwt.sign(
      { userId: user.id },
      this.configService.get('JWT_SECRET'),
      { expiresIn: '1h' },
    );

    // Guardar el token en la base de datos
    await this.prisma.resetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hora
      },
    });

    // Enviar correo con el enlace de restablecimiento
    const resetLink = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${token}`;
    await this.mailService.sendPasswordResetEmail(user.email, resetLink);

    return { message: 'Password reset link sent' };
  }*/

    /*
  async resetPassword({ token, password }: ResetPasswordDto) {
    // Buscar el token en la base de datos
    const resetToken = await this.prisma.resetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
      throw new RpcException({
        status: 400,
        message: 'Invalid or expired token',
      });
    }

    // Validar el token JWT
    try {
      jwt.verify(token, this.configService.get('JWT_SECRET'));
    } catch {
      throw new RpcException({
        status: 400,
        message: 'Invalid token',
      });
    }

    // Actualizar la contraseña
    await this.prisma.users.update({
      where: { id: resetToken.userId },
      data: { password: bcrypt.hashSync(password, 10) },
    });

    // Marcar el token como usado
    await this.prisma.resetToken.update({
      where: { id: resetToken.id },
      data: { used: true },
    });

    return { message: 'Password reset successfully' };
  }*/

}
