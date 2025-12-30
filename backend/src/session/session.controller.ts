import { Controller, Get, Post, Delete, Body, UseGuards, Request } from '@nestjs/common';
import { SessionService } from './session.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ISession } from './interfaces/session.interface';

@Controller('session')
@UseGuards(JwtAuthGuard)
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Get()
  async getSession(@Request() req): Promise<ISession | null> {
    const sessionId = req.user?.sessionId || req.user?.sub;
    if (!sessionId) {
      return null;
    }
    return this.sessionService.get(sessionId);
  }

  @Post()
  async updateSession(@Request() req, @Body() data: Record<string, any>) {
    const sessionId = req.user?.sessionId || req.user?.sub;
    if (!sessionId) {
      return { error: 'Session not found' };
    }
    
    const existingSession = await this.sessionService.get(sessionId);
    if (!existingSession) {
      return { error: 'Session not found' };
    }

    const updatedSession: ISession = {
      ...existingSession,
      data: { ...existingSession.data, ...data },
    };

    await this.sessionService.set(sessionId, updatedSession);
    return { success: true };
  }

  @Delete()
  async deleteSession(@Request() req) {
    const sessionId = req.user?.sessionId || req.user?.sub;
    if (sessionId) {
      await this.sessionService.delete(sessionId);
    }
    return { success: true };
  }
}
