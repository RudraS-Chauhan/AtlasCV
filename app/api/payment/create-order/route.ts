import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createClient } from '@/utils/supabase/server';

export async function POST() {
  try {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    
    if (!key_id || !key_secret) {
      return NextResponse.json({ error: 'Razorpay keys missing' }, { status: 500 });
    }

    const razorpay = new Razorpay({
      key_id,
      key_secret,
    });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const options = {
      amount: 19900, // amount in smallest currency unit (paise for INR, so ₹199)
      currency: "INR",
      receipt: `receipt_${user.id.slice(0, 8)}`,
    };

    const order = await razorpay.orders.create(options);
    
    return NextResponse.json({ orderId: order.id, amount: order.amount, currency: order.currency });
  } catch (error: any) {
    console.error("Order creation error:", error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
