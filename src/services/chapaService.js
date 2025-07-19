const chapa = require('chapa');
const chapa = new Chapa(process.env.CHAPA_SECRET_KEY);

exports.createPaymentIntent = async (req, res) => {
  try {
    const { amount } = req.body;
    const paymentIntent = await chapa.paymentIntents.create({
      amount,
      currency: 'birr',
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};