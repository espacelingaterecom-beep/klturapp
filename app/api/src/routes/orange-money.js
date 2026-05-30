import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../utils/supabaseClient.js';
import logger from '../utils/logger.js';

const router = express.Router();

const ORANGE_MONEY_AMOUNT = 5000; // FCFA
const CLIENT_ID = process.env.ORANGE_MONEY_CLIENT_ID;
const CLIENT_SECRET = process.env.ORANGE_MONEY_CLIENT_SECRET;

/**
 * POST /orange-money/initiate-payment
 * Initiate a payment with Orange Money
 */
router.post('/initiate-payment', async (req, res, next) => {
  try {
    const { userId, amount } = req.body;

    if (!CLIENT_ID || !CLIENT_SECRET) {
      return res.status(500).json({ error: { message: 'Orange Money API credentials are not configured' } });
    }

    // Validate required fields
    if (!userId) {
      return res.status(400).json({ error: { message: 'userId is required' } });
    }
    if (amount === undefined || amount === null) {
      return res.status(400).json({ error: { message: 'amount is required' } });
    }

    // Validate amount is exactly 5000 FCFA
    if (Number(amount) !== ORANGE_MONEY_AMOUNT) {
      return res.status(400).json({ error: { message: `Invalid amount. Expected ${ORANGE_MONEY_AMOUNT} FCFA, got ${amount}` } });
    }

    // Verify user exists
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (userError || !user) {
      return res.status(404).json({ error: { message: 'User profile not found in Supabase' } });
    }

    // Generate unique transaction ID
    const transactionId = uuidv4();

    // Create payment record
    const { data: paymentRecord, error: paymentError } = await supabase
      .from('payments')
      .insert([{
        user_id: userId,
        transaction_id: transactionId,
        amount: Number(amount),
        status: 'pending'
      }])
      .select()
      .single();

    if (paymentError) {
      console.error("Payment Record Error:", paymentError);
      return res.status(500).json({ error: { message: 'Failed to create payment record in database. Make sure the "payments" table exists.' } });
    }

    logger.info(`Payment initiated: transactionId=${transactionId}, userId=${userId}, amount=${amount}`);

    // Return response with payment URL and redirect URL
    res.json({
      transactionId,
      paymentUrl: `https://orange-money-payment-page.com?transactionId=${transactionId}`,
      redirectUrl: `${process.env.FRONTEND_URL || 'http://192.168.2.232:3000'}/payment-success`,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /orange-money/webhook
 * Receive payment confirmation from Orange Money
 */
router.post('/webhook', async (req, res) => {
  const { transactionId, status } = req.body;

  // Validate required fields
  if (!transactionId) {
    return res.status(400).json({ error: 'transactionId is required' });
  }
  if (!status) {
    return res.status(400).json({ error: 'status is required' });
  }

  // Validate status is one of the expected values
  const validStatuses = ['completed', 'failed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status: ${status}`);
  }

  // Find payment record by transactionId
  const { data: payments, error: fetchError } = await supabase
    .from('payments')
    .select('*')
    .eq('transaction_id', transactionId);

  if (fetchError || !payments || payments.length === 0) {
    return res.status(404).json({ error: `Payment not found for transactionId: ${transactionId}` });
  }

  const payment = payments[0];

  // Update payment record
  const { error: updateError } = await supabase
    .from('payments')
    .update({
      status,
      completed_at: status === 'completed' ? new Date().toISOString() : null,
    })
    .eq('id', payment.id);

  if (updateError) {
    return res.status(500).json({ error: 'Failed to update payment record' });
  }

  logger.info(`Payment webhook received: transactionId=${transactionId}, status=${status}`);

  // If payment is completed, update user record
  if (status === 'completed') {
    // Calculate premium expiry date (1 year from now)
    const premiumExpiryDate = new Date();
    premiumExpiryDate.setFullYear(premiumExpiryDate.getFullYear() + 1);

    // Update profile record
    await supabase
      .from('profiles')
      .update({
        is_premium: true,
        certification_badge: true,
        verified_status: 'premium',
        premium_expiry_date: premiumExpiryDate.toISOString(),
      })
      .eq('id', payment.user_id);

    logger.info(`User upgraded to premium: userId=${payment.user_id}`);
  }

  res.json({ success: true });
});

/**
 * GET /orange-money/payment-status/:transactionId
 * Check payment status
 */
router.get('/payment-status/:transactionId', async (req, res) => {
  const { transactionId } = req.params;

  if (!transactionId) {
    return res.status(400).json({ error: 'transactionId is required' });
  }

  // Find payment record by transactionId
  const { data: payments, error: fetchError } = await supabase
    .from('payments')
    .select('*')
    .eq('transaction_id', transactionId);

  if (fetchError || !payments || payments.length === 0) {
    return res.status(404).json({ error: `Payment not found for transactionId: ${transactionId}` });
  }

  const payment = payments[0];

  res.json({
    status: payment.status,
    userId: payment.user_id,
    amount: payment.amount,
    completedAt: payment.completed_at || null,
  });
});

export default router;