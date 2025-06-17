import { IsEmail, IsString, Max, MaxLength } from "class-validator";

export class LoginUserDto {

    @IsString()
    @IsEmail()
    email:string;

    @IsString()
    @MaxLength(50)
    password:string;

}