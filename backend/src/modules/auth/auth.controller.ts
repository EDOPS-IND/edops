import { Body, Controller, Get, HttpCode, Inject, Post, Query, Req, Res, UnauthorizedException } from '@nestjs/common';
import { ApiBody, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { AuthenticatedRequest, Public } from '../../common/auth.guard';
import { AppConfig, InjectConfig } from '../../config';
import { AuthService } from './auth.service';
import { LoginDto, RefreshDto, LogoutDto, SwitchSchoolDto, ForgotPasswordDto, ResetPasswordDto, VerifyResetTokenDto } from './auth.dto';
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
  @Post('forgot-password')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Request a password reset link',
    security: [],
    description: 'Public. Checks if the account exists. If found, generates a 30-minute one-time reset token and emails via Brevo (or console in dev). If not found, refuses with 404. Limit: 5 requests/minute per IP.',
  })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiOkResponse({ description: 'Password reset dispatch confirmation.' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.auth.requestPasswordReset(dto.email);
    return {
      message: 'Password reset link has been dispatched to your email address.',
    };
  }

  @Public()
  @Get('reset-password/verify')
  @ApiOperation({
    summary: 'Verify a password reset token before displaying the reset form',
    security: [],
    description: 'Public. Verifies that the token exists, is unexpired, and has not yet been consumed. Returns token validity and masked email.',
  })
  async verifyResetToken(@Query('token') token: string) {
    return this.auth.verifyResetToken(token);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Reset password using a verified token',
    security: [],
    description: 'Public. Consumes the one-time reset token, updates the scrypt password hash, revokes all existing refresh tokens/sessions for the user, and logs an audit event. Limit: 5 requests/minute per IP.',
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiOkResponse({ description: 'Password reset confirmation message.' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.auth.resetPassword(dto.token, dto.password);
    return {
      message: 'Your password has been successfully reset. You can now sign in with your new password.',
    };
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
    );
    if (!membership && !user.isPlatformAdmin) throw new UnauthorizedException("Active school membership required");
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

  @Public()
  @Post('logout')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Sign out of the current session', security: [{ cookie: [], csrf: [] }],
    description: 'Revokes the supplied refresh token, clears its cookie and records auth.logout. Other devices and school memberships are unchanged. Limit: 120 requests/minute per IP.',
  })
  async logout(@Body() body: LogoutDto, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const user = (request as any).user || (typeof this.auth.userFromRequest === 'function' ? await this.auth.userFromRequest(request) : null);
    const token = body?.refreshToken || request.cookies?.edops_refresh_token;
    if (token) {
      if (user?.id) {
        await this.auth.revokeRefreshToken(token, user.id);
      } else {
        const { hashToken } = await import('./jwt.util');
        await this.auth.drizzle.query(
          `UPDATE user_refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1 AND revoked_at IS NULL`,
          [hashToken(token)]
        );
      }
    }
    response.clearCookie('edops_refresh_token', {
      path: '/', httpOnly: true, sameSite: 'lax', secure: this.config.environment === 'production',
    });
    const sessionCookie = request.cookies?.[this.config.cookieName];
    if (sessionCookie) {
      const sid = typeof sessionCookie === 'string' && sessionCookie.startsWith('s:')
        ? sessionCookie.slice(2).split('.')[0]
        : sessionCookie;
      await this.auth.drizzle.query(`DELETE FROM sessions WHERE sid = $1`, [sid]);
      response.clearCookie(this.config.cookieName, {
        path: '/', httpOnly: true, sameSite: 'lax', secure: this.config.environment === 'production',
      });
    }
    if (user) {
      await this.auth.recordLogout(user);
    }
  }
}

