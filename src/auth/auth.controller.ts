import { Controller } from '@nestjs/common';
import { AuthService } from './auth.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateUserDto, LoginUserDto } from './dto';


@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}


  @MessagePattern('create/user')
  createUser(@Payload() createUserDto: CreateUserDto) {
    return this.authService.createUser(createUserDto);
  }

 @MessagePattern('login/user')
  loginUser(@Payload() loginUserDto: LoginUserDto) {
    return this.authService.loginUser(loginUserDto);
  }


  @MessagePattern('auth.get.user')
  getUser(@Payload() id: string) {
    return this.authService.getUser(id);
  }


  @MessagePattern('auth.delete.user')
  deleteUser(@Payload() id: string) {
    return this.authService.deleteUser(id);
  }




}
