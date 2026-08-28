"use client"

import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer"

import type { QuittanceFields } from "@/lib/quittance"

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 48,
    fontSize: 11,
    fontFamily: "Helvetica",
    lineHeight: 1.45,
    color: "#111111",
  },
  title: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 28,
  },
  addressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 24,
  },
  addressBlock: {
    width: "48%",
  },
  addressRight: {
    width: "48%",
    alignItems: "flex-end",
  },
  addressLine: {
    marginBottom: 2,
  },
  addressLineRight: {
    marginBottom: 2,
    textAlign: "right",
  },
  issueLine: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
  },
  propertyBlock: {
    marginBottom: 20,
  },
  paragraph: {
    marginBottom: 24,
    textAlign: "justify",
  },
  detailTitle: {
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
  },
  detailLine: {
    marginBottom: 4,
  },
  totalLine: {
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  signatureBlock: {
    marginTop: 28,
    alignItems: "flex-end",
  },
  signatureImage: {
    width: 140,
    height: 70,
    objectFit: "contain",
  },
  footer: {
    position: "absolute",
    left: 48,
    right: 48,
    bottom: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 9,
    color: "#666666",
  },
})

type QuittanceDocumentProps = {
  data: QuittanceFields
}

export function QuittanceDocument({ data }: QuittanceDocumentProps) {
  const { profile, tenant, bien } = data

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Quittance de loyer</Text>
        <Text style={styles.subtitle}>
          Quittance de loyer du mois : {data.periodLabel}
        </Text>

        <View style={styles.addressRow}>
          <View style={styles.addressBlock}>
            <Text style={styles.addressLine}>{profile.sciName}</Text>
            {profile.sciAddress.map((line) => (
              <Text key={line} style={styles.addressLine}>
                {line}
              </Text>
            ))}
          </View>

          <View style={styles.addressRight}>
            <Text style={styles.addressLineRight}>{data.tenantShortLabel}</Text>
            {bien.shortAddress ? (
              <Text style={styles.addressLineRight}>{bien.shortAddress}</Text>
            ) : (
              bien.lines.map((line, index) => (
                <Text
                  key={`bien-right-${index}`}
                  style={styles.addressLineRight}
                >
                  {line}
                </Text>
              ))
            )}
          </View>
        </View>

        <Text style={styles.issueLine}>
          Fait à {profile.city}, le {data.issueDateFormatted}
        </Text>

        <Text style={styles.sectionTitle}>Adresse de la location :</Text>
        <View style={styles.propertyBlock}>
          {bien.lines.map((line, index) => (
            <Text key={`bien-${index}`} style={styles.addressLine}>
              {line}
            </Text>
          ))}
        </View>

        <Text style={styles.paragraph}>
          Je soussigné {profile.managerName}, gérant de la {profile.sciName}{" "}
          propriétaire du logement désigné ci-dessus, déclare avoir reçu de{" "}
          {data.tenantHonorific} {tenant.name}, la somme de {data.amountInWords}{" "}
          / {data.totalFormatted} euros, au titre du paiement du loyer et des
          charges pour la période de location du {data.periodStart} au{" "}
          {data.periodEnd} et lui en donne quittance, sous réserve de tous mes
          droits.
        </Text>

        <Text style={styles.detailTitle}>Détail du règlement</Text>
        <Text style={styles.detailLine}>
          Loyer : {data.rentFormatted} euros
        </Text>
        <Text style={styles.detailLine}>
          Provision pour charges : {data.chargesFormatted} euros
        </Text>
        <Text style={styles.totalLine}>
          Total : {data.totalFormatted} euros
        </Text>
        <Text style={styles.detailLine}>
          Date du paiement : le {data.paymentDateFormatted}
        </Text>

        {profile.signatureSrc ? (
          <View style={styles.signatureBlock}>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image has no alt prop */}
            <Image style={styles.signatureImage} src={profile.signatureSrc} />
          </View>
        ) : null}

        <View style={styles.footer} fixed>
          <Text>Quittance de loyer</Text>
          <Text render={({ pageNumber }) => `${pageNumber}`} />
        </View>
      </Page>
    </Document>
  )
}
