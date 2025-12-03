import { Router } from 'express';
import {
    registerHandler,
    loginHandler,
    refreshHandler,
    logoutHandler,
    meHandler,
    setupTwoFactor,
    verifyTwoFactor,
    disableTwoFactor,
    verifyEmailHandler,
    forgotPasswordHandler,
    resetPasswordHandler
} from './auth.controller';
import { requireAuth } from '../../middlewares/auth';

export const authRouter = Router();

authRouter.post('/register', registerHandler);
authRouter.post('/login', loginHandler);
authRouter.post('/refresh', refreshHandler);
authRouter.post('/logout', logoutHandler);
authRouter.get('/me', requireAuth, meHandler);

authRouter.post('/2fa/setup', requireAuth, setupTwoFactor);
authRouter.post('/2fa/verify', requireAuth, verifyTwoFactor);
authRouter.post('/2fa/disable', requireAuth, disableTwoFactor);

authRouter.post('/verify-email', verifyEmailHandler);
authRouter.post('/forgot-password', forgotPasswordHandler);
authRouter.post('/reset-password', resetPasswordHandler);
