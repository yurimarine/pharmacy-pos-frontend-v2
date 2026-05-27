import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import type { PurchaseOrderWithItems } from "@/types/inventory";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#000000",
  },
  title: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  metaLabel: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    width: 100,
  },
  metaValue: {
    fontSize: 10,
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginTop: 16,
    marginBottom: 6,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    marginBottom: 6,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    paddingVertical: 4,
    paddingHorizontal: 4,
    fontFamily: "Helvetica-Bold",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  tableRowAlt: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 4,
    backgroundColor: "#f5f5f5",
  },
  colNum: { width: 24 },
  colProduct: { flex: 1 },
  colPackaging: { width: 72 },
  colQty: { width: 48, textAlign: "right" },
  colUnitCost: { width: 72, textAlign: "right" },
  colTotal: { width: 80, textAlign: "right" },
  totalRow: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderTopColor: "#000000",
    marginTop: 2,
  },
  totalLabel: {
    flex: 1,
    textAlign: "right",
    fontFamily: "Helvetica-Bold",
    paddingRight: 4,
  },
  totalValue: {
    width: 80,
    textAlign: "right",
    fontFamily: "Helvetica-Bold",
  },
  notesSection: {
    marginTop: 16,
  },
  notesLabel: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  notesText: {
    fontSize: 9,
  },
  footer: {
    marginTop: 24,
    fontSize: 8,
    color: "#666666",
  },
});

function formatCurrency(amount: number): string {
  return `₱ ${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function getPOFilename(po: PurchaseOrderWithItems): string {
  return `${po.po_number}.pdf`;
}

export function PurchaseOrderPDF({ po }: { po: PurchaseOrderWithItems }) {
  const total = po.items.reduce(
    (sum, item) => sum + item.quantity_ordered * item.unit_cost,
    0,
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>PURCHASE ORDER</Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>PO Number:</Text>
          <Text style={styles.metaValue}>{po.po_number}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Date:</Text>
          <Text style={styles.metaValue}>{formatDate(po.created_at)}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Status:</Text>
          <Text style={styles.metaValue}>
            {po.status.toUpperCase().replace(/_/g, " ")}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Supplier:</Text>
          <Text style={styles.metaValue}>
            {po.supplier?.name ?? "No supplier specified"}
          </Text>
        </View>

        <Text style={styles.sectionLabel}>Order Items</Text>
        <View style={styles.divider} />

        <View style={styles.tableHeader}>
          <Text style={styles.colNum}>#</Text>
          <Text style={styles.colProduct}>Product</Text>
          <Text style={styles.colPackaging}>Packaging</Text>
          <Text style={styles.colQty}>Qty</Text>
          <Text style={styles.colUnitCost}>Unit Cost</Text>
          <Text style={styles.colTotal}>Total</Text>
        </View>

        {po.items.map((item, idx) => {
          const lineTotal = item.quantity_ordered * item.unit_cost;
          const RowStyle = idx % 2 === 1 ? styles.tableRowAlt : styles.tableRow;
          return (
            <View key={item.id} style={RowStyle}>
              <Text style={styles.colNum}>{idx + 1}</Text>
              <Text style={styles.colProduct}>
                {item.products?.product_name ?? item.product_id}
              </Text>
              <Text style={styles.colPackaging}>
                {item.products?.packaging_type ?? "—"}
              </Text>
              <Text style={styles.colQty}>{item.quantity_ordered}</Text>
              <Text style={styles.colUnitCost}>
                {formatCurrency(item.unit_cost)}
              </Text>
              <Text style={styles.colTotal}>{formatCurrency(lineTotal)}</Text>
            </View>
          );
        })}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>TOTAL</Text>
          <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
        </View>

        {po.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Notes:</Text>
            <Text style={styles.notesText}>{po.notes}</Text>
          </View>
        )}

        <Text style={styles.footer}>
          Generated:{" "}
          {new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </Text>
      </Page>
    </Document>
  );
}
