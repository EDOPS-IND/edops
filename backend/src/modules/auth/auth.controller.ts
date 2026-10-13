import { Body, Controller, Get, HttpCode, Inject, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import { ApiBody, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { AuthenticatedRequest, Public } from '../../common/auth.guard';
import { AppConfig, InjectConfig } from '../../config';
import { AuthService } from './auth.service';
import { LoginDto, RefreshDto, LogoutDto, SwitchSchoolDto } from './auth.dto';
import { ApiErrors, csrfSchema, loginSchema, profileSchema } from '../../common/api-docs';

@ApiTags('Authentication')
@ApiErrors(429, 500)
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService, @InjectConfig() private readonly config: AppConfig) {}

  @Public()
  @Get('csrf')
  @ApiOperation({
    summary: 'Get a CSRF token before making a write request', security: [],
    description: 'Public. Creates an anonymous PostgreSQL-backed session when needed and returns its CSRF token. Keep the browser cookie and send the token in X-CSRF-Token on every POST/PATCH. This does not sign in a user or rotate a valid existing token. Limit: 120 requests/minute per IP.',
  })
  @ApiOkResponse({ description: 'Stateless CSRF compatibility endpoint.', schema: csrfSchema })
  csrfToken() {
    return { csrfToken: '' };
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: Number(process.env.AUTH_THROTTLE_LIMIT ?? 120), ttl: 60_000 } })
  @ApiOperation({
    summary: 'Sign in and issue stateless JWT tokens', security: [],
    description: 'Verifies email and password, records auth.login, and returns stateless JWT access & refresh tokens. Limit: 10 requests/minute per IP.',
  })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ description: 'Current profile, active memberships and JWT tokens.', schema: loginSchema })
  @ApiErrors(400, 401, 403, 413)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const user = await this.auth.verifyCredentials(dto.email, dto.password);
    await this.auth.recordLogin(user);

    const refreshToken = await this.auth.createRefreshToken(user.id);
    response.cookie('edops_refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 14 * 24 * 60 * 60 * 1000,
    });

    const { signAccessToken } = await import('./jwt.util');
    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      isPlatformAdmin: user.isPlatformAdmin,
    });
    return { ...(await this.auth.profile(user)), accessToken, refreshToken };
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  async refresh(@Body() body: RefreshDto, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const refreshToken = body?.refreshToken || request.cookies?.edops_refresh_token;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }
    const result = await this.auth.rotateRefreshToken(refreshToken);
    if (!result) {
      response.clearCookie('edops_refresh_token');
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    response.cookie('edops_refresh_token', result.newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 14 * 24 * 60 * 60 * 1000,
    });
    return { accessToken: result.accessToken, refreshToken: result.newRefreshToken, user: { id: result.user.id, email: result.user.email } };
  }

  @Post('switch-school')
  @HttpCode(200)
  async switchSchool(@Body() body: SwitchSchoolDto, @Req() request: AuthenticatedRequest) {
    const { signAccessToken } = await import('./jwt.util');
    const user = request.user;
    const [membership] = await this.auth.drizzle.query(
      `SELECT role FROM memberships WHERE user_id = $1 AND organization_id = $2 AND status = 'active' LIMIT 1`,
      [user.id, body.schoolId]
    ).catch(() => []);
    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      isPlatformAdmin: user.isPlatformAdmin,
      schoolId: body.schoolId,
      role: membership?.role,
    });
    return { accessToken, activeSchoolId: body.schoolId, role: membership?.role };
  }

  @Get('me')
  @ApiOperation({
    summary: 'Get the current user and school memberships', security: [{ cookie: [] }],
    description: 'Checks the current session and active user, then joins organizations with active memberships. Returns only this user, not a user directory. Suspended schools remain listed with their status; inactive memberships are omitted. Platform admins may have an empty organizations array. No database changes or audit event. Limit: 120 requests/minute per IP.',
  })
  @ApiOkResponse({ description: 'Profile without passwords or tokens.', schema: profileSchema })
  @ApiErrors(401)
  me(@Req() request: AuthenticatedRequest) {
    return this.auth.profile(request.user);
  }

  @Post('logout')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Sign out of the current session', security: [{ cookie: [], csrf: [] }],
    description: 'Revokes the supplied refresh token, clears its cookie and records auth.logout. Other devices and school memberships are unchanged. Limit: 120 requests/minute per IP.',
  })
  @ApiNoContentResponse({ description: 'Session revoked and cookie cleared. Empty body; do not parse it as JSON.' })
  @ApiErrors(400, 401, 403, 413)
  async logout(@Body() body: LogoutDto, @Req() request: AuthenticatedRequest, @Res({ passthrough: true }) response: Response) {
    const token = body?.refreshToken || request.cookies?.edops_refresh_token;
    if (token && request.user?.id) {
      await this.auth.revokeRefreshToken(token, request.user.id);
    }
    response.clearCookie('edops_refresh_token', {
      path: '/', httpOnly: true, sameSite: 'lax', secure: this.config.environment === 'production',
    });
    if (request.user) {
      await this.auth.recordLogout(request.user);
    }
  }
}

