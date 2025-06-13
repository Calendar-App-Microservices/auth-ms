import { Type } from "class-transformer";
import { IsBoolean, IsDate, IsEmail, IsEnum, IsOptional, IsString } from "class-validator";

export class CreateUserDto {

    @IsString()
    name: string;

    @IsString()
    @IsEmail()
    email:string;

    @IsString()
    password:string;
/*
    @IsEnum(Role)
    @IsOptional()
    role?: Roles;*/

    @IsBoolean()
    @IsOptional()
    available?: boolean;
  
    @IsDate()
    @Type(() => Date)
    @IsOptional()
    createdAt?: Date;
  
    @IsDate()
    @Type(() => Date)
    @IsOptional()
    deletedAt?: Date;    //Agregado para hacer soft delete de usuario  
  
    @IsBoolean()
    @IsOptional()
    verified?: boolean;

}