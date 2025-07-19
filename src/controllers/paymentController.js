const prisma = require('../lib/prisma');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const axios = require('axios');
const { getUserId } = require('../middlewares/auth');

// 🎯 Create Stripe payment intent
exports.createStripePaymentIntent = async (req, res) => {
  const userId = getUserId(req);
  const { amount, currency, subscriptionId } = req.body;

  try {
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata: { userId, subscriptionId },
    });

    res.json({ clientSecret: intent.client_secret });
  } catch (err) {
    console.error('Stripe Intent Error:', err);
    res.status(500).json({ error: 'Failed to create Stripe intent' });
  }
};

// ✅ Get user payment history
exports.getUserPayments = async (req, res) => {
  const userId = getUserId(req);
  try {
    const user = await prisma.user.findUnique({ where: { externalId: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const payments = await prisma.payment.findMany({
      where: { userId: user.id },
      orderBy: { paymentDate: 'desc' },
    });

    res.json(payments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
};

// 🌍 Create Chapa payment link
exports.createChapaPaymentLink = async (req, res) => {
  const userId = getUserId(req);
  const { amount, currency, subscriptionId, email } = req.body;

  try {
    const txRef = `tx-${Date.now()}`;
    const response = await axios.post(
      'https://api.chapa.co/v1/transaction/initialize',
      {
        amount,
        currency,
        email,
        tx_ref: txRef,
        callback_url: process.env.CHAPA_CALLBACK_URL,
        return_url: process.env.FRONTEND_URL + '/subscription/success',
        customizations: {
          title: 'Your Streaming App',
          description: 'Subscription Payment',
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
        },
      }
    );

    // Save pending payment record
    const user = await prisma.user.findUnique({ where: { externalId: userId } });
    await prisma.payment.create({
      data: {
        userId: user.id,
        subscriptionId,
        paymentGateway: 'CHAPA',
        amount: parseFloat(amount),
        currency,
        paymentStatus: 'PENDING',
        transactionId: txRef,
      },
    });

    res.json({ checkoutUrl: response.data.data.checkout_url });
  } catch (error) {
    console.error('Chapa Init Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to initialize Chapa payment' });
  }
};

// ✅ Stripe Webhook
exports.handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Stripe Webhook error:', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object;
    const userId = intent.metadata.userId;
    const subscriptionId = parseInt(intent.metadata.subscriptionId, 10);

    const user = await prisma.user.findUnique({ where: { externalId: userId } });

    if (user) {
      await prisma.payment.create({
        data: {
          userId: user.id,
          subscriptionId,
          paymentGateway: 'STRIPE',
          amount: intent.amount / 100,
          currency: intent.currency,
          paymentStatus: 'COMPLETED',
          transactionId: intent.id,
        },
      });

      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: 'ACTIVE',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      });
    }
  }

  res.status(200).send('Webhook received');
};

// ✅ Chapa Webhook
exports.handleChapaWebhook = async (req, res) => {
  const { tx_ref, status } = req.body;

  try {
    const payment = await prisma.payment.findFirst({
      where: { transactionId: tx_ref },
    });

    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    if (status === 'success') {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { paymentStatus: 'COMPLETED' },
      });

      if (payment.subscriptionId) {
        await prisma.subscription.update({
          where: { id: payment.subscriptionId },
          data: {
            status: 'ACTIVE',
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });
      }
    }

    res.json({ message: 'Webhook processed' });
  } catch (error) {
    console.error('Chapa Webhook error:', error);
    res.status(500).json({ error: 'Webhook failed' });
  }
};
