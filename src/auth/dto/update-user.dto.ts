import { PartialType } from "@nestjs/mapped-types";
import { IsEmail, IsOptional, IsString, MinLength, IsEnum } from "class-validator";
import { CreateUserDto } from "./create-user.dto";

export class UpdateUserDto extends PartialType(CreateUserDto) {


  id: string
}