
import { Type } from "class-transformer";
import { IsBoolean, IsDate, IsEmail, IsEnum, IsOptional, IsString, MaxLength } from "class-validator";
import { Roles} from '@prisma/client';

export class CreateUserDto {

    @IsString()
    name: string;

    @IsString()
    @IsEmail()
    email:string;

    @IsString()
    @MaxLength(50)
    password:string;

    
    @IsEnum(Roles)
    @IsOptional()
    role?: Roles;

    @IsDate()
    @Type(() => Date)
    @IsOptional()
    updatedAt?: Date;

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