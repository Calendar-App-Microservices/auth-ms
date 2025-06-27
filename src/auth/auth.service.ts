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

@Injectable()
export class AuthService {

  private readonly logger = new Logger('AuthService')

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
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
        },
      });

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

}
