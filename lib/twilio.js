import twilio from 'twilio'

const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
)

export async function sendWhatsApp(to, businessName, slug) {
    const url = process.env.NEXT_PUBLIC_APP_URL

    await client.messages.create({
        from: process.env.TWILIO_WHATSAPP_FROM,
        to: `whatsapp:${to}`,
        body:
            `Hey there 👋

Thanks for visiting *${businessName}* today!

How was your experience? Takes 30 seconds:
👉 ${url}/feedback/${slug}

We appreciate your support 🙏`
    })
}