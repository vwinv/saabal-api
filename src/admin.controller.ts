import { Controller, Get, Res } from '@nestjs/common';
import { join } from 'path';
import type { Response } from 'express';

@Controller('admin')
export class AdminController {
  @Get()
  getAdmin(@Res() res: Response) {
    const filePath = join(process.cwd(), 'public', 'admin', 'index.html');
    return res.sendFile(filePath);
  }

  @Get('login')
  getLogin(@Res() res: Response) {
    const filePath = join(process.cwd(), 'public', 'admin', 'login.html');
    return res.sendFile(filePath);
  }
}


