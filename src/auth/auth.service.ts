import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma-setup/prisma.service';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { JwtService } from '@nestjs/jwt';
import { envs } from '../config';
import { PaginationDto } from './common';
import { MailService } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { CreateUserDto, ConfirmAccountDto, LoginUserDto, ChangePasswordDto, ForgotPasswordDto, ResetPasswordDto } from './dto';

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

 // CAMBIO de contraseña con clave antigua
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new RpcException({ status: 404, message: 'User not found' });

    const valid = await bcrypt.compare(dto.oldPassword, user.password);
    if (!valid) throw new RpcException({ status: 400, message: 'Old password is incorrect' });

    if (dto.oldPassword === dto.newPassword)
      throw new RpcException({ status: 400, message: 'New password must be different' });

    await this.prisma.users.update({
      where: { id: userId },
      data: {
        password: await bcrypt.hash(dto.newPassword, 10),
        passwordChangedAt: new Date(),
      },
    });

    return { message: 'Password changed successfully' };
  }

  // Enviar email de reset password
  async forgotPassword({ email }: ForgotPasswordDto) {
    const user = await this.prisma.users.findUnique({ where: { email } });
    // Nunca revelar si el email existe
    if (!user) {
      return { message: 'If this email is registered, a password reset link will be sent.' };
    }

    const token = this.jwtService.sign(
      {
        userId: user.id,
        purpose: 'reset-password',
      },
      { expiresIn: '1h', secret: envs.jwtSecret }
    );

    const resetLink = `${envs.frontendUrl}/reset-password?token=${token}`;
    this.mailService.sendPasswordResetEmail(user.email, resetLink)
      .catch(e => this.logger.error('Error sending password reset email:', e));

    return { message: 'If this email is registered, a password reset link will be sent.' };
  }

  // Reset de contraseña por token
  async resetPassword({ token, newPassword }: ResetPasswordDto) {
    let payload: any;
    try {
      payload = this.jwtService.verify(token, { secret: envs.jwtSecret });
    } catch (error) {
      throw new RpcException({ status: 400, message: 'Invalid or expired token' });
    }

    if (payload.purpose !== 'reset-password') {
      throw new RpcException({ status: 400, message: 'Invalid token purpose' });
    }

    const user = await this.prisma.users.findUnique({ where: { id: payload.userId } });
    if (!user) throw new RpcException({ status: 404, message: 'User not found' });

    // Extra seguridad: token ya no válido si password fue cambiada después de su emisión
    if (user.passwordChangedAt && payload.iat * 1000 < user.passwordChangedAt.getTime()) {
      throw new RpcException({ status: 400, message: 'Token is no longer valid (password was already changed).' });
    }

    await this.prisma.users.update({
      where: { id: user.id },
      data: {
        password: await bcrypt.hash(newPassword, 10),
        passwordChangedAt: new Date(),
      },
    });

    return { message: 'Password reset successfully' };
  }

}
