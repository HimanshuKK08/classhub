import { Router } from 'express';
import { createToken, listTokens, revokeToken } from '../controllers/tokenController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// All token routes require a valid session cookie
router.use(requireAuth);

router.post('/', createToken);
router.get('/', listTokens);
router.delete('/:id', revokeToken);

export default router;
