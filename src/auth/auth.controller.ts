import { Controller, ParseUUIDPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PaginationDto } from './common';
import { CreateUserDto, ConfirmAccountDto, LoginUserDto, ChangePasswordDto, ForgotPasswordDto, ResetPasswordDto } from './dto';



@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}


  @MessagePattern('register.user')
  createUser(@Payload() createUserDto: CreateUserDto) {
    return this.authService.createUser(createUserDto);
  }

  @MessagePattern('auth.confirm')
  async confirmAccount(@Payload() confirmAccountDto: ConfirmAccountDto) {
    return this.authService.confirmAccount(confirmAccountDto);
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

  @MessagePattern('auth.change-password')
  async changePassword(@Payload() data: { userId: string, dto: ChangePasswordDto }) {
    return this.authService.changePassword(data.userId, data.dto);
  }

  @MessagePattern('auth.forgot-password')
  async forgotPassword(@Payload() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @MessagePattern('auth.reset-password')
  async resetPassword(@Payload() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }


}
