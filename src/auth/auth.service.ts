import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { CreateUserDto, LoginUserDto } from './dto';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma-setup/prisma.service';


@Injectable()
export class AuthService {

    private readonly logger = new Logger('AuthService')

   constructor(private readonly prisma: PrismaService) {}


  async createUser(createUserDto: CreateUserDto) {
    const { email, name, password } = createUserDto;

    try {
      const user = await this.prisma.user.findUnique({ where: { email } });
      if (user) {
        throw new RpcException({
          status: 400,
          message: 'User already exists',
        });
      }

      const newUser = await this.prisma.user.create({
        data: {
          email, 
          name,
          password: bcrypt.hashSync(password, 10),  // Hash the password
        
        }
      });


      const { password: __, ...rest } = newUser; // Exclude password from the response
       return {
        user: rest,
        token: 'abc'
      }


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
      const user = await this.prisma.user.findUnique({ where: { email } });
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
        token: 'abc'
      }
    } catch (error) {
      throw new RpcException({
        status: 400,
        message: error.message,
      });
    }
  }

  

      
  async getUser(id: string) {
    try {
      const user = await this.prisma.user.findUnique({
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

  async updateUser(id: string, updateUserDto: UpdateUserDto) {
    const { email, name, password } = updateUserDto;

    try {
      const user = await this.prisma.user.findUnique({ where: { id } });
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


      const updatedUser = await this.prisma.user.update({
        where: { id },
        data,
        select: { id: true, email: true, name: true},
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
      const user = await this.prisma.user.findUnique({ where: { id } });
      if (!user) {
        throw new RpcException({
          status: 404,
          message: 'User not found',
        });
      }

      await this.prisma.user.delete({ where: { id } });
      return { message: 'User deleted successfully' };
    } catch (error) {
      throw new RpcException({
        status: 400,
        message: error.message,
      });
    }
  }

}
