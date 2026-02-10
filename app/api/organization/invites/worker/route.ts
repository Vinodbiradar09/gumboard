import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { env } from "@/lib/env";
import { Resend } from "resend";

const resend = new Resend(env.AUTH_RESEND_KEY);

async function handler(request: Request) {
  try {
    const { organization, user, emails } = await request.json();
    if (!Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({
        message: "please send emails in array",
        success: false,
      });
    }
    const invites = await db.organizationInvite.createManyAndReturn({
      data: emails.map((email: string) => ({
        email,
        organizationId: organization.id,
        invitedBy: user.id,
      })),
      skipDuplicates: true,
    });
    const batch = invites.map((invite) => ({
      from: env.EMAIL_FROM,
      to: invite.email,
      subject: `${user.name} invited you to join ${organization.name}`,
      html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>You&apos;re invited to join ${organization.name}!</h2>
              <p>${user.name} (${user.email}) has invited you to join their organization on Board.</p>
              <p>Click the link below to accept the invitation:</p>
              <a href="${env.BASE_URL}/invite/accept?token=${invite.id}"
                 style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Accept Invitation
              </a>
              <p style="margin-top: 20px; color: #666;">
                If you don&apos;t want to receive these emails, please ignore this message.
              </p>
            </div>
          `,
    }));
    await resend.batch.send(batch);
    return NextResponse.json(
      { success: true, message: "the organization invitation has been sent" },
      { status: 200 }
    );
  } catch (error) {
    console.log("error in qstash queue", error);
    return NextResponse.json(
      {
        message: "qstash server failed",
        success: false,
      },
      { status: 500 }
    );
  }
}

export const POST = verifySignatureAppRouter(handler);
