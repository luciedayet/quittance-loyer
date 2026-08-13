import { toCurrency } from "n2words/fr-FR"

import type { Profile } from "@/lib/profiles"
import type { Tenant, TenantCivility } from "@/lib/tenants"

export type QuittanceFields = {
  profile: Profile
  tenant: Tenant
  periodLabel: string
  periodStart: string
  periodEnd: string
  paymentDateFormatted: string
  issueDateFormatted: string
  rentFormatted: string
  chargesFormatted: string
  totalFormatted: string
  totalAmount: number
  amountInWords: string
  tenantHonorific: string
  tenantShortLabel: string
}

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
})

const monthLabelFormatter = new Intl.DateTimeFormat("fr-FR", {
  month: "long",
  year: "numeric",
})

export function formatEuros(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false

  const [yearPart, monthPart, dayPart] = value.split("-")
  const year = Number(yearPart)
  const month = Number(monthPart)
  const day = Number(dayPart)
  const date = new Date(year, month - 1, day)

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  )
}

export function isValidPeriodMonth(value: string): boolean {
  if (!/^\d{4}-\d{2}$/.test(value)) return false

  const month = Number(value.slice(5, 7))
  return month >= 1 && month <= 12
}

export function formatDateFr(date: Date): string {
  if (Number.isNaN(date.getTime())) {
    throw new RangeError("Invalid time value")
  }

  return dateFormatter.format(date)
}

export function formatIsoDate(value: string): string {
  if (!isValidIsoDate(value)) return value

  const [yearPart, monthPart, dayPart] = value.split("-")
  const date = new Date(
    Number(yearPart),
    Number(monthPart) - 1,
    Number(dayPart),
  )
  return formatDateFr(date)
}

export function monthFromDate(date: string): string {
  if (!isValidIsoDate(date)) return ""
  return date.slice(0, 7)
}

export function periodFromMonth(periodMonth: string): {
  start: string
  end: string
  label: string
} | null {
  if (!isValidPeriodMonth(periodMonth)) return null

  const [yearPart, monthPart] = periodMonth.split("-")
  const year = Number(yearPart)
  const monthIndex = Number(monthPart) - 1
  const start = new Date(year, monthIndex, 1)
  const end = new Date(year, monthIndex + 1, 0)

  return {
    start: formatDateFr(start),
    end: formatDateFr(end),
    label: monthLabelFormatter.format(start),
  }
}

export function civilityToHonorific(civility: TenantCivility): string {
  return civility === "Mme" ? "Madame" : "Monsieur"
}

export function amountInWords(total: number): string {
  return toCurrency(total, { and: true })
}

export function buildQuittanceFields(
  profile: Profile,
  tenant: Tenant,
  paymentDate: string,
  periodMonth: string,
): QuittanceFields | null {
  if (!isValidIsoDate(paymentDate) || !isValidPeriodMonth(periodMonth)) {
    return null
  }

  const period = periodFromMonth(periodMonth)
  if (!period) return null

  const totalAmount = tenant.rentAmount + tenant.chargesAmount

  const [yearPart, monthPart, dayPart] = paymentDate.split("-")
  const paymentDateObject = new Date(
    Number(yearPart),
    Number(monthPart) - 1,
    Number(dayPart),
  )

  return {
    profile,
    tenant,
    periodLabel: period.label,
    periodStart: period.start,
    periodEnd: period.end,
    paymentDateFormatted: formatDateFr(paymentDateObject),
    issueDateFormatted: formatDateFr(new Date()),
    rentFormatted: formatEuros(tenant.rentAmount),
    chargesFormatted: formatEuros(tenant.chargesAmount),
    totalFormatted: formatEuros(totalAmount),
    totalAmount,
    amountInWords: amountInWords(totalAmount),
    tenantHonorific: civilityToHonorific(tenant.civility),
    tenantShortLabel: `${tenant.civility} ${tenant.name}`,
  }
}

export function buildQuittanceFilename(fields: QuittanceFields): string {
  const sanitize = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9-_]+/g, "_")
      .replace(/^_+|_+$/g, "")

  return `Quittance_${sanitize(fields.profile.sciName)}_${sanitize(fields.tenant.name)}_${sanitize(fields.periodLabel)}.pdf`
}
