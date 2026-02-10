import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  first_name: string;

  @IsOptional()
  @IsString()
  last_name: string;

  @IsOptional()
  @IsString()
  middle_name: string;

  @IsOptional()
  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  birthday: string;

  @IsOptional()
  @IsString()
  gender: string;

  @IsOptional()
  @IsString()
  locale: string;

  @IsOptional()
  @IsString()
  timezone: string;
}
