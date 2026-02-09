import { auth } from "@/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
// import { Resend } from "resend";
import OrganizationSetupForm from "./form";
import { env } from "@/lib/env";
// import { headers } from "next/headers";
// import { getBaseUrl } from "@/lib/utils";
import { client } from "@/lib/qstash";

// const resend = new Resend(env.AUTH_RESEND_KEY);

const createOrganization = async (orgName: string, teamEmails: string[]) => {
  "use server";

  const session = await auth();
  if (!session || !session.user?.id) {
    throw new Error("Not authenticated");
  }

  if (!orgName?.trim()) {
    throw new Error("Organization name is required");
  }
  const userId = session.user.id;
  const uniqueEmails = [...new Set(teamEmails.map((e) => e.trim().toLowerCase()).filter(Boolean))];

  const organization = await db.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: { name: orgName.trim() },
    });

    await tx.user.update({
      where: { id: userId },
      data: {
        organizationId: org.id,
        isAdmin: true,
      },
    });
    return org;
  });

  client
    .publishJSON({
      url: `${env.BASE_URL}/api/organization/invites/worker`,
      body: {
        organization,
        user: session.user,
        emails: uniqueEmails,
      },
    })
    .catch(console.error);
  return {
    success: true,
    organization,
  };
};

export default async function OrganizationSetup() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  if (!session.user.name) {
    redirect("/setup/profile");
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { organization: true },
  });

  if (user?.organization) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-zinc-900 dark:to-zinc-950">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-sm sm:max-w-md mx-auto space-y-6 sm:space-y-8">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-blue-700 dark:text-blue-300">
              Setup Your Organization
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground dark:text-zinc-400">
              Create your workspace and invite your team
            </p>
          </div>
          <Card className="border-2 bg-white dark:bg-zinc-900 dark:border-zinc-800">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 dark:from-zinc-800 dark:to-blue-900 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {session.user.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <CardTitle className="text-lg sm:text-xl text-blue-700 dark:text-blue-300 truncate max-w-full overflow-hidden whitespace-nowrap">
                Welcome, {session.user.name}!
              </CardTitle>
              <CardDescription className="text-sm sm:text-base text-muted-foreground dark:text-zinc-400">
                Let&apos;s set up your organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OrganizationSetupForm onSubmit={createOrganization} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
