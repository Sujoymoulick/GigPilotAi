import { paymentRepository, userRepository } from '../repositories';
import { BadRequestError } from '../errors/AppError';

export class BillingService {
  public async getBillingDetails(userId: string, token?: string) {
    const profile = await userRepository.queryById<any>(userId, token);
    const invoices = await paymentRepository.getByUser(userId, token);

    return {
      currentPlan: profile ? profile.role : 'Pro',
      creditsRemaining: profile ? profile.credits_remaining : 450,
      monthlyQuota: profile ? profile.monthly_quota : 500,
      renewalDate: new Date(Date.now() + 25 * 24 * 3600 * 1000).toISOString().split('T')[0],
      subscriptionStatus: 'active',
      invoices
    };
  }

  public async upgradePlan(userId: string, body: any, token?: string) {
    const { plan, razorpayPaymentId, coupon } = body;
    if (!plan) throw new BadRequestError('Plan name is required');

    let newQuota = 50;
    let price = 0;
    if (plan === 'Pro') {
      newQuota = 500;
      price = 29;
    } else if (plan === 'Agency') {
      newQuota = 2000;
      price = 89;
    }

    if (coupon === 'LAUNCH20') {
      price = Math.round(price * 0.8 * 100) / 100;
    }

    // Update user role and quota
    await userRepository.updateRecord(userId, {
      role: plan,
      credits_remaining: newQuota,
      monthly_quota: newQuota
    }, token);

    // Create invoice billing record
    const invoice = await paymentRepository.insertRecord({
      user_id: userId,
      invoice_id: `INV-${Date.now().toString().slice(-6)}`,
      amount: price,
      currency: 'USD',
      status: 'Paid',
      pdf_url: '#'
    }, token);

    return invoice;
  }
}

export const billingService = new BillingService();
