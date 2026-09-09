import { Body, Controller, Get, HttpCode, Inject, Post, Req, Res } from '@nestjs/common';
import { ApiBody, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { promisify } from 'node:util';
import { Public, AuthenticatedRequest } from '../../common/auth.guard';
import { csrf } from '../../common/csrf';
import { APP_CONFIG, AppConfig } from '../../config';
import { AuthService } from './auth.service';
import { LoginDto } from './auth.dto';
import { ApiErrors, csrfSchema, loginSchema, profileSchema } from '../../common/api-docs';

@ApiTags('Authentication')
@ApiErrors(429, 500)
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService, @Inject(APP_CONFIG) private readonly config: AppConfig) {}

  @Public()
  @Get('csrf')
  @ApiOperation({
    summary: 'Get a CSRF token before making a write request', security: [],
    description: 'Public. Creates an anonymous PostgreSQL-backed session when needed and returns its CSRF token. Keep the browser cookie and send the token in X-CSRF-Token on every POST/PATCH. This does not sign in a user or rotate a valid existing token. Limit: 120 requests/minute per IP.',
  })
  @ApiOkResponse({ description: 'Session-bound CSRF token; a new session also sets an HTTP-only cookie.', schema: csrfSchema })
  csrfToken(@Req() request: Request) {
    return { csrfToken: csrf.generateToken(request) };
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Sign in and rotate the session', security: [{ cookie: [], csrf: [] }],
    description: 'No prior login required, but first call GET /api/auth/csrf. Trims/lowercases email, verifies the scrypt password and active user, records auth.login, then replaces the session and CSRF token. Authentication lasts at most 8 hours. Replace your saved CSRF token with this response. School suspension does not prevent login; school routes still deny access. Limit: 10 requests/minute per IP.',
  })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ description: 'Current profile, active memberships and replacement CSRF token. Sets a new session cookie.', schema: loginSchema })
  @ApiErrors(400, 401, 403, 413)
  async login(@Body() dto: LoginDto, @Req() request: Request) {
    const user = await this.auth.verifyCredentials(dto.email, dto.password);
    await promisify(request.session.regenerate.bind(request.session))();
    request.session.userId = user.id;
    request.session.authenticatedAt = Date.now();
    const csrfToken = csrf.generateToken(request, true);
    await promisify(request.session.save.bind(request.session))();
    return { ...(await this.auth.profile(user)), csrfToken };
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
    description: 'Deletes this session from PostgreSQL, clears its cookie and records auth.logout. Other sessions and school memberships are unchanged. No request body is needed. The old cookie no longer authenticates; call /auth/csrf again before another login. Repeating logout after revocation does not return a second success. Limit: 120 requests/minute per IP.',
  })
  @ApiNoContentResponse({ description: 'Session revoked and cookie cleared. Empty body; do not parse it as JSON.' })
  @ApiErrors(400, 401, 403, 413)
  async logout(@Req() request: AuthenticatedRequest, @Res({ passthrough: true }) response: Response) {
    await promisify(request.session.destroy.bind(request.session))();
    response.clearCookie(this.config.cookieName, {
      path: '/', httpOnly: true, sameSite: 'lax', secure: this.config.environment === 'production',
    });
    await this.auth.recordLogout(request.user);
  }
}
