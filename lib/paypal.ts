const SANDBOX = 'https://api-m.sandbox.paypal.com';
const LIVE = 'https://api-m.paypal.com';

export function paypalConfigurado() {
  return Boolean(
    process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID?.trim() && process.env.PAYPAL_CLIENT_SECRET?.trim()
  );
}

function paypalBase() {
  const env = (process.env.PAYPAL_ENVIRONMENT || 'sandbox').toLowerCase();
  return env === 'live' || env === 'production' ? LIVE : SANDBOX;
}

async function tokenPaypal() {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID?.trim() || '';
  const secret = process.env.PAYPAL_CLIENT_SECRET?.trim() || '';
  const auth = Buffer.from(`${clientId}:${secret}`).toString('base64');

  const respuesta = await fetch(`${paypalBase()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = (await respuesta.json()) as { access_token?: string; error_description?: string };
  if (!respuesta.ok || !data.access_token) {
    throw new Error(data.error_description || 'No se pudo autenticar con PayPal');
  }
  return data.access_token;
}

export async function crearOrdenPaypal(params: {
  productoId: string;
  titulo: string;
  monto: number;
  returnUrl?: string;
  cancelUrl?: string;
}) {
  const token = await tokenPaypal();
  const value = Number(params.monto).toFixed(2);

  const respuesta = await fetch(`${paypalBase()}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          custom_id: params.productoId,
          description: params.titulo.slice(0, 127),
          amount: { currency_code: 'USD', value },
        },
      ],
      application_context: {
        brand_name: 'CreacionArte',
        user_action: 'PAY_NOW',
        shipping_preference: 'NO_SHIPPING',
        return_url: params.returnUrl,
        cancel_url: params.cancelUrl,
      },
    }),
  });

  const data = (await respuesta.json()) as { id?: string; message?: string };
  if (!respuesta.ok || !data.id) {
    throw new Error(data.message || 'No se pudo crear la orden de PayPal');
  }
  return data.id;
}

export async function capturarOrdenPaypal(paypalOrderId: string) {
  const token = await tokenPaypal();
  const respuesta = await fetch(`${paypalBase()}/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = (await respuesta.json()) as {
    id?: string;
    status?: string;
    message?: string;
    purchase_units?: Array<{
      custom_id?: string;
      payments?: {
        captures?: Array<{
          id?: string;
          status?: string;
          amount?: { value?: string; currency_code?: string };
        }>;
      };
    }>;
  };

  if (!respuesta.ok) {
    throw new Error(data.message || 'No se pudo capturar el pago de PayPal');
  }

  const capture = data.purchase_units?.[0]?.payments?.captures?.[0];
  return {
    paypalOrderId: data.id || paypalOrderId,
    status: data.status || capture?.status || '',
    captureId: capture?.id || data.id || paypalOrderId,
    amount: capture?.amount?.value,
    currency: capture?.amount?.currency_code,
    productoId: data.purchase_units?.[0]?.custom_id,
  };
}
