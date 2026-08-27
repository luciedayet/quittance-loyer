import { redirect } from "next/navigation"

import { getSession } from "@/lib/auth/session"
import { getProfileSciNameByPageId } from "@/lib/notion/profiles"
import { getAllUsers } from "@/lib/notion/users"

export const dynamic = "force-dynamic"

export default async function AdminUsersPage() {
  const session = await getSession()
  if (session?.role !== "admin") redirect("/login")

  const [users, sciByPageId] = await Promise.all([
    getAllUsers(),
    getProfileSciNameByPageId(),
  ])

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <div>
        <h1 className="font-heading text-2xl font-medium">Utilisateurs</h1>
        <p className="text-sm text-muted-foreground">
          {users.length} compte{users.length > 1 ? "s" : ""}
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Nom
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Email
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Rôle
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                SCI
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Statut
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Code d&apos;activation
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const isActivated = Boolean(user.passwordHash)
              const sciName = user.profilePageId
                ? (sciByPageId.get(user.profilePageId) ?? "–")
                : "–"
              return (
                <tr
                  key={user.id}
                  className="border-b border-border last:border-0 hover:bg-muted/20"
                >
                  <td className="px-4 py-3 font-medium">
                    {[user.firstName, user.lastName].filter(Boolean).join(" ") || "–"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        user.role === "admin"
                          ? "rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                          : "rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                      }
                    >
                      {user.role === "admin" ? "Admin" : "Bailleur"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{user.role === "bailleur" ? sciName : "–"}</td>
                  <td className="px-4 py-3">
                    {isActivated ? (
                      <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                        <span className="size-1.5 rounded-full bg-current" />
                        Inscrit
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                        <span className="size-1.5 rounded-full bg-current" />
                        En attente
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isActivated ? (
                      <span className="text-muted-foreground">–</span>
                    ) : user.activationCode ? (
                      <code className="rounded bg-muted px-2 py-0.5 font-mono text-xs tracking-wider">
                        {user.activationCode}
                      </code>
                    ) : (
                      <span className="text-muted-foreground">–</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
