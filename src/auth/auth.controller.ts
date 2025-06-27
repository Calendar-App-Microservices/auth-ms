import { Controller, ParseUUIDPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateUserDto, LoginUserDto } from './dto';
import { PaginationDto } from './common';


@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}


  @MessagePattern('register.user')
  createUser(@Payload() createUserDto: CreateUserDto) {
    return this.authService.createUser(createUserDto);
  }

 @MessagePattern('login.user')
  loginUser(@Payload() loginUserDto: LoginUserDto) {
    return this.authService.loginUser(loginUserDto);
  }


  @MessagePattern('get.user')
  getUser(@Payload('id', ParseUUIDPipe) id: string) {
    return this.authService.getUser(id);
  }

  @MessagePattern('get.all.users')
  getAllUsers(@Payload() paginationDto: PaginationDto) {
    return this.authService.getAllUsers(paginationDto);
  }


  @MessagePattern('delete.user')
  deleteUser(@Payload('id', ParseUUIDPipe) id: string) {
    return this.authService.deleteUser(id);
  }

  @MessagePattern('verify.token')
  verifyToken(@Payload() token: string) {
    return this.authService.verifyToken(token);
  }




}
